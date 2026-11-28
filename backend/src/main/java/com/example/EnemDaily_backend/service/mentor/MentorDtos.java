package com.example.EnemDaily_backend.service.mentor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** O que a tela "Meu mentor" recebe. */
public final class MentorDtos {
    private MentorDtos() {}

    /** Configuração enviada pelo aluno ao criar ou editar o plano. disponibilidade: minutos de segunda a domingo. */
    public record ConfigEntrada(LocalDate inicio, List<Integer> disponibilidade, List<String> foco, String lingua, Boolean aceite) {}

    public record Config(LocalDate inicio, List<Integer> disponibilidade, List<String> foco, String lingua, boolean notificacoes) {}

    /** peso: leve, medio ou extenso (nunca minutos: o aluno decide quanto tempo estuda). */
    public record AssuntoMini(long id, String nome, String area, String disciplina, String peso, String conteudo, boolean habilidade) {}

    /**
     * tipo: estudo, revisao, treino ou redacao. atrasoDias: revisão vencida há N dias. deOntem: estava no plano
     * de um dia anterior e voltou. feita: já marcada hoje.
     */
    public record Tarefa(String tipo, AssuntoMini assunto, int parte, int partes, int atrasoDias, boolean deOntem,
                         boolean feita, boolean revisaoFinal) {}

    /** feitas e planejadas por dia; planejadas é nulo em dias passados sem retrato salvo. */
    public record DiaMapa(LocalDate data, String fase, int feitas, Integer planejadas) {}

    public record DiaSemana(LocalDate data, String fase, int feitas, Integer planejadas, List<Tarefa> tarefas) {}

    public record Area(String area, int estudados, int noPlano, double cobertura) {}

    public record Proximo(AssuntoMini assunto, LocalDate data) {}

    /**
     * cobertura: fração das questões da prova que os assuntos estudados cobrem. coberturaPlano: a que o plano
     * inteiro cobre. bemVindo: dias sem marcar nada, quando o aluno volta depois de uma pausa.
     */
    public record Resumo(int noPlano, int estudados, int revisados, int foraDoPlano, double cobertura, double coberturaPlano,
                         LocalDate terminoPrevisto, long diasParaProva, int sequenciaDias, Integer bemVindo) {}

    public record Fases(LocalDate base, LocalDate aprofundamento, LocalDate retaFinal, String atual) {}

    public record Painel(boolean configurado, LocalDate hoje, LocalDate prova, boolean provaConfirmada,
                         Map<String, String> orientacao, Config config, Fases fases, Resumo resumo,
                         List<Tarefa> hojeTarefas, List<DiaSemana> semana, List<DiaMapa> mapa, List<Area> areas,
                         List<Proximo> proximos, List<AssuntoMini> fora, List<AssuntoMini> removidos,
                         int estudadosAntes) {}

    public record Flashcard(String pergunta, String resposta) {}

    public record Detalhe(AssuntoMini assunto, String comoCai, List<String> dominar, List<Flashcard> flashcards,
                          String nivel, double incidencia, String situacao, LocalDate estudadoEm, int revisoes,
                          LocalDate proximaRevisao, List<AssuntoMini> prerequisitos) {}
}
