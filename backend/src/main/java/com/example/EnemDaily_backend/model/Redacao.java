package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@Table(name = "tb_redacao")
@Getter
@Setter
@NoArgsConstructor
public class Redacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String tema;
    private UUID idUsuario;
    private LocalDate data;
    private int nota;
    private int c1;
    private int c2;
    private int c3;
    private int c4;
    private int c5;
    private int dif;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "tb_redacao_anexo", joinColumns = @JoinColumn(name = "redacao_id"))
    @OrderColumn(name = "ordem")
    private List<RedacaoAnexo> anexos = new ArrayList<>();

    public Redacao(String tema, UUID idUsuario,LocalDate data, int c1, int c2, int c3, int c4, int c5, int dif){
        this.tema = tema;
        this.data = data;
        this.c1 = c1;
        this.c2 = c2;
        this.c3 = c3;
        this.c4 = c4;
        this.c5 = c5;
        this.idUsuario = idUsuario;
        this.dif =  dif;
    }
}
