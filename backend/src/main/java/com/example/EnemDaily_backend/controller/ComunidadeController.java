package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.DTO.comunidade.ComunidadeDTOs;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.service.ComunidadeService;
import com.example.EnemDaily_backend.service.DueloService;
import com.example.EnemDaily_backend.service.RegraException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class ComunidadeController {
    private final ComunidadeService comunidade;
    private final DueloService duelos;

    public ComunidadeController(ComunidadeService comunidade, DueloService duelos) {
        this.comunidade = comunidade;
        this.duelos = duelos;
    }

    private static Usuario eu(Authentication a) {
        if (a == null || !(a.getPrincipal() instanceof Usuario u)) throw new RegraException(HttpStatus.UNAUTHORIZED, "Entre na sua conta para ver seus amigos e duelar.");
        if (u.isDemo()) throw new RegraException(HttpStatus.FORBIDDEN, "Crie sua conta para adicionar amigos e duelar.");
        return u;
    }

    @ExceptionHandler(RegraException.class)
    public ResponseEntity<ComunidadeDTOs.Mensagem> regra(RegraException e) {
        return ResponseEntity.status(e.getStatus()).body(new ComunidadeDTOs.Mensagem(e.getMessage()));
    }


    @GetMapping("/comunidade/buscar")
    public List<ComunidadeDTOs.UsuarioComunidade> buscar(@RequestParam("q") String q, Authentication a) {
        return comunidade.buscar(eu(a), q);
    }

    @GetMapping("/comunidade/perfil/{usuario}")
    public ComunidadeDTOs.PerfilPublico perfil(@PathVariable String usuario, Authentication a) {
        return comunidade.perfil(eu(a), usuario);
    }

    @GetMapping("/comunidade/amigos")
    public List<ComunidadeDTOs.UsuarioComunidade> amigos(Authentication a) {
        return comunidade.amigos(eu(a));
    }

    @GetMapping("/comunidade/solicitacoes")
    public ComunidadeDTOs.Solicitacoes solicitacoes(Authentication a) {
        return comunidade.solicitacoes(eu(a));
    }

    @GetMapping("/comunidade/notificacoes")
    public ComunidadeDTOs.Notificacoes notificacoes(Authentication a) {
        return comunidade.notificacoes(eu(a));
    }

    @PostMapping("/comunidade/amizades/{usuario}")
    public Map<String, String> solicitar(@PathVariable String usuario, Authentication a) {
        return Map.of("relacao", comunidade.solicitarAmizade(eu(a), usuario));
    }

    @PostMapping("/comunidade/amizades/{id}/aceitar")
    public ResponseEntity<Void> aceitar(@PathVariable UUID id, Authentication a) {
        comunidade.aceitarAmizade(eu(a), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/comunidade/amizades/{id}")
    public ResponseEntity<Void> remover(@PathVariable UUID id, Authentication a) {
        comunidade.removerAmizade(eu(a), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/comunidade/bloqueios/{usuario}")
    public ResponseEntity<Void> bloquear(@PathVariable String usuario, Authentication a) {
        comunidade.bloquear(eu(a), usuario);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/comunidade/bloqueios/{usuario}")
    public ResponseEntity<Void> desbloquear(@PathVariable String usuario, Authentication a) {
        comunidade.desbloquear(eu(a), usuario);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/comunidade/privacidade")
    public ComunidadeDTOs.Privacidade privacidade(Authentication a) {
        return comunidade.privacidade(eu(a));
    }

    @PutMapping("/comunidade/privacidade")
    public ComunidadeDTOs.Privacidade salvarPrivacidade(@RequestBody ComunidadeDTOs.Privacidade p, Authentication a) {
        return comunidade.salvarPrivacidade(eu(a), p);
    }


    @GetMapping("/duelos")
    public ComunidadeDTOs.Duelos listar(Authentication a) {
        return duelos.listar(eu(a));
    }

    @GetMapping("/duelos/disponibilidade/{usuario}")
    public ComunidadeDTOs.Disponibilidade disponibilidade(@PathVariable String usuario, Authentication a) {
        return duelos.disponibilidade(eu(a), comunidade.porArroba(usuario));
    }

    @PostMapping("/duelos")
    public ComunidadeDTOs.Duelo desafiar(@RequestBody ComunidadeDTOs.NovoDuelo dto, Authentication a) {
        return duelos.desafiar(eu(a), dto);
    }

    @PostMapping("/duelos/{id}/aceitar")
    public ComunidadeDTOs.Duelo aceitarDuelo(@PathVariable UUID id, Authentication a) {
        return duelos.aceitar(id, eu(a));
    }

    @PostMapping("/duelos/{id}/recusar")
    public ComunidadeDTOs.Duelo recusarDuelo(@PathVariable UUID id, Authentication a) {
        return duelos.recusar(id, eu(a));
    }

    @PostMapping("/duelos/{id}/cancelar")
    public ComunidadeDTOs.Duelo cancelarDuelo(@PathVariable UUID id, Authentication a) {
        return duelos.cancelar(id, eu(a));
    }

    @PostMapping("/duelos/{id}/visto")
    public ResponseEntity<Void> visto(@PathVariable UUID id, Authentication a) {
        duelos.marcarVisto(id, eu(a));
        return ResponseEntity.noContent().build();
    }
}
