package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.Conteudo;
import com.example.EnemDaily_backend.model.ConteudoEstudado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ConteudoEstudadoRepository extends JpaRepository<ConteudoEstudado, Long> {
    boolean existsByUsuarioIdAndConteudoId(UUID usuarioId, Long conteudoId);

    @Modifying
    @Query("delete from ConteudoEstudado e where e.usuarioId = :usuarioId and e.conteudoId = :conteudoId")
    int desmarcar(UUID usuarioId, Long conteudoId);

    /** Só os conteúdos que continuam publicados: os despublicados ou excluídos somem da lista sozinhos. */
    @Query("select c from Conteudo c where c.publicado = true and c.id in (select e.conteudoId from ConteudoEstudado e where e.usuarioId = :usuarioId)")
    List<Conteudo> estudadosPor(UUID usuarioId);
}
