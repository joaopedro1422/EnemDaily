package com.example.EnemDaily_backend.service.mentor;

import com.example.EnemDaily_backend.model.EstudoAssunto;
import com.example.EnemDaily_backend.model.MentorDia;
import com.example.EnemDaily_backend.model.MentorPlano;
import com.example.EnemDaily_backend.model.MentorRegistro;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.*;
import com.example.EnemDaily_backend.service.mentor.CatalogoMentor.ItemCatalogo;
import com.example.EnemDaily_backend.service.mentor.MentorDtos.*;
import com.example.EnemDaily_backend.service.mentor.PlanejadorMentor.Estado;
import com.example.EnemDaily_backend.service.mentor.PlanejadorMentor.Resultado;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Monta a tela "Meu mentor" e aplica as ações do aluno. Todo método confere o acesso ao módulo. */
@Service
public class MentorService {
    public static final class NaoLiberado extends RuntimeException {}

    static final List<String> AREAS = List.of("natureza", "humanas", "matematica", "linguagens");
    static final Set<String> LINGUAS = Set.of("ingles", "espanhol");
    static final int MAX_MIN_DIA = 480;
    static final int MIN_SEMANA = 60;
    static final int MAX_DIAS_INICIO = 90;

    private final MentorAcesso acesso;
    private final CatalogoMentor catalogo;
    private final ProgressoEstudoService progresso;
    private final MentorPlanoRepository planos;
    private final EstudoAssuntoRepository estudos;
    private final MentorRegistroRepository registros;
    private final MentorDiaRepository retratos;
    private final RedacaoRepository redacoes;

    public MentorService(MentorAcesso acesso, CatalogoMentor catalogo, ProgressoEstudoService progresso, MentorPlanoRepository planos,
                         EstudoAssuntoRepository estudos, MentorRegistroRepository registros, MentorDiaRepository retratos,
                         RedacaoRepository redacoes) {
        this.acesso = acesso;
        this.catalogo = catalogo;
        this.progresso = progresso;
        this.planos = planos;
        this.estudos = estudos;
        this.registros = registros;
        this.retratos = retratos;
        this.redacoes = redacoes;
    }

    // ------------------------------------------------------------------ ações

    @Transactional
    public Painel painel(Usuario u) {
        exigir(u);
        return montar(u.getId());
    }

    @Transactional
    public Painel salvarConfig(Usuario u, ConfigEntrada in) {
        exigir(u);
        if (in == null) throw new IllegalArgumentException("Configuração vazia.");
        LocalDate hoje = ProgressoEstudoService.hoje();
        MentorPlano p = planos.findByUsuarioId(u.getId()).orElse(null);
        boolean novo = p == null;
        if (novo && !Boolean.TRUE.equals(in.aceite())) throw new IllegalArgumentException("Confirme que entendeu como o mentor funciona.");
        if (!hoje.isBefore(catalogo.prova())) throw new IllegalArgumentException("O plano desta edição do ENEM já terminou.");

        List<Integer> disp = in.disponibilidade();
        if (disp == null || disp.size() != 7 || disp.stream().anyMatch(m -> m == null || m < 0 || m > MAX_MIN_DIA))
            throw new IllegalArgumentException("Disponibilidade inválida.");
        if (disp.stream().mapToInt(Integer::intValue).sum() < MIN_SEMANA)
            throw new IllegalArgumentException("Escolha pelo menos 1 hora por semana.");
        List<String> foco = in.foco() == null ? List.of() : in.foco().stream().distinct().toList();
        if (foco.size() > 2 || !AREAS.containsAll(foco)) throw new IllegalArgumentException("Escolha até duas áreas de foco.");
        if (in.lingua() == null || !LINGUAS.contains(in.lingua())) throw new IllegalArgumentException("Escolha a língua estrangeira.");

        LocalDate inicio = in.inicio() == null ? hoje : in.inicio();
        boolean mesmoInicio = !novo && inicio.equals(p.getInicio());
        if (!mesmoInicio && (inicio.isBefore(hoje) || inicio.isAfter(hoje.plusDays(MAX_DIAS_INICIO)) || !inicio.isBefore(catalogo.prova())))
            throw new IllegalArgumentException("Data de início inválida.");

        if (novo) {
            p = new MentorPlano();
            p.setUsuarioId(u.getId());
            p.setCriadoEm(LocalDateTime.now());
            p.setAceiteEm(LocalDateTime.now());
            p.setNotificacoes(true);
        }
        p.setInicio(inicio);
        p.setDisponibilidade(disp.stream().map(String::valueOf).collect(Collectors.joining(",")));
        p.setAreasFoco(String.join(",", foco));
        p.setLingua(in.lingua());
        p.setAtualizadoEm(LocalDateTime.now());
        planos.save(p);
        // O retrato de hoje é refeito com a configuração nova.
        retratos.findByUsuarioIdAndData(u.getId(), hoje).ifPresent(retratos::delete);
        return montar(u.getId());
    }

