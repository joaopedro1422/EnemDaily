package com.example.EnemDaily_backend.DTO;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.QuestaoGen;
import com.fasterxml.jackson.annotation.JsonRawValue;

import java.util.List;

public final class ProvaDTOs {

    private ProvaDTOs() {}

    public record QuestaoProva(Long id, AreaEnum area, String disciplina, String assunto, String texto, String enunciado,
                               String linkImg, String fonte, @JsonRawValue String tabela, List<AlternativaProva> alternativas) {
        public static QuestaoProva de(QuestaoGen q) {
            return new QuestaoProva(q.getId(), q.getArea(), q.getDisciplina(), q.getAssunto(), q.getTexto(), q.getEnunciado(),
                    q.getLinkImg(), q.getFonte(), q.getTabela(),
                    q.getAlternativas().stream().map(a -> new AlternativaProva(a.getTexto())).toList());
        }
    }

    public record AlternativaProva(String texto) {}

    public record Responder(String area, Integer alternativa, int tempoGasto) {}

    public record Correcao(UsuarioResponseDTO usuario, boolean acerto, int xp, int xpBase, int bonusPct,
                           int indiceCorreto, QuestaoGen questao) {}

    public record Revisao(QuestaoGen questao, Integer alternativa, boolean acerto, int xp, int tempoGasto,
                          int indiceCorreto, String respondidaEm) {}
}
