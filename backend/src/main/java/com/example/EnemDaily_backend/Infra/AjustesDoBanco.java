package com.example.EnemDaily_backend.Infra;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * O Hibernate 6 cria um CHECK com a lista de valores de cada enum gravado como texto, e o ddl-auto=update
 * não atualiza essa lista quando o enum ganha um valor novo. Sem isso, gravar um EventType novo
 * (como RESPOSTA_BONUS) falha no banco. Ao subir, remove esses CHECKs da coluna event.tipo.
 */
@Component
public class AjustesDoBanco implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AjustesDoBanco.class);
    private final JdbcTemplate jdbc;

    public AjustesDoBanco(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    public void run(ApplicationArguments args) {
        try {
            List<String> restricoes = jdbc.queryForList("""
                    select con.conname from pg_constraint con
                    join pg_class rel on rel.oid = con.conrelid
                    where rel.relname = 'event' and con.contype = 'c' and pg_get_constraintdef(con.oid) ilike '%tipo%'""", String.class);
            for (String nome : restricoes) {
                jdbc.execute("alter table event drop constraint if exists \"" + nome.replace("\"", "") + "\"");
                log.info("Restrição antiga removida de event.tipo: {}", nome);
            }
        } catch (Exception e) {
            log.warn("Não foi possível revisar as restrições de event.tipo: {}", e.getMessage());
        }
        migrarConteudosEstudados();
    }

    /**
     * Os conteúdos marcados como estudados ficavam em tb_conteudo_estudado. Agora o estado é por assunto, em
     * tb_estudo_assunto (o mesmo do "Meu mentor"). Copia o que existir e esvazia a tabela antiga, para não
     * copiar de novo algo que o aluno desmarcar depois.
     */
    private void migrarConteudosEstudados() {
        try {
            String antiga = jdbc.queryForObject("select to_regclass('public.tb_conteudo_estudado')::text", String.class);
            if (antiga == null) return;
            int copiados = jdbc.update("""
                    insert into tb_estudo_assunto (usuario_id, assunto_id, estudado_em, ja_sabia, revisoes, proxima_revisao,
                                                   removido, minutos_feitos, partes_feitas)
                    select ce.usuario_id, c.assunto_id, cast(min(ce.estudado_em) as date), false, 0,
                           cast(min(ce.estudado_em) as date) + 7, false, 0, 0
                    from tb_conteudo_estudado ce
                    join tb_conteudos c on c.id = ce.conteudo_id
                    where c.assunto_id is not null
                    group by ce.usuario_id, c.assunto_id
                    on conflict (usuario_id, assunto_id) do nothing""");
            int apagados = jdbc.update("delete from tb_conteudo_estudado");
            if (copiados > 0 || apagados > 0) log.info("Conteúdos estudados migrados para tb_estudo_assunto: {} copiados, {} na tabela antiga", copiados, apagados);
        } catch (Exception e) {
            log.warn("Não foi possível migrar tb_conteudo_estudado: {}", e.getMessage());
        }
    }
}
