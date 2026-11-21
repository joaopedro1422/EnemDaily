package com.example.EnemDaily_backend.DTO;

import com.example.EnemDaily_backend.model.Area;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UsuarioResponseDTO(UUID id,
                                LocalDate ultimoAcesso,
                                String pagFavorita,
                                String emblemas,
                                String nome,
                                String usuario,
                                String avatar,
                                boolean demo,
                                int xpTotal,
                                int xpHoje,
                                int streak,
                                int streakDiasAtivos,
                                int qntDiasAtivos,
                                Area naturezas,
                                Area humanas,
                                Area linguagens,
                                Area exatas,
                                boolean humRespHj,
                                 boolean exatRespHj,
                                 boolean lingRespHj,
                                 boolean natRespHj,
                                 PresencaSemanalDTO presencaSemanal,
                                 List<XpAnoAreasDTO> xpAnoAreas,
                                 List<GrupoResumidoResponseDTO> grupos,
                                 int maiorSequencia,
                                 boolean onboardingVisto,
                                 String email) {
}
