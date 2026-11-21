package com.example.EnemDaily_backend.service.ia;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

class AvaliadorExpressaoTest {

    @Test
    @DisplayName("Respeita a precedência: multiplicação antes da soma")
    void precedencia() {
        assertThat(AvaliadorExpressao.avaliar("2 + 3 * 4")).isEqualTo(14);
        assertThat(AvaliadorExpressao.avaliar("(2 + 3) * 4")).isEqualTo(20);
    }

    @Test
    @DisplayName("Calcula a conta de um desconto seguido de acréscimo")
    void contaDeDesconto() {
        assertThat(AvaliadorExpressao.avaliar("150 * 0.8 * 1.1")).isCloseTo(132, within(1e-9));
    }

    @Test
    @DisplayName("Entende potência, raiz, porcentagem e vírgula decimal")
    void notacoesDoModelo() {
        assertThat(AvaliadorExpressao.avaliar("2^3")).isEqualTo(8);
        assertThat(AvaliadorExpressao.avaliar("sqrt(81)")).isEqualTo(9);
        assertThat(AvaliadorExpressao.avaliar("200 * 15%")).isCloseTo(30, within(1e-9));
        assertThat(AvaliadorExpressao.avaliar("2,5 * 4")).isEqualTo(10);
    }

    @Test
    @DisplayName("Recusa contas inválidas em vez de devolver um número qualquer")
    void recusaContasInvalidas() {
        assertThatThrownBy(() -> AvaliadorExpressao.avaliar("10 / 0")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> AvaliadorExpressao.avaliar("seno(30)")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> AvaliadorExpressao.avaliar("2 +")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> AvaliadorExpressao.avaliar("1.250.000 * 2")).isInstanceOf(IllegalArgumentException.class);
    }
}
