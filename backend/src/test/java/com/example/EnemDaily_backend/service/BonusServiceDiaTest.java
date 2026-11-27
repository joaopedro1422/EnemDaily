package com.example.EnemDaily_backend.service;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BonusServiceDiaTest {

    @Test
    void exatamenteUmDiaPorSemana() {
        LocalDate segunda = LocalDate.of(2026, 1, 5);
        for (int s = 0; s < 260; s++) {
            int dias = 0;
            for (int d = 0; d < 7; d++) if (BonusService.ehDiaDeBonus(segunda.plusWeeks(s).plusDays(d))) dias++;
            assertEquals(1, dias, "semana " + segunda.plusWeeks(s));
        }
    }

    @Test
    void naoCaiSempreNoMesmoDiaDaSemana() {
        Map<DayOfWeek, Integer> contagem = new HashMap<>();
        LocalDate d = LocalDate.of(2026, 1, 5);
        for (int i = 0; i < 52 * 7 * 4; i++, d = d.plusDays(1)) if (BonusService.ehDiaDeBonus(d)) contagem.merge(d.getDayOfWeek(), 1, Integer::sum);
        assertEquals(7, contagem.size(), "todos os dias da semana aparecem");
        contagem.values().forEach(n -> assertTrue(n >= 10, "distribuição razoável: " + contagem));
    }
}
