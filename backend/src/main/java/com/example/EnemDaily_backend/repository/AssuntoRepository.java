package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.Assunto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AssuntoRepository extends JpaRepository<Assunto, Long> {
    @Query(value = "SELECT * FROM tb_assuntos " +
            "WHERE area = :area " +
            "ORDER BY ultima_vez_utilizado ASC " +
            "LIMIT 1", nativeQuery = true)
    Assunto buscarProximoAssuntoDaFila(int area);
}
