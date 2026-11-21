package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.Length;

import java.io.Serializable;

@Data
@Entity
@Table(name = "questoes_enem")
public class QuestaoEnem implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;
    private String disciplina;
    @Column(columnDefinition = "TEXT")
    private String enunciado;
    private String tags;

}
