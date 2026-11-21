package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.Grupo;
import com.example.EnemDaily_backend.model.GrupoUsuario;
import com.example.EnemDaily_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrupoUsuarioRepository extends JpaRepository<GrupoUsuario, UUID> {
    List<GrupoUsuario> findAllByGrupo(Grupo grupo);
    List<GrupoUsuario> findAllByUsuario(Usuario usuario);
    GrupoUsuario findGrupoUsuarioByUsuarioAndGrupo(Usuario usuario, Grupo grupo);
    boolean existsByUsuarioAndGrupo(Usuario usuario, Grupo grupo);
        @Query(value = """
        SELECT 
            gu.id,
            gu.usuario_id,
            gu.grupo_id,
            gu.data_entrada,
            gu.xp,
            ranking.total_xp as xp_mensal,
            gu.titulos_mensais,
            gu.admin
        FROM grupo_usuario gu
        JOIN (
            SELECT e.id_usuario, 
                   SUM(CAST(e.json_context->>'xp' AS INTEGER)) as total_xp
            FROM event e
            WHERE e.data >= :inicioMes 
              AND e.data <= :fimMes
              AND e.tipo = 'RESPOSTA_QUESTAO'
            GROUP BY e.id_usuario
        ) ranking ON ranking.id_usuario = gu.usuario_id
        WHERE gu.grupo_id = :grupoId
        ORDER BY ranking.total_xp DESC
   
        """, nativeQuery = true)
        List<GrupoUsuario> buscarPodioDoMes(
                @Param("grupoId") UUID grupoId,
                @Param("inicioMes") LocalDateTime inicioMes,
                @Param("fimMes") LocalDateTime fimMes,
                @Param("limit") Integer limit
        );
}
