package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.model.PushInscricao;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.PushInscricaoRepository;
import com.example.EnemDaily_backend.service.LembreteService;
import com.example.EnemDaily_backend.service.WebPushService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/push")
public class PushController {
    public record Chaves(String p256dh, String auth) {}
    public record Inscricao(String endpoint, Chaves keys, String aparelho) {}
    public record Remocao(String endpoint) {}

    private final WebPushService push;
    private final PushInscricaoRepository inscricoes;
    private final LembreteService lembretes;

    public PushController(WebPushService push, PushInscricaoRepository inscricoes, LembreteService lembretes) {
        this.push = push;
        this.inscricoes = inscricoes;
        this.lembretes = lembretes;
    }

    private static Usuario eu(Authentication a) {
        return a != null && a.getPrincipal() instanceof Usuario u && !u.isDemo() ? u : null;
    }

    @GetMapping("/chave")
    public Map<String, String> chave() {
        return Map.of("chavePublica", push.chavePublica());
    }

    @PostMapping("/inscricao")
    @Transactional
    public ResponseEntity<?> inscrever(@RequestBody Inscricao dto, Authentication a) {
        Usuario u = eu(a);
        if (u == null) return ResponseEntity.status(401).body(Map.of("mensagem", "Entre na sua conta para ativar os lembretes."));
        if (dto == null || dto.endpoint() == null || !dto.endpoint().startsWith("https://") || dto.keys() == null || dto.keys().p256dh() == null || dto.keys().auth() == null)
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Inscrição inválida."));
        PushInscricao p = inscricoes.findByEndpoint(dto.endpoint()).orElseGet(PushInscricao::new);
        if (p.getId() == null) p.setCriadaEm(LocalDateTime.now());
        p.setUsuario(u);
        p.setEndpoint(dto.endpoint());
        p.setP256dh(dto.keys().p256dh());
        p.setAuth(dto.keys().auth());
        p.setAparelho(dto.aparelho() == null ? null : dto.aparelho().substring(0, Math.min(120, dto.aparelho().length())));
        p.setFalhas(0);
        inscricoes.save(p);
        return ResponseEntity.ok(Map.of("ativo", true));
    }

    @PostMapping("/remover")
    @Transactional
    public ResponseEntity<Void> remover(@RequestBody Remocao dto) {
        if (dto != null && dto.endpoint() != null) inscricoes.findByEndpoint(dto.endpoint()).ifPresent(inscricoes::delete);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/teste")
    public ResponseEntity<?> teste(Authentication a) {
        Usuario u = eu(a);
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of("enviadas", lembretes.enviarTeste(u)));
    }
}
