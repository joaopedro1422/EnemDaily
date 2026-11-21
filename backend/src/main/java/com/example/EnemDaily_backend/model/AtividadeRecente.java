package com.example.EnemDaily_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "atividades_recentes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtividadeRecente {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String usuario;

    private LocalDateTime dataHora;

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    @JsonIgnore
    private Grupo grupo;
}
