package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.RedacaoRequestDTO;
import com.example.EnemDaily_backend.model.Redacao;
import com.example.EnemDaily_backend.repository.RedacaoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RedacaoService {

    private final RedacaoRepository redacaoRepository;
    public RedacaoService(RedacaoRepository redacaoRepository){
        this.redacaoRepository = redacaoRepository;
    }
    public List<Redacao> salvaRedacao(RedacaoRequestDTO dto, UUID idUsuario){
        Redacao novaRedacao = new Redacao();
        novaRedacao.setData(dto.data());
        novaRedacao.setTema(dto.tema());
        novaRedacao.setIdUsuario(idUsuario);
        novaRedacao.setNota(dto.nota());
        novaRedacao.setC1(dto.c1());
        novaRedacao.setC2(dto.c2());
        novaRedacao.setC3(dto.c3());
        novaRedacao.setC4(dto.c4());
        novaRedacao.setC5(dto.c5());
        redacaoRepository.save(novaRedacao);
        redacaoRepository.flush();
        List<Redacao> redacoes = getRedacoesUsuario(idUsuario);

        return redacoes;

    }
    public List<Redacao> getRedacoesUsuario(UUID idUsuario){
        List<Redacao> redacoes = this.redacaoRepository.findAllByIdUsuarioOrderByDataDesc(idUsuario);
        for (int i =0 ; i< redacoes.size(); i++) {
            if(i == redacoes.size()-1){
                redacoes.get(i).setDif(0);
            }
            else{
                redacoes.get(i).setDif(redacoes.get(i).getNota() - redacoes.get(i+1).getNota());
            }

        }
        return redacoes;
    }

    public boolean deletaRedacao(long id){
        this.redacaoRepository.deleteById(id);
        return true;
    }
}
