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
@Table(name = "push_inscricao", indexes = @Index(name = "idx_push_usuario", columnList = "usuario_id"))
public class PushInscricao {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, unique = true, length = 1024)
    private String endpoint;

    @Column(nullable = false, length = 255)
    private String p256dh;

    @Column(nullable = false, length = 255)
    private String auth;

    private String aparelho;
    private LocalDateTime criadaEm;
    private LocalDateTime ultimoEnvio;
    private int falhas;
}
