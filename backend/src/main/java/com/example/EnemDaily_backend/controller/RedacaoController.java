package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.DTO.RedacaoRequestDTO;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.service.RedacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/redacoes")
public class RedacaoController {
    private final RedacaoService redacaoService;

    public RedacaoController(RedacaoService redacaoService) {
        this.redacaoService = redacaoService;
    }

    @PostMapping
    public ResponseEntity<?> salvaRedacao(@RequestBody RedacaoRequestDTO dto, Authentication authentication) {
        Usuario usuario = (Usuario) authentication.getPrincipal();
        if (usuario != null) {
            return ResponseEntity.ok(redacaoService.salvaRedacao(dto, usuario.getId()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping
    public ResponseEntity<?> getRedacoesUsuario(Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        if (usuario != null) {
            return ResponseEntity.ok(redacaoService.getRedacoesUsuario(usuario.getId()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletaRedacao(@PathVariable("id") Long id, Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        if (usuario != null) {
            return ResponseEntity.ok(redacaoService.deletaRedacao(id));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
