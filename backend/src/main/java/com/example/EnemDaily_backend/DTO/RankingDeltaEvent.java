package com.example.EnemDaily_backend.DTO;

import java.util.UUID;

public record RankingDeltaEvent(UUID grupoId,
                                String usuario,
                                int xpGanho,
                                long seq) {
}
