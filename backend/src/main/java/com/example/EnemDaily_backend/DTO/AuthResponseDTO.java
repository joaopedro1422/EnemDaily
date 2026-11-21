package com.example.EnemDaily_backend.DTO;

public record AuthResponseDTO(    String token,
                                  UsuarioResponseDTO usuario
) {
}
