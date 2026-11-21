package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "alternativas_geradas")
@Getter
@Setter
public class Alternativa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String texto;

    private boolean correta;

    @Column(columnDefinition = "TEXT")
    private String analise;

}
