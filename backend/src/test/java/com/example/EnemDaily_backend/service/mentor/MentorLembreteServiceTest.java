package com.example.EnemDaily_backend.service.mentor;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MentorLembreteServiceTest {

    @Test
    void textoDaManha() {
        assertEquals("Estequiometria, Ecologia, 2 revisões e a redação da semana.",
                MentorLembreteService.textoDaManha(new MentorService.ResumoDoDia(List.of("Estequiometria", "Ecologia"), 2, true, 0, false)));
        assertEquals("Porcentagem.",
                MentorLembreteService.textoDaManha(new MentorService.ResumoDoDia(List.of("Porcentagem"), 0, false, 0, false)));
        assertEquals("1 revisão te esperando.",
                MentorLembreteService.textoDaManha(new MentorService.ResumoDoDia(List.of(), 1, false, 0, false)));
    }

    @Test
    void textoDaNoite() {
        assertEquals("Estequiometria te espera. Se hoje não der, o plano se ajusta.",
                MentorLembreteService.textoDaNoite(new MentorService.ResumoDoDia(List.of("Estequiometria"), 1, false, 0, false)));
        assertEquals("Suas revisões te esperam. Se hoje não der, o plano se ajusta.",
                MentorLembreteService.textoDaNoite(new MentorService.ResumoDoDia(List.of(), 3, false, 0, false)));
    }
}
