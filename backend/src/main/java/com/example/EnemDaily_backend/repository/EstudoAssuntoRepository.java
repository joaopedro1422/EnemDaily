package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.EstudoAssunto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EstudoAssuntoRepository extends JpaRepository<EstudoAssunto, Long> {
    List<EstudoAssunto> findAllByUsuarioId(UUID usuarioId);

    Optional<EstudoAssunto> findByUsuarioIdAndAssuntoId(UUID usuarioId, Long assuntoId);

    List<EstudoAssunto> findAllByUsuarioIdAndEstudadoEmIsNotNull(UUID usuarioId);
}
