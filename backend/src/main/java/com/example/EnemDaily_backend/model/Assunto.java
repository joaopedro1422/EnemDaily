package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.DTO.AssuntoRequestDTO;
import com.example.EnemDaily_backend.Enum.AreaEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "tb_assuntos")
@AllArgsConstructor
@Getter
@Setter
public class Assunto implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private long id;
    private String nomeAssunto;
    private AreaEnum area;
    private LocalDateTime ultimaVezUtilizado;
    public Assunto(AssuntoRequestDTO dto){
        this.nomeAssunto = dto.nomeAssunto();
        this.area = AreaEnum.parse(dto.area());
        this.ultimaVezUtilizado = LocalDateTime.now().minusYears(1);
    }
    public Assunto(){}
    public String toString(){
        return this.nomeAssunto;
    }
}
