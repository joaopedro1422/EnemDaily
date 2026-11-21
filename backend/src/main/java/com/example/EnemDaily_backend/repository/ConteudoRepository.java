package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Conteudo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConteudoRepository extends JpaRepository<Conteudo, Long> {
    Optional<Conteudo> findByAssuntoId(Long assuntoId);

    Optional<Conteudo> findByAreaAndSlugAndPublicadoTrue(AreaEnum area, String slug);

    List<Conteudo> findByPublicadoTrueOrderByAreaAscAssuntoAsc();

    List<Conteudo> findTop6ByAreaAndPublicadoTrueAndIdNotOrderByAssuntoAsc(AreaEnum area, Long id);
}
