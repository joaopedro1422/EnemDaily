package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.Simulado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SimuladoRepository extends JpaRepository<Simulado, Long> {

    List<Simulado> findAllByDiaOrderByNumeracaoDesc(int dia);
    List<Simulado> findAllByDiaAndIdUsuarioOrderByNumeracaoDesc(int dia, UUID idUsuario);

    List<Simulado> findAllByIdUsuario(UUID idUsuario);
}
