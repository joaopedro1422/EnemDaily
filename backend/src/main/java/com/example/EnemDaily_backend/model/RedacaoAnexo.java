package com.example.EnemDaily_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Foto ou PDF de uma redação. O arquivo fica no Firebase Storage; aqui ficam o caminho e o link com token. */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedacaoAnexo {
    @Column(length = 300)
    private String caminho;
    @Column(length = 1000)
    private String url;
    @Column(length = 160)
    private String nome;
    @Column(length = 60)
    private String tipo;
    private long tamanho;
}
