package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Optional;

@Entity
@Getter
@Setter
@Table(name = "grupo_usuario")
public class GrupoUsuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    private Grupo grupo;

    private LocalDateTime dataEntrada;
    private int xp;
    @Column(name = "titulos_mensais", nullable = false, columnDefinition = "int default 0")
    private int titulosMensais;
    @Column(name = "xp_mensal", columnDefinition = "int default 0")
    private int xpMensal;


    private boolean admin;

    public void addXp(int xp){
        this.xp += xp;
    }
    public void addTituloMensal(){
        this.titulosMensais ++;
    }
}
