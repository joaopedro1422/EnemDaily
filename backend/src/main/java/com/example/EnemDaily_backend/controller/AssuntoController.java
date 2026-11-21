package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.DTO.AssuntoRequestDTO;
import com.example.EnemDaily_backend.service.AssuntoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assuntos")
public class AssuntoController {
    private final AssuntoService assuntoService;

    public AssuntoController(AssuntoService assuntoService){
        this.assuntoService = assuntoService;
    }
    @PostMapping
    public ResponseEntity<?> adicionarNovoAssunto(@RequestBody AssuntoRequestDTO assuntoDto){
        return ResponseEntity.status(HttpStatus.CREATED).body(assuntoService.addNovoAssunto(assuntoDto));
    }

    @PostMapping("/lote")
    public ResponseEntity<?> adicionarVariosAssuntos(@RequestBody List<AssuntoRequestDTO> dtos){
        return ResponseEntity.status(HttpStatus.CREATED).body(assuntoService.addVariosAssuntos(dtos));
    }

}
