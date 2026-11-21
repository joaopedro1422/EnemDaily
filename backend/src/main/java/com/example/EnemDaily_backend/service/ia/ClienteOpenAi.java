package com.example.EnemDaily_backend.service.ia;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

@Slf4j
@Component
public class ClienteOpenAi {

    private static final String URL = "https://api.openai.com/v1/responses";
    private static final Set<Integer> TEMPORARIOS = Set.of(408, 409, 429, 500, 502, 503, 504);
    private static final int TENTATIVAS = 4;

    private final ConfigIa config;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
    private volatile boolean backgroundDisponivel = true;

    public ClienteOpenAi(ConfigIa config, ObjectMapper mapper) {
        this.config = config;
        this.mapper = mapper;
    }

    public record Uso(long entrada, long entradaCache, long saida, long raciocinio, double custoUsd, long segundos) {}

    public record Resposta(JsonNode json, Uso uso) {}

    public static class FalhaIa extends RuntimeException {
        public FalhaIa(String msg) { super(msg); }
        public FalhaIa(String msg, Throwable causa) { super(msg, causa); }
    }

    public Resposta gerar(String etapa, String chaveCache, String esforco, JsonNode esquema, String instrucoes, String mensagem) {
        if (config.getChave() == null || config.getChave().isBlank()) {
            throw new FalhaIa("Chave da OpenAI não configurada (enemdaily.ia.chave).");
        }
        Instant inicio = Instant.now();
        boolean emBackground = config.isBackground() && backgroundDisponivel;
        JsonNode resposta;
        try {
            resposta = emBackground
                    ? executarEmBackground(corpo(etapa, chaveCache, esforco, esquema, instrucoes, mensagem, true))
                    : enviarComRetentativas(corpo(etapa, chaveCache, esforco, esquema, instrucoes, mensagem, false), Duration.ofMinutes(config.getLimiteMinutos()));
        } catch (BackgroundRecusado e) {
            log.warn("Modo background recusado pela API ({}). Seguindo em modo síncrono.", e.getMessage());
            backgroundDisponivel = false;
            resposta = enviarComRetentativas(corpo(etapa, chaveCache, esforco, esquema, instrucoes, mensagem, false), Duration.ofMinutes(config.getLimiteMinutos()));
        }
        JsonNode json = extrairJson(resposta);
        Uso uso = uso(resposta, Duration.between(inicio, Instant.now()).toSeconds());
        log.info("[IA] {} {} ({}, {}): entrada {} (cache {}), saída {} (raciocínio {}), {}s, ~US$ {}",
                etapa, chaveCache, config.getModelo(), esforco, uso.entrada(), uso.entradaCache(), uso.saida(), uso.raciocinio(),
                uso.segundos(), String.format("%.3f", uso.custoUsd()));
        return new Resposta(json, uso);
    }

    private ObjectNode corpo(String etapa, String chaveCache, String esforco, JsonNode esquema, String instrucoes, String mensagem, boolean background) {
        ObjectNode corpo = mapper.createObjectNode();
        corpo.put("model", config.getModelo());
        corpo.putObject("reasoning").put("effort", esforco);
        ArrayNode entrada = corpo.putArray("input");
        entrada.addObject().put("role", "developer").put("content", instrucoes);
        entrada.addObject().put("role", "user").put("content", mensagem);
        ObjectNode formato = corpo.putObject("text").putObject("format");
        formato.put("type", "json_schema");
        formato.put("name", etapa);
        formato.put("strict", true);
        formato.set("schema", esquema);
        corpo.put("max_output_tokens", config.getMaxSaida());
        corpo.put("prompt_cache_key", "enemdaily-" + chaveCache);
        corpo.put("store", background);
        if (background) corpo.put("background", true);
        return corpo;
    }

    private JsonNode executarEmBackground(ObjectNode corpo) {
        JsonNode r;
        try {
            r = enviarComRetentativas(corpo, Duration.ofMinutes(2));
        } catch (FalhaIa e) {
            if (e.getMessage() != null && e.getMessage().contains("HTTP 400") && e.getMessage().toLowerCase().contains("background")) {
                throw new BackgroundRecusado(e.getMessage());
            }
            throw e;
        }
        String id = r.path("id").asText();
        Instant limite = Instant.now().plus(Duration.ofMinutes(config.getLimiteMinutos()));
        int falhasSeguidas = 0;
        while (Set.of("queued", "in_progress").contains(r.path("status").asText())) {
            if (Instant.now().isAfter(limite)) {
                cancelar(id);
                throw new FalhaIa("Tempo limite de " + config.getLimiteMinutos() + " min excedido (resposta " + id + ").");
            }
            dormir(Duration.ofSeconds(5));
            try {
                r = requisitar(HttpRequest.newBuilder(URI.create(URL + "/" + id)).GET(), Duration.ofMinutes(1));
                falhasSeguidas = 0;
            } catch (FalhaTemporaria e) {
                if (++falhasSeguidas >= 6) throw new FalhaIa("Falha ao consultar a resposta " + id + ": " + e.getMessage(), e);
            }
        }
        return r;
    }