    @Transactional
    public Painel notificacoes(Usuario u, boolean ativo) {
        exigir(u);
        MentorPlano p = planos.findByUsuarioId(u.getId()).orElseThrow(NoSuchElementException::new);
        p.setNotificacoes(ativo);
        planos.save(p);
        return montar(u.getId());
    }

    @Transactional
    public void apagar(Usuario u) {
        exigir(u);
        planos.deleteByUsuarioId(u.getId());
        retratos.deleteAll(retratos.findAllByUsuarioIdAndDataBetween(u.getId(), LocalDate.of(2000, 1, 1), LocalDate.of(2100, 1, 1)));
    }

    @Transactional
    public Painel estudado(Usuario u, long assuntoId, boolean jaSabia) {
        exigirAssunto(u, assuntoId);
        progresso.marcarEstudado(u.getId(), assuntoId, jaSabia);
        return montar(u.getId());
    }

    /** "Parte de hoje feita": o tempo é o que o plano previu hoje para o assunto (a tela nunca lida com minutos). */
    @Transactional
    public Painel parte(Usuario u, long assuntoId) {
        exigirAssunto(u, assuntoId);
        MentorPlano p = planos.findByUsuarioId(u.getId()).orElseThrow(NoSuchElementException::new);
        Calculo c = calcular(u.getId(), p);
        int minutos = c.pendentesHoje().stream()
                .filter(t -> t.tipo() == PlanejadorMentor.Tipo.ESTUDO && Objects.equals(t.assuntoId(), assuntoId))
                .mapToInt(PlanejadorMentor.Tarefa::minutos).sum();
        if (minutos == 0) throw new IllegalArgumentException("Esse assunto não está no seu dia de hoje.");
        progresso.marcarParte(u.getId(), assuntoId, minutos);
        return montar(u.getId());
    }

    /** Só o dia de hoje, para o card da tela inicial (sem o mapa do ano). */
    public record Hoje(boolean configurado, List<Tarefa> tarefas) {}

    @Transactional
    public Hoje hoje(Usuario u) {
        exigir(u);
        MentorPlano p = planos.findByUsuarioId(u.getId()).orElse(null);
        if (p == null) return new Hoje(false, List.of());
        Calculo c = calcular(u.getId(), p);
        return new Hoje(true, tarefasDeHoje(u.getId(), c));
    }

    @Transactional
    public Painel desfazer(Usuario u, long assuntoId) {
        exigirAssunto(u, assuntoId);
        progresso.desfazerEstudo(u.getId(), assuntoId);
        return montar(u.getId());
    }

    @Transactional
    public Painel revisado(Usuario u, long assuntoId, boolean dificil) {
        exigirAssunto(u, assuntoId);
        progresso.marcarRevisado(u.getId(), assuntoId, dificil);
        return montar(u.getId());
    }

    @Transactional
    public Painel adiar(Usuario u, long assuntoId, int dias) {
        exigirAssunto(u, assuntoId);
        progresso.adiar(u.getId(), assuntoId, dias);
        return montar(u.getId());
    }

    @Transactional
    public Painel remover(Usuario u, long assuntoId, boolean remover) {
        exigirAssunto(u, assuntoId);
        progresso.remover(u.getId(), assuntoId, remover);
        return montar(u.getId());
    }

