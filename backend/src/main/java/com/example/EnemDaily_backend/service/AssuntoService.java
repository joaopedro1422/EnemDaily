package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.AssuntoRequestDTO;
import com.example.EnemDaily_backend.model.Assunto;
import com.example.EnemDaily_backend.repository.AssuntoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssuntoService {
    private final AssuntoRepository assuntoRepository;
    public AssuntoService(AssuntoRepository assuntoRepository){
        this.assuntoRepository = assuntoRepository;
    }

    public Assunto addNovoAssunto(AssuntoRequestDTO dto){
        Assunto novoAssunto = new Assunto(dto);
        return this.assuntoRepository.save(novoAssunto);
    }

    public int addVariosAssuntos(List<AssuntoRequestDTO> dtos){
        List<Assunto> assuntos = dtos.stream().map(Assunto::new).toList();
        this.assuntoRepository.saveAll(assuntos);
        return assuntos.size();
    }
}
