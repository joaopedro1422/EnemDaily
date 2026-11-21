package com.example.EnemDaily_backend.DTO;

import java.util.UUID;

public record GrupoRequestDTO(String nome, String img, boolean publico, boolean naturezas, boolean exatas
                              ,boolean linguagens, boolean humanas) {
}
