package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.Event;
import com.example.EnemDaily_backend.model.Simulado;
import com.example.EnemDaily_backend.repository.EventRepository;
import com.example.EnemDaily_backend.repository.SimuladoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.function.ToIntFunction;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecomendacaoService {

    private static final int DIAS = 5;

    private final EventRepository eventRepository;
    private final SimuladoRepository simuladoRepository;

    public record Assunto(String nome, String area, int erros, int total) {}
    public record Recomendacao(String modo, String area, List<Assunto> assuntos) {}

    public Recomendacao recomendar(UUID idUsuario) {
        List<Event> recentes = eventRepository.findByIdUsuarioAndDataGreaterThanEqual(idUsuario, LocalDate.now().minusDays(DIAS - 1).atStartOfDay());
        Map<String, int[]> porAssunto = new LinkedHashMap<>();
        Map<String, String> areaDoAssunto = new HashMap<>();
        Map<String, Integer> errosPorArea = new HashMap<>();
        for (Event e : recentes) {
            Map<String, Object> c = e.getJsonContext();
            if (c == null || c.get("area") == null || c.get("assunto") == null) continue;
            String area = String.valueOf(c.get("area")), assunto = String.valueOf(c.get("assunto"));
            boolean erro = !Boolean.TRUE.equals(c.get("acerto"));
            int[] n = porAssunto.computeIfAbsent(assunto, k -> new int[2]);
            n[1]++;
            if (erro) { n[0]++; errosPorArea.merge(area, 1, Integer::sum); }
            areaDoAssunto.put(assunto, area);
        }

        String areaSimulado = piorAreaNosSimulados(idUsuario);
        if (areaSimulado != null) {
            List<Assunto> lista = ranquear(porAssunto, areaDoAssunto, areaSimulado);
            if (!lista.isEmpty()) return new Recomendacao("simulados", areaSimulado, lista);
        }
        if (porAssunto.isEmpty()) return new Recomendacao("vazio", null, List.of());
        if (errosPorArea.isEmpty()) return new Recomendacao("positivo", null, List.of());
        String piorArea = Collections.max(errosPorArea.entrySet(), Map.Entry.comparingByValue()).getKey();
        return new Recomendacao("recente", piorArea, ranquear(porAssunto, areaDoAssunto, piorArea));
    }

    private List<Assunto> ranquear(Map<String, int[]> porAssunto, Map<String, String> areaDoAssunto, String area) {
        return porAssunto.entrySet().stream()
                .filter(e -> e.getValue()[0] > 0 && area.equals(areaDoAssunto.get(e.getKey())))
                .sorted(Comparator.<Map.Entry<String, int[]>>comparingInt(e -> -e.getValue()[0])
                        .thenComparingDouble(e -> (double) (e.getValue()[1] - e.getValue()[0]) / e.getValue()[1]))
                .limit(3)
                .map(e -> new Assunto(e.getKey(), area, e.getValue()[0], e.getValue()[1]))
                .collect(Collectors.toList());
    }

    private String piorAreaNosSimulados(UUID idUsuario) {
        List<Simulado> sims = simuladoRepository.findAllByIdUsuario(idUsuario);
        List<Simulado> d1 = sims.stream().filter(s -> s.getDia() == 1).toList();
        List<Simulado> d2 = sims.stream().filter(s -> s.getDia() == 2).toList();
        if (d1.size() < 2 || d2.size() < 2) return null;
        Map<AreaEnum, Double> medias = new EnumMap<>(AreaEnum.class);
        medias.put(AreaEnum.LINGUAGENS, media(d1, Simulado::getLinguagens));
        medias.put(AreaEnum.HUMANAS, media(d1, Simulado::getHumanas));
        medias.put(AreaEnum.NATUREZAS, media(d2, Simulado::getNaturezas));
        medias.put(AreaEnum.EXATAS, media(d2, Simulado::getExatas));
        return Collections.min(medias.entrySet(), Map.Entry.comparingByValue()).getKey().name();
    }

    private static double media(List<Simulado> lista, ToIntFunction<Simulado> campo) {
        return lista.stream().mapToInt(campo).average().orElse(0);
    }
}
