package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.DestaqueOntemDTO;
import com.example.EnemDaily_backend.model.Grupo;
import com.example.EnemDaily_backend.model.GrupoUsuario;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.EventRepository;
import com.example.EnemDaily_backend.repository.GrupoRepository;
import com.example.EnemDaily_backend.repository.GrupoUsuarioRepository;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Regras do destaque de ontem: mais XP; até 5 XP de diferença desempata por posições e depois por tempo. */
class GrupoDestaqueOntemTest {

    private final UUID idGrupo = UUID.randomUUID();
    private GrupoRepository grupos;
    private GrupoUsuarioRepository membros;
    private EventRepository eventos;
    private GrupoService service;
    private Grupo grupo;
    private final List<GrupoUsuario> lista = new ArrayList<>();
    private final List<Object[]> linhas = new ArrayList<>();

    @BeforeEach
    void preparar() {
        grupos = mock(GrupoRepository.class);
        membros = mock(GrupoUsuarioRepository.class);
        eventos = mock(EventRepository.class);
        service = new GrupoService(grupos, mock(UsuarioRepository.class), membros, eventos, mock(UsuarioService.class));
        grupo = mock(Grupo.class);
        when(grupo.isAdmVisivel()).thenReturn(true);
        when(grupos.findById(idGrupo)).thenReturn(Optional.of(grupo));
        when(membros.findAllByGrupo(grupo)).thenReturn(lista);
        when(eventos.resumoOntemNoGrupo(idGrupo)).thenReturn(linhas);
    }

    /** xpGrupo é o total atual; xpOntem/xpHoje e o tempo médio de ontem (em segundos, por resposta). */
    private void membro(String nome, int xpGrupo, int xpOntem, int xpHoje, int tempoMedio) {
        Usuario u = new Usuario();
        u.setId(UUID.randomUUID());
        u.setUsuario(nome);
        GrupoUsuario gu = mock(GrupoUsuario.class);
        when(gu.getUsuario()).thenReturn(u);
        when(gu.getXp()).thenReturn(xpGrupo);
        lista.add(gu);
        int respostas = tempoMedio > 0 ? 4 : 0;
        linhas.add(new Object[]{u.getId(), xpOntem, xpHoje, tempoMedio * respostas, respostas});
    }

    @Test
    void xpComFolgaVenceSemDesempate() {
        membro("ana", 900, 300, 0, 40);
        membro("bruno", 950, 100, 0, 20);
        DestaqueOntemDTO d = service.destaqueOntem(idGrupo).orElseThrow();
        assertEquals("ana", d.usuario());
        assertEquals(300, d.xp());
        assertNull(d.desempate());
        assertEquals(2, d.participantes());
    }

    @Test
    void ateCincoXpDesempataPelasPosicoes() {
        // carla começa ontem em 4º e termina em 2º; davi faz 3 XP a mais, mas já era o 1º e não sobe nada.
        membro("carla", 1000, 100, 0, 50);
        membro("davi", 1080, 103, 0, 10);
        membro("edu", 950, 0, 0, 0);
        membro("fabi", 940, 0, 0, 0);
        DestaqueOntemDTO d = service.destaqueOntem(idGrupo).orElseThrow();
        assertEquals("carla", d.usuario());
        assertEquals("posicoes", d.desempate());
        assertEquals(2, d.posicoes());
        assertEquals(2, d.posicao());
    }

    @Test
    void mesmasPosicoesDesempataPeloMenorTempo() {
        membro("gabi", 500, 80, 0, 45);
        membro("hugo", 300, 78, 0, 30);
        DestaqueOntemDTO d = service.destaqueOntem(idGrupo).orElseThrow();
        assertEquals("hugo", d.usuario());
        assertEquals("tempo", d.desempate());
        assertEquals(30, d.tempoMedio());
    }

    @Test
    void xpDeHojeNaoContaParaAsPosicoesDeOntem() {
        // ivo passou joão só hoje: ontem ele não subiu.
        membro("ivo", 1000, 50, 400, 30);
        membro("joao", 700, 10, 0, 30);
        DestaqueOntemDTO d = service.destaqueOntem(idGrupo).orElseThrow();
        assertEquals("ivo", d.usuario());
        assertEquals(0, d.posicoes());
        assertEquals(2, d.posicao());
    }

    @Test
    void ninguemPontuouOntem() {
        membro("lia", 300, 0, 50, 0);
        assertTrue(service.destaqueOntem(idGrupo).isEmpty());
    }
}
