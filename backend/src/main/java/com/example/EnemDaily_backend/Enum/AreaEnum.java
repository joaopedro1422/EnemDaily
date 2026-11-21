package com.example.EnemDaily_backend.Enum;

import com.example.EnemDaily_backend.model.Usuario;

public enum AreaEnum {
    NATUREZAS {
        @Override
        public void registraDados(Usuario usuario, int xp, int tempoGasto, boolean correta) {
            usuario.getNaturezas().registraDadosArea(xp, tempoGasto, correta);
            usuario.setNatRespondidaHj(true);
        }
    },

    HUMANAS {
        @Override
        public void registraDados(Usuario usuario, int xp, int tempoGasto, boolean correta) {
            usuario.getHumanas().registraDadosArea(xp, tempoGasto, correta);
            usuario.setHumRespondidaHj(true);
        }
    },

    EXATAS {
        @Override
        public void registraDados(Usuario usuario, int xp, int tempoGasto, boolean correta) {
            usuario.getExatas().registraDadosArea(xp, tempoGasto, correta);
            usuario.setExatRespondidaHj(true);
        }

    },

    LINGUAGENS {
        @Override
        public void registraDados(Usuario usuario, int xp, int tempoGasto, boolean correta) {
            usuario.getLinguagens().registraDadosArea(xp, tempoGasto, correta);
            usuario.setLingRespondidaHj(true);
        }
    };
    public static  AreaEnum parse(String area){
        if (area == null) return null;
        String formatado = area.trim()
                .toUpperCase()
                .replace("-", "_");

        try {
            return AreaEnum.valueOf(formatado);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Área do conhecimento inválida: " + area);
        }
    }

    public abstract void registraDados(Usuario usuario, int xp, int tempoGasto, boolean correta);
}
