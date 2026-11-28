package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.MentorRegistro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface MentorRegistroRepository extends JpaRepository<MentorRegistro, Long> {
    List<MentorRegistro> findAllByUsuarioIdAndDataBetween(UUID usuarioId, LocalDate de, LocalDate ate);

    long countByUsuarioIdAndData(UUID usuarioId, LocalDate data);

    List<MentorRegistro> findAllByUsuarioIdAndAssuntoIdAndTipoIn(UUID usuarioId, Long assuntoId, Collection<String> tipos);

    List<MentorRegistro> findAllByUsuarioIdAndData(UUID usuarioId, LocalDate data);
}
