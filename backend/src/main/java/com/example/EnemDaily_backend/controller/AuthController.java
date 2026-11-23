package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.DTO.*;
import com.example.EnemDaily_backend.Infra.AcessoAdmin;
import com.example.EnemDaily_backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final AcessoAdmin acessoAdmin;
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UsuarioRequestDTO dto){
        if(authService.existeUsuarioEmail(dto.email())){
            return ResponseEntity.badRequest().body("email_ja_existe");
        }
        if(authService.existeUsuario(dto.usuario())){
            return ResponseEntity.badRequest().body("usuario_ja_existe");
        }
        return ResponseEntity.ok(authService.register(dto));
    }

    @PostMapping("/register-lote")
    public ResponseEntity<?> registerLote(@RequestBody List<UsuarioRequestDTO> dtos,
                                          @RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req){
        if (!acessoAdmin.autorizado(chave, req)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        for (UsuarioRequestDTO dto: dtos) {
            authService.register(dto);
        }
        return ResponseEntity.ok().build();
    }
    @PostMapping("/envia-codigo")
    public ResponseEntity<?> enviarCodigo(@RequestBody RecuperacaoRequest recuperacaoRequest){
        try{
            authService.processarRecuperacao(recuperacaoRequest.email());
            return ResponseEntity.ok().build();
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/verifica-codigo")
    public ResponseEntity<?> verificaCodigo(@RequestBody VerificaCodigoRequest req){
        return authService.codigoValido(req.email(), req.codigo())
                ? ResponseEntity.ok().build()
                : ResponseEntity.badRequest().body("codigo_invalido");
    }
    @PostMapping("/salva-senha")
    public ResponseEntity<?> salvaSenha(@RequestBody NovaSenhaRequest novaSenhaRequest){
        try{
            authService.salvaNovaSenha(novaSenhaRequest);
            return ResponseEntity.ok().build();
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO dto){
        try{
            AuthResponseDTO response = authService.login(dto);
            return ResponseEntity.ok(response);
        }
        catch(Exception e){
            return ResponseEntity.badRequest().body("usuario ou senha incorretos");
        }

    }
}
