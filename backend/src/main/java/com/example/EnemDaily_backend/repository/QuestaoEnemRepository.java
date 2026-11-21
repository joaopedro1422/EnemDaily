package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.QuestaoEnem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestaoEnemRepository extends JpaRepository<QuestaoEnem, Long> {
    @Query(value = "SELECT * FROM questoes_enem " +
            "WHERE disciplina = :area " +
            "AND to_tsvector('portuguese', tags) @@ plainto_tsquery('portuguese', :assunto) " +
            "ORDER BY RANDOM() LIMIT 2", nativeQuery = true)
    List<QuestaoEnem> buscarReferencias(String area, String assunto);

    interface Referencia {
        Long getId();
        Integer getAno();
        String getEnunciado();
    }

    @Query(value = "SELECT id, ano, enunciado FROM questoes_enem " +
            "WHERE disciplina = :disciplina " +
            "AND position('![' in enunciado) = 0 AND length(enunciado) BETWEEN 200 AND 2500 " +
            "AND to_tsvector('portuguese', coalesce(tags, '')) @@ to_tsquery('portuguese', :consulta) " +
            "ORDER BY random() LIMIT :limite", nativeQuery = true)
    List<Referencia> referenciasDoAssunto(@Param("disciplina") String disciplina, @Param("consulta") String consulta, @Param("limite") int limite);

    @Query(value = "SELECT id, ano, enunciado FROM questoes_enem " +
            "WHERE disciplina = :disciplina " +
            "AND position('![' in enunciado) = 0 AND length(enunciado) BETWEEN 200 AND 2500 " +
            "ORDER BY random() LIMIT :limite", nativeQuery = true)
    List<Referencia> referenciasDaArea(@Param("disciplina") String disciplina, @Param("limite") int limite);


}
