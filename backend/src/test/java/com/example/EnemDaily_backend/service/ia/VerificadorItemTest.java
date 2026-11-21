package com.example.EnemDaily_backend.service.ia;

import com.example.EnemDaily_backend.service.ia.ItemElaborado.AlternativaElaborada;
import com.example.EnemDaily_backend.service.ia.ItemElaborado.TextoBase;
import com.example.EnemDaily_backend.service.ia.ItemElaborado.Verificacao;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class VerificadorItemTest {

    private static final String TEXTO_BASE = "Uma loja de eletrônicos anunciou uma promoção de fim de ano. Um fone de ouvido que custava "
            + "R$ 150,00 recebeu um desconto de 20%. Na semana seguinte, por causa da alta procura, a loja aplicou um "
            + "acréscimo de 10% sobre o novo preço do produto.";
    private static final String ENUNCIADO = "Após as duas alterações, o preço do fone de ouvido, em reais, passou a ser";
    private static final String RESOLUCAO = "Com o desconto de 20%, o preço passa a ser 80% de 150, isto é, 120 reais. "
            + "O acréscimo de 10% é calculado sobre esse novo valor: 120 vezes 1,1 resulta em 132 reais, que é o preço final.";
    private static final String EXPLICACAO = ("Aumentos e descontos percentuais sucessivos são calculados sempre sobre o valor "
            + "mais recente, e não sobre o valor original. Por isso eles são combinados por multiplicação dos fatores. ").repeat(5);
    private static final Verificacao CONTA_CERTA = new Verificacao("150 * 0.8 * 1.1", 132.0, "reais");

    private static AlternativaElaborada gabarito(double valor) {
        return new AlternativaElaborada(true, null, "R$ " + (int) valor + ",00", valor, "CERTA. Aplica os dois percentuais em sequência.");
    }

    private static AlternativaElaborada distrator(double valor, String erro) {
        return new AlternativaElaborada(false, erro, "R$ " + (int) valor + ",00", valor, "ERRADA. " + erro);
    }

    private static List<AlternativaElaborada> alternativasCertas() {
        return List.of(
                gabarito(132),
                distrator(135, "Somou os percentuais: 150 menos 10%."),
                distrator(120, "Esqueceu o acréscimo de 10%."),
                distrator(138, "Calculou o acréscimo sobre o preço original."),
                distrator(165, "Esqueceu o desconto de 20%."));
    }

    private static ItemElaborado item(String enunciado, List<AlternativaElaborada> alternativas, Verificacao verificacao) {
        return new ItemElaborado("Matemática", "C1", "H3", "Porcentagem",
                new TextoBase(List.of(TEXTO_BASE), null, null),
                enunciado, "numerica", verificacao, alternativas, RESOLUCAO, EXPLICACAO);
    }

    @Test
    @DisplayName("Um item bem formado passa sem bloqueios")
    void itemValidoPassa() {
        var resultado = VerificadorItem.verificar(item(ENUNCIADO, alternativasCertas(), CONTA_CERTA));

        assertThat(resultado.bloqueantes()).isEmpty();
        assertThat(resultado.valorCalculado()).isEqualTo(132.0);
    }

    @Test
    @DisplayName("Bloqueia item com duas alternativas marcadas como corretas")
    void bloqueiaDuasCorretas() {
        var alternativas = List.of(gabarito(132), gabarito(135),
                distrator(120, "a"), distrator(138, "b"), distrator(165, "c"));

        var resultado = VerificadorItem.verificar(item(ENUNCIADO, alternativas, CONTA_CERTA));

        assertThat(resultado.aprovado()).isFalse();
    }

    @Test
    @DisplayName("Bloqueia quando a conta declarada pelo modelo não fecha")
    void bloqueiaContaErrada() {
        var contaErrada = new Verificacao("150 * 0.8 * 1.1", 130.0, "reais");

        var resultado = VerificadorItem.verificar(item(ENUNCIADO, alternativasCertas(), contaErrada));

        assertThat(resultado.bloqueantes()).anyMatch(m -> m.contains("não fecha"));
    }

    @Test
    @DisplayName("Bloqueia quando o gabarito não é o resultado da conta")
    void bloqueiaGabaritoQueNaoBateComAConta() {
        var alternativas = List.of(gabarito(135),
                distrator(132, "a"), distrator(120, "b"), distrator(138, "c"), distrator(165, "d"));

        var resultado = VerificadorItem.verificar(item(ENUNCIADO, alternativas, CONTA_CERTA));

        assertThat(resultado.aprovado()).isFalse();
    }

    @Test
    @DisplayName("Bloqueia comando negativo, como o ENEM proíbe")
    void bloqueiaComandoNegativo() {
        var resultado = VerificadorItem.verificar(item("O preço que não corresponde ao valor final é", alternativasCertas(), CONTA_CERTA));

        assertThat(resultado.bloqueantes()).anyMatch(m -> m.contains("negativo"));
    }

    @Test
    @DisplayName("Bloqueia item que cita figura, porque o app só mostra texto e tabela")
    void bloqueiaReferenciaAFigura() {
        var resultado = VerificadorItem.verificar(item("Conforme a figura, o preço final, em reais, é", alternativasCertas(), CONTA_CERTA));

        assertThat(resultado.bloqueantes()).anyMatch(m -> m.contains("figura"));
    }

    @Test
    @DisplayName("Bloqueia menção à letra da alternativa, já que o sistema embaralha a ordem")
    void bloqueiaMencaoALetra() {
        var resultado = VerificadorItem.verificar(item(ENUNCIADO + " o valor da alternativa C", alternativasCertas(), CONTA_CERTA));

        assertThat(resultado.bloqueantes()).anyMatch(m -> m.contains("letra"));
    }
}
