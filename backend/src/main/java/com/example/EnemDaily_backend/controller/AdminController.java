package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.Infra.AcessoAdmin;
import com.example.EnemDaily_backend.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.function.Supplier;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService admin;
    private final AcessoAdmin acesso;

    public AdminController(AdminService admin, AcessoAdmin acesso) {
        this.admin = admin;
        this.acesso = acesso;
    }

    @GetMapping("resumo")
    public ResponseEntity<?> resumo(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req) {
        return protegido(chave, req, admin::resumo);
    }

    @GetMapping("usuarios")
    public ResponseEntity<?> usuarios(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                      @RequestParam(defaultValue = "") String busca,
                                      @RequestParam(defaultValue = "0") int pagina,
                                      @RequestParam(defaultValue = "30") int tamanho) {
        return protegido(chave, req, () -> admin.usuarios(busca, Math.max(0, pagina), Math.min(100, Math.max(1, tamanho))));
    }

    @DeleteMapping("usuarios/{id}")
    public ResponseEntity<?> excluir(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                     @PathVariable UUID id) {
        if (!acesso.autorizado(chave, req)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            return ResponseEntity.ok(admin.excluirUsuario(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", e.getMessage()));
        }
    }

    @GetMapping("atividade")
    public ResponseEntity<?> atividadeDoMes(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                            @RequestParam String mes) {
        return protegido(chave, req, () -> admin.atividadeDoMes(YearMonth.parse(mes)));
    }

    @GetMapping("atividade/dia")
    public ResponseEntity<?> atividadeDoDia(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                            @RequestParam String data) {
        return protegido(chave, req, () -> admin.atividadeDoDia(LocalDate.parse(data)));
    }

    @GetMapping("assuntos")
    public ResponseEntity<?> assuntos(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req) {
        return protegido(chave, req, admin::assuntos);
    }

    public record NovoAssunto(String nome, String area) {}

    @PostMapping("assuntos")
    public ResponseEntity<?> adicionarAssunto(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                              @RequestBody NovoAssunto corpo) {
        if (!acesso.autorizado(chave, req)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(admin.adicionarAssunto(corpo.nome(), corpo.area()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("assuntos/{id}")
    public ResponseEntity<?> excluirAssunto(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req,
                                            @PathVariable long id) {
        if (!acesso.autorizado(chave, req)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return admin.excluirAssunto(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    private ResponseEntity<?> protegido(String chave, HttpServletRequest req, Supplier<Object> acao) {
        if (!acesso.autorizado(chave, req)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(acao.get());
    }
}
