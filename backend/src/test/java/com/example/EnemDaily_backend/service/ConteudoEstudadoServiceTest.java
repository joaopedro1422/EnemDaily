package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Conteudo;
import com.example.EnemDaily_backend.model.EstudoAssunto;
import com.example.EnemDaily_backend.repository.ConteudoRepository;
import com.example.EnemDaily_backend.repository.EstudoAssuntoRepository;
import com.example.EnemDaily_backend.service.mentor.ProgressoEstudoService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** A lista de conteúdos grava e lê "estudado" pelo assunto, no mesmo lugar que o "Meu mentor". */
class ConteudoEstudadoServiceTest {
    private final EstudoAssuntoRepository estudos = mock(EstudoAssuntoRepository.class);
    private final ConteudoRepository conteudos = mock(ConteudoRepository.class);
    private final ProgressoEstudoService progresso = mock(ProgressoEstudoService.class);
    private final ConteudoEstudadoService servico = new ConteudoEstudadoService(estudos, conteudos, progresso);
    private final UUID eu = UUID.randomUUID();

    private Conteudo conteudo(long id, Long assuntoId, String slug) {
        Conteudo c = new Conteudo();
        c.setId(id);
        c.setAssuntoId(assuntoId);
        c.setArea(AreaEnum.EXATAS);
        c.setSlug(slug);
        c.setPublicado(true);
        return c;
    }

    @Test
    void marcarPassaPeloProgressoDoAssunto() {
        when(conteudos.findByAreaAndSlugAndPublicadoTrue(AreaEnum.EXATAS, "funcoes")).thenReturn(Optional.of(conteudo(7, 42L, "funcoes")));
        assertTrue(servico.marcar(eu, "matematica", "funcoes", true));
        verify(progresso).marcarEstudado(eu, 42L, false);
        assertTrue(servico.marcar(eu, "matematica", "funcoes", false));
        verify(progresso).desfazerEstudo(eu, 42L);
    }

    @Test
    void recusaConteudoInexistenteAreaInvalidaOuSemAssunto() {
        when(conteudos.findByAreaAndSlugAndPublicadoTrue(any(), any())).thenReturn(Optional.empty());
        assertFalse(servico.marcar(eu, "matematica", "nao-existe", true));
        assertFalse(servico.marcar(eu, "astrologia", "funcoes", true));
        when(conteudos.findByAreaAndSlugAndPublicadoTrue(AreaEnum.EXATAS, "orfao")).thenReturn(Optional.of(conteudo(8, null, "orfao")));
        assertFalse(servico.marcar(eu, "matematica", "orfao", true));
        verifyNoInteractions(progresso);
    }

    @Test
    void listaSoOsConteudosDosAssuntosEstudados() {
        EstudoAssunto e = new EstudoAssunto(eu, 42L);
        e.setEstudadoEm(LocalDate.of(2027, 3, 1));
        when(estudos.findAllByUsuarioIdAndEstudadoEmIsNotNull(eu)).thenReturn(List.of(e));
        when(conteudos.findByPublicadoTrueOrderByAreaAscAssuntoAsc()).thenReturn(List.of(conteudo(7, 42L, "funcoes"), conteudo(9, 43L, "porcentagem")));
        assertEquals(List.of("matematica/funcoes"), servico.chaves(eu));
    }
}
