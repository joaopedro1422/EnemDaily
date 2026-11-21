package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.Enum.StatusAmizade;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "amizade", uniqueConstraints = @UniqueConstraint(columnNames = {"solicitante_id", "destinatario_id"}))
public class Amizade {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitante_id")
    private Usuario solicitante;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id")
    private Usuario destinatario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAmizade status;

    private LocalDateTime criadaEm;
    private LocalDateTime respondidaEm;

    public Amizade(Usuario solicitante, Usuario destinatario) {
        this.solicitante = solicitante;
        this.destinatario = destinatario;
        this.status = StatusAmizade.PENDENTE;
        this.criadaEm = LocalDateTime.now();
    }
}
