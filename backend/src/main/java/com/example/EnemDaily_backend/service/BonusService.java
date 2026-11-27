package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.ProvaDTOs;
import com.example.EnemDaily_backend.DTO.UsuarioResponseDTO;
import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.QuestaoGen;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.QuestaoGenRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.IntStream;

/**
 * Questão bônus: um dia surpresa por semana, igual para todos, em que cada aluno recebe
 * de volta uma questão que errou antes (revisão de erro). Vale até 50 XP e não conta como questão do dia.
 */
@Service
public class BonusService {

    public static final int XP_MAX = 50;
    private static final int XP_MIN = 5;
    private static final int TEMPO_BASE = 40;
    private static final int DIAS_RECENTES = 21;

    public static class SemBonus extends RuntimeException {
        public SemBonus(String msg) { super(msg); }
    }

    public record Status(boolean disponivel, boolean respondida, String area, int xpMax, String erradaEm,
                         ProvaDTOs.QuestaoProva questao, ProvaDTOs.Revisao revisao) {
        static Status nenhum() { return new Status(false, false, null, XP_MAX, null, null, null); }
    }

    private record Candidato(Long questaoId, AreaEnum area, LocalDate dia) {}
    private record Escolha(QuestaoGen questao, LocalDate erradaEm) {}

    private final JdbcTemplate jdbc;
    private final QuestaoGenRepository questoes;
    private final UsuarioService usuarios;
    private final ObjectMapper mapper;

    @Value("${enemdaily.modo-teste:false}")
    private boolean modoTeste;

    public BonusService(JdbcTemplate jdbc, QuestaoGenRepository questoes, UsuarioService usuarios, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.questoes = questoes;
        this.usuarios = usuarios;
        this.mapper = mapper;
    }

    /** Um dia por semana, sorteado pelo número da semana: o mesmo dia para todo mundo e sem padrão fixo. */
    public static boolean ehDiaDeBonus(LocalDate dia) {
        long semana = dia.with(DayOfWeek.MONDAY).toEpochDay();
        long h = semana * 0x9E3779B97F4A7C15L;
        h = (h ^ (h >>> 30)) * 0xBF58476D1CE4E5B9L;
        h = (h ^ (h >>> 27)) * 0x94D049BB133111EBL;
        h ^= (h >>> 31);
        return dia.getDayOfWeek().getValue() - 1 == (int) Math.floorMod(h, 7L);
    }

    private boolean hojeTemBonus() { return modoTeste || ehDiaDeBonus(LocalDate.now()); }

    public Status status(Usuario u) {
        if (u == null || u.isDemo() || !hojeTemBonus()) return Status.nenhum();
        Map<String, Object> feita = respostaDeHoje(u);
        if (feita != null) {
            JsonNode ctx = ctx(feita.get("ctx"));
            QuestaoGen q = ctx.hasNonNull("questaoId") ? questoes.findById(ctx.get("questaoId").asLong()).orElse(null) : null;
            if (q == null) return Status.nenhum();
            Integer alt = ctx.hasNonNull("alternativa") ? ctx.get("alternativa").asInt() : null;
            var revisao = new ProvaDTOs.Revisao(q, alt, ctx.path("acerto").asBoolean(false), ctx.path("xp").asInt(0),
                    ctx.path("tempoGasto").asInt(0), indiceCorreto(q), (String) feita.get("hora"));
            return new Status(true, true, q.getArea().name(), XP_MAX, ctx.path("erradaEm").asText(null), null, revisao);
        }
        Escolha e = escolher(u);
        if (e == null) return Status.nenhum();
        return new Status(true, false, e.questao().getArea().name(), XP_MAX, e.erradaEm().toString(), ProvaDTOs.QuestaoProva.de(e.questao()), null);
    }

