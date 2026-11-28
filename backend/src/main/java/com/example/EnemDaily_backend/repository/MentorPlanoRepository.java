package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.MentorPlano;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MentorPlanoRepository extends JpaRepository<MentorPlano, Long> {
    Optional<MentorPlano> findByUsuarioId(UUID usuarioId);

    List<MentorPlano> findAllByNotificacoesTrue();

    void deleteByUsuarioId(UUID usuarioId);
}
