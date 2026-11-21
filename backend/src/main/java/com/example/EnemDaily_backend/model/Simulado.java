package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.DTO.SimuladoRequestDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Data
@Table(name = "tb_simulados")
@AllArgsConstructor
@Getter
@Setter
public class Simulado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private UUID idUsuario;
    private String nome;
    private LocalDate data;
    private int numeracao;
    private int dia;
    private int dif;
    private int naturezas;
    private int linguagens;
    private int humanas;
    private int exatas;
    private int total;
    private String anotacoes;
    public Simulado(){

    }
}
