package com.example.EnemDaily_backend.service.mentor;

import com.example.EnemDaily_backend.service.mentor.PlanejadorMentor.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Regras do cronograma conferidas com o catálogo real dos assuntos. */
class PlanejadorMentorTest {
    static final String[] AREAS = {"natureza", "humanas", "matematica", "linguagens"};
    static final LocalDate PROVA = LocalDate.of(2027, 11, 7);
    static final LocalDate HOJE = LocalDate.of(2027, 2, 1); // segunda-feira

    static List<Item> catalogo;
    static Map<String, Long> idPorNome = new HashMap<>();
    static Map<Long, Item> porId = new HashMap<>();

    @BeforeAll
    static void carregar() throws Exception {
        JsonNode raiz;
        try (InputStream in = new ClassPathResource(CatalogoMentor.ARQUIVO).getInputStream()) {
            raiz = new ObjectMapper().readTree(in);
        }
        long id = 1;
        for (JsonNode n : raiz.path("assuntos")) idPorNome.put(n.path("nome").asText(), id++);
        List<Item> itens = new ArrayList<>();
        for (JsonNode n : raiz.path("assuntos")) {
            if (n.path("foraDoPlano").asBoolean(false)) continue;
            List<Long> pre = new ArrayList<>();
            n.path("prerequisitos").forEach(x -> pre.add(idPorNome.get(x.asText())));
            List<Long> rec = new ArrayList<>();
            n.path("recomendadosAntes").forEach(x -> rec.add(idPorNome.get(x.asText())));
            Item i = new Item(idPorNome.get(n.path("nome").asText()), AREAS[n.path("area").asInt()], n.path("nome").asText(),
                    "habilidade".equals(n.path("tipo").asText()), n.path("incidencia").asDouble(), n.path("nivel").asText(),
                    n.path("minutos").asInt(), pre, rec, n.hasNonNull("lingua") ? n.path("lingua").asText() : null);
            itens.add(i);
            porId.put(i.id(), i);
        }
        catalogo = List.copyOf(itens);
        assertFalse(porId.containsKey(idPorNome.get("Interpretação de Texto")), "habilidade bloqueada fica fora do plano");
        assertTrue(catalogo.size() >= 140, "catálogo carregado");
        assertFalse(idPorNome.containsValue(null));
    }

    static Config config(int seg, int sab, int dom, Set<String> foco) {
        return new Config(HOJE, new int[]{seg, seg, seg, seg, seg, sab, dom}, foco, "ingles");
    }

    static Resultado plano(Config cfg, Map<Long, Estado> estados) {
        return PlanejadorMentor.planejar(HOJE, PROVA, cfg, catalogo, estados, 0);
    }

    static int capacidade(Config cfg, LocalDate d) {
        return cfg.minutos()[d.getDayOfWeek().getValue() - 1];
    }

    @Test
    void nenhumDiaPassaDaDisponibilidade() {
        Config cfg = config(60, 180, 0, Set.of());
        Resultado r = plano(cfg, Map.of());
        for (Dia d : r.dias()) {
            int soma = d.tarefas().stream().mapToInt(Tarefa::minutos).sum();
            assertTrue(soma <= capacidade(cfg, d.data()), () -> d.data() + ": " + soma + " min");
        }
    }

    @Test
    void preRequisitoTerminaAntesDeComecarODependente() {
        Resultado r = plano(config(90, 180, 60, Set.of()), Map.of());
        for (Long id : r.sequencia()) {
            LocalDate inicio = r.inicioPrevisto().get(id);
            if (inicio == null) continue;
            for (Long pre : porId.get(id).pre()) {
                LocalDate fimPre = r.conclusaoPrevista().get(pre);
                assertNotNull(fimPre, porId.get(pre).nome() + " deveria estar no plano antes de " + porId.get(id).nome());
                assertTrue(fimPre.isBefore(inicio), porId.get(pre).nome() + " termina " + fimPre + ", " + porId.get(id).nome() + " começa " + inicio);
            }
        }
    }