    /** Marca tudo o que falta hoje. Assunto dividido em partes conta como a parte do dia. */
    @Transactional
    public Painel concluirDia(Usuario u) {
        exigir(u);
        MentorPlano p = planos.findByUsuarioId(u.getId()).orElseThrow(NoSuchElementException::new);
        Calculo c = calcular(u.getId(), p);
        for (PlanejadorMentor.Tarefa t : c.pendentesHoje()) {
            switch (t.tipo()) {
                case ESTUDO -> {
                    if (t.partes() > 1) progresso.marcarParte(u.getId(), t.assuntoId(), t.minutos());
                    else progresso.marcarEstudado(u.getId(), t.assuntoId(), false);
                }
                case REVISAO -> progresso.marcarRevisado(u.getId(), t.assuntoId(), false);
                case REDACAO -> {
                    if (!c.redacaoNaSemana()) marcarRedacao(u.getId(), c.hoje(), true);
                }
            }
        }
        return montar(u.getId());
    }

    /**
     * "Não consegui" num item de hoje: ele vai para o próximo dia que couber. O tempo dele fica bloqueado hoje,
     * para o plano não puxar outro assunto no lugar.
     */
    @Transactional
    public Painel naoConsegui(Usuario u, long assuntoId) {
        exigirAssunto(u, assuntoId);
        MentorPlano p = planos.findByUsuarioId(u.getId()).orElseThrow(NoSuchElementException::new);
        Calculo c = calcular(u.getId(), p);
        int minutos = c.pendentesHoje().stream().filter(t -> Objects.equals(t.assuntoId(), assuntoId))
                .mapToInt(PlanejadorMentor.Tarefa::minutos).sum();
        if (minutos == 0) throw new IllegalArgumentException("Esse assunto não está no seu dia de hoje.");
        progresso.adiar(u.getId(), assuntoId, 1);
        bloquear(u.getId(), c.hoje(), minutos);
        return montar(u.getId());
    }

    /** "Não consegui" no dia inteiro: tudo o que falta hoje vai para os próximos dias, e o dia se encerra. */
    @Transactional
    public Painel naoConseguiDia(Usuario u) {
        exigir(u);
        MentorPlano p = planos.findByUsuarioId(u.getId()).orElseThrow(NoSuchElementException::new);
        Calculo c = calcular(u.getId(), p);
        int minutos = 0;
        for (PlanejadorMentor.Tarefa t : c.pendentesHoje()) {
            minutos += t.minutos();
            if (t.tipo() == PlanejadorMentor.Tipo.REDACAO) pularRedacao(u.getId(), c.hoje());
            else progresso.adiar(u.getId(), t.assuntoId(), 1);
        }
        // Encerra o dia inteiro, não só o que estava previsto.
        int capacidade = c.cfg().minutos()[c.hoje().getDayOfWeek().getValue() - 1];
        bloquear(u.getId(), c.hoje(), Math.max(minutos, capacidade));
        return montar(u.getId());
    }

    /** Redação da semana: feita (marcada pelo mentor) ou "não consegui" hoje. */
    @Transactional
    public Painel redacao(Usuario u, boolean feita) {
        exigir(u);
        planos.findByUsuarioId(u.getId()).orElseThrow(NoSuchElementException::new);
        LocalDate hoje = ProgressoEstudoService.hoje();
        if (feita) marcarRedacao(u.getId(), hoje, true);
        else pularRedacao(u.getId(), hoje);
        return montar(u.getId());
    }

    /** Desfaz a última marcação de hoje no assunto (o "Desfazer" que aparece logo depois de marcar). */
    @Transactional
    public Painel desfazerHoje(Usuario u, long assuntoId) {
        exigirAssunto(u, assuntoId);
        progresso.desfazerHoje(u.getId(), assuntoId);
        return montar(u.getId());
    }

    private void marcarRedacao(UUID uid, LocalDate hoje, boolean feita) {
        MentorDia d = retratos.findByUsuarioIdAndData(uid, hoje).orElseGet(() -> new MentorDia(uid, hoje));
        d.setRedacaoFeita(feita);
        d.setRedacaoPulada(false);
        retratos.save(d);
    }

    private void pularRedacao(UUID uid, LocalDate hoje) {
        MentorDia d = retratos.findByUsuarioIdAndData(uid, hoje).orElseGet(() -> new MentorDia(uid, hoje));
        d.setRedacaoPulada(true);
        d.setRedacaoFeita(false);
        retratos.save(d);
    }

    private void bloquear(UUID uid, LocalDate hoje, int minutos) {
        MentorDia d = retratos.findByUsuarioIdAndData(uid, hoje).orElseGet(() -> new MentorDia(uid, hoje));
        d.setMinutosBloqueados(Math.min(MAX_MIN_DIA, d.getMinutosBloqueados() + minutos));
        retratos.save(d);
    }

