package com.example.EnemDaily_backend.service;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LembreteServiceQuandoTest {

    @Test
    void hojeEAmanha() {
        LocalDate hoje = LocalDate.now();
        assertEquals("hoje", LembreteService.quando(hoje));
        assertEquals("amanhã", LembreteService.quando(hoje.plusDays(1)));
    }

    @Test
    void diaDaSemanaComDataEArtigo() {
        LocalDate base = LocalDate.now().plusDays(2);
        LocalDate sexta = base.with(TemporalAdjusters.nextOrSame(DayOfWeek.FRIDAY));
        LocalDate sabado = base.with(TemporalAdjusters.nextOrSame(DayOfWeek.SATURDAY));
        DateTimeFormatter dm = DateTimeFormatter.ofPattern("dd/MM");
        assertEquals("na sexta-feira (" + sexta.format(dm) + ")", LembreteService.quando(sexta));
        assertEquals("no sábado (" + sabado.format(dm) + ")", LembreteService.quando(sabado));
    }
}
