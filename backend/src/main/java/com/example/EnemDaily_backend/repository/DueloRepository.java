package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.Enum.StatusDuelo;
import com.example.EnemDaily_backend.model.Duelo;
import com.example.EnemDaily_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface DueloRepository extends JpaRepository<Duelo, UUID> {

    @Query("""
        select d from Duelo d join fetch d.desafiante join fetch d.desafiado
        where (d.desafiante = :u or d.desafiado = :u) and d.status in :status
        order by d.dia desc, d.criadoEm desc
    """)
    List<Duelo> doUsuario(@Param("u") Usuario u, @Param("status") Collection<StatusDuelo> status);

    @Query("""
        select d from Duelo d join fetch d.desafiante join fetch d.desafiado
        where ((d.desafiante = :a and d.desafiado = :b) or (d.desafiante = :b and d.desafiado = :a)) and d.status in :status
        order by d.dia desc
    """)
    List<Duelo> entre(@Param("a") Usuario a, @Param("b") Usuario b, @Param("status") Collection<StatusDuelo> status);

    @Query("""
        select count(d) > 0 from Duelo d
        where ((d.desafiante = :a and d.desafiado = :b) or (d.desafiante = :b and d.desafiado = :a))
          and d.dia = :dia and d.status in :status
    """)
    boolean existeNoDia(@Param("a") Usuario a, @Param("b") Usuario b, @Param("dia") LocalDate dia, @Param("status") Collection<StatusDuelo> status);

    @Query("select count(d) from Duelo d where d.desafiante = :u and d.status = :status")
    long contarEnviados(@Param("u") Usuario u, @Param("status") StatusDuelo status);

    @Query("select d from Duelo d join fetch d.desafiante join fetch d.desafiado where d.status in :status and d.dia < :hoje")
    List<Duelo> vencidos(@Param("hoje") LocalDate hoje, @Param("status") Collection<StatusDuelo> status);
}
