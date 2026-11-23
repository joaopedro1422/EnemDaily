package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.DTO.ProvaDTOs;
import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.Infra.AcessoAdmin;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.service.CorrecaoService;
import com.example.EnemDaily_backend.service.GeradorQuestaoService;
import com.example.EnemDaily_backend.service.ia.StatusGeracao;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/questoes")
public class QuestaoController {
    private final GeradorQuestaoService geradorQuestaoService;
    private final StatusGeracao statusGeracao;
    private final AcessoAdmin acessoAdmin;
    private final CorrecaoService correcaoService;

    public QuestaoController(GeradorQuestaoService geradorQuestaoService, StatusGeracao statusGeracao, AcessoAdmin acessoAdmin, CorrecaoService correcaoService) {
        this.correcaoService = correcaoService;
        this.geradorQuestaoService = geradorQuestaoService;
        this.statusGeracao = statusGeracao;
        this.acessoAdmin = acessoAdmin;
    }

    @GetMapping("exemplo/{area}")
    public ResponseEntity<?> getQuestaoExemplo(@PathVariable("area") String area) {
        var q = geradorQuestaoService.getQuestaoExemplo(AreaEnum.parse(area));
        return q == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(q);
    }

    @GetMapping("geracao")
    public ResponseEntity<?> statusDaGeracao(@RequestHeader(value = "X-Admin-Chave", required = false) String chave, HttpServletRequest req) {
        if (!acessoAdmin.autorizado(chave, req)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(statusGeracao.todos());
    }

    @GetMapping("{area}")
    public ResponseEntity<?> getQuestao(@PathVariable("area") String area,@RequestHeader(value = "Authorization", required = false) String token, Authentication authentication){
        if (authentication == null || !(authentication.getPrincipal() instanceof Usuario usuario)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String jwtApenas = token == null ? null : token.replace("Bearer ", "");
        if (!usuario.isDemo() && (jwtApenas == null || !jwtApenas.equals(usuario.getTokenSessao()))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        var q = geradorQuestaoService.getQuestaoDia(AreaEnum.parse(area));
        return q == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(ProvaDTOs.QuestaoProva.de(q));
    }

    @GetMapping("{area}/revisao")
    public ResponseEntity<?> revisao(@PathVariable("area") String area, Authentication authentication) {
        try {
            return ResponseEntity.ok(correcaoService.revisar(area, (Usuario) authentication.getPrincipal()));
        } catch (CorrecaoService.NaoRespondida | CorrecaoService.SemQuestao e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", e.getMessage()));
        }
    }

    @PostMapping()
    public ResponseEntity<?> geraQuestoes(@RequestHeader(value = "X-Admin-Chave", required = false) String chave,
                                          HttpServletRequest req,
                                          @RequestParam(defaultValue = "hoje") String dia,
                                          @RequestParam(required = false) String area,
                                          @RequestParam(defaultValue = "false") boolean substituir) {
        if (!acessoAdmin.autorizado(chave, req)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        LocalDate data;
        try {
            data = switch (dia) {
                case "hoje" -> LocalDate.now();
                case "amanha" -> LocalDate.now().plusDays(1);
                default -> LocalDate.parse(dia);
            };
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Use dia=hoje, dia=amanha ou uma data AAAA-MM-DD."));
        }
        Set<AreaEnum> areas = area == null || area.isBlank() ? EnumSet.allOf(AreaEnum.class) : EnumSet.of(AreaEnum.parse(area));
        var iniciadas = geradorQuestaoService.disparar(data, areas, substituir);
        return ResponseEntity.accepted().body(Map.of(
                "dia", data.toString(),
                "iniciadas", iniciadas,
                "acompanhe", "GET /api/questoes/geracao"));
    }
}
