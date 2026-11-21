package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.DTO.AddUsuarioGrupoRequestDTO;
import com.example.EnemDaily_backend.DTO.AlteraGrupoDTO;
import com.example.EnemDaily_backend.DTO.DeleteUsuarioGrupoDTO;
import com.example.EnemDaily_backend.DTO.GrupoRequestDTO;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.service.GrupoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/grupos")
public class GrupoController {

    private final GrupoService grupoService;
    public GrupoController(GrupoService grupoService){
        this.grupoService = grupoService;
    }

    @PostMapping("/criar")
    public ResponseEntity<?> criaGrupo(@RequestBody GrupoRequestDTO grupoRequestDTO, Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        return ResponseEntity.ok(grupoService.salvaGrupo(grupoRequestDTO, usuario.getId()));
    }
    @PutMapping
    public ResponseEntity<?> atualizaGrupo(@RequestBody AlteraGrupoDTO dto, Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();

        try {
            return ResponseEntity.ok(grupoService.atualizaGrupo(dto));
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/add-user")
    public ResponseEntity<?> addUser(@RequestBody AddUsuarioGrupoRequestDTO addUsuarioGrupoRequestDTO, Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        try {
            return ResponseEntity.ok(grupoService.addUsuarioGrupo(usuario.getId(), addUsuarioGrupoRequestDTO.idGrupo()));
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGrupo(@PathVariable("id") UUID id){
        try{
            return ResponseEntity.status(HttpStatus.OK).body(grupoService.getGrupo(id));
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/publicos")
    public ResponseEntity<?> getGruposPublicos(Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        try {
            return ResponseEntity.ok(grupoService.getGruposPublicos(usuario.getId()));
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
    @GetMapping("/melhorMensal/{id}")
    public ResponseEntity<?> getMelhorMensal(@PathVariable("id") UUID idGrupo){

        try {
            grupoService.processaMelhorDoMes(idGrupo);
            return ResponseEntity.ok("Processado!");
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
    @GetMapping("/podioMensal/{id}")
    public ResponseEntity<?> getPodioMensal(@PathVariable("id") UUID idGrupo, Authentication authentication){
        Usuario usuario = (Usuario) authentication.getPrincipal();
        try {
            return ResponseEntity.ok(grupoService.getMelhoresDoMes(idGrupo, usuario.getId()));
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
    @DeleteMapping("/deleta/{id}")
    public ResponseEntity<?> DeletaGrupo(@PathVariable("id") UUID id ){
        try {
            grupoService.deletaGrupo(id);
            return ResponseEntity.status(HttpStatus.OK).body("Deletado com sucesso!");
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    @DeleteMapping()
    public ResponseEntity<?> DeleteUsuarioGrupo(@RequestBody DeleteUsuarioGrupoDTO dto){
        try {
            return ResponseEntity.status(HttpStatus.OK).body(grupoService.deletaUsuarioGrupo( dto.idGrupo(), dto.idUsuario()));
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
