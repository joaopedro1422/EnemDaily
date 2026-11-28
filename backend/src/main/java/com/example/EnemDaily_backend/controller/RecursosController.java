package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.service.mentor.MentorAcesso;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Quais módulos em teste estão liberados para quem está logado. Sem login, tudo fica desligado. */
@RestController
public class RecursosController {
    private final MentorAcesso mentor;

    public RecursosController(MentorAcesso mentor) {
        this.mentor = mentor;
    }

    @GetMapping("/recursos")
    public ResponseEntity<Map<String, Boolean>> recursos() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario u = auth != null && auth.getPrincipal() instanceof Usuario x ? x : null;
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("mentor", mentor.liberado(u)));
    }
}
