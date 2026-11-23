package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.AuthResponseDTO;
import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.Enum.EventType;
import com.example.EnemDaily_backend.model.*;
import com.example.EnemDaily_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DemoService {

    static final String EMAIL = "demo@enemdaily.app";
    private static final String USUARIO = "usuario.demo";
    private static final String NOME = "Usuário";
    private static final String AVATAR = "ed1|ameixa|diagonal|nenhuma|||";
    private static final UUID GRUPO_BRASIL = UUID.fromString("16599b34-57a9-41e3-b1cb-eb255671c3f1");

    private static final int SEQUENCIA_ATUAL = 26;
    private static final int DIAS_ANTES_DA_PAUSA = 24;
    private static final int XP_TOTAL = 6240;
    private static final int QUESTOES_PULADAS = 4;
    private static final long SEMENTE = 20261121L;

    private static final AreaEnum[] AREAS = { AreaEnum.LINGUAGENS, AreaEnum.HUMANAS, AreaEnum.NATUREZAS, AreaEnum.EXATAS };
    private static final Map<AreaEnum, Integer> ACERTOS = Map.of(
            AreaEnum.LINGUAGENS, 42, AreaEnum.HUMANAS, 39, AreaEnum.NATUREZAS, 36, AreaEnum.EXATAS, 39);
    private static final Map<AreaEnum, List<String>> ASSUNTOS_PADRAO = Map.of(
            AreaEnum.LINGUAGENS, List.of("Interpretação de Texto", "Gêneros Textuais", "Variação Linguística", "Funções da Linguagem", "Literatura Brasileira"),
            AreaEnum.HUMANAS, List.of("Brasil Colônia", "Brasil Império", "Geopolítica", "Urbanização", "Filosofia Moderna"),
            AreaEnum.NATUREZAS, List.of("Ecologia", "Genética", "Eletricidade", "Termoquímica", "Fisiologia Humana"),
            AreaEnum.EXATAS, List.of("Porcentagem", "Funções", "Geometria Plana", "Estatística", "Probabilidade"));

    private final UsuarioRepository usuarioRepository;
    private final EventRepository eventRepository;
    private final AssuntoRepository assuntoRepository;
    private final SimuladoRepository simuladoRepository;
    private final RedacaoRepository redacaoRepository;
    private final GrupoRepository grupoRepository;
    private final GrupoUsuarioRepository grupoUsuarioRepository;
    private final UsuarioService usuarioService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    private record Vaga(LocalDate dia, AreaEnum area) {}

    @Transactional
    public synchronized AuthResponseDTO entrar() {
        Usuario u = usuarioRepository.findByEmail(EMAIL).orElseGet(this::criar);
        prepararParaVisita(u);
        return new AuthResponseDTO(jwtService.generateToken(u), usuarioService.getUsuarioResponseDTO(u));
    }

    @Transactional
    public synchronized void recriar() {
        usuarioRepository.findByEmail(EMAIL).ifPresent(u -> {
            apagarDados(u.getId());
            grupoUsuarioRepository.deleteAll(grupoUsuarioRepository.findAllByUsuario(u));
            usuarioRepository.delete(u);
            usuarioRepository.flush();
        });
        prepararParaVisita(criar());
    }

    private Usuario criar() {
        Usuario u = new Usuario();
        u.setNome(NOME);
        u.setUsuario(USUARIO);
        u.setEmail(EMAIL);
        u.setSenha(passwordEncoder.encode(UUID.randomUUID().toString() + new SecureRandom().nextLong()));
        u.setAvatar(AVATAR);
        u.setDemo(true);
        u.setOnboardingVisto(true);
        u.setPagFavorita("nenhuma");
        u.setEmblemas("");
        u.setTokenSessao("");
        u.setNaturezas(new Area());
        u.setHumanas(new Area());
        u.setLinguagens(new Area());
        u.setExatas(new Area());
        u.setDataUtilmoAcesso(LocalDate.now().minusDays(1));
        return usuarioRepository.save(u);
    }

    private void apagarDados(UUID id) {
        eventRepository.apagarTodos(id);
        simuladoRepository.deleteAll(simuladoRepository.findAllByIdUsuario(id));
        redacaoRepository.deleteAll(redacaoRepository.findAllByIdUsuarioOrderByDataDesc(id));
    }

    private void prepararParaVisita(Usuario u) {
        LocalDate hoje = LocalDate.now();
        eventRepository.apagarDesde(u.getId(), hoje.atStartOfDay());
        List<Event> eventos = eventRepository.findByIdUsuarioOrderByDataAsc(u.getId());
        int xpAtual = eventos.stream().mapToInt(e -> e.getJsonContext() == null ? 0 : ((Number) e.getJsonContext().getOrDefault("xp", 0)).intValue()).sum();
        boolean atualizado = !eventos.isEmpty() && xpAtual == XP_TOTAL
                && eventos.get(eventos.size() - 1).getData().toLocalDate().equals(hoje.minusDays(1));
        if (!atualizado) {
            apagarDados(u.getId());
            eventos = eventRepository.saveAll(gerarHistorico(u.getId(), hoje));
            semearSimulados(u.getId(), hoje);
            semearRedacoes(u.getId(), hoje);
            u.setDataCadastro(diasDeEstudo(hoje).get(0).minusDays(2).atTime(19, 12));
        }
        u.setNome(NOME);
        u.setUsuario(USUARIO);
        u.setAvatar(AVATAR);
        u.setEmblemas("");
        recalcular(u, eventos, hoje);
        u = usuarioRepository.save(u);
        eventRepository.flush();
        garantirGrupo(u, diasDeEstudo(hoje).get(0));
    }

    private void garantirGrupo(Usuario u, LocalDate entrada) {
        grupoRepository.findById(GRUPO_BRASIL).ifPresent(g -> {
            GrupoUsuario gu = grupoUsuarioRepository.findAllByUsuario(u).stream()
                    .filter(x -> x.getGrupo().getId().equals(g.getId())).findFirst()
                    .orElseGet(() -> {
                        GrupoUsuario novo = new GrupoUsuario();
                        novo.setGrupo(g);
                        novo.setUsuario(u);
                        novo.setAdmin(false);
                        return novo;
                    });
            int xp = 0;
            if (g.isLinguagens()) xp += u.getLinguagens().getXp();
            if (g.isHumanas()) xp += u.getHumanas().getXp();
            if (g.isNaturezas()) xp += u.getNaturezas().getXp();
            if (g.isExatas()) xp += u.getExatas().getXp();
            gu.setXp(xp);
            gu.setDataEntrada(entrada.atTime(19, 30));
            grupoUsuarioRepository.save(gu);
        });
    }

    private List<LocalDate> diasDeEstudo(LocalDate hoje) {
        List<LocalDate> dias = new ArrayList<>();
        LocalDate inicioRecente = hoje.minusDays(SEQUENCIA_ATUAL);
        LocalDate inicioAntigo = inicioRecente.minusDays(1 + DIAS_ANTES_DA_PAUSA);
        for (LocalDate d = inicioAntigo; d.isBefore(inicioRecente.minusDays(1)); d = d.plusDays(1)) dias.add(d);
        for (LocalDate d = inicioRecente; d.isBefore(hoje); d = d.plusDays(1)) dias.add(d);
        return dias;
    }

    private List<Event> gerarHistorico(UUID id, LocalDate hoje) {
        Random r = new Random(SEMENTE);
        List<LocalDate> dias = diasDeEstudo(hoje);
        List<Vaga> vagas = new ArrayList<>();
        for (LocalDate d : dias) for (AreaEnum a : AREAS) vagas.add(new Vaga(d, a));
        for (int i = 0; i < QUESTOES_PULADAS; i++) vagas.remove(1 + r.nextInt(DIAS_ANTES_DA_PAUSA * 4 - 2));

        Set<Vaga> corretas = new HashSet<>();
        for (AreaEnum a : AREAS) {
            List<Vaga> daArea = new ArrayList<>(vagas.stream().filter(v -> v.area() == a).toList());
            Collections.shuffle(daArea, r);
            corretas.addAll(daArea.subList(0, Math.min(ACERTOS.get(a), daArea.size())));
        }

        List<Vaga> ordemCorretas = vagas.stream().filter(corretas::contains).toList();
        int[] xps = new int[ordemCorretas.size()];
        int soma = 0;
        for (int i = 0; i < xps.length; i++) { xps[i] = 28 + r.nextInt(25); soma += xps[i]; }
        for (int i = 0; soma != XP_TOTAL && xps.length > 0; i = (i + 1) % xps.length) {
            int passo = soma < XP_TOTAL ? 1 : -1;
            if (xps[i] + passo < 20 || xps[i] + passo > 84) continue;
            xps[i] += passo;
            soma += passo;
        }
        Map<Vaga, Integer> xpDe = new HashMap<>();
        for (int i = 0; i < xps.length; i++) xpDe.put(ordemCorretas.get(i), xps[i]);

        Map<AreaEnum, List<String>> assuntos = assuntosPorArea();
        List<Event> out = new ArrayList<>();
        Map<LocalDate, LocalTime> horaDoDia = new HashMap<>();
        for (Vaga v : vagas) {
            boolean acerto = corretas.contains(v);
            int xp = acerto ? xpDe.get(v) : 0;
            int xpBase = acerto ? Math.min(70, (int) Math.round(xp / 1.1)) : 0;
            int tempo = !acerto ? 60 + r.nextInt(150) : xpBase >= 70 ? 28 + r.nextInt(12) : Math.max(41, (int) Math.round(70 * 40.0 / Math.max(xpBase, 1)));
            LocalTime hora = horaDoDia.computeIfAbsent(v.dia(), d -> LocalTime.of(10 + r.nextInt(8), r.nextInt(50)));
            horaDoDia.put(v.dia(), hora.plusMinutes(3 + r.nextInt(5)));
            List<String> lista = assuntos.get(v.area());
            Map<String, Object> ctx = new HashMap<>();
            ctx.put("xp", xp);
            ctx.put("xpBase", xpBase);
            ctx.put("assunto", lista.get(r.nextInt(lista.size())));
            ctx.put("area", v.area().name());
            ctx.put("acerto", acerto);
            ctx.put("tempoGasto", tempo);
            Event e = new Event();
            e.setIdUsuario(id);
            e.setTipo(EventType.RESPOSTA_QUESTAO);
            e.setData(v.dia().atTime(hora));
            e.setJsonContext(ctx);
            out.add(e);
        }
        return out;
    }

    private void recalcular(Usuario u, List<Event> eventos, LocalDate hoje) {
        Map<AreaEnum, Area> areas = new EnumMap<>(AreaEnum.class);
        for (AreaEnum a : AREAS) {
            Area x = new Area();
            x.setUltimaResposta(hoje.minusDays(1));
            areas.put(a, x);
        }
        int xpTotal = 0, respondidas = 0, acertos = 0, sequenciaAcertos = 0;
        for (Event e : eventos) {
            Map<String, Object> c = e.getJsonContext();
            if (c == null || c.get("area") == null) continue;
            AreaEnum area = AreaEnum.valueOf(String.valueOf(c.get("area")));
            boolean acerto = Boolean.TRUE.equals(c.get("acerto"));
            int xp = ((Number) c.getOrDefault("xp", 0)).intValue();
            int tempo = ((Number) c.getOrDefault("tempoGasto", 0)).intValue();
            Area a = areas.get(area);
            a.setQuestoesRespondidas(a.getQuestoesRespondidas() + 1);
            a.setXp(a.getXp() + xp);
            a.setTempoGasto(a.getTempoGasto() + tempo);
            if (acerto) { a.setAcertos(a.getAcertos() + 1); a.setStreak(a.getStreak() + 1); } else a.setStreak(0);
            xpTotal += xp;
            respondidas++;
            if (acerto) { acertos++; sequenciaAcertos++; } else sequenciaAcertos = 0;
        }
        u.setLinguagens(areas.get(AreaEnum.LINGUAGENS));
        u.setHumanas(areas.get(AreaEnum.HUMANAS));
        u.setNaturezas(areas.get(AreaEnum.NATUREZAS));
        u.setExatas(areas.get(AreaEnum.EXATAS));
        u.setXpTotal(xpTotal);
        u.setQuestoesRespondidasTotal(respondidas);
        u.setQuestoesAcertadasTotal(acertos);
        u.setStreak(sequenciaAcertos);
        u.setDiasAtivosStreak(SEQUENCIA_ATUAL);
        u.setSemanasCompletadas(respondidas / 28);
        u.setDataUtilmoAcesso(hoje.minusDays(1));
        u.setLingRespondidaHj(false);
        u.setHumRespondidaHj(false);
        u.setNatRespondidaHj(false);
        u.setExatRespondidaHj(false);
        u.setD1(true);
        u.setD7(true);
        u.setD30(false);
    }

    private Map<AreaEnum, List<String>> assuntosPorArea() {
        Map<AreaEnum, List<String>> m = new EnumMap<>(AreaEnum.class);
        for (Assunto a : assuntoRepository.findAll()) {
            if (a.getArea() != null) m.computeIfAbsent(a.getArea(), k -> new ArrayList<>()).add(a.getNomeAssunto());
        }
        for (AreaEnum a : AREAS) {
            List<String> lista = m.getOrDefault(a, new ArrayList<>());
            lista.sort(Comparator.naturalOrder());
            m.put(a, lista.isEmpty() ? ASSUNTOS_PADRAO.get(a) : lista);
        }
        return m;
    }

    private void semearSimulados(UUID id, LocalDate hoje) {
        int[][] notas = { { 31, 28, 24, 23 }, { 34, 31, 27, 27 }, { 37, 34, 30, 31 } };
        Integer anterior1 = null, anterior2 = null;
        for (int i = 0; i < notas.length; i++) {
            int[] n = notas[i];
            LocalDate data = hoje.minusDays(46 - i * 18L);
            anterior1 = salvarSimulado(id, "Simulado " + (i + 1) + " · 1º dia", data, i + 1, 1, n[0], n[1], 0, 0, anterior1);
            anterior2 = salvarSimulado(id, "Simulado " + (i + 1) + " · 2º dia", data.plusDays(7), i + 1, 2, 0, 0, n[2], n[3], anterior2);
        }
    }

    private int salvarSimulado(UUID id, String nome, LocalDate data, int numeracao, int dia, int lc, int ch, int cn, int mt, Integer anterior) {
        Simulado s = new Simulado();
        s.setIdUsuario(id);
        s.setNome(nome);
        s.setData(data);
        s.setNumeracao(numeracao);
        s.setDia(dia);
        s.setLinguagens(lc);
        s.setHumanas(ch);
        s.setNaturezas(cn);
        s.setExatas(mt);
        s.setTotal(lc + ch + cn + mt);
        s.setDif(anterior == null ? 0 : s.getTotal() - anterior);
        s.setAnotacoes("");
        simuladoRepository.save(s);
        return s.getTotal();
    }

    private void semearRedacoes(UUID id, LocalDate hoje) {
        String[] temas = {
                "Desafios para a valorização de comunidades e povos tradicionais no Brasil",
                "Invisibilidade do trabalho de cuidado realizado pela mulher no Brasil",
                "Caminhos para combater a insegurança alimentar no Brasil",
                "O estigma associado às doenças mentais na sociedade brasileira" };
        int[][] comp = { { 160, 120, 120, 140, 120 }, { 160, 160, 120, 160, 140 }, { 160, 160, 160, 180, 160 }, { 180, 160, 160, 180, 180 } };
        int anterior = -1;
        for (int i = 0; i < temas.length; i++) {
            int[] c = comp[i];
            int nota = Arrays.stream(c).sum();
            Redacao r = new Redacao(temas[i], id, hoje.minusDays(48 - i * 14L), c[0], c[1], c[2], c[3], c[4], anterior < 0 ? 0 : nota - anterior);
            r.setNota(nota);
            redacaoRepository.save(r);
            anterior = nota;
        }
    }
}
