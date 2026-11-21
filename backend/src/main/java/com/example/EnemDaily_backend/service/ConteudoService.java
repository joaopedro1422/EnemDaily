package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Assunto;
import com.example.EnemDaily_backend.model.Conteudo;
import com.example.EnemDaily_backend.model.QuestaoGen;
import com.example.EnemDaily_backend.repository.AssuntoRepository;
import com.example.EnemDaily_backend.repository.ConteudoRepository;
import com.example.EnemDaily_backend.repository.QuestaoGenRepository;
import com.example.EnemDaily_backend.service.ia.ClienteOpenAi;
import com.example.EnemDaily_backend.service.ia.ConfigIa;
import com.example.EnemDaily_backend.service.ia.HtmlSeguro;
import com.example.EnemDaily_backend.service.ia.PromptsQuestao;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class ConteudoService {

    public record Resumo(String area, String slug, String assunto, String titulo, String descricao, LocalDateTime atualizadoEm) {}

    public record Pagina(Long id, Long assuntoId, String area, String assunto, String slug, String titulo, String seoTitulo,
                         String seoDescricao, String resumo, String comoCai, String paraNaoErrar, boolean publicado,
                         LocalDateTime atualizadoEm, LocalDateTime publicadoEm, QuestaoGen questao, List<Resumo> relacionados) {}

    public record ItemAdmin(Long assuntoId, String assunto, String area, Long conteudoId, String status, LocalDateTime atualizadoEm, String slug) {}

    public record Edicao(String titulo, String seoTitulo, String seoDescricao, String resumo, String comoCai, String paraNaoErrar) {}

    private final ConteudoRepository conteudos;
    private final AssuntoRepository assuntos;
    private final QuestaoGenRepository questoes;
    private final ClienteOpenAi ia;
    private final PromptsQuestao prompts;
    private final ConfigIa config;
    private final ObjectMapper mapper;
    private final String prompt;
    private final JsonNode esquema;
    private final HttpClient http = HttpClient.newHttpClient();

    @Value("${enemdaily.vercel.deploy-hook:}")
    private String deployHook;

    public ConteudoService(ConteudoRepository conteudos, AssuntoRepository assuntos, QuestaoGenRepository questoes, ClienteOpenAi ia,
                           PromptsQuestao prompts, ConfigIa config, ObjectMapper mapper) {
        this.conteudos = conteudos;
        this.assuntos = assuntos;
        this.questoes = questoes;
        this.ia = ia;
        this.prompts = prompts;
        this.config = config;
        this.mapper = mapper;
        try {
            this.prompt = ler("prompts/conteudo.md");
            this.esquema = mapper.readTree(ler("prompts/esquemas/conteudo.json"));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public List<Resumo> publicados() {
        return conteudos.findByPublicadoTrueOrderByAreaAscAssuntoAsc().stream().map(this::resumo).toList();
    }

    public Optional<Pagina> publicada(String areaChave, String slug) {
        AreaEnum area = PromptsQuestao.areaPorChave(areaChave);
        if (area == null) return Optional.empty();
        return conteudos.findByAreaAndSlugAndPublicadoTrue(area, slug).map(this::pagina);
    }

    public List<ItemAdmin> listaAdmin() {
        Map<Long, Conteudo> porAssunto = new HashMap<>();
        conteudos.findAll().forEach(c -> { if (c.getAssuntoId() != null) porAssunto.put(c.getAssuntoId(), c); });
        return assuntos.findAll().stream()
                .sorted(Comparator.comparing((Assunto a) -> a.getArea().ordinal()).thenComparing(Assunto::getNomeAssunto))
                .map(a -> {
                    Conteudo c = porAssunto.get(a.getId());
                    String status = c == null ? "sem" : c.isPublicado() ? "publicado" : "rascunho";
                    return new ItemAdmin(a.getId(), a.getNomeAssunto(), chave(a.getArea()), c == null ? null : c.getId(), status,
                            c == null ? null : c.getAtualizadoEm(), c == null ? null : c.getSlug());
                }).toList();
    }

    public Optional<Pagina> doAssunto(long assuntoId) {
        return conteudos.findByAssuntoId(assuntoId).map(this::pagina);
    }

    public Pagina gerar(long assuntoId) {
        Assunto assunto = assuntos.findById(assuntoId).orElseThrow(() -> new NoSuchElementException("Assunto não encontrado"));
        String instrucoes = prompt + "\n\n" + prompts.moduloArea(assunto.getArea());
        String mensagem = "<tarefa>\nEscreva a página de estudo do assunto \"" + assunto.getNomeAssunto() + "\" ("
                + PromptsQuestao.AREAS.get(assunto.getArea()).nome() + ").\n</tarefa>";
        var r = ia.gerar("conteudo_assunto", "conteudo-" + chave(assunto.getArea()), config.getEsforcoConteudo(), esquema, instrucoes, mensagem);
        JsonNode j = r.json();
        Conteudo c = conteudos.findByAssuntoId(assuntoId).orElseGet(() -> novo(assunto));
        boolean estavaPublicado = c.isPublicado();
        c.setTitulo(j.path("titulo").asText());
        c.setSeoTitulo(j.path("seo_titulo").asText());
        c.setSeoDescricao(j.path("seo_descricao").asText());
        c.setResumo(HtmlSeguro.limpar(j.path("resumo").asText(), HtmlSeguro.CONTEUDO));
        c.setComoCai(HtmlSeguro.limpar(j.path("como_cai").asText(), HtmlSeguro.CONTEUDO));
        c.setParaNaoErrar(HtmlSeguro.limpar(j.path("para_nao_errar").asText(), HtmlSeguro.CONTEUDO));
        c.setModeloIa(config.getModelo());
        c.setPublicado(false);
        c.setAtualizadoEm(LocalDateTime.now());
        escolherQuestao(c);
        conteudos.save(c);
        if (estavaPublicado) atualizarSite();
        log.info("[Conteúdos] Rascunho gerado para '{}' (~US$ {})", assunto.getNomeAssunto(), String.format("%.3f", r.uso().custoUsd()));
        return pagina(c);
    }

    @Transactional
    public Pagina salvar(long assuntoId, Edicao e) {
        Assunto assunto = assuntos.findById(assuntoId).orElseThrow(() -> new NoSuchElementException("Assunto não encontrado"));
        Conteudo c = conteudos.findByAssuntoId(assuntoId).orElseGet(() -> novo(assunto));
        c.setTitulo(texto(e.titulo()));
        c.setSeoTitulo(texto(e.seoTitulo()));
        c.setSeoDescricao(texto(e.seoDescricao()));
        c.setResumo(HtmlSeguro.limpar(nulo(e.resumo()), HtmlSeguro.CONTEUDO));
        c.setComoCai(HtmlSeguro.limpar(nulo(e.comoCai()), HtmlSeguro.CONTEUDO));
        c.setParaNaoErrar(HtmlSeguro.limpar(nulo(e.paraNaoErrar()), HtmlSeguro.CONTEUDO));
        c.setAtualizadoEm(LocalDateTime.now());
        escolherQuestao(c);
        conteudos.save(c);
        if (c.isPublicado()) atualizarSite();
        return pagina(c);
    }

    @Transactional
    public Pagina publicar(long assuntoId, boolean publicar) {
        Conteudo c = conteudos.findByAssuntoId(assuntoId).orElseThrow(() -> new NoSuchElementException("Esse assunto ainda não tem conteúdo"));
        if (publicar && (vazio(c.getTitulo()) || vazio(c.getResumo()) || vazio(c.getComoCai()))) {
            throw new IllegalArgumentException("Preencha pelo menos título, resumo e \"como cai no ENEM\" antes de publicar.");
        }
        c.setPublicado(publicar);
        if (publicar && c.getPublicadoEm() == null) c.setPublicadoEm(LocalDateTime.now());
        escolherQuestao(c);
        conteudos.save(c);
        atualizarSite();
        return pagina(c);
    }

    @Transactional
    public void excluir(long assuntoId) {
        conteudos.findByAssuntoId(assuntoId).ifPresent(c -> {
            boolean estava = c.isPublicado();
            conteudos.delete(c);
            if (estava) atualizarSite();
        });
    }

    private Conteudo novo(Assunto a) {
        Conteudo c = new Conteudo();
        c.setAssuntoId(a.getId());
        c.setArea(a.getArea());
        c.setAssunto(a.getNomeAssunto());
        c.setSlug(slugLivre(a.getArea(), slugificar(a.getNomeAssunto())));
        c.setCriadoEm(LocalDateTime.now());
        return c;
    }

    private void escolherQuestao(Conteudo c) {
        c.setQuestaoId(questoes.findFirstByAreaAndAssuntoAndModeloIaIsNotNullAndDataLessThanOrderByDataDesc(c.getArea(), c.getAssunto(), LocalDate.now().atStartOfDay())
                .map(QuestaoGen::getId).orElse(null));
    }

    private String slugLivre(AreaEnum area, String base) {
        Set<String> usados = new HashSet<>();
        conteudos.findAll().stream().filter(x -> x.getArea() == area).forEach(x -> usados.add(x.getSlug()));
        String slug = base;
        for (int i = 2; usados.contains(slug); i++) slug = base + "-" + i;
        return slug;
    }

    public static String slugificar(String s) {
        String t = Normalizer.normalize(s.toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        t = t.replace("º", "").replace("ª", "");
        return t.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private Pagina pagina(Conteudo c) {
        QuestaoGen q = c.getQuestaoId() == null ? null : questoes.findById(c.getQuestaoId()).orElse(null);
        List<Resumo> relacionados = c.getId() == null ? List.of()
                : conteudos.findTop6ByAreaAndPublicadoTrueAndIdNotOrderByAssuntoAsc(c.getArea(), c.getId()).stream().map(this::resumo).toList();
        return new Pagina(c.getId(), c.getAssuntoId(), chave(c.getArea()), c.getAssunto(), c.getSlug(), c.getTitulo(), c.getSeoTitulo(),
                c.getSeoDescricao(), c.getResumo(), c.getComoCai(), c.getParaNaoErrar(), c.isPublicado(), c.getAtualizadoEm(),
                c.getPublicadoEm(), q, relacionados);
    }

    private Resumo resumo(Conteudo c) {
        return new Resumo(chave(c.getArea()), c.getSlug(), c.getAssunto(), c.getTitulo(), c.getSeoDescricao(), c.getAtualizadoEm());
    }

    private void atualizarSite() {
        if (deployHook == null || deployHook.isBlank()) return;
        http.sendAsync(HttpRequest.newBuilder(URI.create(deployHook)).POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.discarding())
                .whenComplete((r, e) -> {
                    if (e != null) log.warn("[Conteúdos] Falha ao acionar o deploy da Vercel: {}", e.getMessage());
                    else log.info("[Conteúdos] Deploy da Vercel acionado ({})", r.statusCode());
                });
    }

    private static String chave(AreaEnum area) { return PromptsQuestao.AREAS.get(area).chave(); }
    private static boolean vazio(String s) { return s == null || s.isBlank(); }
    private static String texto(String s) { return s == null ? null : s.trim(); }
    private static String nulo(String s) { return s == null ? "" : s; }

    private static String ler(String caminho) throws IOException {
        return new String(new ClassPathResource(caminho).getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
    }
}
