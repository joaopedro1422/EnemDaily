package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Conteudo;
import com.example.EnemDaily_backend.model.EstudoAssunto;
import com.example.EnemDaily_backend.repository.ConteudoRepository;
import com.example.EnemDaily_backend.repository.EstudoAssuntoRepository;
import com.example.EnemDaily_backend.service.ia.PromptsQuestao;
import com.example.EnemDaily_backend.service.mentor.ProgressoEstudoService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * "Estudado" na lista de conteúdos. A chave de cada conteúdo é "area/slug", a mesma da URL. O estado fica em
 * tb_estudo_assunto (pelo assunto do conteúdo), o mesmo que o "Meu mentor" usa.
 */
@Service
public class ConteudoEstudadoService {

    private final EstudoAssuntoRepository estudos;
    private final ConteudoRepository conteudos;
    private final ProgressoEstudoService progresso;

    public ConteudoEstudadoService(EstudoAssuntoRepository estudos, ConteudoRepository conteudos, ProgressoEstudoService progresso) {
        this.estudos = estudos;
        this.conteudos = conteudos;
        this.progresso = progresso;
    }

    public List<String> chaves(UUID usuarioId) {
        Set<Long> estudados = estudos.findAllByUsuarioIdAndEstudadoEmIsNotNull(usuarioId).stream()
                .map(EstudoAssunto::getAssuntoId).collect(Collectors.toSet());
        if (estudados.isEmpty()) return List.of();
        return conteudos.findByPublicadoTrueOrderByAreaAscAssuntoAsc().stream()
                .filter(c -> c.getAssuntoId() != null && estudados.contains(c.getAssuntoId()))
                .map(ConteudoEstudadoService::chave)
                .toList();
    }

    /** Devolve false quando o conteúdo não existe, não está publicado ou não tem assunto. */
    public boolean marcar(UUID usuarioId, String areaChave, String slug, boolean estudado) {
        Optional<Conteudo> c = publicado(areaChave, slug).filter(x -> x.getAssuntoId() != null);
        if (c.isEmpty()) return false;
        if (estudado) progresso.marcarEstudado(usuarioId, c.get().getAssuntoId(), false);
        else progresso.desfazerEstudo(usuarioId, c.get().getAssuntoId());
        return true;
    }

    private Optional<Conteudo> publicado(String areaChave, String slug) {
        AreaEnum area = PromptsQuestao.areaPorChave(areaChave);
        return area == null ? Optional.empty() : conteudos.findByAreaAndSlugAndPublicadoTrue(area, slug);
    }

    private static String chave(Conteudo c) {
        return PromptsQuestao.AREAS.get(c.getArea()).chave() + "/" + c.getSlug();
    }
}
