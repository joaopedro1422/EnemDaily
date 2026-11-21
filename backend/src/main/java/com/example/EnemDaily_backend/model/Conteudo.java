package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "tb_conteudos", uniqueConstraints = @UniqueConstraint(columnNames = {"area", "slug"}))
public class Conteudo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long assuntoId;
    @Enumerated(EnumType.ORDINAL)
    private AreaEnum area;
    private String assunto;
    private String slug;
    private String titulo;
    private String seoTitulo;
    @Column(length = 400)
    private String seoDescricao;
    @Column(columnDefinition = "TEXT")
    private String resumo;
    @Column(columnDefinition = "TEXT")
    private String comoCai;
    @Column(columnDefinition = "TEXT")
    private String paraNaoErrar;
    private Long questaoId;
    private boolean publicado;
    private String modeloIa;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;
    private LocalDateTime publicadoEm;
}
