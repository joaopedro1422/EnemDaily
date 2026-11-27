package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tb_conteudo_estudado", uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "conteudo_id"}))
public class ConteudoEstudado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;
    @Column(name = "conteudo_id", nullable = false)
    private Long conteudoId;
    private LocalDateTime estudadoEm;

    public ConteudoEstudado(UUID usuarioId, Long conteudoId) {
        this.usuarioId = usuarioId;
        this.conteudoId = conteudoId;
        this.estudadoEm = LocalDateTime.now();
    }
}
