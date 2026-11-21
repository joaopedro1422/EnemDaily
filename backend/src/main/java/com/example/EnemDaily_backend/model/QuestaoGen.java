package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.fasterxml.jackson.annotation.JsonRawValue;
import jakarta.persistence.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "tb_questoes_geradas")
public class QuestaoGen implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;
    @Enumerated(EnumType.ORDINAL)
    private AreaEnum area;
    private String disciplina;
    private String assunto;
    @Column(columnDefinition = "TEXT")
    private String texto;
    @Column(columnDefinition = "TEXT")
    private String enunciado;
    private LocalDateTime data;
    @Column(columnDefinition = "TEXT")
    private String explicacao;
    private String linkImg;
    private String linkEstudo;
    private String tags;
    @Column(columnDefinition = "TEXT")
    private String resolucao;
    @Column(columnDefinition = "TEXT")
    private String competencia;
    @Column(columnDefinition = "TEXT")
    private String habilidade;
    @Column(columnDefinition = "TEXT")
    private String fonte;
    @JsonRawValue
    @Column(columnDefinition = "TEXT")
    private String tabela;
    private String modeloIa;
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "questao_id")
    @OrderBy("id ASC")
    private List<Alternativa> alternativas = new ArrayList<>();
    public void adicionarAlternativa(Alternativa alternativa) {
        alternativas.add(alternativa);

    }
}
