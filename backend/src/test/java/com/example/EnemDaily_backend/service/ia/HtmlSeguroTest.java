package com.example.EnemDaily_backend.service.ia;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HtmlSeguroTest {

    @Test
    @DisplayName("Mantém as marcações permitidas no item")
    void mantemPermitidas() {
        assertThat(HtmlSeguro.limpar("H<sub>2</sub>O e <i>Homo sapiens</i>", HtmlSeguro.ITEM))
                .isEqualTo("H<sub>2</sub>O e <i>Homo sapiens</i>");
    }

    @Test
    @DisplayName("Remove scripts que o modelo (ou alguém) colocar no texto")
    void removeScript() {
        assertThat(HtmlSeguro.limpar("Texto<script>alert('x')</script> final", HtmlSeguro.ITEM))
                .isEqualTo("Texto final");
    }

    @Test
    @DisplayName("Tira atributos perigosos, como onclick, das tags permitidas")
    void tiraAtributos() {
        assertThat(HtmlSeguro.limpar("<b onclick=\"roubar()\">importante</b>", HtmlSeguro.ITEM))
                .isEqualTo("<b>importante</b>");
    }

    @Test
    @DisplayName("Descarta tags fora da lista e escapa o sinal de menor solto")
    void descartaTagsNaoPermitidas() {
        assertThat(HtmlSeguro.limpar("<p>x < 3</p>", HtmlSeguro.ITEM)).isEqualTo("x &lt; 3");
    }
}
