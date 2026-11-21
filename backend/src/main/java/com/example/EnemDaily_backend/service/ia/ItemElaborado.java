package com.example.EnemDaily_backend.service.ia;

import java.util.List;
import java.util.Map;

public record ItemElaborado(
        String disciplina,
        String competencia,
        String habilidade,
        String conceitoChave,
        TextoBase textoBase,
        String enunciado,
        String tipoAlternativas,
        Verificacao verificacaoNumerica,
        List<AlternativaElaborada> alternativas,
        String resolucao,
        String explicacaoAssunto
) {
    public record TextoBase(List<String> paragrafos, Tabela tabela, String fonte) {}

    public record Tabela(String titulo, List<String> colunas, List<List<String>> linhas, String nota) {}

    public record Verificacao(String expressao, Double resultado, String unidade) {}

    public record AlternativaElaborada(boolean correta, String hipoteseDeErro, String texto, Double valorNumerico, String analise) {}

    public boolean numerica() {
        return "numerica".equals(tipoAlternativas);
    }

    public record Resolucao(String resolucao, List<Julgamento> alternativas, String letraEscolhida, double confianca,
                            Problemas problemas, String comentario) {
        public record Julgamento(String letra, String veredito, String motivo) {}

        public record Problemas(boolean maisDeUmaDefensavel, boolean nenhumaCorreta, boolean erroConceitualOuDeCalculo,
                                boolean dadosInsuficientes, boolean textoBaseDispensavel,
                                boolean respostaObviaSemConhecimento, boolean distratorAbsurdo) {}
    }

    public record Revisao(List<Problema> problemas, Map<String, Integer> notas, String veredito, String resumo) {
        public record Problema(String gravidade, String onde, String descricao, String comoCorrigir) {}
    }
}
