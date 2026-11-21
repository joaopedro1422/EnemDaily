package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Slf4j
@Service
public class AdminService {

    private final JdbcTemplate jdbc;

    public AdminService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> resumo() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("usuarios", contar("select count(*) from tb_usuarios"));
        r.put("novos7dias", contar("select count(*) from tb_usuarios where data_cadastro >= now() - interval '7 days'"));
        r.put("ativosHoje", contar("select count(distinct id_usuario) from event where tipo = 'RESPOSTA_QUESTAO' and data >= current_date"));
        r.put("respostasTotal", contar("select count(*) from event where tipo = 'RESPOSTA_QUESTAO'"));
        r.put("usuariosComSimulados", contar("select count(distinct s.id_usuario) from tb_simulados s join tb_usuarios u on u.id = s.id_usuario"));
        r.put("simulados", contar("select count(*) from tb_simulados"));
        r.put("usuariosComRedacoes", contar("select count(distinct r.id_usuario) from tb_redacao r join tb_usuarios u on u.id = r.id_usuario"));
        r.put("redacoes", contar("select count(*) from tb_redacao"));
        return r;
    }

    public Map<String, Object> usuarios(String busca, int pagina, int tamanho) {
        String filtro = busca == null ? "" : busca.trim().toLowerCase(Locale.ROOT);
        String like = "%" + filtro.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        String where = " where (? = '' or lower(u.nome) like ? or lower(u.usuario) like ? or lower(u.email) like ?) ";
        long total = jdbc.queryForObject("select count(*) from tb_usuarios u" + where, Long.class, filtro, like, like, like);
        List<Map<String, Object>> lista = jdbc.queryForList("""
                select u.id, u.nome, u.usuario, u.email, u.avatar, u.demo, u.xp_total as "xpTotal",
                       u.questoes_respondidas_total as "respondidas", u.questoes_acertadas_total as "acertos",
                       u.data_cadastro as "dataCadastro", u.data_utilmo_acesso as "ultimoAcesso",
                       (select count(*) from tb_simulados s where s.id_usuario = u.id) as "simulados",
                       (select count(*) from tb_redacao r where r.id_usuario = u.id) as "redacoes"
                from tb_usuarios u""" + where + """
                order by u.data_cadastro desc nulls last, u.nome
                limit ? offset ?""", filtro, like, like, like, tamanho, (long) pagina * tamanho);
        return Map.of("total", total, "pagina", pagina, "tamanho", tamanho, "usuarios", lista);
    }

    public List<Map<String, Object>> atividadeDoMes(YearMonth mes) {
        LocalDate ini = mes.atDay(1);
        return jdbc.queryForList("""
                select cast(date(data) as text) as "dia", count(*) as "respostas", count(distinct id_usuario) as "ativos"
                from event where tipo = 'RESPOSTA_QUESTAO' and data >= ? and data < ?
                group by date(data) order by 1""", ini, ini.plusMonths(1));
    }

    public Map<String, Object> atividadeDoDia(LocalDate dia) {
        Object[] p = {dia, dia.plusDays(1)};
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("dia", dia.toString());
        r.put("respostas", contar("select count(*) from event where tipo = 'RESPOSTA_QUESTAO' and data >= ? and data < ?", p));
        r.put("ativos", contar("select count(distinct id_usuario) from event where tipo = 'RESPOSTA_QUESTAO' and data >= ? and data < ?", p));
        r.put("acertos", contar("select count(*) from event where tipo = 'RESPOSTA_QUESTAO' and data >= ? and data < ? and json_context->>'acerto' = 'true'", p));
        r.put("completaram4", contar("""
                select count(*) from (select id_usuario from event where tipo = 'RESPOSTA_QUESTAO' and data >= ? and data < ?
                group by id_usuario having count(distinct json_context->>'area') >= 4) t""", p));
        r.put("novosCadastros", contar("select count(*) from tb_usuarios where data_cadastro >= ? and data_cadastro < ?", p));
        r.put("porArea", jdbc.queryForList("""
                select json_context->>'area' as "area", count(*) as "respostas",
                       sum(case when json_context->>'acerto' = 'true' then 1 else 0 end) as "acertos"
                from event where tipo = 'RESPOSTA_QUESTAO' and data >= ? and data < ?
                group by 1 order by 1""", p));
        r.put("questoes", jdbc.queryForList("""
                select area, id, assunto, coalesce(modelo_ia, 'anterior') as "modelo"
                from tb_questoes_geradas where data >= ? and data < ? order by area""", p));
        return r;
    }

    @Transactional
    public Map<String, Object> excluirUsuario(UUID id) {
        List<Map<String, Object>> achado = jdbc.queryForList("select usuario, nome from tb_usuarios where id = ?", id);
        if (achado.isEmpty()) throw new NoSuchElementException("Usuário não encontrado");
        String login = (String) achado.get(0).get("usuario");
        Map<String, Object> removidos = new LinkedHashMap<>();

        int gruposApagados = 0, gruposTransferidos = 0;
        for (UUID grupo : jdbc.queryForList("select id from grupos where id_adm = ?", UUID.class, id)) {
            List<UUID> herdeiro = jdbc.queryForList(
                    "select usuario_id from grupo_usuario where grupo_id = ? and usuario_id <> ? order by xp desc, data_entrada asc limit 1",
                    UUID.class, grupo, id);
            if (herdeiro.isEmpty()) {
                jdbc.update("delete from atividades_recentes where grupo_id = ?", grupo);
                jdbc.update("delete from grupo_usuario where grupo_id = ?", grupo);
                jdbc.update("delete from grupos where id = ?", grupo);
                gruposApagados++;
            } else {
                jdbc.update("update grupos set id_adm = ? where id = ?", herdeiro.get(0), grupo);
                jdbc.update("update grupo_usuario set admin = true where grupo_id = ? and usuario_id = ?", grupo, herdeiro.get(0));
                gruposTransferidos++;
            }
        }
        removidos.put("gruposApagados", gruposApagados);
        removidos.put("gruposTransferidos", gruposTransferidos);
        removidos.put("participacoesEmGrupos", jdbc.update("delete from grupo_usuario where usuario_id = ?", id));
        removidos.put("atividadesEmGrupos", login == null ? 0 : jdbc.update("delete from atividades_recentes where usuario = ?", login));
        removidos.put("amizades", jdbc.update("delete from amizade where solicitante_id = ? or destinatario_id = ?", id, id));
        removidos.put("bloqueios", jdbc.update("delete from bloqueio where bloqueador_id = ? or bloqueado_id = ?", id, id));
        removidos.put("duelos", jdbc.update("delete from duelo where desafiante_id = ? or desafiado_id = ?", id, id));
        removidos.put("inscricoesPush", jdbc.update("delete from push_inscricao where usuario_id = ?", id));
        removidos.put("eventos", jdbc.update("delete from event where id_usuario = ?", id));
        removidos.put("simulados", jdbc.update("delete from tb_simulados where id_usuario = ?", id));
        removidos.put("redacoes", jdbc.update("delete from tb_redacao where id_usuario = ?", id));
        removidos.put("usuario", jdbc.update("delete from tb_usuarios where id = ?", id));
        log.warn("[Admin] Usuário {} ({}) excluído: {}", login, id, removidos);
        return removidos;
    }

    public List<Map<String, Object>> assuntos() {
        List<Map<String, Object>> lista = jdbc.queryForList("""
                select a.id, a.nome_assunto as "nome", a.area as "ordinal", a.ultima_vez_utilizado as "ultimoUso",
                       (select count(*) from tb_questoes_geradas q where q.area = a.area and q.assunto = a.nome_assunto) as "questoes"
                from tb_assuntos a order by a.area, a.ultima_vez_utilizado asc nulls first, a.nome_assunto""");
        Set<Object> primeiros = new HashSet<>();
        for (Map<String, Object> m : lista) {
            Object ordinal = m.remove("ordinal");
            m.put("area", AreaEnum.values()[((Number) ordinal).intValue()].name());
            m.put("proximo", primeiros.add(ordinal));
        }
        return lista;
    }

    public Map<String, Object> adicionarAssunto(String nome, String area) {
        String limpo = nome == null ? "" : nome.trim().replaceAll("\\s+", " ");
        if (limpo.length() < 2 || limpo.length() > 120) throw new IllegalArgumentException("Informe um nome de assunto entre 2 e 120 caracteres.");
        AreaEnum a = AreaEnum.parse(area);
        Long repetidos = jdbc.queryForObject("select count(*) from tb_assuntos where area = ? and lower(nome_assunto) = lower(?)", Long.class, a.ordinal(), limpo);
        if (repetidos != null && repetidos > 0) throw new IllegalArgumentException("Esse assunto já existe nessa área.");
        Long id = jdbc.queryForObject("insert into tb_assuntos (nome_assunto, area, ultima_vez_utilizado) values (?, ?, now() - interval '1 year') returning id",
                Long.class, limpo, a.ordinal());
        return Map.of("id", id, "nome", limpo, "area", a.name());
    }

    public boolean excluirAssunto(long id) {
        return jdbc.update("delete from tb_assuntos where id = ?", id) > 0;
    }

    private long contar(String sql, Object... params) {
        Long n = jdbc.queryForObject(sql, Long.class, params);
        return n == null ? 0 : n;
    }
}
