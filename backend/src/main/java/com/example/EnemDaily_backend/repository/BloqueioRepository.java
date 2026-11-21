package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.Bloqueio;
import com.example.EnemDaily_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BloqueioRepository extends JpaRepository<Bloqueio, UUID> {
    Optional<Bloqueio> findByBloqueadorAndBloqueado(Usuario bloqueador, Usuario bloqueado);

    @Query("select count(b) > 0 from Bloqueio b where (b.bloqueador = :a and b.bloqueado = :b) or (b.bloqueador = :b and b.bloqueado = :a)")
    boolean existeEntre(@Param("a") Usuario a, @Param("b") Usuario b);

    @Query("select b.bloqueado.id from Bloqueio b where b.bloqueador = :u")
    List<UUID> bloqueadosPor(@Param("u") Usuario u);

    @Query("select b.bloqueador.id from Bloqueio b where b.bloqueado = :u")
    List<UUID> quemBloqueou(@Param("u") Usuario u);
}
