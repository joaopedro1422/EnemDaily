package com.example.EnemDaily_backend.service.mentor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * Monta o cronograma de estudos. Não acessa banco nem relógio: recebe tudo pronto e devolve sempre o mesmo
 * resultado para a mesma entrada, o que permite recalcular o plano a cada marcação e testá-lo a fundo.
 *
 * <p>Estratégia:
 * <ol>
 *   <li><b>O que entra:</b> se não couber tudo até a reta final, escolhe pelo retorno (questões por minuto de
 *       estudo, com peso maior para as áreas de foco e para os assuntos de base), puxando junto os pré-requisitos.</li>
 *   <li><b>Em que ordem:</b> respeita os pré-requisitos obrigatórios, prefere a base antes do aprofundamento
 *       (pela TRI, garantir as questões fáceis vem primeiro) e intercala as áreas na proporção do que falta em cada uma.</li>
 *   <li><b>Quando:</b> distribui dia a dia na disponibilidade do aluno. Revisões vencidas vêm antes, assuntos
 *       longos são divididos em partes e as últimas semanas antes da prova ficam só para revisão.</li>
 * </ol>
 */
public final class PlanejadorMentor {

    public static final int MIN_REVISAO = 15;
    public static final int MIN_TREINO = 20;
    public static final int MIN_REDACAO = 60;
    static final int DIAS_RETA_FINAL = 42;
    static final int MIN_PARA_COMECAR = 15;
    /** Assunto novo só começa com pelo menos meia hora livre (ou se couber inteiro no que sobrou). */
    static final int MIN_INICIO_NOVO = 30;
    static final int SOBRA_TOLERADA = 10;

    private PlanejadorMentor() {}

    public enum Tipo { ESTUDO, REVISAO, REDACAO }

    public enum Fase { BASE, APROFUNDAMENTO, RETA_FINAL }

    /** Um assunto do catálogo, já ligado ao id de tb_assuntos. */
    public record Item(long id, String area, String nome, boolean habilidade, double incidencia, String nivel,
                       int minutos, List<Long> pre, List<Long> recomendados, String lingua) {}

    /** O que já aconteceu com o assunto para este aluno. */
    public record Estado(LocalDate estudadoEm, int revisoes, LocalDate proximaRevisao, LocalDate adiadoAte,
                         boolean removido, int minutosFeitos, int partesFeitas) {
        public static Estado vazio() { return new Estado(null, 0, null, null, false, 0, 0); }
    }

    /** minutos: disponibilidade de segunda (índice 0) a domingo (índice 6). */
    public record Config(LocalDate inicio, int[] minutos, Set<String> foco, String lingua) {}

    /**
     * parte/partes valem para estudos divididos em vários dias. devidaDesde é o dia em que a revisão venceu
     * (antes de hoje = atrasada). revisaoFinal marca as revisões da reta final.
     */
    public record Tarefa(Tipo tipo, Long assuntoId, int minutos, int parte, int partes, LocalDate devidaDesde, boolean revisaoFinal) {}

    public record Dia(LocalDate data, Fase fase, List<Tarefa> tarefas) {}

    public record Resultado(LocalDate inicio, LocalDate inicioAprofundamento, LocalDate inicioRetaFinal, LocalDate fim,
                            List<Dia> dias, List<Long> sequencia, Map<Long, LocalDate> inicioPrevisto,
                            Map<Long, LocalDate> conclusaoPrevista, Set<Long> noPlano, List<Long> foraDoPlano) {
        public Optional<Dia> dia(LocalDate data) {
            return dias.stream().filter(d -> d.data().equals(data)).findFirst();
        }
    }

    // ------------------------------------------------------------------ intervalos de revisão

    /**
     * Próxima revisão depois de estudar (revisoesFeitas = 0) ou depois da n-ésima revisão. A primeira vem uma
     * semana depois, nunca no mesmo dia; as seguintes se espaçam (3, 6 e 8 semanas). Se o aluno teve dificuldade,
     * a revisão volta em 4 dias sem avançar o intervalo. Habilidades (interpretação, língua estrangeira) viram
     * treino a cada 2 semanas.
     */
    public static LocalDate proximaRevisao(LocalDate base, int revisoesFeitas, boolean habilidade, boolean dificil) {
        if (dificil) return base.plusDays(4);
        if (habilidade) return base.plusDays(14);
        return switch (revisoesFeitas) {
            case 0 -> base.plusDays(7);
            case 1 -> base.plusDays(21);
            case 2 -> base.plusDays(42);
            default -> base.plusDays(56);
        };
    }

