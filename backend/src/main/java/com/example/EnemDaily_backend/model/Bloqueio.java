package com.example.EnemDaily_backend.model;

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
@Table(name = "bloqueio", uniqueConstraints = @UniqueConstraint(columnNames = {"bloqueador_id", "bloqueado_id"}))
public class Bloqueio {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "bloqueador_id")
    private Usuario bloqueador;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "bloqueado_id")
    private Usuario bloqueado;

    private LocalDateTime criadoEm;

    public Bloqueio(Usuario bloqueador, Usuario bloqueado) {
        this.bloqueador = bloqueador;
        this.bloqueado = bloqueado;
        this.criadoEm = LocalDateTime.now();
    }
}
