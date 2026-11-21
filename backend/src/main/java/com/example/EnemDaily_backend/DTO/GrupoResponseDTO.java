package com.example.EnemDaily_backend.DTO;

import com.example.EnemDaily_backend.model.AtividadeRecente;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GrupoResponseDTO(String nome, UUID id, UUID idAdmin, boolean admVisivel, LocalDate dtCriacao, String img, boolean publico, boolean naturezas, boolean humanas, boolean linguagens, boolean exatas, List<UsuarioGrupoResponseDTO> usuariogrupo, List<AtividadeRecente> atividadesRecentes) {
}
