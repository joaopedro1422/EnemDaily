package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Conteudo;
import com.example.EnemDaily_backend.model.ConteudoEstudado;
import com.example.EnemDaily_backend.repository.ConteudoEstudadoRepository;
import com.example.EnemDaily_backend.repository.ConteudoRepository;
import com.example.EnemDaily_backend.service.ia.PromptsQuestao;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Os conteúdos que o aluno marcou como estudados. A chave de cada um é "area/slug", a mesma da URL. */
@Service
public class ConteudoEstudadoService {

    private final ConteudoEstudadoRepository estudados;
    private final ConteudoRepository conteudos;

    public ConteudoEstudadoService(ConteudoEstudadoRepository estudados, ConteudoRepository conteudos) {
        this.estudados = estudados;
        this.conteudos = conteudos;
    }

    public List<String> chaves(UUID usuarioId) {
        return estudados.estudadosPor(usuarioId).stream().map(ConteudoEstudadoService::chave).toList();
    }

    /** Devolve false quando o conteúdo não existe ou não está publicado. */
    @Transactional
    public boolean marcar(UUID usuarioId, String areaChave, String slug, boolean estudado) {
        Optional<Conteudo> c = publicado(areaChave, slug);
        if (c.isEmpty()) return false;
        Long id = c.get().getId();
        if (!estudado) estudados.desmarcar(usuarioId, id);
        else if (!estudados.existsByUsuarioIdAndConteudoId(usuarioId, id)) estudados.save(new ConteudoEstudado(usuarioId, id));
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
