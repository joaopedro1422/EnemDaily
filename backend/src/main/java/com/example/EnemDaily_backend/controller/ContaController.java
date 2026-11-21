package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import com.example.EnemDaily_backend.service.ContaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.function.Function;

@RestController
@RequestMapping("/usuarios/conta")
public class ContaController {

    public record Nome(String nome) {}
    public record NomeUsuario(String usuario) {}
    public record Email(String email, String senhaAtual) {}
    public record Senha(String senhaAtual, String novaSenha) {}

    private final ContaService conta;
    private final UsuarioRepository usuarios;

    public ContaController(ContaService conta, UsuarioRepository usuarios) {
        this.conta = conta;
        this.usuarios = usuarios;
    }

    @GetMapping("/disponivel")
    public ResponseEntity<?> disponivel(@RequestParam String usuario, Authentication auth) {
        return executar(auth, eu -> conta.disponibilidade(usuario, eu));
    }

    @PutMapping("/nome")
    public ResponseEntity<?> nome(@RequestBody Nome corpo, Authentication auth) {
        return executar(auth, eu -> conta.alterarNome(eu, corpo.nome()));
    }

    @PutMapping("/usuario")
    public ResponseEntity<?> usuario(@RequestBody NomeUsuario corpo, Authentication auth) {
        return executar(auth, eu -> conta.alterarUsuario(eu, corpo.usuario()));
    }

    @PutMapping("/email")
    public ResponseEntity<?> email(@RequestBody Email corpo, Authentication auth) {
        return executar(auth, eu -> conta.alterarEmail(eu, corpo.email(), corpo.senhaAtual()));
    }

    @PutMapping("/senha")
    public ResponseEntity<?> senha(@RequestBody Senha corpo, Authentication auth) {
        return executar(auth, eu -> { conta.alterarSenha(eu, corpo.senhaAtual(), corpo.novaSenha()); return Map.of("ok", true); });
    }

    private ResponseEntity<?> executar(Authentication auth, Function<Usuario, Object> acao) {
        Usuario principal = (Usuario) auth.getPrincipal();
        Usuario eu = usuarios.findById(principal.getId()).orElse(null);
        if (eu == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            return ResponseEntity.ok(acao.apply(eu));
        } catch (ContaService.RegraConta e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}
