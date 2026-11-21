package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Alternativa;
import com.example.EnemDaily_backend.model.Assunto;
import com.example.EnemDaily_backend.model.QuestaoGen;
import com.example.EnemDaily_backend.repository.AssuntoRepository;
import com.example.EnemDaily_backend.repository.QuestaoEnemRepository;
import com.example.EnemDaily_backend.repository.QuestaoGenRepository;
import com.example.EnemDaily_backend.service.ia.*;
import com.example.EnemDaily_backend.service.ia.ItemElaborado.AlternativaElaborada;
import com.example.EnemDaily_backend.service.ia.ItemElaborado.Resolucao;
import com.example.EnemDaily_backend.service.ia.ItemElaborado.Revisao;
import com.example.EnemDaily_backend.service.ia.ItemElaborado.Tabela;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.DoubleAdder;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ElaboracaoQuestaoService {

    public record Resultado(QuestaoGen questao, double custoUsd, boolean comRessalvas) {}

    public static class FalhaGeracao extends RuntimeException {
        public final double custoUsd;
        FalhaGeracao(String msg, double custo) { super(msg); this.custoUsd = custo; }
    }

    private record Avaliacao(ItemMontado montado, VerificadorItem.Resultado lint, Resolucao resolucao, Revisao revisao,
                             boolean aprovado, boolean aceitavel, boolean descartar, double pontuacao, List<String> problemas) {}

    private static final Set<String> VAZIAS = Set.of("de", "da", "do", "das", "dos", "e", "a", "o", "as", "os", "em", "no", "na",
            "nos", "nas", "um", "uma", "para", "por", "com", "grau", "texto");
    private static final Pattern PREFIXO_ANALISE = Pattern.compile(
            "^\\s*(<p>)?\\s*(?:<(?:b|strong)>)?\\s*(?:CERTA|ERRADA)\\s*[.:–-]?\\s*(?:</(?:b|strong)>)?\\s*", Pattern.CASE_INSENSITIVE);
    private static final List<String> GRAVIDADES = List.of("critica", "alta", "media", "baixa");

    private final ClienteOpenAi ia;
    private final PromptsQuestao prompts;
    private final ConfigIa config;
    private final StatusGeracao status;
    private final AssuntoRepository assuntoRepository;
    private final QuestaoEnemRepository questaoEnemRepository;
    private final QuestaoGenRepository questaoGenRepository;
    private final TransactionTemplate transacao;
    private final ObjectMapper json;
    private final ExecutorService paralelo = Executors.newVirtualThreadPerTaskExecutor();
    private final Random sorte = new SecureRandom();

    public ElaboracaoQuestaoService(ClienteOpenAi ia, PromptsQuestao prompts, ConfigIa config, StatusGeracao status,
                                    AssuntoRepository assuntoRepository, QuestaoEnemRepository questaoEnemRepository,
                                    QuestaoGenRepository questaoGenRepository, TransactionTemplate transacao, ObjectMapper mapper) {
        this.ia = ia;
        this.prompts = prompts;
        this.config = config;
        this.status = status;
        this.assuntoRepository = assuntoRepository;
        this.questaoEnemRepository = questaoEnemRepository;
        this.questaoGenRepository = questaoGenRepository;
        this.transacao = transacao;
        this.json = mapper.copy()
                .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public Resultado gerar(AreaEnum area, LocalDate dia, boolean substituir) {
        DoubleAdder custo = new DoubleAdder();
        Assunto assunto = assuntoRepository.buscarProximoAssuntoDaFila(area.ordinal());
        if (assunto == null) throw new FalhaGeracao("Nenhum assunto cadastrado para " + area, 0);
        String nomeAssunto = assunto.getNomeAssunto();
        String instrucoes = prompts.instrucoesElaborador(area);
        String tarefa = prompts.tarefa(area, nomeAssunto, dia, referencias(area, nomeAssunto), recentes(area));
        log.info("[Questões] {} {}: assunto '{}'", area, dia, nomeAssunto);

        Avaliacao aprovada = null;
        Avaliacao melhor = null;
        rascunhos:
        for (int rascunho = 1; rascunho <= config.getMaxRascunhos(); rascunho++) {
            try {
                etapa(area, "Rascunho " + rascunho + ": elaborando (" + nomeAssunto + ")", custo);
                ItemElaborado item = elaborar(area, instrucoes, tarefa, custo);
                for (int rodada = 0; ; rodada++) {
                    String rotulo = "Rascunho " + rascunho + (rodada == 0 ? "" : ", revisão " + rodada);
                    VerificadorItem.Resultado lint = VerificadorItem.verificar(item);
                    ItemMontado apresentado = null;
                    List<String> problemas;
                    if (!lint.aprovado()) {
                        problemas = lint.bloqueantes().stream().map(p -> "[verificação automática] " + p).toList();
                        etapa(area, rotulo + ": reprovado na verificação automática (" + String.join(" | ", lint.bloqueantes()) + ")", custo);
                    } else {
                        apresentado = ItemMontado.montar(item, usoPorPosicao(), sorte);
                        etapa(area, rotulo + ": resolução cega e revisão em paralelo (gabarito " + apresentado.letraGabarito() + ")", custo);
                        Avaliacao av = avaliar(area, apresentado, lint, custo);
                        etapa(area, rotulo + ": resolvedor marcou " + av.resolucao().letraEscolhida()
                                + " (confiança " + av.resolucao().confianca() + "), revisor: " + av.revisao().veredito()
                                + ", notas " + av.revisao().notas().values(), custo);
                        if (av.aceitavel() && (melhor == null || av.pontuacao() > melhor.pontuacao())) melhor = av;
                        if (av.aprovado()) { aprovada = av; break rascunhos; }
                        if (av.descartar()) { etapa(area, rotulo + ": revisor recomendou descartar a ideia", custo); break; }
                        problemas = av.problemas();
                        problemas.forEach(p -> log.info("[Questões] {}: {} -> {}", area, rotulo, p));
                        etapa(area, rotulo + ": devolvido. " + resumir(problemas.get(0)), custo);
                    }
                    if (rodada >= config.getMaxRevisoes()) break;
                    etapa(area, rotulo + ": corrigindo " + problemas.size() + " problema(s)", custo);
                    item = elaborar(area, instrucoes, prompts.revisao(tarefa, paraJson(item), apresentado, problemas), custo);
                }
            } catch (RuntimeException e) {
                log.error("[Questões] {} rascunho {} falhou: {}", area, rascunho, e.getMessage(), e);
                etapa(area, "Rascunho " + rascunho + " falhou: " + e.getMessage(), custo);
            }
        }

        Avaliacao escolhida = aprovada != null ? aprovada : melhor;
        if (escolhida == null) {
            throw new FalhaGeracao("Nenhuma versão passou nas verificações de correção para " + area + " (" + nomeAssunto + ")", custo.sum());
        }
        if (aprovada == null) {
            log.warn("[Questões] {}: nenhuma versão foi aprovada sem ressalvas; publicando a melhor que passou nas checagens de correção.", area);
        }
        QuestaoGen salva = salvar(area, dia, assunto, escolhida, substituir);
        log.info("[Questões] {} {}: publicada (id {}, gabarito {}, custo ~US$ {})", area, dia, salva.getId(),
                escolhida.montado().letraGabarito(), String.format("%.2f", custo.sum()));
        return new Resultado(salva, custo.sum(), aprovada == null);
    }

    private ItemElaborado elaborar(AreaEnum area, String instrucoes, String mensagem, DoubleAdder custo) {
        var r = ia.gerar("item_enem", "elaborar-" + chave(area), config.getEsforcoElaborar(), prompts.esquemaElaborador(), instrucoes, mensagem);
        custo.add(r.uso().custoUsd());
        return converter(r.json(), ItemElaborado.class);
    }

    private Avaliacao avaliar(AreaEnum area, ItemMontado m, VerificadorItem.Resultado lint, DoubleAdder custo) {
        CompletableFuture<Resolucao> fr = CompletableFuture.supplyAsync(() -> {
            var r = ia.gerar("resolucao_cega", "resolver-" + chave(area), config.getEsforcoResolver(), prompts.esquemaResolvedor(),
                    prompts.instrucoesResolvedor(area), prompts.paraResolver(m));
            custo.add(r.uso().custoUsd());
            return converter(r.json(), Resolucao.class);
        }, paralelo);
        CompletableFuture<Revisao> fv = CompletableFuture.supplyAsync(() -> {
            var r = ia.gerar("revisao_item", "revisar-" + chave(area), config.getEsforcoRevisar(), prompts.esquemaRevisor(),
                    prompts.instrucoesRevisor(area), prompts.paraRevisar(area, m, lint));
            custo.add(r.uso().custoUsd());
            return converter(r.json(), Revisao.class);
        }, paralelo);
        Resolucao r;
        Revisao v;
        try {
            r = fr.join();
            v = fv.join();
        } catch (CompletionException e) {
            if (e.getCause() instanceof RuntimeException re) throw re;
            throw e;
        }
        return julgar(m, lint, r, v);
    }

    private Avaliacao julgar(ItemMontado m, VerificadorItem.Resultado lint, Resolucao r, Revisao v) {
        String gabarito = m.letraGabarito();
        var p = r.problemas();
        boolean concorda = gabarito.equals(r.letraEscolhida());
        boolean semFalhaDeCorrecao = !p.maisDeUmaDefensavel() && !p.nenhumaCorreta() && !p.erroConceitualOuDeCalculo() && !p.dadosInsuficientes();
        boolean semFalhaDeQualidade = !p.textoBaseDispensavel() && !p.respostaObviaSemConhecimento() && !p.distratorAbsurdo();
        List<Resolucao.Julgamento> defensaveis = r.alternativas() == null ? List.of() : r.alternativas().stream()
                .filter(j -> !gabarito.equals(j.letra()) && !"incorreta".equals(j.veredito())).toList();
        List<Revisao.Problema> problemasRevisor = v.problemas() == null ? List.of() : v.problemas();
        long criticos = problemasRevisor.stream().filter(x -> "critica".equals(x.gravidade())).count();
        long altos = problemasRevisor.stream().filter(x -> "alta".equals(x.gravidade())).count();
        long medios = problemasRevisor.stream().filter(x -> "media".equals(x.gravidade())).count();
        Map<String, Integer> notas = v.notas() == null ? Map.of() : v.notas();
        int notaMinima = notas.values().stream().mapToInt(Integer::intValue).min().orElse(0);
        int somaNotas = notas.values().stream().mapToInt(Integer::intValue).sum();

        boolean aprovado = concorda && semFalhaDeCorrecao && semFalhaDeQualidade && defensaveis.isEmpty()
                && r.confianca() >= 0.8 && "aprovar".equals(v.veredito()) && criticos == 0 && altos == 0 && notaMinima >= 4;
        boolean aceitavel = concorda && semFalhaDeCorrecao && defensaveis.isEmpty() && r.confianca() >= 0.7
                && criticos == 0 && notaMinima >= 3 && !"descartar".equals(v.veredito());
        double pontuacao = somaNotas + 10 * r.confianca() - 6 * altos - 2 * medios - (semFalhaDeQualidade ? 0 : 5);

        List<String> problemas = new ArrayList<>();
        if (!concorda) {
            AlternativaElaborada escolhida = m.porLetra(r.letraEscolhida());
            problemas.add("[resolvedor independente | gabarito] Sem conhecer o gabarito, um resolvedor experiente escolheu "
                    + r.letraEscolhida() + ") \"" + (escolhida == null ? "?" : escolhida.texto()) + "\", e não o gabarito "
                    + gabarito + ") \"" + m.ordem().get(m.indiceGabarito()).texto() + "\". Raciocínio dele: " + r.resolucao());
        } else if (r.confianca() < 0.8) {
            problemas.add("[resolvedor independente] Chegou ao gabarito, mas com confiança de apenas " + r.confianca()
                    + ". Raciocínio dele: " + r.resolucao());
        }
        for (Resolucao.Julgamento j : defensaveis) {
            problemas.add("[resolvedor independente | alternativas] A alternativa " + j.letra() + ") também foi considerada "
                    + ("correta".equals(j.veredito()) ? "correta" : "defensável em recurso") + ": " + j.motivo());
        }
        if (p.maisDeUmaDefensavel()) problemas.add("[resolvedor independente] Mais de uma alternativa pode ser defendida.");
        if (p.nenhumaCorreta()) problemas.add("[resolvedor independente] Nenhuma alternativa responde corretamente ao comando.");
        if (p.erroConceitualOuDeCalculo()) problemas.add("[resolvedor independente] Há erro conceitual, dado incoerente ou conta que não fecha.");
        if (p.dadosInsuficientes()) problemas.add("[resolvedor independente] Faltam dados para chegar a uma única resposta.");
        if (p.textoBaseDispensavel()) problemas.add("[resolvedor independente] Dá para acertar sem ler o texto-base: ele virou pretexto.");
        if (p.respostaObviaSemConhecimento()) problemas.add("[resolvedor independente] Dá para acertar sem dominar o conteúdo (resposta óbvia ou entregue por pista).");
        if (p.distratorAbsurdo()) problemas.add("[resolvedor independente] Há distrator descartável por qualquer pessoa, mesmo sem estudar.");
        boolean algumaFalha = !concorda || !semFalhaDeCorrecao || !semFalhaDeQualidade || !defensaveis.isEmpty();
        if (algumaFalha && r.comentario() != null && !r.comentario().isBlank() && !r.comentario().trim().equalsIgnoreCase("nenhum")) {
            problemas.add("[resolvedor independente | comentário] " + r.comentario());
        }

        problemasRevisor.stream()
                .sorted(Comparator.comparingInt(x -> Math.max(0, GRAVIDADES.indexOf(x.gravidade()))))
                .forEach(x -> problemas.add("[revisor | " + x.gravidade() + " | " + x.onde() + "] " + x.descricao()
                        + " Como corrigir: " + x.comoCorrigir()));
        notas.forEach((criterio, nota) -> {
            if (nota < 4) problemas.add("[revisor | nota " + nota + "/5] Critério \"" + criterio.replace('_', ' ') + "\" abaixo do padrão ENEM.");
        });
        if (problemas.isEmpty() && !aprovado) problemas.add("[revisor] " + v.resumo());
        return new Avaliacao(m, lint, r, v, aprovado, aceitavel, "descartar".equals(v.veredito()), pontuacao, problemas);
    }

    private QuestaoGen salvar(AreaEnum area, LocalDate dia, Assunto assunto, Avaliacao av, boolean substituir) {
        ItemMontado m = av.montado();
        ItemElaborado it = m.item();
        QuestaoGen q = new QuestaoGen();
        q.setArea(area);
        q.setDisciplina(it.disciplina());
        q.setAssunto(assunto.getNomeAssunto());
        q.setTags(it.conceitoChave());
        q.setTexto(it.textoBase().paragrafos().stream()
                .map(par -> HtmlSeguro.limpar(par, HtmlSeguro.ITEM))
                .filter(par -> !par.isBlank())
                .collect(Collectors.joining("\n\n")));
        q.setFonte(HtmlSeguro.limpar(it.textoBase().fonte(), HtmlSeguro.ITEM));
        q.setTabela(tabelaJson(it.textoBase().tabela()));
        q.setEnunciado(HtmlSeguro.limpar(it.enunciado(), HtmlSeguro.ITEM));
        q.setResolucao(HtmlSeguro.limpar(it.resolucao(), HtmlSeguro.PEDAGOGICO));
        q.setExplicacao(HtmlSeguro.limpar(it.explicacaoAssunto(), HtmlSeguro.PEDAGOGICO));
        q.setCompetencia(it.competencia());
        q.setHabilidade(it.habilidade());
        q.setLinkEstudo(linkEstudo(it.conceitoChave() == null || it.conceitoChave().isBlank() ? assunto.getNomeAssunto() : it.conceitoChave()));
        q.setModeloIa(config.getModelo());
        q.setData(dia.atStartOfDay());
        for (AlternativaElaborada a : m.ordem()) {
            Alternativa alt = new Alternativa();
            alt.setTexto(HtmlSeguro.limpar(a.texto(), HtmlSeguro.ITEM));
            alt.setCorreta(a.correta());
            String analise = HtmlSeguro.limpar(a.analise(), HtmlSeguro.PEDAGOGICO);
            alt.setAnalise(PREFIXO_ANALISE.matcher(analise).replaceFirst(mr -> mr.group(1) == null ? "" : "<p>"));
            q.adicionarAlternativa(alt);
        }
        return transacao.execute(tx -> {
            List<QuestaoGen> existentes = questaoGenRepository.findByAreaAndDataGreaterThanEqualAndDataLessThan(
                    area, dia.atStartOfDay(), dia.plusDays(1).atStartOfDay());
            if (!existentes.isEmpty()) {
                if (!substituir) {
                    log.warn("[Questões] {} {}: já existia questão publicada; a nova foi descartada.", area, dia);
                    return existentes.get(0);
                }
                questaoGenRepository.deleteAll(existentes);
                questaoGenRepository.flush();
            }
            QuestaoGen salva = questaoGenRepository.save(q);
            assunto.setUltimaVezUtilizado(LocalDateTime.now());
            assuntoRepository.save(assunto);
            return salva;
        });
    }

    private List<PromptsQuestao.Referencia> referencias(AreaEnum area, String assunto) {
        String disciplina = PromptsQuestao.AREAS.get(area).disciplinaEnem();
        String consulta = Arrays.stream(assunto.toLowerCase(Locale.ROOT).split("[^\\p{L}]+"))
                .filter(w -> w.length() >= 3 && !VAZIAS.contains(w))
                .distinct()
                .collect(Collectors.joining(" | "));
        Map<Long, QuestaoEnemRepository.Referencia> refs = new LinkedHashMap<>();
        try {
            if (!consulta.isBlank()) questaoEnemRepository.referenciasDoAssunto(disciplina, consulta, 3).forEach(r -> refs.put(r.getId(), r));
            if (refs.size() < 3) questaoEnemRepository.referenciasDaArea(disciplina, 5).forEach(r -> { if (refs.size() < 3) refs.putIfAbsent(r.getId(), r); });
        } catch (RuntimeException e) {
            log.warn("[Questões] Não foi possível buscar itens oficiais de referência: {}", e.getMessage());
        }
        return refs.values().stream().map(r -> new PromptsQuestao.Referencia(r.getAno(), r.getEnunciado())).toList();
    }

    private List<PromptsQuestao.Recente> recentes(AreaEnum area) {
        return questaoGenRepository.findTop8ByAreaOrderByDataDesc(area).stream()
                .map(q -> {
                    String t = VerificadorItem.texto(q.getTexto()).replaceAll("\\s+", " ");
                    return new PromptsQuestao.Recente(q.getAssunto(), q.getTags(), t.length() > 110 ? t.substring(0, 110) : t);
                })
                .toList();
    }

    private int[] usoPorPosicao() {
        int[] uso = new int[5];
        try {
            for (Number n : questaoGenRepository.posicoesRecentesDoGabarito(12)) {
                int i = n.intValue();
                if (i >= 0 && i < 5) uso[i]++;
            }
        } catch (RuntimeException e) {
            log.warn("[Questões] Não foi possível ler as posições recentes do gabarito: {}", e.getMessage());
        }
        return uso;
    }

    private String tabelaJson(Tabela t) {
        if (t == null) return null;
        Tabela limpa = new Tabela(
                HtmlSeguro.limpar(t.titulo(), HtmlSeguro.ITEM),
                t.colunas().stream().map(c -> HtmlSeguro.limpar(c, HtmlSeguro.ITEM)).toList(),
                t.linhas().stream().map(l -> l.stream().map(c -> HtmlSeguro.limpar(c, HtmlSeguro.ITEM)).toList()).toList(),
                notaUtil(t.nota()));
        try {
            return json.writeValueAsString(limpa);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String notaUtil(String nota) {
        if (nota == null || nota.toLowerCase().matches("(?s).*dados\\s+(hipot[eé]tic|fict[ií]ci).*")) return null;
        return HtmlSeguro.limpar(nota, HtmlSeguro.ITEM);
    }

    private static String linkEstudo(String conceito) {
        return "https://pt.wikipedia.org/w/index.php?search=" + URLEncoder.encode(conceito.trim(), StandardCharsets.UTF_8) + "&go=Ir";
    }

    private String paraJson(ItemElaborado item) {
        try {
            return json.writerWithDefaultPrettyPrinter().writeValueAsString(item);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private <T> T converter(JsonNode no, Class<T> tipo) {
        try {
            return json.treeToValue(no, tipo);
        } catch (JsonProcessingException e) {
            throw new ClienteOpenAi.FalhaIa("Saída do modelo fora do formato esperado: " + e.getOriginalMessage(), e);
        }
    }

    private void etapa(AreaEnum area, String msg, DoubleAdder custo) {
        log.info("[Questões] {}: {}", area, msg);
        status.etapa(area, msg, custo.sum());
    }

    private static String resumir(String s) {
        return s.length() > 220 ? s.substring(0, 217) + "..." : s;
    }

    private static String chave(AreaEnum area) {
        return PromptsQuestao.AREAS.get(area).chave();
    }
}
