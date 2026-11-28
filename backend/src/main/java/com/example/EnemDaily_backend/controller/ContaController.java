package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import com.example.EnemDaily_backend.service.ContaService;
import com.example.EnemDaily_backend.service.EscolaService;
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
    public record EscolaEscolhida(Long codigo, Long idLivre, String nome) {}

    private final ContaService conta;
    private final UsuarioRepository usuarios;
    private final EscolaService escolas;

    public ContaController(ContaService conta, UsuarioRepository usuarios, EscolaService escolas) {
        this.conta = conta;
        this.usuarios = usuarios;
        this.escolas = escolas;
    }

    @GetMapping("/escolas")
    public ResponseEntity<?> buscarEscolas(@RequestParam String q, Authentication auth) {
        return executar(auth, eu -> escolas.buscar(q));
    }

    /** Escola do aluno: {"escola": opção} ou {"escola": null}. */
    @GetMapping("/escola")
    public ResponseEntity<?> escola(Authentication auth) {
        return executar(auth, eu -> java.util.Collections.singletonMap("escola", escolas.minha(eu).orElse(null)));
    }

    @PutMapping("/escola")
    public ResponseEntity<?> definirEscola(@RequestBody EscolaEscolhida corpo, Authentication auth) {
        return executar(auth, eu -> java.util.Collections.singletonMap("escola", escolas.definir(eu, corpo.codigo(), corpo.idLivre(), corpo.nome()).orElse(null)));
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
