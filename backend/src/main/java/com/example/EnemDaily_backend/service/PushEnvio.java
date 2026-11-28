package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.model.PushInscricao;
import com.example.EnemDaily_backend.repository.PushInscricaoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Monta e entrega notificações push, cuidando de inscrições vencidas e de falhas repetidas. */
@Component
public class PushEnvio {
    private static final Logger log = LoggerFactory.getLogger(PushEnvio.class);
    private static final int MAX_FALHAS = 5;

    private final PushInscricaoRepository inscricoes;
    private final WebPushService push;
    private final ObjectMapper json;

    public PushEnvio(PushInscricaoRepository inscricoes, WebPushService push, ObjectMapper json) {
        this.inscricoes = inscricoes;
        this.push = push;
        this.json = json;
    }

    public String payload(String titulo, String corpo, String tag, String url) {
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

    public boolean entregar(PushInscricao p, String corpo) {
        return entregar(p, corpo, 6 * 3600);
    }

    public boolean entregar(PushInscricao p, String corpo, int validadeSegundos) {
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
