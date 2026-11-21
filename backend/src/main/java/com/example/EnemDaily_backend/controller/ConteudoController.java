package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.Infra.AcessoAdmin;
import com.example.EnemDaily_backend.service.ConteudoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Supplier;

@RestController
public class ConteudoController {

    private final ConteudoService servico;
    private final AcessoAdmin acesso;

    public ConteudoController(ConteudoService servico, AcessoAdmin acesso) {
        this.servico = servico;
        this.acesso = acesso;
    }

    @GetMapping("/conteudos")
    public ResponseEntity<?> publicados() {
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofMinutes(5))).body(servico.publicados());
    }

    @GetMapping("/conteudos/{area}/{slug}")
    public ResponseEntity<?> pagina(@PathVariable String area, @PathVariable String slug) {
        return servico.publicada(area, slug)
                .<ResponseEntity<?>>map(p -> ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofMinutes(5))).body(p))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/admin/conteudos")
    public ResponseEntity<?> lista(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req) {
        return protegido(chave, req, servico::listaAdmin);
    }

    @GetMapping("/admin/conteudos/{assuntoId}")
    public ResponseEntity<?> doAssunto(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                       @PathVariable long assuntoId) {
        if (!acesso.autorizado(chave, req)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return servico.doAssunto(assuntoId).<ResponseEntity<?>>map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/admin/conteudos/{assuntoId}/gerar")
    public ResponseEntity<?> gerar(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                   @PathVariable long assuntoId) {
        return protegido(chave, req, () -> servico.gerar(assuntoId));
    }

    @PutMapping("/admin/conteudos/{assuntoId}")
    public ResponseEntity<?> salvar(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                    @PathVariable long assuntoId, @RequestBody ConteudoService.Edicao edicao) {
        return protegido(chave, req, () -> servico.salvar(assuntoId, edicao));
    }

    @PostMapping("/admin/conteudos/{assuntoId}/publicacao")
    public ResponseEntity<?> publicar(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                      @PathVariable long assuntoId, @RequestParam boolean publicar) {
        return protegido(chave, req, () -> servico.publicar(assuntoId, publicar));
    }

    @DeleteMapping("/admin/conteudos/{assuntoId}")
    public ResponseEntity<?> excluir(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                     @PathVariable long assuntoId) {
        return protegido(chave, req, () -> { servico.excluir(assuntoId); return Map.of("ok", true); });
    }

    private ResponseEntity<?> protegido(String chave, HttpServletRequest req, Supplier<Object> acao) {
        if (!acesso.autorizado(chave, req)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            return ResponseEntity.ok(acao.get());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("erro", "Falhou: " + e.getMessage()));
        }
    }
}
