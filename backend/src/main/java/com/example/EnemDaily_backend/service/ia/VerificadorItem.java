package com.example.EnemDaily_backend.service.ia;

import com.example.EnemDaily_backend.service.ia.ItemElaborado.AlternativaElaborada;
import com.example.EnemDaily_backend.service.ia.ItemElaborado.Tabela;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public final class VerificadorItem {

    private VerificadorItem() {}

    public record Alerta(boolean bloqueante, String mensagem) {}

    public record Resultado(List<Alerta> alertas, Double valorCalculado) {
        public boolean aprovado() { return alertas.stream().noneMatch(Alerta::bloqueante); }
        public List<String> bloqueantes() { return alertas.stream().filter(Alerta::bloqueante).map(Alerta::mensagem).toList(); }
        public List<String> avisos() { return alertas.stream().filter(a -> !a.bloqueante()).map(Alerta::mensagem).toList(); }
    }

    private static final int F = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS;
    private static final Pattern NEGATIVO = Pattern.compile("\\b(não|exceto|incorret[ao]s?|fals[ao]s?|errad[ao]s?)\\b", F);
    private static final Pattern LETRA = Pattern.compile("\\b(alternativas?|opç(ão|ões)|opcao|letras?)\\s*\\(?(?-i:[A-E])\\)?(?![\\p{L}\\d])", F);
    private static final Pattern ANTERIORES = Pattern.compile("\\b(todas|nenhuma)\\s+(as|das)\\s+(anteriores|alternativas|opções)\\b", F);
    private static final Pattern ABSOLUTO = Pattern.compile("\\b(somente|apenas|nunca|jamais|sempre|exclusivamente|unicamente)\\b", F);
    private static final Pattern FIGURA = Pattern.compile("((conforme|segundo|observe|veja|como mostra|mostrad[ao] n)\\s*(a|o|na|no)?\\s*(figura|imagem|ilustração|gráfico|charge|tirinha|mapa))|((figura|imagem|ilustração|gráfico|charge|tirinha|mapa)\\s+(a seguir|abaixo|acima|ao lado))", F);
    private static final Pattern TAG = Pattern.compile("<[^>]*>");
    private static final Pattern APROXIMACAO = Pattern.compile("aproximad|mais próxim|próximo de|estimad", F);

    public static Resultado verificar(ItemElaborado item) {
        List<Alerta> a = new ArrayList<>();
        Double calculado = null;
        List<AlternativaElaborada> alts = item.alternativas() == null ? List.of() : item.alternativas();

        if (alts.size() != 5) a.add(erro("O item tem " + alts.size() + " alternativas; precisa ter exatamente 5."));
        long corretas = alts.stream().filter(AlternativaElaborada::correta).count();
        if (corretas != 1) a.add(erro("O item marca " + corretas + " alternativas como corretas; precisa ser exatamente 1."));

        Set<String> vistos = new HashSet<>();
        for (AlternativaElaborada alt : alts) {
            String t = normalizar(alt.texto());
            if (t.isBlank()) a.add(erro("Há alternativa sem texto."));
            else if (!vistos.add(t)) a.add(erro("Há alternativas repetidas: \"" + texto(alt.texto()) + "\"."));
            if (!alt.correta() && vazio(alt.hipoteseDeErro())) a.add(erro("O distrator \"" + resumo(alt.texto()) + "\" está sem hipótese de erro."));
            String analise = texto(alt.analise()).trim().toUpperCase(Locale.ROOT);
            if (alt.correta() && analise.startsWith("ERRADA")) a.add(erro("A análise do gabarito começa com ERRADA."));
            if (!alt.correta() && analise.startsWith("CERTA")) a.add(erro("A análise do distrator \"" + resumo(alt.texto()) + "\" começa com CERTA."));
            if (vazio(alt.analise())) a.add(erro("A alternativa \"" + resumo(alt.texto()) + "\" está sem análise."));
            if (ANTERIORES.matcher(texto(alt.texto())).find()) a.add(erro("Alternativa do tipo \"todas/nenhuma das anteriores\" é proibida."));
        }

        String enunciado = texto(item.enunciado());
        if (enunciado.isBlank()) a.add(erro("O enunciado está vazio."));
        var neg = NEGATIVO.matcher(enunciado);
        if (neg.find()) a.add(erro("O enunciado usa o termo negativo \"" + neg.group() + "\". O comando precisa ser positivo."));

        String textoBase = item.textoBase() == null || item.textoBase().paragrafos() == null ? ""
                : item.textoBase().paragrafos().stream().map(VerificadorItem::texto).collect(Collectors.joining("\n"));
        Tabela tabela = item.textoBase() == null ? null : item.textoBase().tabela();
        int palavras = contarPalavras(textoBase);
        int minimo = tabela != null ? 15 : 25;
        if (palavras < minimo) a.add(erro("O texto-base tem só " + palavras + " palavras; um item do ENEM precisa de uma situação-estímulo de verdade."));
        if (palavras > 330) a.add(aviso("O texto-base tem " + palavras + " palavras, acima do habitual."));
        if (FIGURA.matcher(textoBase + "\n" + enunciado).find()) a.add(erro("O item faz referência a figura, imagem, gráfico ou mapa, mas só pode usar texto e tabela."));
        if (tabela != null) verificarTabela(tabela, a);

        String fonte = item.textoBase() == null ? null : item.textoBase().fonte();
        if (fonte != null && fonte.toLowerCase(Locale.ROOT).contains("disponível em")) {
            a.add(aviso("A fonte cita um endereço da internet (\"" + fonte + "\"). Confira se a fonte é real, de domínio público ou oficial; se houver dúvida, ela deve ser removida."));
        }

        String pedagogico = String.join("\n", texto(item.resolucao()), texto(item.explicacaoAssunto()),
                alts.stream().map(x -> texto(x.analise())).collect(Collectors.joining("\n")));
        String todasAlts = alts.stream().map(x -> texto(x.texto())).collect(Collectors.joining("\n"));
        var letra = LETRA.matcher(enunciado + "\n" + todasAlts + "\n" + pedagogico);
        if (letra.find()) a.add(erro("O item menciona a letra de uma alternativa (\"" + letra.group().trim() + "\"). A ordem é definida pelo sistema: refira-se às alternativas pelo conteúdo."));

        if (contarPalavras(texto(item.explicacaoAssunto())) < 80) a.add(erro("A explicação do assunto está curta demais (mínimo de 120 palavras)."));
        if (contarPalavras(texto(item.resolucao())) < 25) a.add(erro("A resolução está curta demais."));

        AlternativaElaborada gabarito = alts.stream().filter(AlternativaElaborada::correta).findFirst().orElse(null);
        List<AlternativaElaborada> distratores = alts.stream().filter(x -> !x.correta()).toList();

        if (item.numerica()) {
            if (alts.stream().anyMatch(x -> x.valorNumerico() == null)) a.add(erro("Alternativas numéricas precisam de valor_numerico em todas."));
            else if (alts.stream().map(AlternativaElaborada::valorNumerico).distinct().count() != alts.size()) a.add(erro("Há alternativas numéricas com o mesmo valor."));
            if (item.verificacaoNumerica() == null) a.add(erro("Item numérico sem verificacao_numerica."));
        } else if (gabarito != null && distratores.size() == 4) {
            double media = distratores.stream().mapToInt(x -> texto(x.texto()).length()).average().orElse(1);
            int tamGab = texto(gabarito.texto()).length();
            boolean maisLongo = distratores.stream().allMatch(x -> texto(x.texto()).length() < tamGab);
            if (maisLongo && tamGab > media * 1.4) a.add(erro("O gabarito é a alternativa mais longa, com " + Math.round(100 * tamGab / media) + "% da extensão média dos distratores. Isso entrega a resposta: equilibre a extensão."));
            else if (maisLongo && tamGab > media * 1.2) a.add(aviso("O gabarito é a alternativa mais longa (" + Math.round(100 * tamGab / media) + "% da média dos distratores)."));
            boolean absolutoSoNosDistratores = distratores.stream().anyMatch(x -> ABSOLUTO.matcher(texto(x.texto())).find())
                    && !ABSOLUTO.matcher(texto(gabarito.texto())).find();
            if (absolutoSoNosDistratores) a.add(aviso("Há distratores com termos totalizantes ou restritivos (somente, apenas, nunca, sempre...) que o gabarito não tem."));
        }

        if (item.verificacaoNumerica() != null) {
            var v = item.verificacaoNumerica();
            try {
                calculado = AvaliadorExpressao.avaliar(v.expressao());
                if (v.resultado() == null || !iguais(calculado, v.resultado())) {
                    a.add(erro("A verificação numérica não fecha: \"" + v.expressao() + "\" dá " + formatar(calculado) + ", mas o resultado declarado é " + formatar(v.resultado()) + ". Refaça as contas."));
                }
                if (item.numerica() && gabarito != null && gabarito.valorNumerico() != null) {
                    boolean aproximado = APROXIMACAO.matcher(enunciado).find();
                    if (!compativel(calculado, gabarito.valorNumerico(), aproximado)) {
                        a.add(erro("O valor do gabarito (" + formatar(gabarito.valorNumerico()) + ") não corresponde à conta de verificação (\"" + v.expressao() + "\" = " + formatar(calculado) + "). Refaça a resolução do zero."));
                    }
                    for (AlternativaElaborada d : distratores) {
                        if (d.valorNumerico() != null && compativel(calculado, d.valorNumerico(), false)) {
                            a.add(erro("O distrator \"" + resumo(d.texto()) + "\" tem o mesmo valor que a conta correta."));
                        }
                    }
                }
            } catch (IllegalArgumentException e) {
                a.add(erro("A expressão de verificação \"" + v.expressao() + "\" não pôde ser calculada: " + e.getMessage() + "."));
            }
        }
        return new Resultado(a, calculado);
    }

    private static void verificarTabela(Tabela t, List<Alerta> a) {
        int colunas = t.colunas() == null ? 0 : t.colunas().size();
        if (colunas == 0) { a.add(erro("A tabela está sem colunas.")); return; }
        if (t.linhas() == null || t.linhas().isEmpty()) { a.add(erro("A tabela está sem linhas.")); return; }
        for (List<String> linha : t.linhas()) {
            if (linha == null || linha.size() != colunas) { a.add(erro("Toda linha da tabela precisa ter " + colunas + " células.")); return; }
        }
    }

    static boolean iguais(double a, double b) {
        return Math.abs(a - b) <= Math.max(1e-9, 1e-6 * Math.max(Math.abs(a), Math.abs(b)));
    }

    static boolean compativel(double calculado, double gabarito, boolean aproximado) {
        if (iguais(calculado, gabarito)) return true;
        int casas = Math.max(0, BigDecimal.valueOf(gabarito).stripTrailingZeros().scale());
        double arredondado = BigDecimal.valueOf(calculado).setScale(casas, java.math.RoundingMode.HALF_UP).doubleValue();
        if (iguais(arredondado, gabarito)) return true;
        return aproximado && Math.abs(calculado - gabarito) <= 0.02 * Math.abs(gabarito);
    }

    public static String texto(String html) {
        if (html == null) return "";
        return TAG.matcher(html).replaceAll(" ").replace("&nbsp;", " ").replaceAll("[ \\t]+", " ").trim();
    }

    private static String normalizar(String s) {
        String t = Normalizer.normalize(texto(s).toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return t.replaceAll("[^\\p{L}\\p{N}]+", " ").trim();
    }

    private static int contarPalavras(String s) {
        String t = s == null ? "" : s.trim();
        return t.isEmpty() ? 0 : t.split("\\s+").length;
    }

    private static String resumo(String s) {
        String t = texto(s);
        return t.length() > 70 ? t.substring(0, 67) + "..." : t;
    }

    static String formatar(Double v) {
        if (v == null) return "nulo";
        return BigDecimal.valueOf(v).stripTrailingZeros().toPlainString();
    }

    private static boolean vazio(String s) {
        return s == null || texto(s).isBlank();
    }

    private static Alerta erro(String m) { return new Alerta(true, m); }

    private static Alerta aviso(String m) { return new Alerta(false, m); }
}
