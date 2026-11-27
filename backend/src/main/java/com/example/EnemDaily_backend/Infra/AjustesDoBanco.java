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
    }
}
