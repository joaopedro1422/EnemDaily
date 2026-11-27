package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.service.ConteudoEstudadoService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/conteudos/estudados")
public class ConteudoEstudadoController {

    private final ConteudoEstudadoService servico;

    public ConteudoEstudadoController(ConteudoEstudadoService servico) {
        this.servico = servico;
    }

    @GetMapping
    public ResponseEntity<?> lista(Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(servico.chaves(u.getId()));
    }

    @PutMapping("/{area}/{slug}")
    public ResponseEntity<?> marcar(@PathVariable String area, @PathVariable String slug, Authentication auth) {
        return alterar(area, slug, true, auth);
    }

    @DeleteMapping("/{area}/{slug}")
    public ResponseEntity<?> desmarcar(@PathVariable String area, @PathVariable String slug, Authentication auth) {
        return alterar(area, slug, false, auth);
    }

    private ResponseEntity<?> alterar(String area, String slug, boolean estudado, Authentication auth) {
        Usuario u = usuario(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return servico.marcar(u.getId(), area, slug, estudado) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    private static Usuario usuario(Authentication auth) {
        return auth != null && auth.getPrincipal() instanceof Usuario u ? u : null;
    }
}
