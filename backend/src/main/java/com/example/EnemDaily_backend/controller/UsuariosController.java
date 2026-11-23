package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.DTO.PaginaFavoritaDTO;
import com.example.EnemDaily_backend.DTO.ProvaDTOs;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.service.CorrecaoService;
import com.example.EnemDaily_backend.service.GrupoService;
import com.example.EnemDaily_backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/usuarios")
public class UsuariosController {
    private final UsuarioService usuarioService;
    private final GrupoService grupoService;
    private final CorrecaoService correcaoService;
    @org.springframework.beans.factory.annotation.Autowired
    private com.example.EnemDaily_backend.service.RecomendacaoService recomendacaoService;
    public UsuariosController(UsuarioService usuarioService, GrupoService grupoService, CorrecaoService correcaoService){
        this.correcaoService = correcaoService;
        this.usuarioService = usuarioService;
        this.grupoService = grupoService;
    }

    @GetMapping
    public ResponseEntity<?> getUsuarios(){
        return ResponseEntity.ok(usuarioService.getUsuarios());
    }

    @PostMapping("/resposta")
    public ResponseEntity<?> registraResposta(@RequestBody ProvaDTOs.Responder dto, Authentication authentication){
        if (authentication == null || !(authentication.getPrincipal() instanceof Usuario usuario)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(correcaoService.corrigir(dto, usuario));
        } catch (CorrecaoService.JaRespondida e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("erro", e.getMessage()));
        } catch (CorrecaoService.SemQuestao e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", e.getMessage()));
        }
    }
    @PostMapping("/pagina-favorita")
    public ResponseEntity<?> registraResposta(@RequestBody String pagFavorita, Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        usuario.setPagFavorita(pagFavorita);

        return ResponseEntity.ok().body(usuarioService.salvaUsuario(usuario));


    }
    @GetMapping("/respostas-hoje")
    public ResponseEntity<Integer> getUsuariosHoje() {
        int total = usuarioService.getUsuariosAtivosHoje();
        return ResponseEntity.ok(total);
    }
    @GetMapping("/resumo-semanal")
    public ResponseEntity<?> getResumoSemanal(Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok().body(usuarioService.getResumoSemanal(usuario.getId()));
    }
    @GetMapping("/recomendacao")
    public ResponseEntity<?> getRecomendacao(Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(recomendacaoService.recomendar(usuario.getId()));
    }
    @GetMapping("/relatorio-assuntos")
    public ResponseEntity<?> getResumoAssuntos(Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok().body(usuarioService.getResumoAssuntos(usuario.getId()));
    }

    @PostMapping("/onboarding-visto")
    public ResponseEntity<?> marcaOnboardingVisto(Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        usuario.setOnboardingVisto(true);
        return ResponseEntity.ok().body(usuarioService.salvaUsuario(usuario));
    }

    @PostMapping("/altera-avatar")
    public ResponseEntity<?> alteraAvatar(@RequestBody String avatar, Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        usuario.setAvatar(avatar);
        return ResponseEntity.ok().body(usuarioService.salvaUsuario(usuario));
    }

    @PostMapping("/setDemo")
    public ResponseEntity<?> setDemo(@RequestBody UUID id){
        Usuario usuario = usuarioService.getById(id);
        usuario.setDemo(true);
        return  ResponseEntity.ok().body(usuarioService.salvaUsuario(usuario));
    }


    @PostMapping("/removeBrasil")
    public ResponseEntity<?> removeBrasil(@RequestBody UUID id){
        grupoService.deletaUsuarioGrupoBrasil(id);
        return  ResponseEntity.ok().build();
    }

    @PostMapping("/tornaAdm")
    public ResponseEntity<?> tornaAdm(@RequestBody UUID id){
        grupoService.tornaUsuarioAdmBr(id);
        return  ResponseEntity.ok().build();
    }
}
