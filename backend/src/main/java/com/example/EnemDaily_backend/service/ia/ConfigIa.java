package com.example.EnemDaily_backend.service.ia;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class ConfigIa {
    @Value("${enemdaily.ia.chave:}")
    private String chave;
    @Value("${enemdaily.ia.modelo:gpt-5.5}")
    private String modelo;
    @Value("${enemdaily.ia.esforco.elaborar:xhigh}")
    private String esforcoElaborar;
    @Value("${enemdaily.ia.esforco.resolver:xhigh}")
    private String esforcoResolver;
    @Value("${enemdaily.ia.esforco.revisar:xhigh}")
    private String esforcoRevisar;
    @Value("${enemdaily.ia.esforco.conteudo:high}")
    private String esforcoConteudo;
    @Value("${enemdaily.ia.max-saida:64000}")
    private int maxSaida;
    @Value("${enemdaily.ia.background:true}")
    private boolean background;
    @Value("${enemdaily.ia.limite-minutos:30}")
    private int limiteMinutos;
    @Value("${enemdaily.ia.max-rascunhos:2}")
    private int maxRascunhos;
    @Value("${enemdaily.ia.max-revisoes:2}")
    private int maxRevisoes;
    @Value("${enemdaily.ia.areas-em-paralelo:4}")
    private int areasEmParalelo;
    @Value("${enemdaily.ia.preco.entrada:5.00}")
    private double precoEntrada;
    @Value("${enemdaily.ia.preco.entrada-cache:0.50}")
    private double precoEntradaCache;
    @Value("${enemdaily.ia.preco.saida:30.00}")
    private double precoSaida;
}
