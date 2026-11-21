package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.StatusDuelo;
import com.example.EnemDaily_backend.model.Duelo;
import com.example.EnemDaily_backend.model.PushInscricao;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.DueloRepository;
import com.example.EnemDaily_backend.repository.EventRepository;
import com.example.EnemDaily_backend.repository.PushInscricaoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LembreteService {
    private static final Logger log = LoggerFactory.getLogger(LembreteService.class);
    private static final int QUESTOES_POR_DIA = 4;
    private static final int MAX_FALHAS = 5;

    private final PushInscricaoRepository inscricoes;
    private final WebPushService push;
    private final EventRepository eventRepository;
    private final DueloRepository dueloRepository;
    private final ObjectMapper json;

    public LembreteService(PushInscricaoRepository inscricoes, WebPushService push, EventRepository eventRepository,
                           DueloRepository dueloRepository, ObjectMapper json) {
        this.inscricoes = inscricoes;
        this.push = push;
        this.eventRepository = eventRepository;
        this.dueloRepository = dueloRepository;
        this.json = json;
    }

    @Scheduled(cron = "0 0 10 * * *", zone = "America/Sao_Paulo")
    public void lembreteDas10() {
        int enviados = enviarLembretes();
        log.info("Lembrete das 10h: {} notificações enviadas", enviados);
    }

    @Scheduled(cron = "0 0 20 * * *", zone = "America/Sao_Paulo")
    public void lembreteDaNoite() {
        int enviados = enviarLembretesDaNoite();
        log.info("Lembrete da noite: {} notificações enviadas", enviados);
    }

    @Transactional
    public int enviarLembretesDaNoite() {
        LocalDate hoje = LocalDate.now();
        ZonedDateTime agora = ZonedDateTime.now(ZoneId.of("America/Sao_Paulo"));
        long horas = Math.max(1, Duration.between(agora, agora.toLocalDate().plusDays(1).atStartOfDay(agora.getZone())).toMinutes() / 60);
        String faltam = "Faltam " + horas + (horas == 1 ? " hora" : " horas") + " para o dia acabar.";
        Map<UUID, List<PushInscricao>> porUsuario = inscricoes.todasAtivas().stream().collect(Collectors.groupingBy(p -> p.getUsuario().getId()));
        int enviados = 0;
        for (List<PushInscricao> aparelhos : porUsuario.values()) {
            Usuario u = aparelhos.get(0).getUsuario();
            if (eventRepository.respostasNoPeriodo(u.getId(), hoje.atStartOfDay(), hoje.plusDays(1).atStartOfDay()) > 0) continue;
            int sequencia = eventRepository.sequenciaAtualDiasAtivos(u.getId());
            String corpo = sequencia >= 2
                    ? payload("Não perca a sua sequência de " + sequencia + " dias 🔥", faltam + " Responda ao menos uma questão para mantê-la.", "lembrete-noite", "/Home")
                    : payload("O desafio de hoje ainda te espera", faltam + " São só 4 questões.", "lembrete-noite", "/Home");
            for (PushInscricao p : aparelhos) if (entregar(p, corpo, (int) Math.max(600, horas * 3600))) enviados++;
        }
        return enviados;
    }

    @Transactional
    public int enviarLembretes() {
        LocalDate hoje = LocalDate.now();
        Map<UUID, List<PushInscricao>> porUsuario = inscricoes.todasAtivas().stream().collect(Collectors.groupingBy(p -> p.getUsuario().getId()));
        int enviados = 0;
        for (List<PushInscricao> aparelhos : porUsuario.values()) {
            Usuario u = aparelhos.get(0).getUsuario();
            long feitas = eventRepository.respostasNoPeriodo(u.getId(), hoje.atStartOfDay(), hoje.plusDays(1).atStartOfDay());
            if (feitas >= QUESTOES_POR_DIA) continue;
            String corpo = mensagemDoDia(u, (int) feitas, hoje);
            for (PushInscricao p : aparelhos) if (entregar(p, corpo)) enviados++;
        }
        return enviados;
    }

    @Transactional
    public int enviarTeste(Usuario u) {
        String corpo = payload("Lembretes ativados", "Todo dia às 10h a gente avisa quando o desafio do dia estiver te esperando.", "lembrete-ativado", "/Home");
        int ok = 0;
        for (PushInscricao p : inscricoes.findAllByUsuario(u)) if (entregar(p, corpo)) ok++;
        return ok;
    }

    private String mensagemDoDia(Usuario u, int feitas, LocalDate hoje) {
        String duelo = dueloDeHoje(u, hoje);
        if (feitas == 0) {
            int sequencia = eventRepository.sequenciaAtualDiasAtivos(u.getId());
            String corpo = duelo != null ? "Seu duelo com " + duelo + " vale hoje. 4 questões te esperando."
                    : sequencia >= 2 ? "Sua sequência de " + sequencia + " dias continua hoje. São só 4 questões."
                    : "São só 4 questões. Responda e continue construindo seu campus.";
            return payload("O desafio de hoje está no ar", corpo, "desafio-diario", "/Home");
        }
        int faltam = QUESTOES_POR_DIA - feitas;
        String corpo = "Você respondeu " + feitas + " de 4. Falta" + (faltam == 1 ? " 1 questão" : "m " + faltam + " questões") + " para completar o dia"
                + (duelo != null ? " e garantir o duelo com " + duelo + "." : ".");
        return payload("Falta pouco para fechar o dia", corpo, "desafio-diario", "/Home");
    }

    private String dueloDeHoje(Usuario u, LocalDate hoje) {
        return dueloRepository.doUsuario(u, EnumSet.of(StatusDuelo.AGENDADO)).stream()
                .filter(d -> d.getDia().equals(hoje)).findFirst()
                .map(d -> "@" + (d.getDesafiante().getId().equals(u.getId()) ? d.getDesafiado() : d.getDesafiante()).getUsuario())
                .orElse(null);
    }

    private String payload(String titulo, String corpo, String tag, String url) {
        Map<String, Object> clique = Map.of("default", Map.of("operation", "navigateLastFocusedOrOpen", "url", url));
        Map<String, Object> n = new LinkedHashMap<>();
        n.put("title", titulo);
        n.put("body", corpo);
        n.put("icon", "/icons/icon-192x192.png");
        n.put("badge", "/icons/badge-96x96.png");
        n.put("tag", tag);
        n.put("renotify", true);
        n.put("lang", "pt-BR");
        n.put("vibrate", List.of(80, 40, 80));
        n.put("data", Map.of("onActionClick", clique, "url", url));
        try { return json.writeValueAsString(Map.of("notification", n)); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }

    private boolean entregar(PushInscricao p, String corpo) {
        return entregar(p, corpo, 6 * 3600);
    }

    private boolean entregar(PushInscricao p, String corpo, int validadeSegundos) {
        try {
            int status = push.enviar(p.getEndpoint(), p.getP256dh(), p.getAuth(), corpo, validadeSegundos);
            if (status == 404 || status == 410) { inscricoes.delete(p); return false; }
            if (status >= 200 && status < 300) {
                p.setUltimoEnvio(LocalDateTime.now());
                p.setFalhas(0);
                inscricoes.save(p);
                return true;
            }
            log.warn("Push recusado ({}) para {}", status, p.getEndpoint());
        } catch (Exception e) {
            log.warn("Falha ao enviar push: {}", e.getMessage());
        }
        p.setFalhas(p.getFalhas() + 1);
        if (p.getFalhas() >= MAX_FALHAS) inscricoes.delete(p); else inscricoes.save(p);
        return false;
    }
}
