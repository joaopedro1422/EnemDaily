package com.example.EnemDaily_backend.DTO;
import java.util.List;
public record PodioGrupoResponseDTO(int posicaoUsuarioLogado, List<UsuarioPodioDTO> usuarios) {
}
