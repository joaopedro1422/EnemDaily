package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.SimuladoRequestDTO;
import com.example.EnemDaily_backend.DTO.SimuladoResponseDTO;
import com.example.EnemDaily_backend.model.Simulado;
import com.example.EnemDaily_backend.repository.SimuladoRepository;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.UUID;

@Service
public class SimuladoService {
    private final SimuladoRepository simuladoRepository;

    public SimuladoService(SimuladoRepository simuladoRepository){
        this.simuladoRepository = simuladoRepository;
    }

    public List<SimuladoResponseDTO> salvaSimulado(SimuladoRequestDTO dto, UUID idUsuario){
        int totalAcertos = dto.exatas()+ dto.humanas()+ dto.linguagens() + dto.naturezas();
        Simulado novoSimulado = new Simulado();
        novoSimulado.setData(dto.data());
        novoSimulado.setDia(dto.dia());
        novoSimulado.setIdUsuario(idUsuario);
        novoSimulado.setNome(dto.nome());
        novoSimulado.setExatas(dto.exatas());
        novoSimulado.setHumanas(dto.humanas());
        novoSimulado.setNaturezas(dto.naturezas());
        novoSimulado.setAnotacoes(dto.anotacoes());
        novoSimulado.setLinguagens(dto.linguagens());
        novoSimulado.setTotal(totalAcertos);
        List<Simulado> listaSimulados = simuladoRepository.findAllByDiaAndIdUsuarioOrderByNumeracaoDesc(dto.dia(), idUsuario);
        if(listaSimulados.isEmpty()){
            novoSimulado.setNumeracao(1);
            novoSimulado.setDif(0);
        }
        else{
            Simulado primeiroSimulado = listaSimulados.getFirst();
            novoSimulado.setNumeracao(primeiroSimulado.getNumeracao()+1);
            novoSimulado.setDif(totalAcertos - primeiroSimulado.getTotal());
        }
        simuladoRepository.save(novoSimulado);
        simuladoRepository.flush();
        return getSimuladosUsuario(idUsuario);
    }

    public List<SimuladoResponseDTO> getSimulados(){
        List<Simulado> simulados = simuladoRepository.findAll();
        return simulados.stream().map(s -> new SimuladoResponseDTO(s.getId(),s.getNome(),s.getAnotacoes(), s.getData(), s.getDif(), s.getTotal(), s.getExatas(),s.getHumanas(),s.getLinguagens(),s.getNaturezas(),s.getNumeracao(),s.getDia())).toList();
    }

    public List<SimuladoResponseDTO> getSimuladosUsuario(UUID idUsuario){
        List<Simulado> simulados = simuladoRepository.findAllByIdUsuario(idUsuario);
        return simulados.stream().map(s -> new SimuladoResponseDTO(s.getId(),s.getNome(),s.getAnotacoes(), s.getData(), s.getDif(), s.getTotal(), s.getExatas(),s.getHumanas(),s.getLinguagens(),s.getNaturezas(),s.getNumeracao(),s.getDia())).toList();
    }

    public List<SimuladoResponseDTO> deletaSimulado(Long id, UUID idUsuario){
        simuladoRepository.deleteById(id);
        simuladoRepository.flush();
        return getSimuladosUsuario(idUsuario);
    }
}