    public Detalhe detalhe(Usuario u, long assuntoId) {
        exigirAssunto(u, assuntoId);
        ItemCatalogo i = catalogo.item(assuntoId).orElseThrow(NoSuchElementException::new);
        EstudoAssunto e = estudos.findByUsuarioIdAndAssuntoId(u.getId(), assuntoId).orElse(null);
        String situacao = e == null ? "pendente" : e.isRemovido() ? "removido" : e.estudado() ? "estudado" : "pendente";
        List<AssuntoMini> pre = i.pre().stream().map(id -> catalogo.item(id).map(this::mini).orElse(null)).filter(Objects::nonNull).toList();
        return new Detalhe(mini(i), i.comoCai(), i.dominar(),
                i.flashcards().stream().map(f -> new Flashcard(f.pergunta(), f.resposta())).toList(),
                i.nivel(), i.incidencia(), situacao, e == null ? null : e.getEstudadoEm(), e == null ? 0 : e.getRevisoes(),
                e == null ? null : e.getProximaRevisao(), pre);
    }

    // ------------------------------------------------------------------ lembretes

    /** Para os lembretes: o que está previsto hoje (e grava o retrato do dia). Vazio se o aluno não tem plano. */
    public record ResumoDoDia(List<String> novos, int revisoes, boolean redacao, int feitasHoje, boolean abriuMao) {
        public boolean vazio() { return novos.isEmpty() && revisoes == 0 && !redacao; }
    }

    @Transactional
    public Optional<ResumoDoDia> resumoDoDia(UUID usuarioId) {
        MentorPlano p = planos.findByUsuarioId(usuarioId).orElse(null);
        if (p == null) return Optional.empty();
        Calculo c = calcular(usuarioId, p);
        List<String> novos = new ArrayList<>();
        int revisoes = 0;
        boolean redacao = false;
        for (PlanejadorMentor.Tarefa t : c.pendentesHoje()) {
            switch (t.tipo()) {
                case ESTUDO -> catalogo.item(t.assuntoId()).ifPresent(i -> novos.add(i.nome()));
                case REVISAO -> revisoes++;
                case REDACAO -> redacao = !c.redacaoNaSemana();
            }
        }
        boolean abriuMao = retratos.findByUsuarioIdAndData(usuarioId, c.hoje())
                .map(d -> d.getMinutosBloqueados() > 0 || d.isRedacaoPulada()).orElse(false);
        return Optional.of(new ResumoDoDia(novos, revisoes, redacao, c.registrosHoje().size(), abriuMao));
    }

    // ------------------------------------------------------------------ montagem

    private record Calculo(LocalDate hoje, PlanejadorMentor.Config cfg, Map<Long, Estado> estados, Map<Long, EstudoAssunto> linhas,
                           Resultado resultado, List<MentorRegistro> registrosHoje, List<PlanejadorMentor.Tarefa> pendentesHoje,
                           boolean redacaoNaSemana) {}

    private Calculo calcular(UUID uid, MentorPlano p) {
        LocalDate hoje = ProgressoEstudoService.hoje();
        PlanejadorMentor.Config cfg = new PlanejadorMentor.Config(p.getInicio(), minutos(p.getDisponibilidade()), foco(p.getAreasFoco()), p.getLingua());
        Map<Long, EstudoAssunto> linhas = estudos.findAllByUsuarioId(uid).stream()
                .collect(Collectors.toMap(EstudoAssunto::getAssuntoId, Function.identity(), (a, b) -> a));
        Map<Long, Estado> estados = new HashMap<>();
        linhas.forEach((id, e) -> estados.put(id, new Estado(e.getEstudadoEm(), e.getRevisoes(), e.getProximaRevisao(),
                e.getAdiadoAte(), e.isRemovido(), e.getMinutosFeitos(), e.getPartesFeitas())));
        List<MentorRegistro> hojeRegs = registros.findAllByUsuarioIdAndData(uid, hoje);
        MentorDia retratoHoje = retratos.findByUsuarioIdAndData(uid, hoje).orElse(null);
        // O que o aluno já fez hoje e o que ele abriu mão ("não consegui") saem do tempo de hoje.
        int usados = hojeRegs.stream().mapToInt(MentorRegistro::getMinutos).sum()
                + (retratoHoje == null ? 0 : retratoHoje.getMinutosBloqueados());
        Resultado r = PlanejadorMentor.planejar(hoje, catalogo.prova(), cfg, catalogo.paraPlanejador(), estados, usados);
        List<PlanejadorMentor.Tarefa> pendentes = r.dia(hoje).map(PlanejadorMentor.Dia::tarefas).orElse(List.of());
        if (retratoHoje != null && retratoHoje.isRedacaoPulada())
            pendentes = pendentes.stream().filter(t -> t.tipo() != PlanejadorMentor.Tipo.REDACAO).toList();

        // Redação da semana: registrada no módulo de redações ou marcada como feita no mentor.
        LocalDate seg = hoje.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        boolean redacaoNaSemana = redacoes.findAllByIdUsuarioOrderByDataDesc(uid).stream()
                .anyMatch(x -> x.getData() != null && !x.getData().isBefore(seg) && !x.getData().isAfter(seg.plusDays(6)))
                || retratos.findAllByUsuarioIdAndDataBetween(uid, seg, seg.plusDays(6)).stream().anyMatch(MentorDia::isRedacaoFeita);

        salvarRetrato(uid, hoje, pendentes, hojeRegs);
        return new Calculo(hoje, cfg, estados, linhas, r, hojeRegs, pendentes, redacaoNaSemana);
    }

