package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.DTO.AreaHojeDTO;
import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.Interface.AssuntoResumo;
import com.example.EnemDaily_backend.Interface.PlacarDoDia;
import java.time.LocalDateTime;
import com.example.EnemDaily_backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    @Query(value = """
    SELECT DISTINCT EXTRACT(DOW FROM data) AS dia_semana
    FROM event
    WHERE id_usuario = :usuarioId
      AND tipo = 'RESPOSTA_QUESTAO'
      AND data >= date_trunc('week', CURRENT_DATE)
""", nativeQuery = true)
    List<Integer> diasAtivosSemana(@Param("usuarioId") UUID usuarioId);

    @Query(value = """
    WITH dias AS (
      SELECT DISTINCT DATE(data AT TIME ZONE 'America/Sao_Paulo') AS d
      FROM event
      WHERE id_usuario = :usuarioId
        AND tipo = 'RESPOSTA_QUESTAO'
    ),
    ancora AS (
      SELECT 
        CASE 
          WHEN MAX(d) >= CURRENT_DATE - INTERVAL '1 day' THEN MAX(d) 
          ELSE NULL 
        END AS last_day
      FROM dias
    ),
    ordenado AS (
      SELECT d,
             ROW_NUMBER() OVER (ORDER BY d DESC) AS rn,
             (SELECT last_day FROM ancora) AS last_day
      FROM dias
      WHERE (SELECT last_day FROM ancora) IS NOT NULL
    ),
    marcado AS (
      SELECT d,
             ((last_day - d) - (rn - 1)) AS quebra
      FROM ordenado
    )
    SELECT COALESCE(SUM(CASE WHEN quebra = 0 THEN 1 ELSE 0 END), 0)::int
    FROM marcado
    """, nativeQuery = true)
    int sequenciaAtualDiasAtivos(@Param("usuarioId") UUID usuarioId);
    @Query(value ="""
        SELECT COUNT(DISTINCT DATE(e.data))
        FROM Event e
        WHERE e.id_usuario = :usuarioId
          AND e.tipo = 'RESPOSTA_QUESTAO'
    """, nativeQuery = true)
    int contarDiasAtivos(UUID usuarioId);
    @Query(value = """
        WITH dias AS (
          SELECT DISTINCT DATE(data) AS d
          FROM event
          WHERE id_usuario = :usuarioId AND tipo = 'RESPOSTA_QUESTAO'
        ),
        grupos AS (
          SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS bloco FROM dias
        )
        SELECT COALESCE(MAX(qtd), 0)::int FROM (SELECT COUNT(*) AS qtd FROM grupos GROUP BY bloco) s
    """, nativeQuery = true)
    int maiorSequenciaDiasAtivos(@Param("usuarioId") UUID usuarioId);
    @Query(value = """
        SELECT to_char(DATE(e.data), 'YYYY-MM-DD') AS dia,
               e.json_context ->> 'area' AS area,
               COUNT(*)::int AS respondidas,
               COALESCE(SUM(CASE WHEN e.json_context ->> 'acerto' = 'true' THEN 1 ELSE 0 END), 0)::int AS acertos,
               COALESCE(SUM((e.json_context ->> 'xp')::int), 0)::int AS xp,
               COALESCE(SUM((e.json_context ->> 'tempoGasto')::int), 0)::int AS tempo
        FROM event e
        WHERE e.id_usuario = :usuarioId
          AND e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(e.data), e.json_context ->> 'area'
        ORDER BY DATE(e.data)
    """, nativeQuery = true)
    List<com.example.EnemDaily_backend.Interface.ResumoSemanalLinha> resumoSemanal(@Param("usuarioId") UUID usuarioId);
    @Query(value = """
        SELECT to_char(MIN(e.data), 'HH24:MI')
        FROM event e
        WHERE e.id_usuario = :usuarioId
          AND e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= CURRENT_DATE
          AND e.data <  CURRENT_DATE + INTERVAL '1 day'
    """, nativeQuery = true)
    String primeiraRespostaHoje(@Param("usuarioId") UUID usuarioId);
    @Query(value = """
     SELECT json_context ->> 'area' AS area
         FROM event
         WHERE id_usuario = :usuarioId
           AND tipo = 'RESPOSTA_QUESTAO'
           AND json_context ->> 'acerto' = 'true'
           AND data >= CURRENT_DATE
           AND data < CURRENT_DATE + INTERVAL '1 day'
         GROUP BY json_context ->> 'area';
    """ , nativeQuery = true)
    List<AreaEnum> areasAcertadasHoje(UUID usuarioId);
    @Query(value = """
     SELECT json_context ->> 'area' AS area
         FROM event
         WHERE id_usuario = :usuarioId
           AND tipo = 'RESPOSTA_QUESTAO'
           AND data >= CURRENT_DATE
           AND data < CURRENT_DATE + INTERVAL '1 day'
         GROUP BY json_context ->> 'area';
    """ , nativeQuery = true)
    List<AreaEnum> areasRespondidasHoje(UUID usuarioId);
    @Query(value = """
        SELECT COALESCE(SUM((e.json_context->>'xp')::int), 0)
        FROM event e
        WHERE e.id_usuario = :usuarioId
          AND e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= date_trunc('week', now()) - interval '1 day'
    """, nativeQuery = true)
    int xpSemanal(UUID usuarioId);
    @Query(value = """
    SELECT
        COALESCE(
            SUM( (json_context->>'xp')::int ),
            0
        ) AS xp_mensal
    FROM event
    WHERE id_usuario = :usuarioId
      AND tipo = 'RESPOSTA_QUESTAO'
      AND data >= date_trunc('month', CURRENT_DATE)
      AND data < CURRENT_DATE + INTERVAL '1 day';
""", nativeQuery = true)
    int xpMensal(UUID usuarioId);
    @Query(value = """
        SELECT COALESCE(SUM((e.json_context->>'xp')::int), 0)
        FROM event e
        JOIN grupos g ON g.id = :grupoId
        WHERE e.id_usuario = :usuarioId
          AND e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= date_trunc('week', CURRENT_DATE)
          AND e.data <  date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
          AND (
            (e.json_context->>'area' = 'HUMANAS'    AND g.humanas    = TRUE) OR
            (e.json_context->>'area' = 'EXATAS'     AND g.exatas     = TRUE) OR
            (e.json_context->>'area' = 'LINGUAGENS' AND g.linguagens = TRUE) OR
            (e.json_context->>'area' = 'NATUREZAS'  AND g.naturezas  = TRUE)
          )
        """, nativeQuery = true)
    int xpSemanalNoGrupo(UUID usuarioId, UUID grupoId);
    @Query(value = """
        SELECT COUNT(DISTINCT e.id_usuario)
        FROM event e
        WHERE e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= CURRENT_DATE
          AND e.data < CURRENT_DATE + INTERVAL '1 day'
        """, nativeQuery = true)
    int countDistinctUsersRespondedToday();
    @Query(value = """
        SELECT COALESCE(SUM((e.json_context->>'xp')::int), 0)
        FROM event e
        JOIN grupos g ON g.id = :grupoId
        WHERE e.id_usuario = :usuarioId
          AND e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= CURRENT_DATE
          AND e.data <  CURRENT_DATE + INTERVAL '1 day'
          AND (
            (e.json_context->>'area' = 'HUMANAS'    AND g.humanas    = TRUE) OR
            (e.json_context->>'area' = 'EXATAS'     AND g.exatas     = TRUE) OR
            (e.json_context->>'area' = 'LINGUAGENS' AND g.linguagens = TRUE) OR
            (e.json_context->>'area' = 'NATUREZAS'  AND g.naturezas  = TRUE)
          )
        """, nativeQuery = true)
    int xpHojeNoGrupo(UUID usuarioId, UUID grupoId);
    @Query(value = """
        SELECT COALESCE(SUM((e.json_context->>'xp')::int), 0)
        FROM event e
        WHERE e.id_usuario = :usuarioId
          AND e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= CURRENT_DATE
          AND e.data <  CURRENT_DATE + INTERVAL '1 day'
        """, nativeQuery = true)
    int xpHoje(UUID usuarioId);
    @Query(value = """
        SELECT COALESCE(SUM((e.json_context->>'xp')::int), 0) AS xp_mensal
        FROM event e
        JOIN grupos g ON g.id = :grupoId
        WHERE e.id_usuario = :usuarioId
          AND e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= date_trunc('month', CURRENT_DATE)
          AND e.data <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
          AND (
            (e.json_context->>'area' = 'HUMANAS'    AND g.humanas   = TRUE) OR
            (e.json_context->>'area' = 'EXATAS'     AND g.exatas     = TRUE) OR
            (e.json_context->>'area' = 'LINGUAGENS' AND g.linguagens = TRUE) OR
            (e.json_context->>'area' = 'NATUREZAS'  AND g.naturezas  = TRUE)
          )
        """, nativeQuery = true)
    int xpMensalNoGrupo(UUID usuarioId, UUID grupoId);
    @Query(value = """
        SELECT
          (json_context ->> 'area')    AS area,
          (json_context ->> 'assunto') AS assunto,
          COUNT(*)::int                AS totalRespostas,
          SUM(
              CASE 
                WHEN (json_context ->> 'acerto')::boolean THEN 1 
                ELSE 0 
              END
          )::int AS totalAcertos
        FROM event
        WHERE id_usuario = :usuarioId
          AND tipo = 'RESPOSTA_QUESTAO'
        GROUP BY area, assunto
        ORDER BY area, totalRespostas DESC
""", nativeQuery = true)
    List<AssuntoResumo> resumoAssuntos(@Param("usuarioId") UUID usuarioId);
    @Query(value = """
    WITH meses AS (
      SELECT generate_series(
        date_trunc('year', CURRENT_DATE),
        date_trunc('year', CURRENT_DATE) + interval '11 months',
        interval '1 month'
      ) AS mes_inicio
    )
    SELECT
      EXTRACT(MONTH FROM m.mes_inicio)::int AS mes,
      COALESCE(SUM(CASE WHEN (e.json_context->>'area') = 'NATUREZAS'
          THEN (e.json_context->>'xp')::int ELSE 0 END), 0) AS naturezas,
      COALESCE(SUM(CASE WHEN (e.json_context->>'area') = 'HUMANAS'
          THEN (e.json_context->>'xp')::int ELSE 0 END), 0) AS humanas,
      COALESCE(SUM(CASE WHEN (e.json_context->>'area') = 'LINGUAGENS'
          THEN (e.json_context->>'xp')::int ELSE 0 END), 0) AS linguagens,
      COALESCE(SUM(CASE WHEN (e.json_context->>'area') = 'EXATAS'
          THEN (e.json_context->>'xp')::int ELSE 0 END), 0) AS exatas
    FROM meses m
    LEFT JOIN event e
      ON e.data >= m.mes_inicio
     AND e.data <  m.mes_inicio + interval '1 month'
     AND e.id_usuario = :usuarioId
     AND e.tipo = 'RESPOSTA_QUESTAO'
    GROUP BY mes
    ORDER BY mes
  """, nativeQuery = true)
    List<Object[]> xpPorMesAnoAtual(UUID usuarioId);

    @Query(value = """
        SELECT COALESCE(SUM(COALESCE((e.json_context->>'xpBase')::int, (e.json_context->>'xp')::int)), 0) AS xp,
               COUNT(*) FILTER (WHERE (e.json_context->>'acerto')::boolean) AS acertos,
               COALESCE(SUM((e.json_context->>'tempoGasto')::int), 0) AS tempo,
               COUNT(*) AS respostas
        FROM event e
        WHERE e.id_usuario = :usuarioId
          AND e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= :inicio AND e.data < :fim
    """, nativeQuery = true)
    PlacarDoDia placarNoPeriodo(@Param("usuarioId") UUID usuarioId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query(value = """
        SELECT COUNT(*) FROM event e
        WHERE e.id_usuario = :usuarioId AND e.tipo = 'RESPOSTA_QUESTAO'
          AND e.data >= :inicio AND e.data < :fim
    """, nativeQuery = true)
    long respostasNoPeriodo(@Param("usuarioId") UUID usuarioId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);
}