    public static int minutosDeRevisao(Item i) {
        return i != null && i.habilidade() ? MIN_TREINO : MIN_REVISAO;
    }

    // ------------------------------------------------------------------ plano

    /**
     * @param minutosUsadosHoje o que o aluno já marcou hoje; sai da disponibilidade de hoje para o dia não
     *                          crescer sem fim a cada marcação.
     */
    public static Resultado planejar(LocalDate hoje, LocalDate prova, Config cfg, List<Item> catalogo,
                                     Map<Long, Estado> estados, int minutosUsadosHoje) {
        LocalDate inicio = cfg.inicio().isAfter(hoje) ? cfg.inicio() : hoje;
        LocalDate fim = prova.minusDays(1);

        Map<Long, Item> porId = new LinkedHashMap<>();
        for (Item i : catalogo) {
            if (i.lingua() != null && !i.lingua().equals(cfg.lingua())) continue;
            if (estado(estados, i.id()).removido()) continue;
            porId.put(i.id(), i);
        }

        if (fim.isBefore(inicio)) {
            return new Resultado(inicio, inicio, inicio, fim, List.of(), List.of(), Map.of(), Map.of(),
                    estudados(porId, estados), List.of());
        }

        long totalDias = ChronoUnit.DAYS.between(inicio, prova);
        LocalDate retaFinal = prova.minusDays(DIAS_RETA_FINAL);
        if (ChronoUnit.DAYS.between(inicio, retaFinal) < 21) retaFinal = prova.minusDays(Math.max(7, totalDias / 5));
        if (retaFinal.isBefore(inicio)) retaFinal = inicio;
        LocalDate aprofundamento = inicio.plusDays(ChronoUnit.DAYS.between(inicio, retaFinal) * 6 / 10);

        Capacidade cap = new Capacidade(cfg, inicio, hoje, minutosUsadosHoje);
        Set<LocalDate> diasRedacao = diasDeRedacao(inicio, fim, cap);

        Set<Long> estudados = estudados(porId, estados);
        List<Item> pendentes = porId.values().stream().filter(i -> !estudados.contains(i.id())).toList();

        int orcamento = 0;
        for (LocalDate d = inicio; d.isBefore(retaFinal); d = d.plusDays(1)) orcamento += cap.de(d);
        for (LocalDate d : diasRedacao) if (d.isBefore(retaFinal)) orcamento -= Math.min(MIN_REDACAO, cap.de(d));
        orcamento -= revisoesJaDevidas(porId, estados, estudados, inicio, retaFinal);
        long diasAteReta = Math.max(0, ChronoUnit.DAYS.between(inicio, retaFinal));

        Set<Long> selecionados = selecionar(pendentes, estudados, Math.max(0, orcamento), cfg, porId, estados, diasAteReta);
        List<Long> sequencia = ordenar(selecionados, estudados, cfg, porId, estados);

        Simulacao sim = new Simulacao(porId, estados, estudados, sequencia, cap, diasRedacao, retaFinal);
        List<Dia> dias = new ArrayList<>();
        for (LocalDate d = inicio; !d.isAfter(fim); d = d.plusDays(1)) {
            Fase fase = !d.isBefore(retaFinal) ? Fase.RETA_FINAL : !d.isBefore(aprofundamento) ? Fase.APROFUNDAMENTO : Fase.BASE;
            dias.add(new Dia(d, fase, sim.dia(d)));
        }
        dias = numerarPartes(dias, estados);

        Set<Long> noPlano = new LinkedHashSet<>(estudados);
        noPlano.addAll(selecionados);
        List<Long> fora = porId.values().stream()
                .filter(i -> !noPlano.contains(i.id()))
                .sorted(Comparator.comparingDouble(Item::incidencia).reversed())
                .map(Item::id).toList();
        return new Resultado(inicio, aprofundamento, retaFinal, fim, dias, sequencia, sim.inicioPrevisto,
                sim.conclusaoPrevista, noPlano, fora);
    }

    // ------------------------------------------------------------------ seleção

    static double pesoFoco(Item i, Config cfg) {
        return cfg.foco() != null && cfg.foco().contains(i.area()) ? 1.35 : 1.0;
    }

    /** Peso do nível na escolha: base rende mais por hora (questões mais acessíveis, pesam na coerência da TRI). */
    static double fatorNivelSelecao(Item i) {
        return switch (i.nivel()) { case "base" -> 1.2; case "avancado" -> 0.85; default -> 1.0; };
    }

