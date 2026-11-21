package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.RankingDeltaEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class GrupoStreamService {
    private final Map<UUID, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final Map<UUID, AtomicLong> seqByGrupo = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID grupoId) {
        SseEmitter emitter = new SseEmitter(0L);

        emitters.computeIfAbsent(grupoId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        seqByGrupo.computeIfAbsent(grupoId, k -> new AtomicLong(0));

        emitter.onCompletion(() -> remove(grupoId, emitter));
        emitter.onTimeout(() -> remove(grupoId, emitter));
        emitter.onError(e -> remove(grupoId, emitter));

        return emitter;
    }

    private void remove(UUID grupoId, SseEmitter emitter) {
        var list = emitters.get(grupoId);
        if (list != null) list.remove(emitter);
    }

    public long nextSeq(UUID grupoId) {
        return seqByGrupo.computeIfAbsent(grupoId, k -> new AtomicLong(0)).incrementAndGet();
    }

    public void publishDelta(UUID grupoId, RankingDeltaEvent evt) {
        var list = emitters.getOrDefault(grupoId, new CopyOnWriteArrayList<>());

        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                        .name("ranking-delta")
                        .data(evt));
            } catch (Exception e) {
                remove(grupoId, emitter);
            }
        }
    }
}
