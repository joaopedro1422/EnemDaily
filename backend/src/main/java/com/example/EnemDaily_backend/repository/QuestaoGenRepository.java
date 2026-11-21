package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.QuestaoGen;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuestaoGenRepository extends JpaRepository<QuestaoGen, Long> {
    @Query("""
        SELECT q
        FROM QuestaoGen q
        WHERE q.area = :area
          AND q.data >= :inicioDia
          AND q.data < :fimDia
    """)
    Optional<QuestaoGen> buscarQuestaoDoDia(
            @Param("area") AreaEnum area,
            @Param("inicioDia") LocalDateTime inicioDia,
            @Param("fimDia") LocalDateTime fimDia
    );
    @Query("""
      SELECT q FROM QuestaoGen q
      WHERE q.data >= :inicioDia AND q.data < :fimDia
    """)
    List<QuestaoGen> listarQuestoesDoDia(
            @Param("inicioDia") LocalDateTime inicioDia,
            @Param("fimDia") LocalDateTime fimDia
    );

    Optional<QuestaoGen> findFirstByAreaAndDataLessThanOrderByDataDesc(AreaEnum area, LocalDateTime antes);

    List<QuestaoGen> findTop8ByAreaOrderByDataDesc(AreaEnum area);

    Optional<QuestaoGen> findFirstByAreaAndAssuntoAndModeloIaIsNotNullAndDataLessThanOrderByDataDesc(AreaEnum area, String assunto, LocalDateTime antes);

    List<QuestaoGen> findByAreaAndDataGreaterThanEqualAndDataLessThan(AreaEnum area, LocalDateTime inicio, LocalDateTime fim);

    @Query(value = "SELECT (SELECT count(*) FROM alternativas_geradas a2 WHERE a2.questao_id = q.id AND a2.id < a.id) " +
            "FROM tb_questoes_geradas q JOIN alternativas_geradas a ON a.questao_id = q.id AND a.correta = true " +
            "ORDER BY q.data DESC, q.id DESC LIMIT :limite", nativeQuery = true)
    List<Number> posicoesRecentesDoGabarito(@Param("limite") int limite);
}
