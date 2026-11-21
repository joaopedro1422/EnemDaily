package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.DTO.DeletaSimuladoDTO;
import com.example.EnemDaily_backend.DTO.SimuladoRequestDTO;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.service.SimuladoService;
import org.springframework.boot.autoconfigure.graphql.GraphQlProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/simulados")
public class SimuladoController {
    private final SimuladoService simuladoService;
    public SimuladoController(SimuladoService simuladoService){
        this.simuladoService = simuladoService;
    }

    @PostMapping
    public ResponseEntity<?> addSimulado(@RequestBody SimuladoRequestDTO dto, Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(simuladoService.salvaSimulado(dto, usuario.getId()));
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll(){
        return ResponseEntity.ok(simuladoService.getSimulados());
    }

    @GetMapping
    public ResponseEntity<?> getSimuladosUsuario(Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        if(usuario != null){
            return ResponseEntity.ok(simuladoService.getSimuladosUsuario(usuario.getId()));
        }
        else{
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

    }

    @DeleteMapping
    public ResponseEntity<?> deletaSimulado(@RequestBody DeletaSimuladoDTO deletaSimuladoDTO, Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        if(usuario != null){
            return ResponseEntity.ok(simuladoService.deletaSimulado(deletaSimuladoDTO.idSimulado(), usuario.getId()));
        }
        else{
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
