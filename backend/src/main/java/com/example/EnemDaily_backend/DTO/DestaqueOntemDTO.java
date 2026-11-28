package com.example.EnemDaily_backend.DTO;

import java.time.LocalDate;
import java.util.UUID;

/**
 * O destaque do grupo no dia anterior. xp é o XP de ontem nas áreas do grupo; posicoes é quantos lugares a
 * pessoa subiu ao longo de ontem no ranking geral; posicao é o lugar dela no fim de ontem; tempoMedio é em
 * segundos (0 se não houver tempo registrado). desempate diz o que decidiu quando o XP ficou a até 5 pontos:
 * "posicoes", "tempo" ou nulo (venceu pelo XP).
 */
public record DestaqueOntemDTO(UUID idUsuario, String usuario, String avatar, LocalDate data, int xp, int posicoes,
                               int posicao, int tempoMedio, String desempate, int participantes) {
}