    public ProvaDTOs.Correcao responder(Usuario u, Integer alternativa, int tempoGasto) {
        if (u == null || u.isDemo() || !hojeTemBonus()) throw new SemBonus("Hoje não tem questão bônus.");
        if (respostaDeHoje(u) != null) throw new SemBonus("Você já respondeu a questão bônus de hoje.");
        Escolha e = escolher(u);
        if (e == null) throw new SemBonus("Não encontramos uma questão para revisar.");
        QuestaoGen q = e.questao();
        int tempo = Math.max(0, Math.min(tempoGasto, CorrecaoService.TEMPO_TOTAL));
        int certo = indiceCorreto(q);
        boolean acerto = alternativa != null && alternativa >= 0 && alternativa == certo;
        int xp = !acerto ? 0 : tempo <= TEMPO_BASE ? XP_MAX : Math.max((int) Math.floor(XP_MAX * ((double) TEMPO_BASE / Math.max(tempo, 1))), XP_MIN);
        UsuarioResponseDTO dto = usuarios.registraBonus(u, q.getArea(), q.getId(), acerto, xp, tempo, alternativa, e.erradaEm());
        return new ProvaDTOs.Correcao(dto, acerto, xp, xp, 0, certo, q);
    }

    // Sorteia entre as questões erradas antes de hoje, dando preferência às das últimas semanas.
    // O sorteio usa o dia e o aluno como semente: abrir e responder sempre caem na mesma questão.
    private Escolha escolher(Usuario u) {
        LocalDate hoje = LocalDate.now();
        Set<Long> jaRevisadas = new HashSet<>(jdbc.queryForList("""
                select (json_context->>'questaoId')::bigint from event
                where id_usuario = ? and tipo = 'RESPOSTA_BONUS' and json_context->>'questaoId' is not null""", Long.class, u.getId()));
        List<Candidato> erros = jdbc.query("""
                select json_context->>'questaoId' as qid, json_context->>'area' as area, cast(data as date) as dia from event
                where id_usuario = ? and tipo = 'RESPOSTA_QUESTAO' and json_context->>'acerto' = 'false' and data < current_date
                order by data desc limit 400""",
                (rs, i) -> {
                    String qid = rs.getString("qid");
                    AreaEnum area = AreaEnum.parse(rs.getString("area"));
                    return new Candidato(qid == null || qid.isBlank() ? null : Long.valueOf(qid), area, rs.getDate("dia").toLocalDate());
                }, u.getId());
        Random sorteio = new Random(u.getId().hashCode() * 31L + hoje.toEpochDay());
        List<Candidato> recentes = new ArrayList<>(), antigos = new ArrayList<>();
        for (Candidato c : erros) if (c.area() != null) (c.dia().isAfter(hoje.minusDays(DIAS_RECENTES + 1)) ? recentes : antigos).add(c);
        Collections.shuffle(recentes, sorteio);
        Collections.shuffle(antigos, sorteio);
        for (List<Candidato> grupo : List.of(recentes, antigos))
            for (Candidato c : grupo) {
                QuestaoGen q = resolver(c);
                if (q != null && !jaRevisadas.contains(q.getId()) && !q.getAlternativas().isEmpty()) return new Escolha(q, c.dia());
            }
        return null;
    }

    // Eventos antigos não guardam o id: cada área tem uma questão por dia, então área + data a identificam.
    private QuestaoGen resolver(Candidato c) {
        if (c.questaoId() != null) return questoes.findById(c.questaoId()).orElse(null);
        return questoes.buscarQuestaoDoDia(c.area(), c.dia().atStartOfDay(), c.dia().plusDays(1).atStartOfDay()).orElse(null);
    }

    private Map<String, Object> respostaDeHoje(Usuario u) {
        List<Map<String, Object>> l = jdbc.queryForList("""
                select cast(json_context as text) as ctx, to_char(data, 'HH24:MI') as hora from event
                where id_usuario = ? and tipo = 'RESPOSTA_BONUS' and data >= current_date and data < current_date + interval '1 day'
                order by data desc limit 1""", u.getId());
        return l.isEmpty() ? null : l.get(0);
    }

    private JsonNode ctx(Object texto) {
        try { return mapper.readTree((String) texto); } catch (Exception e) { return mapper.createObjectNode(); }
    }

    private static int indiceCorreto(QuestaoGen q) {
        return IntStream.range(0, q.getAlternativas().size()).filter(i -> q.getAlternativas().get(i).isCorreta()).findFirst().orElse(-1);
    }
}
