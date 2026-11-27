package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Conteudo;
import com.example.EnemDaily_backend.model.ConteudoEstudado;
import com.example.EnemDaily_backend.repository.ConteudoEstudadoRepository;
import com.example.EnemDaily_backend.repository.ConteudoRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ConteudoEstudadoServiceTest {
    private final ConteudoEstudadoRepository estudados = mock(ConteudoEstudadoRepository.class);
    private final ConteudoRepository conteudos = mock(ConteudoRepository.class);
    private final ConteudoEstudadoService servico = new ConteudoEstudadoService(estudados, conteudos);
    private final UUID eu = UUID.randomUUID();

    private Conteudo publicado() {
        Conteudo c = new Conteudo();
        c.setId(7L);
        c.setArea(AreaEnum.EXATAS);
        c.setSlug("funcoes");
        c.setPublicado(true);
        when(conteudos.findByAreaAndSlugAndPublicadoTrue(AreaEnum.EXATAS, "funcoes")).thenReturn(Optional.of(c));
        return c;
    }

    @Test
    void marcaUmaVezSo() {
        publicado();
        when(estudados.existsByUsuarioIdAndConteudoId(eu, 7L)).thenReturn(false, true);
        assertTrue(servico.marcar(eu, "matematica", "funcoes", true));
        assertTrue(servico.marcar(eu, "matematica", "funcoes", true));
        verify(estudados, times(1)).save(any(ConteudoEstudado.class));
    }

    @Test
    void desmarcaApagandoALinha() {
        publicado();
        assertTrue(servico.marcar(eu, "matematica", "funcoes", false));
        verify(estudados).desmarcar(eu, 7L);
        verify(estudados, never()).save(any());
    }

    @Test
    void recusaConteudoInexistenteOuAreaInvalida() {
        when(conteudos.findByAreaAndSlugAndPublicadoTrue(any(), any())).thenReturn(Optional.empty());
        assertFalse(servico.marcar(eu, "matematica", "nao-existe", true));
        assertFalse(servico.marcar(eu, "astrologia", "funcoes", true));
        verify(estudados, never()).save(any());
    }

    @Test
    void listaComAChaveDaUrl() {
        Conteudo c = publicado();
        when(estudados.estudadosPor(eu)).thenReturn(List.of(c));
        assertEquals(List.of("matematica/funcoes"), servico.chaves(eu));
    }
}
