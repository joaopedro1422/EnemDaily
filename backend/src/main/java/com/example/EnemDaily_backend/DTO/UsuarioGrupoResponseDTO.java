package com.example.EnemDaily_backend.DTO;

import java.util.UUID;

public record UsuarioGrupoResponseDTO(UUID id, boolean isAdm,String emblemas, String usuario, String avatar, int xpTotal, int xpGrupo, int sequenciaAcertos, int tempoMedio, int xpSemanal, int xpMensal, int xpHoje, int sequenciaAtual , int titulosMensais, int acertosLinguagens, int acertosHumanas, int acertosNaturezas, int acertosExatas, int diasAtivos, String primeiraRespostaHoje) {
}
