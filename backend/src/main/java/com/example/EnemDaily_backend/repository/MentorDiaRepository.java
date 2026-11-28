package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.MentorDia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MentorDiaRepository extends JpaRepository<MentorDia, Long> {
    Optional<MentorDia> findByUsuarioIdAndData(UUID usuarioId, LocalDate data);

    List<MentorDia> findAllByUsuarioIdAndDataBetween(UUID usuarioId, LocalDate de, LocalDate ate);

    Optional<MentorDia> findFirstByUsuarioIdAndDataLessThanOrderByDataDesc(UUID usuarioId, LocalDate data);
}
