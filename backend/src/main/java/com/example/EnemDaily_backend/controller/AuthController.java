package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.DTO.*;
import com.example.EnemDaily_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
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
    public ResponseEntity<?> registerLote(@RequestBody List<UsuarioRequestDTO> dtos){
        for (UsuarioRequestDTO dto: dtos) {
            authService.register(dto);
        }
        return ResponseEntity.ok().build();
    }
    @PostMapping("/envia-codigo")
    public ResponseEntity<?> enviarCodigo(@RequestBody RecuperacaoRequest recuperacaoRequest){
        try{
            return ResponseEntity.ok(authService.processarRecuperacao(recuperacaoRequest.email()));
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/salva-senha")
    public ResponseEntity<?> salvaSenha(@RequestBody NovaSenhaRequest novaSenhaRequest){
        return ResponseEntity.ok(authService.salvaNovaSenha(novaSenhaRequest));
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
