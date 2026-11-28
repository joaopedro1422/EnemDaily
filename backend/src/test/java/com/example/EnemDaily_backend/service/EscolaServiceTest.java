package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.model.EscolaLivre;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.EscolaLivreRepository;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class EscolaServiceTest {

    private EscolaLivreRepository livres;
    private EscolaService service;

    @BeforeEach
    void preparar() {
        livres = mock(EscolaLivreRepository.class);
        when(livres.findTop200ByChaveContaining(anyString())).thenReturn(List.of());
        service = new EscolaService(livres, mock(UsuarioRepository.class));
    }

    @Test
    void nomesFicamLegiveisSemPerderAsSiglas() {
        assertEquals("EE Jose de Alencar II", EscolaService.exibir("EE JOSE DE ALENCAR II"));
        assertEquals("ETEC Dr Emilio Hernandez", EscolaService.exibir("ETEC DR EMILIO HERNANDEZ"));
        assertEquals("EM Tempo Integral e Educacao", EscolaService.exibir("EM TEMPO INTEGRAL E EDUCACAO"));
    }

    @Test
    void buscaIgnoraAcentoEMaiusculaEAceitaCidade() {
        List<EscolaService.Opcao> r = service.buscar("Acrelândia jean pierre");
        assertFalse(r.isEmpty());
        assertTrue(r.get(0).nome().contains("Jean Pierre"), r.get(0).nome());
        assertEquals("inep", r.get(0).tipo());
        assertEquals("Acrelândia · AC", r.get(0).local());
    }

    @Test
    void buscaCurtaNaoRetornaNada() {
        assertTrue(service.buscar("a").isEmpty());
    }

    @Test
    void textoLivreViraOpcaoSemDuplicar() {
        EscolaLivre existente = new EscolaLivre("Cursinho Popular Quilombo", "cursinho popular quilombo");
        existente.setId(7L);
        when(livres.findByChave("cursinho popular quilombo")).thenReturn(Optional.of(existente));
        when(livres.findById(7L)).thenReturn(Optional.of(existente));
        Usuario u = new Usuario();
        EscolaService.Opcao o = service.definir(u, null, null, "  cursinho   popular QUILOMBO ").orElseThrow();
        assertEquals(7L, u.getEscolaLivreId());
        assertNull(u.getEscolaInep());
        assertEquals("Cursinho Popular Quilombo", o.nome());
        verify(livres, never()).save(any());
    }

    @Test
    void escolaDoInepPrecisaExistir() {
        Usuario u = new Usuario();
        assertThrows(ContaService.RegraConta.class, () -> service.definir(u, 1L, null, null));
        service.definir(u, 12018422L, null, null);
        assertEquals(12018422L, u.getEscolaInep());
        assertEquals("Esc Santa Lucia III", service.minha(u).orElseThrow().nome());
    }
}