    private Painel montar(UUID uid) {
        LocalDate prova = catalogo.prova();
        Map<String, String> orientacao = catalogo.orientacao();
        MentorPlano p = planos.findByUsuarioId(uid).orElse(null);
        Map<Long, ItemCatalogo> cat = catalogo.itens();
        if (p == null) {
            int antes = (int) estudos.findAllByUsuarioIdAndEstudadoEmIsNotNull(uid).stream().filter(e -> cat.containsKey(e.getAssuntoId())).count();
            return new Painel(false, ProgressoEstudoService.hoje(), prova, catalogo.provaConfirmada(), orientacao, null, null, null,
                    List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), antes);
        }

        Calculo c = calcular(uid, p);
        LocalDate hoje = c.hoje();
        Resultado r = c.resultado();

        LocalDate inicioMapa = (p.getInicio().isBefore(hoje) ? p.getInicio() : hoje).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Map<LocalDate, List<MentorRegistro>> regsPorDia = registros.findAllByUsuarioIdAndDataBetween(uid, inicioMapa, hoje).stream()
                .collect(Collectors.groupingBy(MentorRegistro::getData));
        Map<LocalDate, MentorDia> retratoPorDia = retratos.findAllByUsuarioIdAndDataBetween(uid, inicioMapa, hoje).stream()
                .collect(Collectors.toMap(MentorDia::getData, Function.identity(), (a, b) -> a));
        List<Tarefa> hojeTarefas = tarefasDeHoje(uid, c);

