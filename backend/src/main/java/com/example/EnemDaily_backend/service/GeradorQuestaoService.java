package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.QuestaoGen;
import com.example.EnemDaily_backend.repository.QuestaoGenRepository;
import com.example.EnemDaily_backend.service.ia.ConfigIa;
import com.example.EnemDaily_backend.service.ia.StatusGeracao;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

@Service
@Slf4j
public class GeradorQuestaoService {

    private final QuestaoGenRepository questaoGenRepository;
    private final ElaboracaoQuestaoService elaboracao;
    private final StatusGeracao status;
    private final Semaphore vagas;
    private final ExecutorService fila = Executors.newVirtualThreadPerTaskExecutor();

    @Value("${enemdaily.geracao.agendada:true}")
    private boolean agendada;

    @Value("${enemdaily.questao.data-fixa:}")
    private String dataFixa;

    public GeradorQuestaoService(QuestaoGenRepository questaoGenRepository, ElaboracaoQuestaoService elaboracao,
                                 StatusGeracao status, ConfigIa config) {
        this.questaoGenRepository = questaoGenRepository;
        this.elaboracao = elaboracao;
        this.status = status;
        this.vagas = new Semaphore(Math.max(1, config.getAreasEmParalelo()));
    }

    // @Scheduled(cron = "0 0 20 * * *", zone = "America/Sao_Paulo")
    public void gerarParaAmanha() {
        if (agendada) disparar(LocalDate.now().plusDays(1), EnumSet.allOf(AreaEnum.class), false);
    }

    // @Scheduled(cron = "0 5 0 * * *", zone = "America/Sao_Paulo")
    public void completarHoje() {
        if (agendada) disparar(LocalDate.now(), EnumSet.allOf(AreaEnum.class), false);
    }

    public List<AreaEnum> disparar(LocalDate dia, Set<AreaEnum> areas, boolean substituir) {
        List<AreaEnum> iniciadas = new ArrayList<>();
        for (AreaEnum area : areas) {
            if (!substituir && existe(area, dia)) continue;
            if (!status.iniciar(area, dia)) continue;
            iniciadas.add(area);
            fila.submit(() -> executar(area, dia, substituir));
        }
        if (!iniciadas.isEmpty()) log.info("[Questões] Geração disparada para {}: {}", dia, iniciadas);
        return iniciadas;
    }

    private void executar(AreaEnum area, LocalDate dia, boolean substituir) {
        try {
            vagas.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            status.concluir(area, false, "Interrompida", 0);
            return;
        }
        try {
            var r = elaboracao.gerar(area, dia, substituir);
            status.concluir(area, true, (r.comRessalvas() ? "Publicada com ressalvas" : "Publicada") + " (id " + r.questao().getId()
                    + ", custo ~US$ " + String.format("%.2f", r.custoUsd()) + ")", r.custoUsd());
        } catch (ElaboracaoQuestaoService.FalhaGeracao e) {
            log.error("[Questões] {} {}: {}", area, dia, e.getMessage());
            status.concluir(area, false, "Falhou: " + e.getMessage(), e.custoUsd);
        } catch (RuntimeException e) {
            log.error("[Questões] {} {}: erro inesperado", area, dia, e);
            status.concluir(area, false, "Falhou: " + e.getMessage(), 0);
        } finally {
            vagas.release();
        }
    }

    private boolean existe(AreaEnum area, LocalDate dia) {
        return !questaoGenRepository.findByAreaAndDataGreaterThanEqualAndDataLessThan(area, dia.atStartOfDay(), dia.plusDays(1).atStartOfDay()).isEmpty();
    }

    public QuestaoGen getQuestaoDia(AreaEnum area) {
        LocalDate hoje = dataFixa.isBlank() ? LocalDate.now() : LocalDate.parse(dataFixa);
        return questaoGenRepository.buscarQuestaoDoDia(area, hoje.atStartOfDay(), hoje.plusDays(1).atStartOfDay()).orElse(null);
    }

    public QuestaoGen getQuestaoExemplo(AreaEnum area) {
        return questaoGenRepository.findFirstByAreaAndDataLessThanOrderByDataDesc(area, LocalDate.now().atStartOfDay()).orElse(null);
    }
}
