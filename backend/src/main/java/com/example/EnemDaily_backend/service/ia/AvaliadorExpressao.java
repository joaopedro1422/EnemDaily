package com.example.EnemDaily_backend.service.ia;

public final class AvaliadorExpressao {

    private final String s;
    private int pos;

    private AvaliadorExpressao(String expressao) {
        this.s = expressao
                .replace('×', '*').replace('·', '*').replace('÷', '/').replace('−', '-')
                .replace("√", "sqrt").replace("π", "pi")
                .replaceAll("\\s+", "")
                .toLowerCase();
    }

    public static double avaliar(String expressao) {
        if (expressao == null || expressao.isBlank()) throw new IllegalArgumentException("expressão vazia");
        AvaliadorExpressao a = new AvaliadorExpressao(expressao);
        double v = a.soma();
        if (a.pos != a.s.length()) throw new IllegalArgumentException("símbolo inesperado em '" + a.s.substring(a.pos) + "'");
        if (Double.isNaN(v) || Double.isInfinite(v)) throw new IllegalArgumentException("resultado indefinido");
        return v;
    }

    private double soma() {
        double v = produto();
        while (pos < s.length()) {
            char c = s.charAt(pos);
            if (c == '+') { pos++; v += produto(); }
            else if (c == '-') { pos++; v -= produto(); }
            else break;
        }
        return v;
    }

    private double produto() {
        double v = unario();
        while (pos < s.length()) {
            char c = s.charAt(pos);
            if (c == '*') { pos++; v *= unario(); }
            else if (c == '/') {
                pos++;
                double d = unario();
                if (d == 0) throw new IllegalArgumentException("divisão por zero");
                v /= d;
            } else break;
        }
        return v;
    }

    private double unario() {
        if (pos < s.length() && s.charAt(pos) == '-') { pos++; return -unario(); }
        if (pos < s.length() && s.charAt(pos) == '+') { pos++; return unario(); }
        return potencia();
    }

    private double potencia() {
        double base = primario();
        if (pos < s.length() && (s.charAt(pos) == '^' || s.startsWith("**", pos))) {
            pos += s.charAt(pos) == '^' ? 1 : 2;
            return Math.pow(base, unario());
        }
        return base;
    }

    private double primario() {
        if (pos >= s.length()) throw new IllegalArgumentException("expressão incompleta");
        char c = s.charAt(pos);
        if (c == '(') {
            pos++;
            double v = soma();
            esperar(')');
            return v;
        }
        if (Character.isDigit(c) || c == '.' || c == ',') return numero();
        if (Character.isLetter(c)) {
            int ini = pos;
            while (pos < s.length() && Character.isLetter(s.charAt(pos))) pos++;
            String nome = s.substring(ini, pos);
            if (nome.equals("pi")) return Math.PI;
            esperar('(');
            double arg = soma();
            esperar(')');
            return switch (nome) {
                case "sqrt", "raiz" -> {
                    if (arg < 0) throw new IllegalArgumentException("raiz de número negativo");
                    yield Math.sqrt(arg);
                }
                case "cbrt" -> Math.cbrt(arg);
                case "abs" -> Math.abs(arg);
                case "log", "log10" -> Math.log10(arg);
                case "ln" -> Math.log(arg);
                default -> throw new IllegalArgumentException("função desconhecida '" + nome + "'");
            };
        }
        throw new IllegalArgumentException("símbolo inesperado '" + c + "'");
    }

    private double numero() {
        int ini = pos;
        while (pos < s.length() && (Character.isDigit(s.charAt(pos)) || s.charAt(pos) == '.' || s.charAt(pos) == ',')) pos++;
        String n = s.substring(ini, pos).replace(',', '.');
        if (n.chars().filter(ch -> ch == '.').count() > 1) throw new IllegalArgumentException("número mal formado '" + n + "' (use ponto decimal, sem separador de milhar)");
        if (pos < s.length() && s.charAt(pos) == '%') { pos++; return Double.parseDouble(n) / 100d; }
        return Double.parseDouble(n);
    }

    private void esperar(char c) {
        if (pos >= s.length() || s.charAt(pos) != c) throw new IllegalArgumentException("esperava '" + c + "'");
        pos++;
    }
}
