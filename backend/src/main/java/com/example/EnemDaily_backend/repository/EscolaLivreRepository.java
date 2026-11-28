package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.EscolaLivre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EscolaLivreRepository extends JpaRepository<EscolaLivre, Long> {
    Optional<EscolaLivre> findByChave(String chave);

    List<EscolaLivre> findTop200ByChaveContaining(String trecho);
}
