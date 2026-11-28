package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Escola, cursinho ou mentoria digitada por um aluno porque não estava na lista do INEP. Vira opção na busca
 * para os próximos. chave é o nome normalizado (sem acento, minúsculo), para não duplicar.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tb_escola_livre", uniqueConstraints = @UniqueConstraint(columnNames = "chave"))
public class EscolaLivre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String nome;
    @Column(nullable = false, length = 100)
    private String chave;
    private LocalDateTime criadoEm;

    public EscolaLivre(String nome, String chave) {
        this.nome = nome;
        this.chave = chave;
        this.criadoEm = LocalDateTime.now();
    }
}
