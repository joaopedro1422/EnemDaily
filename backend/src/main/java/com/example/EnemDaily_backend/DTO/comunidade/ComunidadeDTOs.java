package com.example.EnemDaily_backend.DTO.comunidade;

import java.util.List;
import java.util.UUID;

public final class ComunidadeDTOs {
    private ComunidadeDTOs() {}

    public record UsuarioMini(UUID id, String nome, String usuario, String avatar) {}

    public record UsuarioComunidade(UUID id, String nome, String usuario, String avatar, int xpTotal, int sequencia,
                                    String relacao, boolean perfilPrivado) {}

    public record Placar(int vitorias, int derrotas, int empates) {}

    public record Duelo(UUID id, String dia, String status, boolean souDesafiante, UsuarioMini oponente,
                        int meuXp, int xpOponente, int meusAcertos, int acertosOponente,
                        int minhasRespostas, int respostasOponente, String resultado, boolean visto, String criadoEm) {}

    public record PerfilPublico(UUID id, String nome, String usuario, String avatar, int xpTotal, String emblemas,
                                int sequenciaAtual, int maiorSequencia, int diasAtivos, boolean podeVerCampus,
                                int acertosLinguagens, int acertosHumanas, int acertosNaturezas, int acertosExatas,
                                String relacao, UUID amizadeId, boolean perfilPrivado,
                                boolean podeDesafiar, String motivoSemDuelo, boolean podeDuelarHoje,
                                Placar placar, Duelo dueloAtivo, int duelosVencidos, int duelosDisputados) {}

    public record SolicitacaoAmizade(UUID id, UsuarioMini usuario, String criadaEm) {}

    public record Solicitacoes(List<SolicitacaoAmizade> amizadesRecebidas, List<SolicitacaoAmizade> amizadesEnviadas,
                               List<Duelo> duelosRecebidos, List<Duelo> duelosEnviados) {}

    public record Duelos(List<Duelo> recebidos, List<Duelo> enviados, List<Duelo> agendados, List<Duelo> historico, Placar geral) {}

    public record Notificacoes(long amizades, long duelos, List<Duelo> convites, List<Duelo> resultados, List<Duelo> hoje) {}

    public record NovoDuelo(String usuario, String dia) {}

    public record Privacidade(boolean perfilPrivado, boolean duelosSoAmigos) {}

    public record Disponibilidade(boolean hoje, String motivo, String primeiroDia) {}

    public record Mensagem(String mensagem) {}
}