    /** Peso do nível na ordem: mais forte, para cobrir o básico de tudo antes de aprofundar. */
    static double fatorNivelOrdem(Item i) {
        return switch (i.nivel()) { case "base" -> 1.5; case "avancado" -> 0.6; default -> 1.0; };
    }

    private static int custoNoOrcamento(Item i, Estado e, long diasAteReta) {
        int estudo = Math.max(MIN_PARA_COMECAR, i.minutos() - e.minutosFeitos());
        if (i.habilidade()) return estudo + (int) Math.min(12, diasAteReta / 14) * MIN_TREINO;
        return estudo + 2 * MIN_REVISAO;
    }

    static Set<Long> selecionar(List<Item> pendentes, Set<Long> estudados, int orcamento, Config cfg,
                                Map<Long, Item> porId, Map<Long, Estado> estados, long diasAteReta) {
        Set<Long> escolhidos = new LinkedHashSet<>();
        Set<Long> pendentesIds = new HashSet<>();
        for (Item i : pendentes) pendentesIds.add(i.id());
        int usado = 0;
        while (true) {
            double melhorRazao = -1;
            Set<Long> melhorFecho = null;
            int melhorCusto = 0;
            for (Item i : pendentes) {
                if (escolhidos.contains(i.id())) continue;
                Set<Long> fecho = new LinkedHashSet<>();
                fechar(i.id(), fecho, escolhidos, pendentesIds, porId);
                int custo = 0;
                double valor = 0;
                for (Long f : fecho) {
                    Item it = porId.get(f);
                    custo += custoNoOrcamento(it, estado(estados, f), diasAteReta);
                    valor += it.incidencia() * pesoFoco(it, cfg) * fatorNivelSelecao(it);
                }
                if (custo <= 0 || usado + custo > orcamento) continue;
                double razao = valor / custo;
                // Desempate estável: o de maior incidência, depois o menor id.
                if (razao > melhorRazao + 1e-12) {
                    melhorRazao = razao;
                    melhorFecho = fecho;
                    melhorCusto = custo;
                }
            }
            if (melhorFecho == null) break;
            escolhidos.addAll(melhorFecho);
            usado += melhorCusto;
        }
        return escolhidos;
    }

    /** O assunto e os pré-requisitos obrigatórios que ainda faltam (os de fora do catálogo do aluno não travam). */
    private static void fechar(Long id, Set<Long> fecho, Set<Long> escolhidos, Set<Long> pendentes, Map<Long, Item> porId) {
        if (fecho.contains(id) || escolhidos.contains(id) || !pendentes.contains(id)) return;
        fecho.add(id);
        for (Long p : porId.get(id).pre()) fechar(p, fecho, escolhidos, pendentes, porId);
    }

    // ------------------------------------------------------------------ ordem

    static List<Long> ordenar(Set<Long> selecionados, Set<Long> estudados, Config cfg, Map<Long, Item> porId,
                              Map<Long, Estado> estados) {
        Map<String, Double> pesoArea = new TreeMap<>();
        for (Long id : selecionados) {
            Item i = porId.get(id);
            pesoArea.merge(i.area(), i.incidencia() * pesoFoco(i, cfg), Double::sum);
        }
        Map<String, Integer> alocado = new HashMap<>();
        Set<Long> feitos = new HashSet<>(estudados);
        List<Long> restantes = new ArrayList<>(selecionados);
        List<Long> ordem = new ArrayList<>();

        // Quem já começou um assunto longo continua por ele.
        restantes.stream()
                .filter(id -> estado(estados, id).minutosFeitos() > 0)
                .filter(id -> porId.get(id).pre().stream().allMatch(p -> feitos.contains(p) || !selecionados.contains(p)))
                .sorted(Comparator.comparingInt(id -> -estado(estados, id).minutosFeitos()))
                .toList()
                .forEach(id -> { ordem.add(id); feitos.add(id); restantes.remove(id); });

        while (!restantes.isEmpty()) {
            List<Item> disponiveis = new ArrayList<>();
            for (Long id : restantes) {
                Item i = porId.get(id);
                if (i.pre().stream().allMatch(p -> feitos.contains(p) || !selecionados.contains(p))) disponiveis.add(i);
            }
            if (disponiveis.isEmpty()) for (Long id : restantes) disponiveis.add(porId.get(id)); // não deveria acontecer

            String area = null;
            double menor = Double.MAX_VALUE;
            for (Item i : disponiveis) {
                double progresso = (alocado.getOrDefault(i.area(), 0) + 1.0) / pesoArea.getOrDefault(i.area(), 1e-9);
                if (progresso < menor - 1e-12 || (Math.abs(progresso - menor) <= 1e-12 && i.area().compareTo(area) < 0)) {
                    menor = progresso;
                    area = i.area();
                }
            }
            Item escolhido = null;
            double melhor = -1;
            for (Item i : disponiveis) {
                if (!i.area().equals(area)) continue;
                double chave = i.incidencia() * pesoFoco(i, cfg) * fatorNivelOrdem(i);
                boolean recomendadoPendente = i.recomendados().stream().anyMatch(r -> selecionados.contains(r) && !feitos.contains(r));
                if (recomendadoPendente) chave *= 0.6;
                if (chave > melhor + 1e-12 || (Math.abs(chave - melhor) <= 1e-12 && escolhido != null && i.id() < escolhido.id())) {
                    melhor = chave;
                    escolhido = i;
                }
            }
            Long id = escolhido.id();
            ordem.add(id);
            feitos.add(id);
            restantes.remove(id);
            alocado.merge(escolhido.area(), escolhido.minutos(), Integer::sum);
        }
        return ordem;
    }

