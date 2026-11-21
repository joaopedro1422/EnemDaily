package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.Enum.StatusDuelo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "duelo", indexes = {
        @Index(name = "idx_duelo_desafiante", columnList = "desafiante_id"),
        @Index(name = "idx_duelo_desafiado", columnList = "desafiado_id"),
        @Index(name = "idx_duelo_dia_status", columnList = "dia,status")
})
public class Duelo {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "desafiante_id")
    private Usuario desafiante;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "desafiado_id")
    private Usuario desafiado;

    @Column(nullable = false)
    private LocalDate dia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusDuelo status;

    private Integer xpDesafiante;
    private Integer xpDesafiado;
    private Integer acertosDesafiante;
    private Integer acertosDesafiado;
    private Integer tempoDesafiante;
    private Integer tempoDesafiado;

    private UUID vencedorId;

    @Column(columnDefinition = "boolean default false")
    private boolean vistoDesafiante;
    @Column(columnDefinition = "boolean default false")
    private boolean vistoDesafiado;

    private LocalDateTime criadoEm;
    private LocalDateTime respondidoEm;

    public Duelo(Usuario desafiante, Usuario desafiado, LocalDate dia) {
        this.desafiante = desafiante;
        this.desafiado = desafiado;
        this.dia = dia;
        this.status = StatusDuelo.PENDENTE;
        this.criadoEm = LocalDateTime.now();
    }

    public boolean participa(UUID usuarioId) {
        return desafiante.getId().equals(usuarioId) || desafiado.getId().equals(usuarioId);
    }
}