    @Test
    void retaFinalSoTemRevisaoERedacao() {
        Resultado r = plano(config(60, 120, 0, Set.of()), Map.of());
        assertEquals(PROVA.minusDays(42), r.inicioRetaFinal());
        r.dias().stream().filter(d -> !d.data().isBefore(r.inicioRetaFinal()))
                .flatMap(d -> d.tarefas().stream())
                .forEach(t -> assertNotEquals(Tipo.ESTUDO, t.tipo()));
        assertTrue(r.dias().stream().filter(d -> !d.data().isBefore(r.inicioRetaFinal()))
                .anyMatch(d -> d.tarefas().stream().anyMatch(Tarefa::revisaoFinal)), "a reta final tem revisões finais");
    }

    @Test
    void primeiraRevisaoNuncaNoMesmoDiaDoEstudo() {
        Resultado r = plano(config(60, 120, 0, Set.of()), Map.of());
        Map<Long, LocalDate> primeiraRevisao = new HashMap<>();
        for (Dia d : r.dias()) for (Tarefa t : d.tarefas())
            if (t.tipo() == Tipo.REVISAO) primeiraRevisao.putIfAbsent(t.assuntoId(), d.data());
        r.conclusaoPrevista().forEach((id, fim) -> {
            LocalDate rev = primeiraRevisao.get(id);
            if (rev != null) assertTrue(ChronoUnit.DAYS.between(fim, rev) >= 7, porId.get(id).nome());
        });
    }

    @Test
    void soEntraALinguaEscolhida() {
        Resultado r = plano(config(60, 120, 0, Set.of()), Map.of());
        Long espanhol = idPorNome.get("Espanhol: interpretação de texto");
        Long ingles = idPorNome.get("Inglês: interpretação de texto");
        assertFalse(r.noPlano().contains(espanhol));
        assertFalse(r.foraDoPlano().contains(espanhol));
        assertTrue(r.noPlano().contains(ingles));
    }

    @Test
    void poucoTempoDeixaDeForaOQueMenosRende() {
        Resultado r = plano(config(30, 0, 0, Set.of()), Map.of());
        assertFalse(r.foraDoPlano().isEmpty(), "com 2h30 por semana não cabe tudo");
        // Os assuntos que mais caem entram sempre.
        for (String nome : List.of("Razão e Proporção", "Inglês: interpretação de texto"))
            assertTrue(r.noPlano().contains(idPorNome.get(nome)), nome);
        double incPlano = r.noPlano().stream().mapToDouble(id -> porId.get(id).incidencia()).average().orElse(0);
        double incFora = r.foraDoPlano().stream().mapToDouble(id -> porId.get(id).incidencia()).average().orElse(0);
        assertTrue(incPlano > incFora, "o plano fica com os de maior incidência");
    }

    @Test
    void tempoDeSobraColocaTudo() {
        Resultado r = plano(config(180, 240, 120, Set.of()), Map.of());
        assertTrue(r.foraDoPlano().isEmpty(), () -> "ficaram de fora: " + r.foraDoPlano().size());
    }

    @Test
    void areaDeFocoGanhaMaisEspacoNoComeco() {
        long semFoco = assuntosDaAreaNasPrimeirasSemanas(plano(config(60, 120, 0, Set.of()), Map.of()), "natureza");
        long comFoco = assuntosDaAreaNasPrimeirasSemanas(plano(config(60, 120, 0, Set.of("natureza")), Map.of()), "natureza");
        assertTrue(comFoco > semFoco, comFoco + " > " + semFoco);
    }

    static long assuntosDaAreaNasPrimeirasSemanas(Resultado r, String area) {
        return r.inicioPrevisto().entrySet().stream()
                .filter(e -> e.getValue().isBefore(HOJE.plusWeeks(8)))
                .filter(e -> porId.get(e.getKey()).area().equals(area)).count();
    }

    @Test
    void baseAntesDoAvancado() {
        Resultado r = plano(config(60, 120, 0, Set.of()), Map.of());
        List<Long> seq = r.sequencia();
        double posBase = seq.stream().filter(id -> porId.get(id).nivel().equals("base")).mapToInt(seq::indexOf).average().orElse(0);
        double posAvancado = seq.stream().filter(id -> porId.get(id).nivel().equals("avancado")).mapToInt(seq::indexOf).average().orElse(0);
        assertTrue(posBase < posAvancado);
    }

