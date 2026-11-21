package com.example.EnemDaily_backend.service.ia;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class StatusGeracao {

    public record Estado(AreaEnum area, LocalDate dia, String etapa, boolean emAndamento, Boolean sucesso,
                         double custoUsd, LocalDateTime inicio, LocalDateTime atualizado, List<String> historico) {}

    private final Map<AreaEnum, Estado> estados = new ConcurrentHashMap<>();

    public synchronized boolean iniciar(AreaEnum area, LocalDate dia) {
        Estado atual = estados.get(area);
        if (atual != null && atual.emAndamento()) return false;
        LocalDateTime agora = LocalDateTime.now();
        estados.put(area, new Estado(area, dia, "Iniciando", true, null, 0, agora, agora, new ArrayList<>(List.of(hora() + " Início da geração para " + dia))));
        return true;
    }

    public synchronized void etapa(AreaEnum area, String etapa, double custoAcumulado) {
        Estado e = estados.get(area);
        if (e == null) return;
        List<String> h = new ArrayList<>(e.historico());
        h.add(hora() + " " + etapa);
        if (h.size() > 40) h.remove(0);
        estados.put(area, new Estado(area, e.dia(), etapa, true, null, custoAcumulado, e.inicio(), LocalDateTime.now(), h));
    }

    public synchronized void concluir(AreaEnum area, boolean sucesso, String mensagem, double custo) {
        Estado e = estados.get(area);
        if (e == null) return;
        List<String> h = new ArrayList<>(e.historico());
        h.add(hora() + " " + mensagem);
        estados.put(area, new Estado(area, e.dia(), mensagem, false, sucesso, custo, e.inicio(), LocalDateTime.now(), h));
    }

    public Map<AreaEnum, Estado> todos() {
        return Map.copyOf(estados);
    }

    private static String hora() {
        return LocalDateTime.now().toLocalTime().withNano(0).toString();
    }
}
