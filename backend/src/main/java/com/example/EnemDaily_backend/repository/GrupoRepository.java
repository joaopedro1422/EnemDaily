package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.Grupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GrupoRepository extends JpaRepository<Grupo, UUID> {
    List<Grupo> findAllByPublico(boolean publico);
}