    @Test
    void adiadoNaoComecaAntesDaData() {
        Config cfg = config(60, 120, 0, Set.of());
        Long primeiro = plano(cfg, Map.of()).sequencia().get(0);
        LocalDate ate = HOJE.plusDays(3);
        Resultado r = plano(cfg, Map.of(primeiro, new Estado(null, 0, null, ate, false, 0, 0)));
        assertFalse(r.inicioPrevisto().get(primeiro).isBefore(ate));
    }

    @Test
    void removidoSaiDoPlanoEDaListaDeFora() {
        Long removido = idPorNome.get("Razão e Proporção");
        Resultado r = plano(config(60, 120, 0, Set.of()), Map.of(removido, new Estado(null, 0, null, null, true, 0, 0)));
        assertFalse(r.noPlano().contains(removido));
        assertFalse(r.foraDoPlano().contains(removido));
        // Quem dependia dele não fica travado.
        Long dependente = idPorNome.get("Regra de três e grandezas proporcionais");
        assertTrue(r.noPlano().contains(dependente));
    }

    @Test
    void revisaoAtrasadaApareceHojeComADataOriginal() {
        Long id = idPorNome.get("Porcentagem");
        Estado e = new Estado(HOJE.minusDays(20), 0, HOJE.minusDays(13), null, false, 0, 0);
        Resultado r = plano(config(60, 120, 0, Set.of()), Map.of(id, e));
        Tarefa t = r.dia(HOJE).orElseThrow().tarefas().stream().filter(x -> x.tipo() == Tipo.REVISAO && x.assuntoId().equals(id)).findFirst().orElseThrow();
        assertEquals(HOJE.minusDays(13), t.devidaDesde());
        assertFalse(r.sequencia().contains(id), "estudado não volta como novo");
    }

    @Test
    void oQueJaFoiFeitoHojeSaiDoTempoDeHoje() {
        Config cfg = config(60, 120, 0, Set.of());
        Resultado r = PlanejadorMentor.planejar(HOJE, PROVA, cfg, catalogo, Map.of(), 60);
        assertTrue(r.dia(HOJE).orElseThrow().tarefas().isEmpty());
        assertFalse(r.dia(HOJE.plusDays(1)).orElseThrow().tarefas().isEmpty());
    }

    @Test
    void assuntoLongoViraPartesNumeradas() {
        Resultado r = plano(config(30, 0, 0, Set.of()), Map.of());
        Optional<Tarefa> parte = r.dias().stream().flatMap(d -> d.tarefas().stream())
                .filter(t -> t.tipo() == Tipo.ESTUDO && t.partes() > 1).findFirst();
        assertTrue(parte.isPresent());
        assertTrue(parte.get().parte() >= 1 && parte.get().parte() <= parte.get().partes());
    }

    @Test
    void mesmaEntradaMesmoPlano() {
        Config cfg = config(60, 120, 30, Set.of("matematica"));
        assertEquals(plano(cfg, Map.of()).dias(), plano(cfg, Map.of()).dias());
    }

    @Test
    void depoisDaProvaNaoHaPlano() {
        Resultado r = PlanejadorMentor.planejar(PROVA, PROVA, config(60, 120, 0, Set.of()), catalogo, Map.of(), 0);
        assertTrue(r.dias().isEmpty());
    }

    @Test
    void intervalosDeRevisao() {
        LocalDate d = LocalDate.of(2027, 3, 1);
        assertEquals(d.plusDays(7), PlanejadorMentor.proximaRevisao(d, 0, false, false));
        assertEquals(d.plusDays(21), PlanejadorMentor.proximaRevisao(d, 1, false, false));
        assertEquals(d.plusDays(42), PlanejadorMentor.proximaRevisao(d, 2, false, false));
        assertEquals(d.plusDays(4), PlanejadorMentor.proximaRevisao(d, 2, false, true));
        assertEquals(d.plusDays(14), PlanejadorMentor.proximaRevisao(d, 0, true, false));
    }
}
