package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.service.mentor.MentorDtos.ConfigEntrada;
import com.example.EnemDaily_backend.service.mentor.MentorService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Function;

/**
 * "Meu mentor". Todas as rotas exigem login (o ExigeLoginInterceptor responde 401 sem ele) e respondem 404
 * enquanto o módulo não estiver liberado para o aluno. Cada ação devolve o painel já recalculado.
 */
@RestController
@RequestMapping("/mentor")
public class MentorController {
    public record Notificacoes(boolean ativo) {}
    public record Estudado(Boolean jaSabia) {}
    public record Revisado(Boolean dificil) {}
    public record Adiar(int dias) {}
    public record Redacao(boolean feita) {}

    private final MentorService mentor;

    public MentorController(MentorService mentor) {
        this.mentor = mentor;
    }

    @GetMapping
    public ResponseEntity<?> painel(Authentication auth) {
        return executar(auth, mentor::painel);
    }

    @GetMapping("/hoje")
    public ResponseEntity<?> hoje(Authentication auth) {
        return executar(auth, mentor::hoje);
    }

    @GetMapping("/dias")
    public ResponseEntity<?> dias(@RequestParam("de") String de, @RequestParam("ate") String ate, Authentication auth) {
        return executar(auth, u -> mentor.dias(u, java.time.LocalDate.parse(de), java.time.LocalDate.parse(ate)));
    }

    @PutMapping("/plano")
    public ResponseEntity<?> salvar(@RequestBody ConfigEntrada config, Authentication auth) {
        return executar(auth, u -> mentor.salvarConfig(u, config));
    }

    @DeleteMapping("/plano")
    public ResponseEntity<?> apagar(Authentication auth) {
        return executar(auth, u -> { mentor.apagar(u); return Map.of("ok", true); });
    }

    @PutMapping("/notificacoes")
    public ResponseEntity<?> notificacoes(@RequestBody Notificacoes n, Authentication auth) {
        return executar(auth, u -> mentor.notificacoes(u, n != null && n.ativo()));
    }

    @PostMapping("/hoje/concluir")
    public ResponseEntity<?> concluirDia(Authentication auth) {
        return executar(auth, mentor::concluirDia);
    }

    @PostMapping("/hoje/nao-consegui")
    public ResponseEntity<?> naoConseguiDia(Authentication auth) {
        return executar(auth, mentor::naoConseguiDia);
    }

    @PostMapping("/redacao")
    public ResponseEntity<?> redacao(@RequestBody Redacao r, Authentication auth) {
        return executar(auth, u -> mentor.redacao(u, r != null && r.feita()));
    }

    @GetMapping("/assuntos/{id}")
    public ResponseEntity<?> detalhe(@PathVariable long id, Authentication auth) {
        return executar(auth, u -> mentor.detalhe(u, id));
    }

    @PostMapping("/assuntos/{id}/estudado")
    public ResponseEntity<?> estudado(@PathVariable long id, @RequestBody(required = false) Estudado e, Authentication auth) {
        return executar(auth, u -> mentor.estudado(u, id, e != null && Boolean.TRUE.equals(e.jaSabia())));
    }

    @DeleteMapping("/assuntos/{id}/estudado")
    public ResponseEntity<?> naoEstudado(@PathVariable long id, Authentication auth) {
        return executar(auth, u -> mentor.desfazer(u, id));
    }

    @PostMapping("/assuntos/{id}/parte")
    public ResponseEntity<?> parte(@PathVariable long id, Authentication auth) {
        return executar(auth, u -> mentor.parte(u, id));
    }

    @PostMapping("/assuntos/{id}/revisado")
    public ResponseEntity<?> revisado(@PathVariable long id, @RequestBody(required = false) Revisado r, Authentication auth) {
        return executar(auth, u -> mentor.revisado(u, id, r != null && Boolean.TRUE.equals(r.dificil())));
    }

    @PostMapping("/assuntos/{id}/desfazer")
    public ResponseEntity<?> desfazerHoje(@PathVariable long id, Authentication auth) {
        return executar(auth, u -> mentor.desfazerHoje(u, id));
    }

    @PostMapping("/assuntos/{id}/nao-consegui")
    public ResponseEntity<?> naoConsegui(@PathVariable long id, Authentication auth) {
        return executar(auth, u -> mentor.naoConsegui(u, id));
    }

    @PostMapping("/assuntos/{id}/adiar")
    public ResponseEntity<?> adiar(@PathVariable long id, @RequestBody Adiar a, Authentication auth) {
        return executar(auth, u -> mentor.adiar(u, id, a == null ? 0 : a.dias()));
    }

    @PostMapping("/assuntos/{id}/remover")
    public ResponseEntity<?> remover(@PathVariable long id, Authentication auth) {
        return executar(auth, u -> mentor.remover(u, id, true));
    }

    @PostMapping("/assuntos/{id}/restaurar")
    public ResponseEntity<?> restaurar(@PathVariable long id, Authentication auth) {
        return executar(auth, u -> mentor.remover(u, id, false));
    }

    private ResponseEntity<?> executar(Authentication auth, Function<Usuario, Object> acao) {
        if (auth == null || !(auth.getPrincipal() instanceof Usuario u)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(acao.apply(u));
        } catch (MentorService.NaoLiberado e) {
            return ResponseEntity.notFound().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", e.getMessage() == null ? "Não encontrado." : e.getMessage()));
        } catch (IllegalArgumentException | java.time.format.DateTimeParseException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erro", "Tente de novo em instantes."));
        }
    }
}
