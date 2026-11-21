package com.example.EnemDaily_backend.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Embeddable
public class Area {
    private int questoesRespondidas;
    private int acertos;
    private int streak;
    private int xp;
    private int tempoGasto;
    private boolean acertoHoje;

    private LocalDate ultimaResposta;

    public Area(){
        this.questoesRespondidas = 0;
        this.acertos = 0;
        this.streak = 0;
        this.xp = 0;
        this.tempoGasto = 0;
        this.acertoHoje = false;
        this.ultimaResposta = LocalDate.now().minusDays(1);
    }

    public boolean isAcertoHoje() {
        return acertoHoje;
    }

    public void setAcertoHoje(boolean acertoHoje) {
        this.acertoHoje = acertoHoje;
    }

    public void registraDadosArea(int xp, int tempoGasto, boolean correta){
        this.xp += xp;
        this.tempoGasto += tempoGasto;
        this.questoesRespondidas ++ ;
        this.ultimaResposta = LocalDate.now();
        this.acertoHoje = correta;
        if(correta){
            this.acertos++;
            this.streak++;
        }
        else{
            this.streak = 0;
        }
    }

    public LocalDate getUltimaResposta() {
        return ultimaResposta;
    }

    public void setUltimaResposta(LocalDate ultimaResposta) {
        this.ultimaResposta = ultimaResposta;
    }

    public int getQuestoesRespondidas() {
        return questoesRespondidas;
    }

    public void setQuestoesRespondidas(int questoesRespondidas) {
        this.questoesRespondidas = questoesRespondidas;
    }

    public int getAcertos() {
        return acertos;
    }

    public void setAcertos(int acertos) {
        this.acertos = acertos;
    }

    public int getStreak() {
        return streak;
    }

    public void setStreak(int streak) {
        this.streak = streak;
    }

    public int getXp() {
        return xp;
    }

    public void setXp(int xp) {
        this.xp = xp;
    }

    public int getTempoGasto() {
        return tempoGasto;
    }

    public void setTempoGasto(int tempoGasto) {
        this.tempoGasto = tempoGasto;
    }
}
