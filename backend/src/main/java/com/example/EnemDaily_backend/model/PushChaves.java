package com.example.EnemDaily_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "push_chaves")
public class PushChaves {
    @Id
    private Integer id = 1;

    @Column(nullable = false, length = 200)
    private String publica;

    @Column(nullable = false, length = 400)
    private String privada;
}
