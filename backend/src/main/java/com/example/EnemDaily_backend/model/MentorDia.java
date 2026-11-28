package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Retrato do que o plano propôs para um dia. Como o cronograma se reorganiza sozinho, sem isso não daria
 * para saber depois o que estava previsto: é o que mostra "ficou de ontem" e se a semana foi cumprida.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tb_mentor_dia", uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "data"}))
public class MentorDia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;
    @Column(nullable = false)
    private LocalDate data;
    /** Quantas tarefas o plano propôs no dia. */
    private int planejadas;
    /** Assuntos novos propostos no dia, separados por vírgula. */
    @Column(length = 400)
    private String assuntosNovos;
    /**
     * Minutos do dia que o aluno abriu mão ("não consegui"). Saem da disponibilidade de hoje para o plano não
     * colocar outro assunto no lugar.
     */
    private int minutosBloqueados;
    /** O aluno marcou a redação da semana como feita neste dia. */
    private boolean redacaoFeita;
    /** O aluno disse que não conseguiu fazer a redação prevista para este dia. */
    private boolean redacaoPulada;

    public MentorDia(UUID usuarioId, LocalDate data) {
        this.usuarioId = usuarioId;
        this.data = data;
    }
}
