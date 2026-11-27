package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.ProvaDTOs.Correcao;
import com.example.EnemDaily_backend.DTO.ProvaDTOs.Responder;
import com.example.EnemDaily_backend.DTO.ProvaDTOs.Revisao;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import com.example.EnemDaily_backend.DTO.RespostaDTO;
import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Area;
import com.example.EnemDaily_backend.model.QuestaoGen;
import com.example.EnemDaily_backend.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

@Service
public class CorrecaoService {

    public static final int TEMPO_TOTAL = 210;
    private static final int XP_MAX = 70;
    private static final int XP_MIN = 5;
    private static final int TEMPO_BASE = 40;

    public static class JaRespondida extends RuntimeException {
        public JaRespondida() { super("Você já respondeu essa área hoje."); }
    }

    public static class NaoRespondida extends RuntimeException {
        public NaoRespondida() { super("Você ainda não respondeu essa área hoje."); }
    }

    public static class SemQuestao extends RuntimeException {
        public SemQuestao() { super("Ainda não há questão dessa área hoje."); }
    }

    private final GeradorQuestaoService questoes;
    private final UsuarioService usuarios;
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    @Value("${enemdaily.modo-teste:false}")
    private boolean modoTeste;

    public CorrecaoService(GeradorQuestaoService questoes, UsuarioService usuarios, JdbcTemplate jdbc, ObjectMapper mapper) {
        this.questoes = questoes;
        this.usuarios = usuarios;
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    public Revisao revisar(String areaTexto, Usuario usuario) {
        AreaEnum area = AreaEnum.parse(areaTexto);
        QuestaoGen q = questoes.getQuestaoDia(area);
        if (q == null) throw new SemQuestao();
        List<Map<String, Object>> linhas = jdbc.queryForList("""
                select cast(json_context as text) as ctx, to_char(data, 'HH24:MI') as hora from event
                where id_usuario = ? and tipo = 'RESPOSTA_QUESTAO' and data >= current_date and data < current_date + interval '1 day'
                  and json_context->>'area' = ?
                order by data desc limit 1""", usuario.getId(), area.name());
        if (linhas.isEmpty()) throw new NaoRespondida();
        JsonNode ctx;
        try {
            ctx = mapper.readTree((String) linhas.get(0).get("ctx"));
        } catch (Exception e) {
            ctx = mapper.createObjectNode();
        }
        int indiceCorreto = IntStream.range(0, q.getAlternativas().size()).filter(i -> q.getAlternativas().get(i).isCorreta()).findFirst().orElse(-1);
        Integer alternativa = ctx.hasNonNull("alternativa") ? ctx.get("alternativa").asInt() : null;
        return new Revisao(q, alternativa, ctx.path("acerto").asBoolean(false), ctx.path("xp").asInt(0),
                ctx.path("tempoGasto").asInt(0), indiceCorreto, (String) linhas.get(0).get("hora"));
    }

    public Correcao corrigir(Responder r, Usuario usuario) {
        AreaEnum area = AreaEnum.parse(r.area());
        if (area == null) throw new IllegalArgumentException("Área inválida");
        QuestaoGen q = questoes.getQuestaoDia(area);
        if (q == null) throw new SemQuestao();
        Area dados = dadosDaArea(usuario, area);
        if (!modoTeste && dados != null && LocalDate.now().equals(dados.getUltimaResposta())) throw new JaRespondida();

        int tempo = Math.max(0, Math.min(r.tempoGasto(), TEMPO_TOTAL));
        int indiceCorreto = IntStream.range(0, q.getAlternativas().size()).filter(i -> q.getAlternativas().get(i).isCorreta()).findFirst().orElse(-1);
        Integer marcada = r.alternativa();
        boolean acerto = marcada != null && marcada >= 0 && marcada == indiceCorreto;

        int bonusPct = 0, xpBase = 0, xp = 0;
        if (acerto) {
            xpBase = tempo <= TEMPO_BASE ? XP_MAX : Math.max((int) Math.floor(XP_MAX * ((double) TEMPO_BASE / Math.max(tempo, 1))), XP_MIN);
            int dias = usuarios.getStreakDiasAtivos(usuario.getId());
            bonusPct = dias >= 20 ? 20 : dias >= 8 ? 15 : dias >= 4 ? 10 : 0;
            xp = (int) Math.floor(xpBase * (1 + bonusPct / 100.0));
        }
        var usuarioAtualizado = usuarios.registraResposta(new RespostaDTO(xp, tempo, acerto, q.getAssunto(), area, xpBase, marcada, q.getId()), usuario);
        return new Correcao(usuarioAtualizado, acerto, xp, xpBase, bonusPct, indiceCorreto, q);
    }

    private static Area dadosDaArea(Usuario u, AreaEnum area) {
        return switch (area) {
            case NATUREZAS -> u.getNaturezas();
            case HUMANAS -> u.getHumanas();
            case EXATAS -> u.getExatas();
            case LINGUAGENS -> u.getLinguagens();
        };
    }
}