    private void cancelar(String id) {
        try {
            requisitar(HttpRequest.newBuilder(URI.create(URL + "/" + id + "/cancel")).POST(HttpRequest.BodyPublishers.noBody()), Duration.ofSeconds(30));
        } catch (Exception e) {
            log.warn("Não foi possível cancelar a resposta {}: {}", id, e.getMessage());
        }
    }

    private JsonNode enviarComRetentativas(ObjectNode corpo, Duration limite) {
        String json = corpo.toString();
        for (int tentativa = 1; ; tentativa++) {
            try {
                return requisitar(HttpRequest.newBuilder(URI.create(URL))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(json)), limite);
            } catch (FalhaTemporaria e) {
                if (tentativa >= TENTATIVAS) throw new FalhaIa("OpenAI indisponível após " + TENTATIVAS + " tentativas: " + e.getMessage(), e);
                Duration espera = e.esperaSugerida != null ? e.esperaSugerida : Duration.ofSeconds(10L << (tentativa - 1));
                log.warn("[IA] Falha temporária ({}). Nova tentativa em {}s.", e.getMessage(), espera.toSeconds());
                dormir(espera);
            }
        }
    }

    private JsonNode requisitar(HttpRequest.Builder req, Duration limite) {
        HttpResponse<String> resp;
        try {
            resp = http.send(req.header("Authorization", "Bearer " + config.getChave()).timeout(limite).build(),
                    HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            throw new FalhaTemporaria(e.getClass().getSimpleName() + ": " + e.getMessage(), null);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new FalhaIa("Interrompido", e);
        }
        int status = resp.statusCode();
        if (status / 100 == 2) {
            try {
                return mapper.readTree(resp.body());
            } catch (IOException e) {
                throw new FalhaIa("Resposta da OpenAI ilegível", e);
            }
        }
        String erro = mensagemDeErro(resp.body());
        if (TEMPORARIOS.contains(status)) {
            Duration espera = resp.headers().firstValue("retry-after").map(v -> {
                try { return Duration.ofSeconds(Math.min(120, Long.parseLong(v.trim()))); } catch (NumberFormatException e) { return null; }
            }).orElse(null);
            throw new FalhaTemporaria("HTTP " + status + " " + erro, espera);
        }
        throw new FalhaIa("HTTP " + status + " " + erro);
    }

    private String mensagemDeErro(String corpo) {
        try {
            return mapper.readTree(corpo).path("error").path("message").asText(corpo);
        } catch (IOException e) {
            return corpo == null ? "" : corpo.substring(0, Math.min(300, corpo.length()));
        }
    }

    private JsonNode extrairJson(JsonNode r) {
        String status = r.path("status").asText();
        if (!"completed".equals(status)) {
            String motivo = r.path("incomplete_details").path("reason").asText(r.path("error").path("message").asText(""));
            throw new FalhaIa("Resposta " + status + (motivo.isBlank() ? "" : " (" + motivo + ")"));
        }
        for (JsonNode item : r.path("output")) {
            if (!"message".equals(item.path("type").asText())) continue;
            for (JsonNode c : item.path("content")) {
                String tipo = c.path("type").asText();
                if ("refusal".equals(tipo)) throw new FalhaIa("Modelo recusou: " + c.path("refusal").asText());
                if ("output_text".equals(tipo)) {
                    try {
                        return mapper.readTree(c.path("text").asText());
                    } catch (IOException e) {
                        throw new FalhaIa("JSON inválido na saída do modelo", e);
                    }
                }
            }
        }
        throw new FalhaIa("Resposta sem texto de saída");
    }

    private Uso uso(JsonNode r, long segundos) {
        JsonNode u = r.path("usage");
        long entrada = u.path("input_tokens").asLong();
        long cache = u.path("input_tokens_details").path("cached_tokens").asLong();
        long saida = u.path("output_tokens").asLong();
        long raciocinio = u.path("output_tokens_details").path("reasoning_tokens").asLong();
        double custo = ((entrada - cache) * config.getPrecoEntrada() + cache * config.getPrecoEntradaCache() + saida * config.getPrecoSaida()) / 1_000_000d;
        return new Uso(entrada, cache, saida, raciocinio, custo, segundos);
    }

    private static void dormir(Duration d) {
        try {
            Thread.sleep(d.toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new FalhaIa("Interrompido", e);
        }
    }

    private static class FalhaTemporaria extends RuntimeException {
        final Duration esperaSugerida;
        FalhaTemporaria(String msg, Duration espera) { super(msg); this.esperaSugerida = espera; }
    }

    private static class BackgroundRecusado extends RuntimeException {
        BackgroundRecusado(String msg) { super(msg); }
    }
}
