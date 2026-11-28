package com.example.EnemDaily_backend.service.mentor;

import com.example.EnemDaily_backend.model.Assunto;
import com.example.EnemDaily_backend.model.Conteudo;
import com.example.EnemDaily_backend.repository.AssuntoRepository;
import com.example.EnemDaily_backend.repository.ConteudoRepository;
import com.example.EnemDaily_backend.service.ia.PromptsQuestao;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Os dados de cada assunto para o cronograma (resources/plano/assuntos-enem-2027.json), ligados aos ids de
 * tb_assuntos pela área e pelo nome. A ligação é refeita de tempos em tempos, porque assuntos e conteúdos
 * podem mudar pelo admin.
 */
@Slf4j
@Component
public class CatalogoMentor {
    static final String ARQUIVO = "plano/assuntos-enem-2027.json";
    private static final Duration VALIDADE = Duration.ofMinutes(10);

    public record Flashcard(String pergunta, String resposta) {}

    public record ItemCatalogo(long assuntoId, String area, String disciplina, String nome, String tipo, double incidencia,
                               String confianca, String nivel, int minutos, List<Long> pre, List<Long> recomendados,
                               String lingua, String comoCai, List<String> dominar, List<Flashcard> flashcards) {
        public boolean habilidade() { return "habilidade".equals(tipo); }

        public PlanejadorMentor.Item paraPlanejador() {
            return new PlanejadorMentor.Item(assuntoId, area, nome, habilidade(), incidencia, nivel, minutos, pre, recomendados, lingua);
        }
    }

    private final AssuntoRepository assuntos;
    private final ConteudoRepository conteudos;
    private final JsonNode raiz;
    private final LocalDate prova;
    private final boolean provaConfirmada;
    private final Map<String, String> orientacao;

    private volatile Map<Long, ItemCatalogo> itens = Map.of();
    private volatile Map<Long, String> conteudoPorAssunto = Map.of();
    private volatile Instant carregadoEm = Instant.EPOCH;

    public CatalogoMentor(AssuntoRepository assuntos, ConteudoRepository conteudos, ObjectMapper mapper) {
        this.assuntos = assuntos;
        this.conteudos = conteudos;
        try (InputStream in = new ClassPathResource(ARQUIVO).getInputStream()) {
            this.raiz = mapper.readTree(in);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível ler " + ARQUIVO, e);
        }
        this.prova = LocalDate.parse(raiz.path("provas").path("dia1").asText());
        this.provaConfirmada = raiz.path("provas").path("confirmadas").asBoolean(false);
        Map<String, String> o = new LinkedHashMap<>();
        raiz.path("orientacao").fields().forEachRemaining(e -> o.put(e.getKey(), e.getValue().asText()));
        this.orientacao = Collections.unmodifiableMap(o);
    }

    public LocalDate prova() { return prova; }

    public boolean provaConfirmada() { return provaConfirmada; }

    public Map<String, String> orientacao() { return orientacao; }

    public Map<Long, ItemCatalogo> itens() {
        recarregarSeVencido();
        return itens;
    }

    public Optional<ItemCatalogo> item(long assuntoId) {
        return Optional.ofNullable(itens().get(assuntoId));
    }

    /** "area/slug" do conteúdo publicado do assunto, se houver. */
    public Optional<String> conteudo(long assuntoId) {
        recarregarSeVencido();
        return Optional.ofNullable(conteudoPorAssunto.get(assuntoId));
    }

    public List<PlanejadorMentor.Item> paraPlanejador() {
        return itens().values().stream().map(ItemCatalogo::paraPlanejador).toList();
    }

    /** Força a religação na próxima leitura (ex.: depois de publicar um conteúdo). */
    public void invalidar() {
        carregadoEm = Instant.EPOCH;
    }

