package com.example.EnemDaily_backend.service.mentor;

import com.example.EnemDaily_backend.model.MentorPlano;
import com.example.EnemDaily_backend.model.PushInscricao;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.MentorPlanoRepository;
import com.example.EnemDaily_backend.repository.PushInscricaoRepository;
import com.example.EnemDaily_backend.service.PushEnvio;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Lembretes do "Meu mentor", só para quem tem o módulo liberado, um plano criado com lembretes ligados e
 * notificações ativas no aparelho. De manhã: o que está previsto hoje. À noite: um toque gentil se nada foi
 * marcado (e o aluno não disse que não ia conseguir).
 */
@Slf4j
@Service
public class MentorLembreteService {
    private final MentorPlanoRepository planos;
    private final PushInscricaoRepository inscricoes;
    private final PushEnvio envio;
    private final MentorService mentor;
    private final MentorAcesso acesso;

    public MentorLembreteService(MentorPlanoRepository planos, PushInscricaoRepository inscricoes, PushEnvio envio,
                                 MentorService mentor, MentorAcesso acesso) {
        this.planos = planos;
        this.inscricoes = inscricoes;
        this.envio = envio;
        this.mentor = mentor;
        this.acesso = acesso;
    }

    @Scheduled(cron = "0 0 7 * * *", zone = "America/Sao_Paulo")
    public void manha() {
        log.info("[Mentor] Lembrete da manhã: {} notificações enviadas", enviar(true));
    }

    @Scheduled(cron = "0 0 19 * * *", zone = "America/Sao_Paulo")
    public void noite() {
        log.info("[Mentor] Lembrete da noite: {} notificações enviadas", enviar(false));
    }

    int enviar(boolean manha) {
        Set<UUID> comPlano = planos.findAllByNotificacoesTrue().stream().map(MentorPlano::getUsuarioId).collect(Collectors.toSet());
        if (comPlano.isEmpty()) return 0;
        Map<UUID, List<PushInscricao>> porUsuario = inscricoes.todasAtivas().stream()
                .filter(p -> comPlano.contains(p.getUsuario().getId()))
                .collect(Collectors.groupingBy(p -> p.getUsuario().getId()));
        int enviados = 0;
        for (List<PushInscricao> aparelhos : porUsuario.values()) {
            Usuario u = aparelhos.get(0).getUsuario();
            if (!acesso.liberado(u)) continue;
            try {
                MentorService.ResumoDoDia r = mentor.resumoDoDia(u.getId()).orElse(null);
                if (r == null || r.vazio()) continue;
                String corpo;
                if (manha) {
                    corpo = envio.payload("Seu plano de hoje", textoDaManha(r), "mentor-dia", "/cronograma");
                } else {
                    if (r.feitasHoje() > 0 || r.abriuMao()) continue;
                    corpo = envio.payload("Ainda dá tempo hoje", textoDaNoite(r), "mentor-noite", "/cronograma");
                }
                for (PushInscricao p : aparelhos) if (envio.entregar(p, corpo, manha ? 12 * 3600 : 4 * 3600)) enviados++;
            } catch (RuntimeException e) {
                log.warn("[Mentor] Falha no lembrete de {}: {}", u.getId(), e.getMessage());
            }
        }
        return enviados;
    }

    /** "Estequiometria e Ecologia, mais 2 revisões." */
    static String textoDaManha(MentorService.ResumoDoDia r) {
        List<String> partes = new ArrayList<>(r.novos());
        if (r.revisoes() > 0) partes.add(r.revisoes() == 1 ? "1 revisão" : r.revisoes() + " revisões");
        if (r.redacao()) partes.add("a redação da semana");
        String lista = juntar(partes);
        if (r.novos().isEmpty()) return capitalizar(lista) + " te esperando.";
        return capitalizar(lista) + ".";
    }

    /** "Estequiometria te espera. Se hoje não der, o plano se ajusta." */
    static String textoDaNoite(MentorService.ResumoDoDia r) {
        String alvo = !r.novos().isEmpty() ? r.novos().get(0) + " te espera"
                : r.revisoes() > 0 ? (r.revisoes() == 1 ? "Sua revisão te espera" : "Suas revisões te esperam")
                : "A redação da semana te espera";
        return alvo + ". Se hoje não der, o plano se ajusta.";
    }

    private static String juntar(List<String> partes) {
        if (partes.isEmpty()) return "";
        if (partes.size() == 1) return partes.get(0);
        return String.join(", ", partes.subList(0, partes.size() - 1)) + " e " + partes.get(partes.size() - 1);
    }

    private static String capitalizar(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
