package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** Histórico do que o aluno marcou em cada dia. Alimenta o mapa do ano e os lembretes. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tb_mentor_registro", indexes = @Index(columnList = "usuario_id, data"))
public class MentorRegistro {
    public static final String ESTUDO = "ESTUDO";
    public static final String REVISAO = "REVISAO";
    /** Uma parte de um assunto longo, antes de concluí-lo. */
    public static final String PARTE = "PARTE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;
    @Column(name = "assunto_id", nullable = false)
    private Long assuntoId;
    @Column(nullable = false, length = 16)
    private String tipo;
    @Column(nullable = false)
    private LocalDate data;
    /** Minutos que essa marcação ocupou do dia (para não empilhar tarefas além da disponibilidade). */
    private int minutos;
    private LocalDateTime criadoEm;

    public MentorRegistro(UUID usuarioId, Long assuntoId, String tipo, LocalDate data, int minutos) {
        this.usuarioId = usuarioId;
        this.assuntoId = assuntoId;
        this.tipo = tipo;
        this.data = data;
        this.minutos = minutos;
        this.criadoEm = LocalDateTime.now();
    }
}
