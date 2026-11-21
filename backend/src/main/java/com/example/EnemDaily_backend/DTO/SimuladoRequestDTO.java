package com.example.EnemDaily_backend.DTO;

import java.time.LocalDate;

public record SimuladoRequestDTO(String nome,String anotacoes, LocalDate data, int dia, int naturezas, int exatas, int linguagens, int humanas) {
}
