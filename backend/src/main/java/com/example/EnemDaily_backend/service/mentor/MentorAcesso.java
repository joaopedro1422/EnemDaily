package com.example.EnemDaily_backend.service.mentor;

import com.example.EnemDaily_backend.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Liga e desliga o "Meu mentor". Com enemdaily.mentor.ativo=false, só os logins em enemdaily.mentor.testadores
 * veem o módulo. Para os demais, as rotas respondem 404 e o app não mostra nada.
 */
@Component
public class MentorAcesso {
    private final boolean ativo;
    private final Set<String> testadores;

    public MentorAcesso(@Value("${enemdaily.mentor.ativo:false}") boolean ativo,
                        @Value("${enemdaily.mentor.testadores:}") String testadores) {
        this.ativo = ativo;
        this.testadores = Arrays.stream(testadores.split(","))
                .map(s -> s.trim().replaceFirst("^@", "").toLowerCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean liberado(Usuario u) {
        if (u == null || u.isDemo()) return false;
        if (ativo) return true;
        return u.getUsuario() != null && testadores.contains(u.getUsuario().toLowerCase(Locale.ROOT));
    }
}
