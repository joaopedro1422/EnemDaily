package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.model.RedacaoAnexo;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RedacaoAnexosTest {
    private final UUID eu = UUID.randomUUID();
    private final String url = "https://firebasestorage.googleapis.com/v0/b/x/o/a?alt=media&token=t";

    private RedacaoAnexo foto(String caminho) { return new RedacaoAnexo(caminho, url, "foto.jpg", "image/jpeg", 400_000); }
    private RedacaoAnexo pdf() { return new RedacaoAnexo("redacoes/" + eu + "/a.pdf", url, "redacao.pdf", "application/pdf", 2_000_000); }

    @Test
    void semAnexosViraListaVazia() {
        assertTrue(RedacaoService.validaAnexos(null, eu).isEmpty());
    }

    @Test
    void aceitaAteTresFotosDoProprioAluno() {
        String p = "redacoes/" + eu + "/";
        assertEquals(3, RedacaoService.validaAnexos(List.of(foto(p + "1.jpg"), foto(p + "2.jpg"), foto(p + "3.jpg")), eu).size());
        assertEquals(1, RedacaoService.validaAnexos(List.of(pdf()), eu).size());
    }

    @Test
    void recusaQuatroFotosMisturaOutraPastaETamanho() {
        String p = "redacoes/" + eu + "/";
        assertThrows(RedacaoService.AnexoInvalido.class, () -> RedacaoService.validaAnexos(List.of(foto(p + "1"), foto(p + "2"), foto(p + "3"), foto(p + "4")), eu));
        assertThrows(RedacaoService.AnexoInvalido.class, () -> RedacaoService.validaAnexos(List.of(pdf(), foto(p + "1")), eu));
        assertThrows(RedacaoService.AnexoInvalido.class, () -> RedacaoService.validaAnexos(List.of(foto("redacoes/" + UUID.randomUUID() + "/1.jpg")), eu));
        assertThrows(RedacaoService.AnexoInvalido.class, () -> RedacaoService.validaAnexos(List.of(foto(p + "../x/1.jpg")), eu));
        assertThrows(RedacaoService.AnexoInvalido.class, () -> RedacaoService.validaAnexos(List.of(new RedacaoAnexo(p + "1.jpg", url, "f", "image/jpeg", 9_000_000)), eu));
        assertThrows(RedacaoService.AnexoInvalido.class, () -> RedacaoService.validaAnexos(List.of(new RedacaoAnexo(p + "1.gif", url, "f", "image/gif", 1000)), eu));
        assertThrows(RedacaoService.AnexoInvalido.class, () -> RedacaoService.validaAnexos(List.of(new RedacaoAnexo(p + "1.jpg", "https://malicioso.com/x", "f", "image/jpeg", 1000)), eu));
    }
}
