package com.example.EnemDaily_backend.DTO;

import java.time.LocalDate;
import java.util.UUID;

public record GrupoResumidoResponseDTO(String nome, int posicao, UUID id, String img, int membros, boolean publico, boolean naturezas, boolean humanas, boolean linguagens, boolean exatas) {
}
