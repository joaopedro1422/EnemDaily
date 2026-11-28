package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** Configuração do "Meu mentor" de um aluno. O cronograma em si é recalculado a partir disto e do progresso. */
@Getter
@Setter
@Entity
@Table(name = "tb_mentor_plano", uniqueConstraints = @UniqueConstraint(columnNames = "usuario_id"))
public class MentorPlano {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;
    @Column(nullable = false)
    private LocalDate inicio;
    /** Minutos disponíveis de segunda a domingo, separados por vírgula ("60,60,60,60,60,120,0"). */
    @Column(nullable = false, length = 64)
    private String disponibilidade;
    /** Chaves das áreas de foco ("matematica,natureza"), no máximo duas. */
    @Column(length = 64)
    private String areasFoco;
    @Column(nullable = false, length = 16)
    private String lingua;
    private boolean notificacoes = true;
    /** Quando o aluno confirmou que entendeu a proposta (não é curso, não garante aprovação). */
    @Column(nullable = false)
    private LocalDateTime aceiteEm;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;
}
