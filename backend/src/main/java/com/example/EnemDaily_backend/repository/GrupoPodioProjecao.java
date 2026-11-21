package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.GrupoUsuario;

import java.time.LocalDateTime;
import java.util.UUID;

public interface GrupoPodioProjecao {
    Long getId();
    UUID getGrupoId();
    UUID getUsuarioId();
    LocalDateTime getDataEntrada();
    Integer getXp();
    Integer getTitulosMensais();
    Boolean getAdmin();
    Integer getTotalXp();
}
