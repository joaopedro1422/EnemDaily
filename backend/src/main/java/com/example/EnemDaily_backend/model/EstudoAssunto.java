package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Situação de um assunto para um aluno. É a fonte única de "estudado": a lista de conteúdos e o
 * "Meu mentor" leem e gravam aqui. Uma linha também pode existir só para guardar um adiamento ou
 * a retirada do assunto do plano.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tb_estudo_assunto", uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "assunto_id"}))
public class EstudoAssunto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;
    @Column(name = "assunto_id", nullable = false)
    private Long assuntoId;
    /** Dia em que foi marcado como estudado; nulo se ainda não foi. */
    private LocalDate estudadoEm;
    /** Marcado como "já domino", sem passar pelo estudo no plano. */
    private boolean jaSabia;
    private int revisoes;
    private LocalDate ultimaRevisao;
    private LocalDate proximaRevisao;
    /** O aluno pediu para ver esse assunto só a partir deste dia. */
    private LocalDate adiadoAte;
    /** O aluno tirou esse assunto do plano. */
    private boolean removido;
    /** Assuntos longos são estudados em partes: quanto já foi feito antes de concluir. */
    private int minutosFeitos;
    private int partesFeitas;
    /** Dia em que o aluno leu a orientação e começou o estudo. Só vale para o próprio dia. */
    private LocalDate iniciadoEm;

    public EstudoAssunto(UUID usuarioId, Long assuntoId) {
        this.usuarioId = usuarioId;
        this.assuntoId = assuntoId;
    }

    public boolean estudado() {
        return estudadoEm != null;
    }
}
