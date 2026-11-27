package com.example.EnemDaily_backend.DTO;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Area;

public record RespostaDTO(int xp, int tempoGasto, boolean acerto, String assunto, AreaEnum area, Integer xpBase, Integer alternativa, Long questaoId) {
}
