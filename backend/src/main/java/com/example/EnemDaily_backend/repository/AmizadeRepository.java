package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.Enum.StatusAmizade;
import com.example.EnemDaily_backend.model.Amizade;
import com.example.EnemDaily_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AmizadeRepository extends JpaRepository<Amizade, UUID> {

    @Query("""
        select a from Amizade a
        where (a.solicitante = :a and a.destinatario = :b) or (a.solicitante = :b and a.destinatario = :a)
    """)
    Optional<Amizade> entre(@Param("a") Usuario a, @Param("b") Usuario b);

    @Query("""
        select a from Amizade a join fetch a.solicitante join fetch a.destinatario
        where (a.solicitante = :u or a.destinatario = :u) and a.status = :status
        order by a.respondidaEm desc
    """)
    List<Amizade> doUsuario(@Param("u") Usuario u, @Param("status") StatusAmizade status);

    @Query("select a from Amizade a join fetch a.solicitante where a.destinatario = :u and a.status = com.example.EnemDaily_backend.Enum.StatusAmizade.PENDENTE order by a.criadaEm desc")
    List<Amizade> recebidasPendentes(@Param("u") Usuario u);

    @Query("select a from Amizade a join fetch a.destinatario where a.solicitante = :u and a.status = com.example.EnemDaily_backend.Enum.StatusAmizade.PENDENTE order by a.criadaEm desc")
    List<Amizade> enviadasPendentes(@Param("u") Usuario u);

    @Query("select count(a) from Amizade a where a.destinatario = :u and a.status = com.example.EnemDaily_backend.Enum.StatusAmizade.PENDENTE")
    long contarRecebidasPendentes(@Param("u") Usuario u);
}