    // ------------------------------------------------------------------ capacidade e redação

    private static final class Capacidade {
        private final int[] minutos;
        private final LocalDate inicio;
        private final LocalDate hoje;
        private final int usadosHoje;

        Capacidade(Config cfg, LocalDate inicio, LocalDate hoje, int usadosHoje) {
            this.minutos = cfg.minutos();
            this.inicio = inicio;
            this.hoje = hoje;
            this.usadosHoje = usadosHoje;
        }

        int de(LocalDate d) {
            if (d.isBefore(inicio)) return 0;
            int m = minutos[d.getDayOfWeek().getValue() - 1];
            if (d.equals(hoje)) m -= usadosHoje;
            return Math.max(0, m);
        }

        int bruto(LocalDate d) {
            return minutos[d.getDayOfWeek().getValue() - 1];
        }
    }

    /**
     * Uma redação por semana no dia com mais tempo; quem tem menos de 2h30 na semana faz a cada duas semanas.
     * Quem tem menos de 1h no melhor dia não recebe redação no plano.
     */
    static Set<LocalDate> diasDeRedacao(LocalDate inicio, LocalDate fim, Capacidade cap) {
        Set<LocalDate> dias = new HashSet<>();
        int semanaTotal = 0;
        LocalDate melhor = null;
        int melhorCap = 0;
        for (int i = 0; i < 7; i++) {
            LocalDate d = inicio.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).plusDays(i);
            int c = cap.bruto(d);
            semanaTotal += c;
            if (c >= melhorCap) { melhorCap = c; melhor = d; }
        }
        if (melhor == null || melhorCap < MIN_REDACAO) return dias;
        boolean quinzenal = semanaTotal < 150;
        DayOfWeek diaDaSemana = melhor.getDayOfWeek();
        int semana = 0;
        for (LocalDate d = inicio.with(TemporalAdjusters.nextOrSame(diaDaSemana)); !d.isAfter(fim); d = d.plusWeeks(1), semana++) {
            if (!quinzenal || semana % 2 == 0) dias.add(d);
        }
        return dias;
    }

    // ------------------------------------------------------------------ simulação dia a dia

    private record Revisao(long id, LocalDate devida, LocalDate devidaOriginal, int feitas, boolean finalRev) {}

    private static final class Simulacao {
        final Map<Long, Item> porId;
        final Map<Long, Estado> estados;
        final Set<Long> concluidos;
        final List<Long> fila;
        final Capacidade cap;
        final Set<LocalDate> diasRedacao;
        final LocalDate retaFinal;
        final PriorityQueue<Revisao> revisoes = new PriorityQueue<>(Comparator
                .comparing(Revisao::devida)
                .thenComparingDouble(r -> -itemIncidencia(r))
                .thenComparingLong(Revisao::id));
        final Map<Long, LocalDate> inicioPrevisto = new HashMap<>();
        final Map<Long, LocalDate> conclusaoPrevista = new HashMap<>();
        final Map<Long, Integer> restante = new HashMap<>();
        final Set<Long> comRevisaoNaReta = new HashSet<>();
        /** Concluídos no dia em simulação: ainda não liberam os dependentes, que só começam no dia seguinte. */
        final Set<Long> concluidosHoje = new HashSet<>();
        Long emAndamento;

        Simulacao(Map<Long, Item> porId, Map<Long, Estado> estados, Set<Long> estudados, List<Long> sequencia,
                  Capacidade cap, Set<LocalDate> diasRedacao, LocalDate retaFinal) {
            this.porId = porId;
            this.estados = estados;
            this.concluidos = new HashSet<>(estudados);
            this.fila = new ArrayList<>(sequencia);
            this.cap = cap;
            this.diasRedacao = diasRedacao;
            this.retaFinal = retaFinal;
            for (Long id : estudados) {
                Estado e = estado(estados, id);
                if (e.proximaRevisao() != null) revisoes.add(new Revisao(id, e.proximaRevisao(), e.proximaRevisao(), e.revisoes(), false));
            }
        }

        private double itemIncidencia(Revisao r) {
            Item i = porId.get(r.id());
            return i == null ? 0 : i.incidencia();
        }

        List<Tarefa> dia(LocalDate d) {
            List<Tarefa> tarefas = new ArrayList<>();
            int c = cap.de(d);
            boolean reta = !d.isBefore(retaFinal);
            if (d.equals(retaFinal)) agendarRevisoesFinais(d);

            // 1. Revisões vencidas: as mais antigas e importantes primeiro. Fora da reta final, ocupam no máximo
            //    metade do dia quando ainda há assunto novo, para o plano não travar.
            boolean haNovo = emAndamento != null || !fila.isEmpty();
            int tetoRevisao = reta || !haNovo ? c : Math.max(MIN_REVISAO, c / 2);
            int limite = reta ? 8 : 4;
            int usadas = 0;
            List<Revisao> adiadas = new ArrayList<>();
            while (!revisoes.isEmpty() && !revisoes.peek().devida().isAfter(d) && tarefas.size() < limite) {
                Revisao r = revisoes.poll();
                Item item = porId.get(r.id());
                if (item == null) continue;
                int m = minutosDeRevisao(item);
                if (usadas + m > tetoRevisao || m > c - usadas) { adiadas.add(r); break; }
                usadas += m;
                tarefas.add(new Tarefa(Tipo.REVISAO, r.id(), m, 0, 0, r.devidaOriginal(), r.finalRev()));
                if (!r.finalRev()) {
                    LocalDate proxima = proximaRevisao(d, r.feitas() + 1, item.habilidade(), false);
                    revisoes.add(new Revisao(r.id(), proxima, proxima, r.feitas() + 1, false));
                    if (!proxima.isBefore(retaFinal)) comRevisaoNaReta.add(r.id());
                }
            }
            revisoes.addAll(adiadas);
            c -= usadas;

            // 2. Redação da semana.
            if (diasRedacao.contains(d) && c >= 45) {
                int m = Math.min(MIN_REDACAO, c);
                tarefas.add(new Tarefa(Tipo.REDACAO, null, m, 0, 0, null, false));
                c -= m;
            }

            // 3. Assuntos novos (fora da reta final).
            if (!reta) {
                int iniciados = 0;
                int maxNovos = cap.de(d) >= 150 ? 3 : 2;
                concluidosHoje.clear();
                while (c >= MIN_PARA_COMECAR) {
                    if (emAndamento == null) {
                        if (iniciados >= maxNovos) break;
                        Long proximo = proximoDisponivel(d);
                        if (proximo == null) break;
                        Estado e = estado(estados, proximo);
                        int precisa = Math.max(MIN_PARA_COMECAR, porId.get(proximo).minutos() - e.minutosFeitos());
                        if (c < Math.min(precisa, MIN_INICIO_NOVO)) break;
                        fila.remove(proximo);
                        emAndamento = proximo;
                        restante.put(proximo, precisa);
                        inicioPrevisto.put(proximo, d);
                        iniciados++;
                    }
                    int falta = restante.get(emAndamento);
                    int m = Math.min(c, falta);
                    // O tempo de cada assunto é estimado: se sobrariam até 10 minutos, ele termina hoje.
                    boolean termina = falta - m <= SOBRA_TOLERADA;
                    tarefas.add(new Tarefa(Tipo.ESTUDO, emAndamento, m, 0, 0, null, false));
                    c -= m;
                    if (termina) {
                        conclusaoPrevista.put(emAndamento, d);
                        concluidosHoje.add(emAndamento);
                        Item item = porId.get(emAndamento);
                        LocalDate primeira = proximaRevisao(d, 0, item.habilidade(), false);
                        revisoes.add(new Revisao(emAndamento, primeira, primeira, 0, false));
                        if (!primeira.isBefore(retaFinal)) comRevisaoNaReta.add(emAndamento);
                        restante.remove(emAndamento);
                        emAndamento = null;
                    } else {
                        restante.put(emAndamento, falta - m);
                        break;
                    }
                }
                concluidos.addAll(concluidosHoje);
                concluidosHoje.clear();
            }
            return tarefas;
        }

        /** O próximo da fila que já pode começar: pré-requisitos concluídos em dias anteriores e sem adiamento. */
        private Long proximoDisponivel(LocalDate d) {
            for (Long id : fila) {
                Item i = porId.get(id);
                Estado e = estado(estados, id);
                if (e.adiadoAte() != null && e.adiadoAte().isAfter(d)) continue;
                boolean pronto = i.pre().stream().allMatch(p -> concluidos.contains(p) || !porId.containsKey(p) || !emJogo(p));
                if (pronto) return id;
            }
            return null;
        }

        /** Pré-requisito que ainda vai ser estudado no plano (fila ou em andamento). */
        private boolean emJogo(Long id) {
            return fila.contains(id) || Objects.equals(emAndamento, id) || concluidosHoje.contains(id);
        }

        /** Na reta final, cada assunto estudado ganha uma última revisão, dos que mais caem para os que menos caem. */
        private void agendarRevisoesFinais(LocalDate d) {
            concluidos.stream()
                    .map(porId::get)
                    .filter(Objects::nonNull)
                    .filter(i -> !i.habilidade() && !comRevisaoNaReta.contains(i.id()))
                    .sorted(Comparator.comparingDouble(Item::incidencia).reversed())
                    .forEach(i -> revisoes.add(new Revisao(i.id(), d, d, 99, true)));
        }
    }

    // ------------------------------------------------------------------ utilidades

    /** Numera as partes de cada estudo dividido em vários dias ("parte 2 de 3"), contando as que o aluno já fez. */
    private static List<Dia> numerarPartes(List<Dia> dias, Map<Long, Estado> estados) {
        Map<Long, Integer> total = new HashMap<>();
        for (Dia d : dias) for (Tarefa t : d.tarefas()) if (t.tipo() == Tipo.ESTUDO) total.merge(t.assuntoId(), 1, Integer::sum);
        Map<Long, Integer> vistos = new HashMap<>();
        List<Dia> saida = new ArrayList<>(dias.size());
        for (Dia d : dias) {
            List<Tarefa> ts = new ArrayList<>(d.tarefas().size());
            for (Tarefa t : d.tarefas()) {
                if (t.tipo() != Tipo.ESTUDO) { ts.add(t); continue; }
                int feitas = estado(estados, t.assuntoId()).partesFeitas();
                int n = vistos.merge(t.assuntoId(), 1, Integer::sum);
                int partes = feitas + total.get(t.assuntoId());
                ts.add(new Tarefa(t.tipo(), t.assuntoId(), t.minutos(), partes > 1 ? feitas + n : 0, partes > 1 ? partes : 0, null, false));
            }
            saida.add(new Dia(d.data(), d.fase(), ts));
        }
        return saida;
    }

    private static Set<Long> estudados(Map<Long, Item> porId, Map<Long, Estado> estados) {
        Set<Long> s = new LinkedHashSet<>();
        for (Long id : porId.keySet()) if (estado(estados, id).estudadoEm() != null) s.add(id);
        return s;
    }

    /** Minutos das revisões dos já estudados que vencem antes da reta final (reservados antes de escolher os novos). */
    private static int revisoesJaDevidas(Map<Long, Item> porId, Map<Long, Estado> estados, Set<Long> estudados,
                                         LocalDate inicio, LocalDate retaFinal) {
        int total = 0;
        for (Long id : estudados) {
            Estado e = estado(estados, id);
            Item i = porId.get(id);
            if (e.proximaRevisao() == null || i == null) continue;
            LocalDate d = e.proximaRevisao().isBefore(inicio) ? inicio : e.proximaRevisao();
            int feitas = e.revisoes();
            while (d.isBefore(retaFinal)) {
                total += minutosDeRevisao(i);
                feitas++;
                d = proximaRevisao(d, feitas, i.habilidade(), false);
            }
        }
        return total;
    }

    static Estado estado(Map<Long, Estado> estados, Long id) {
        Estado e = estados.get(id);
        return e == null ? Estado.vazio() : e;
    }
}