        // Semana corrente, de segunda a domingo.
        LocalDate seg = hoje.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<DiaSemana> semana = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = seg.plusDays(i);
            String fase = fase(d, r);
            if (d.isBefore(hoje)) {
                List<Tarefa> feitas = regsPorDia.getOrDefault(d, List.of()).stream().map(this::feita).toList();
                MentorDia ret = retratoPorDia.get(d);
                semana.add(new DiaSemana(d, fase, feitas.size(), ret == null ? null : ret.getPlanejadas(), feitas));
            } else if (d.equals(hoje)) {
                MentorDia ret = retratoPorDia.get(d);
                semana.add(new DiaSemana(d, fase, c.registrosHoje().size(), ret == null ? hojeTarefas.size() : Math.max(ret.getPlanejadas(), hojeTarefas.size()), hojeTarefas));
            } else {
                List<Tarefa> previstas = r.dia(d).map(x -> ordenarDoDia(x.tarefas()).stream()
                        .filter(t -> !(c.redacaoNaSemana() && t.tipo() == PlanejadorMentor.Tipo.REDACAO))
                        .map(t -> tarefa(t, hoje, Set.of(), c.redacaoNaSemana())).toList()).orElse(List.of());
                semana.add(new DiaSemana(d, fase, 0, previstas.size(), previstas));
            }
        }

        // Mapa do ano: do começo do plano até a prova.
        List<DiaMapa> mapa = new ArrayList<>();
        for (LocalDate d = inicioMapa; d.isBefore(prova); d = d.plusDays(1)) {
            String fase = fase(d, r);
            if (d.isBefore(hoje)) {
                MentorDia ret = retratoPorDia.get(d);
                mapa.add(new DiaMapa(d, fase, regsPorDia.getOrDefault(d, List.of()).size(), ret == null ? null : ret.getPlanejadas()));
            } else if (d.equals(hoje)) {
                mapa.add(new DiaMapa(d, fase, c.registrosHoje().size(), c.registrosHoje().size() + c.pendentesHoje().size()));
            } else {
                mapa.add(new DiaMapa(d, fase, 0, r.dia(d).map(x -> x.tarefas().size()).orElse(0)));
            }
        }

        // Resumo e áreas.
        Map<Long, ItemCatalogo> universo = new LinkedHashMap<>();
        cat.forEach((id, i) -> {
            if (i.lingua() != null && !i.lingua().equals(p.getLingua())) return;
            if (c.estados().containsKey(id) && c.estados().get(id).removido()) return;
            universo.put(id, i);
        });
        double totalInc = universo.values().stream().mapToDouble(ItemCatalogo::incidencia).sum();
        Set<Long> estudadosU = universo.keySet().stream().filter(id -> estudado(c.estados(), id)).collect(Collectors.toSet());
        int revisados = (int) estudadosU.stream().filter(id -> c.estados().get(id).revisoes() > 0).count();
        double cobertura = totalInc == 0 ? 0 : estudadosU.stream().mapToDouble(id -> universo.get(id).incidencia()).sum() / totalInc;
        double coberturaPlano = totalInc == 0 ? 0 : r.noPlano().stream().filter(universo::containsKey).mapToDouble(id -> universo.get(id).incidencia()).sum() / totalInc;
        LocalDate termino = r.conclusaoPrevista().values().stream().max(Comparator.naturalOrder()).orElse(null);
        Resumo resumo = new Resumo(r.noPlano().size(), estudadosU.size(), revisados, r.foraDoPlano().size(),
                arred(cobertura), arred(coberturaPlano), termino, Math.max(0, ChronoUnit.DAYS.between(hoje, prova)),
                sequencia(uid, hoje, regsPorDia, c.registrosHoje()), bemVindo(uid, p, hoje, c.registrosHoje()));

        List<Area> areas = new ArrayList<>();
        for (String a : AREAS) {
            List<ItemCatalogo> daArea = universo.values().stream().filter(i -> i.area().equals(a)).toList();
            double inc = daArea.stream().mapToDouble(ItemCatalogo::incidencia).sum();
            double feita = daArea.stream().filter(i -> estudadosU.contains(i.assuntoId())).mapToDouble(ItemCatalogo::incidencia).sum();
            int noPlano = (int) daArea.stream().filter(i -> r.noPlano().contains(i.assuntoId())).count();
            int estudadosArea = (int) daArea.stream().filter(i -> estudadosU.contains(i.assuntoId())).count();
            areas.add(new Area(a, estudadosArea, noPlano, inc == 0 ? 0 : arred(feita / inc)));
        }

        Set<Long> deHoje = c.pendentesHoje().stream().filter(t -> t.assuntoId() != null).map(PlanejadorMentor.Tarefa::assuntoId).collect(Collectors.toSet());
        List<Proximo> proximos = r.sequencia().stream()
                .filter(id -> !deHoje.contains(id) && r.inicioPrevisto().containsKey(id) && r.inicioPrevisto().get(id).isAfter(hoje))
                .sorted(Comparator.comparing(id -> r.inicioPrevisto().get(id)))
                .limit(6)
                .map(id -> catalogo.item(id).map(i -> new Proximo(mini(i), r.inicioPrevisto().get(id))).orElse(null))
                .filter(Objects::nonNull).toList();
        List<AssuntoMini> fora = r.foraDoPlano().stream().map(id -> catalogo.item(id).map(this::mini).orElse(null)).filter(Objects::nonNull).toList();
        List<AssuntoMini> removidos = c.linhas().values().stream().filter(EstudoAssunto::isRemovido)
                .map(e -> catalogo.item(e.getAssuntoId()).map(this::mini).orElse(null)).filter(Objects::nonNull).toList();

        Config config = new Config(p.getInicio(), Arrays.stream(c.cfg().minutos()).boxed().toList(), List.copyOf(c.cfg().foco()), p.getLingua(), p.isNotificacoes());
        Fases fases = new Fases(r.inicio(), r.inicioAprofundamento(), r.inicioRetaFinal(), fase(hoje, r));
        return new Painel(true, hoje, prova, catalogo.provaConfirmada(), orientacao, config, fases, resumo, hojeTarefas, semana, mapa,
                areas, proximos, fora, removidos, 0);
    }

    // ------------------------------------------------------------------ peças

    /** O que falta hoje primeiro, o que já foi feito depois. */
    private List<Tarefa> tarefasDeHoje(UUID uid, Calculo c) {
        LocalDate hoje = c.hoje();
        // "Ficou de ontem": estava no último dia com plano e não teve nem uma parte feita naquele dia.
        Set<Long> deOntem = retratos.findFirstByUsuarioIdAndDataLessThanOrderByDataDesc(uid, hoje)
                .filter(d -> !d.getData().isBefore(hoje.minusDays(7)))
                .map(d -> {
                    Set<Long> s = new HashSet<>(ids(d.getAssuntosNovos()));
                    registros.findAllByUsuarioIdAndData(uid, d.getData()).forEach(x -> s.remove(x.getAssuntoId()));
                    return s;
                }).orElse(Set.of());
        List<Tarefa> lista = new ArrayList<>();
        for (PlanejadorMentor.Tarefa t : ordenarDoDia(c.pendentesHoje())) lista.add(tarefa(t, hoje, deOntem, c.redacaoNaSemana()));
        for (MentorRegistro reg : c.registrosHoje()) lista.add(feita(reg));
        return lista;
    }

    private void salvarRetrato(UUID uid, LocalDate hoje, List<PlanejadorMentor.Tarefa> pendentes, List<MentorRegistro> feitas) {
        Set<Long> novos = new LinkedHashSet<>();
        pendentes.stream().filter(t -> t.tipo() == PlanejadorMentor.Tipo.ESTUDO).forEach(t -> novos.add(t.assuntoId()));
        feitas.stream().filter(f -> !MentorRegistro.REVISAO.equals(f.getTipo())).forEach(f -> novos.add(f.getAssuntoId()));
        MentorDia d = retratos.findByUsuarioIdAndData(uid, hoje).orElseGet(() -> new MentorDia(uid, hoje));
        Set<Long> todos = new LinkedHashSet<>(ids(d.getAssuntosNovos()));
        todos.addAll(novos);
        String texto = todos.stream().map(String::valueOf).collect(Collectors.joining(","));
        if (texto.length() > 400) {
            int corte = texto.lastIndexOf(',', 400);
            texto = corte > 0 ? texto.substring(0, corte) : "";
        }
        int planejadas = Math.max(d.getPlanejadas(), pendentes.size() + feitas.size());
        if (d.getId() != null && planejadas == d.getPlanejadas() && texto.equals(Objects.toString(d.getAssuntosNovos(), ""))) return;
        d.setPlanejadas(planejadas);
        d.setAssuntosNovos(texto);
        retratos.save(d);
    }

    /** Estudo primeiro, depois revisões e treinos, depois a redação. */
    private List<PlanejadorMentor.Tarefa> ordenarDoDia(List<PlanejadorMentor.Tarefa> ts) {
        return ts.stream().sorted(Comparator.comparingInt(t -> switch (t.tipo()) { case ESTUDO -> 0; case REVISAO -> 1; case REDACAO -> 2; })).toList();
    }

    private Tarefa tarefa(PlanejadorMentor.Tarefa t, LocalDate hoje, Set<Long> deOntem, boolean redacaoNaSemana) {
        if (t.tipo() == PlanejadorMentor.Tipo.REDACAO) return new Tarefa("redacao", null, 0, 0, 0, false, redacaoNaSemana, false);
        ItemCatalogo i = catalogo.item(t.assuntoId()).orElse(null);
        AssuntoMini m = i == null ? null : mini(i);
        if (t.tipo() == PlanejadorMentor.Tipo.ESTUDO)
            return new Tarefa("estudo", m, t.parte(), t.partes(), 0, deOntem.contains(t.assuntoId()), false, false);
        int atraso = t.devidaDesde() != null && t.devidaDesde().isBefore(hoje) ? (int) ChronoUnit.DAYS.between(t.devidaDesde(), hoje) : 0;
        return new Tarefa(i != null && i.habilidade() ? "treino" : "revisao", m, 0, 0, atraso, false, false, t.revisaoFinal());
    }

    private Tarefa feita(MentorRegistro reg) {
        ItemCatalogo i = catalogo.item(reg.getAssuntoId()).orElse(null);
        AssuntoMini m = i == null ? null : mini(i);
        String tipo = switch (reg.getTipo()) {
            case MentorRegistro.PARTE -> "parte";
            case MentorRegistro.REVISAO -> i != null && i.habilidade() ? "treino" : "revisao";
            default -> "estudo";
        };
        return new Tarefa(tipo, m, 0, 0, 0, false, true, false);
    }

    AssuntoMini mini(ItemCatalogo i) {
        String peso = i.minutos() <= 45 ? "leve" : i.minutos() <= 90 ? "medio" : "extenso";
        return new AssuntoMini(i.assuntoId(), i.nome(), i.area(), i.disciplina(), peso, catalogo.conteudo(i.assuntoId()).orElse(null), i.habilidade());
    }

    private static String fase(LocalDate d, Resultado r) {
        if (!d.isBefore(r.inicioRetaFinal())) return "reta-final";
        if (!d.isBefore(r.inicioAprofundamento())) return "aprofundamento";
        return "base";
    }

    /** Dias seguidos com alguma marcação, terminando hoje (ou ontem, se hoje ainda não teve nada). */
    private int sequencia(UUID uid, LocalDate hoje, Map<LocalDate, List<MentorRegistro>> porDia, List<MentorRegistro> hojeRegs) {
        LocalDate d = hojeRegs.isEmpty() ? hoje.minusDays(1) : hoje;
        int n = hojeRegs.isEmpty() ? 0 : 1;
        if (!hojeRegs.isEmpty()) d = d.minusDays(1);
        while (porDia.containsKey(d) && !porDia.get(d).isEmpty()) {
            n++;
            d = d.minusDays(1);
        }
        return n;
    }

    /** Quantos dias o aluno ficou sem marcar nada, se voltou depois de 3 dias ou mais (e ainda não marcou hoje). */
    private Integer bemVindo(UUID uid, MentorPlano p, LocalDate hoje, List<MentorRegistro> hojeRegs) {
        if (!hojeRegs.isEmpty() || hoje.isBefore(p.getInicio().plusDays(3))) return null;
        LocalDate ultimo = registros.findAllByUsuarioIdAndDataBetween(uid, hoje.minusDays(60), hoje.minusDays(1)).stream()
                .map(MentorRegistro::getData).max(Comparator.naturalOrder()).orElse(null);
        LocalDate base = ultimo != null && ultimo.isAfter(p.getInicio()) ? ultimo : p.getInicio();
        long dias = ChronoUnit.DAYS.between(base, hoje);
        return dias >= 3 ? (int) dias : null;
    }

    private static boolean estudado(Map<Long, Estado> estados, Long id) {
        Estado e = estados.get(id);
        return e != null && e.estudadoEm() != null;
    }

    private static int[] minutos(String texto) {
        int[] m = new int[7];
        String[] partes = texto == null ? new String[0] : texto.split(",");
        for (int i = 0; i < 7 && i < partes.length; i++) {
            try { m[i] = Math.max(0, Math.min(MAX_MIN_DIA, Integer.parseInt(partes[i].trim()))); } catch (NumberFormatException ignored) {}
        }
        return m;
    }

    private static Set<String> foco(String texto) {
        if (texto == null || texto.isBlank()) return Set.of();
        return Arrays.stream(texto.split(",")).map(String::trim).filter(AREAS::contains).collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static Set<Long> ids(String texto) {
        if (texto == null || texto.isBlank()) return Set.of();
        Set<Long> s = new LinkedHashSet<>();
        for (String x : texto.split(",")) {
            try { s.add(Long.parseLong(x.trim())); } catch (NumberFormatException ignored) {}
        }
        return s;
    }

    private static double arred(double v) {
        return Math.round(v * 1000) / 1000.0;
    }

    private void exigir(Usuario u) {
        if (!acesso.liberado(u)) throw new NaoLiberado();
    }

    private void exigirAssunto(Usuario u, long assuntoId) {
        exigir(u);
        if (catalogo.item(assuntoId).isEmpty()) throw new NoSuchElementException("Assunto não encontrado.");
    }
}
