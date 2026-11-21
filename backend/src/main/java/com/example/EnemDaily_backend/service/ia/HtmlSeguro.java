package com.example.EnemDaily_backend.service.ia;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class HtmlSeguro {

    public static final Set<String> PEDAGOGICO = Set.of("p", "b", "strong", "i", "em", "ul", "ol", "li", "sub", "sup", "br");
    public static final Set<String> CONTEUDO = Set.of("p", "h3", "b", "strong", "i", "em", "ul", "ol", "li", "sub", "sup", "br");
    public static final Set<String> ITEM = Set.of("b", "strong", "i", "em", "sub", "sup", "br");

    private static final Pattern PERIGOSAS = Pattern.compile("<(script|style|iframe|object)\\b[^>]*>.*?</\\1\\s*>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern TAG =Pattern.compile("<\\s*(/?)\\s*([a-zA-Z][a-zA-Z0-9]*)\\b[^<>]*>");

    private HtmlSeguro() {}

    public static String limpar(String s, Set<String> permitidas) {
        if (s == null) return null;
        s = PERIGOSAS.matcher(s).replaceAll("");
        StringBuilder out = new StringBuilder(s.length());
        Matcher m = TAG.matcher(s);
        int i = 0;
        while (i < s.length()) {
            char c = s.charAt(i);
            if (c == '<') {
                m.region(i, s.length());
                if (m.lookingAt()) {
                    String nome = m.group(2).toLowerCase(Locale.ROOT);
                    if (permitidas.contains(nome)) out.append(nome.equals("br") ? "<br>" : "<" + m.group(1) + nome + ">");
                    i = m.end();
                    continue;
                }
                out.append("&lt;");
            } else {
                out.append(c);
            }
            i++;
        }
        return out.toString().trim();
    }
}
