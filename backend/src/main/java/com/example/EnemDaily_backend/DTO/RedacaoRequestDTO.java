package com.example.EnemDaily_backend.DTO;

import com.example.EnemDaily_backend.model.RedacaoAnexo;

import java.time.LocalDate;
import java.util.List;

public record RedacaoRequestDTO(String tema, LocalDate data, int c1, int c2, int c3, int c4, int c5, int nota, List<RedacaoAnexo> anexos) {
}
