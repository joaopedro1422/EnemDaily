package com.example.EnemDaily_backend.DTO;

import java.time.LocalDate;

public record SimuladoResponseDTO(Long id,String nome, String anotacoes, LocalDate data, int dif, int acertosTotais, int exatas, int humanas, int linguagens, int naturezas, int numeracao, int dia) {
}
