package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.Redacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RedacaoRepository extends JpaRepository<Redacao, Long> {

    List<Redacao> findAllByIdUsuarioOrderByDataDesc(UUID idUsuario);
}
