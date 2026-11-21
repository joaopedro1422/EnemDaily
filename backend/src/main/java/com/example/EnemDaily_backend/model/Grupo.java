package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.DTO.GrupoRequestDTO;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "grupos")
@Data
public class Grupo {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;
    private String nome;
    private String img;
    private UUID idAdm;
    private boolean publico;
    private boolean naturezas;
    private boolean humanas;
    private boolean linguagens;
    private boolean exatas;
    private double mediaXp;
    private boolean admVisivel;
    @OneToMany(mappedBy = "grupo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AtividadeRecente> atividadesRecentes;
    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDate dataCriacao;
    @OneToMany(mappedBy = "grupo", cascade = CascadeType.ALL)
    private List<GrupoUsuario> membros;

    public Grupo(GrupoRequestDTO dto, UUID idAdm){
        this.nome = dto.nome();
        this.exatas = dto.exatas();
        this.naturezas = dto.naturezas();
        this.linguagens = dto.linguagens();
        this.humanas = dto.humanas();
        this.publico = dto.publico();
        this.img = dto.img();
        this.idAdm = idAdm;
        this.membros = new ArrayList<>();
        this.atividadesRecentes = new ArrayList<>();
        this.mediaXp = 0;
        this.dataCriacao = LocalDate.now();
        this.admVisivel = true;
    }
    public Grupo(){}

    public void addUsuario(GrupoUsuario grupoUsuario){
        this.membros.add(grupoUsuario);
    }
}
