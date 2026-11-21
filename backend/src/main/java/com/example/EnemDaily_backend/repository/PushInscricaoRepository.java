package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.PushInscricao;
import com.example.EnemDaily_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PushInscricaoRepository extends JpaRepository<PushInscricao, UUID> {
    Optional<PushInscricao> findByEndpoint(String endpoint);

    List<PushInscricao> findAllByUsuario(Usuario usuario);

    @Query("select p from PushInscricao p join fetch p.usuario u where u.demo = false")
    List<PushInscricao> todasAtivas();
}