    private void recarregarSeVencido() {
        if (Duration.between(carregadoEm, Instant.now()).compareTo(VALIDADE) < 0) return;
        synchronized (this) {
            if (Duration.between(carregadoEm, Instant.now()).compareTo(VALIDADE) < 0) return;
            try {
                carregar();
            } catch (RuntimeException e) {
                // Sem banco no momento: mantém o que já tinha e tenta de novo na próxima leitura.
                log.warn("[Mentor] Falha ao ligar o catálogo aos assuntos: {}", e.getMessage());
                return;
            }
            carregadoEm = Instant.now();
        }
    }

    private void carregar() {
        Map<String, Long> idPorChave = new HashMap<>();
        for (Assunto a : assuntos.findAll()) idPorChave.put(chave(a.getArea().ordinal(), a.getNomeAssunto()), a.getId());

        Map<String, Long> idPorNome = new HashMap<>();
        List<JsonNode> ligados = new ArrayList<>();
        List<String> semBanco = new ArrayList<>();
        for (JsonNode n : raiz.path("assuntos")) {
            // Habilidade que não se estuda como assunto (ex.: Interpretação de Texto): treina-se fazendo questões.
            if (n.path("foraDoPlano").asBoolean(false)) continue;
            Long id = idPorChave.get(chave(n.path("area").asInt(), n.path("nome").asText()));
            if (id == null) { semBanco.add(n.path("nome").asText()); continue; }
            idPorNome.put(normalizar(n.path("nome").asText()), id);
            ligados.add(n);
        }
        if (!semBanco.isEmpty()) log.warn("[Mentor] {} assunto(s) do catálogo sem par no banco: {}", semBanco.size(), semBanco);

        Map<Long, ItemCatalogo> novo = new LinkedHashMap<>();
        for (JsonNode n : ligados) {
            long id = idPorNome.get(normalizar(n.path("nome").asText()));
            String area = PromptsQuestao.AREAS.get(com.example.EnemDaily_backend.Enum.AreaEnum.values()[n.path("area").asInt()]).chave();
            List<String> dominar = new ArrayList<>();
            n.path("dominar").forEach(x -> dominar.add(x.asText()));
            List<Flashcard> cards = new ArrayList<>();
            n.path("flashcards").forEach(x -> cards.add(new Flashcard(x.path("pergunta").asText(), x.path("resposta").asText())));
            String lingua = n.hasNonNull("lingua") ? n.path("lingua").asText() : null;
            novo.put(id, new ItemCatalogo(id, area, n.path("disciplina").asText(), n.path("nome").asText(), n.path("tipo").asText("conteudo"),
                    n.path("incidencia").asDouble(), n.path("confiancaIncidencia").asText(), n.path("nivel").asText("intermediario"),
                    n.path("minutos").asInt(90), ids(n.path("prerequisitos"), idPorNome), ids(n.path("recomendadosAntes"), idPorNome),
                    lingua, n.path("comoCai").asText(), List.copyOf(dominar), List.copyOf(cards)));
        }

        Map<Long, String> porAssunto = new HashMap<>();
        for (Conteudo c : conteudos.findByPublicadoTrueOrderByAreaAscAssuntoAsc()) {
            if (c.getAssuntoId() != null) porAssunto.put(c.getAssuntoId(), PromptsQuestao.AREAS.get(c.getArea()).chave() + "/" + c.getSlug());
        }
        this.itens = Collections.unmodifiableMap(novo);
        this.conteudoPorAssunto = Collections.unmodifiableMap(porAssunto);
    }

    private static List<Long> ids(JsonNode nomes, Map<String, Long> idPorNome) {
        List<Long> ids = new ArrayList<>();
        nomes.forEach(x -> {
            Long id = idPorNome.get(normalizar(x.asText()));
            if (id != null) ids.add(id);
        });
        return List.copyOf(ids);
    }

    private static String chave(int area, String nome) {
        return area + "|" + normalizar(nome);
    }

    static String normalizar(String s) {
        return Normalizer.normalize(s == null ? "" : s.trim(), Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
    }
}
