package com.example.EnemDaily_backend.service.ia;

import com.example.EnemDaily_backend.service.ia.ItemElaborado.AlternativaElaborada;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.stream.IntStream;

public record ItemMontado(ItemElaborado item, List<AlternativaElaborada> ordem, int indiceGabarito) {

    public static final String LETRAS = "ABCDE";

    public String letraGabarito() {
        return letra(indiceGabarito);
    }

    public static String letra(int i) {
        return String.valueOf(LETRAS.charAt(i));
    }

    public AlternativaElaborada porLetra(String letra) {
        int i = letra == null ? -1 : LETRAS.indexOf(letra.trim().toUpperCase());
        return i < 0 || i >= ordem.size() ? null : ordem.get(i);
    }

    public static ItemMontado montar(ItemElaborado item, int[] usoRecentePorPosicao, Random sorte) {
        List<AlternativaElaborada> ordem;
        if (item.numerica()) {
            ordem = new ArrayList<>(item.alternativas());
            ordem.sort(Comparator.comparingDouble(AlternativaElaborada::valorNumerico));
        } else {
            AlternativaElaborada gabarito = item.alternativas().stream().filter(AlternativaElaborada::correta).findFirst().orElseThrow();
            ordem = new ArrayList<>(item.alternativas().stream().filter(a -> !a.correta()).toList());
            Collections.shuffle(ordem, sorte);
            int menorUso = IntStream.of(usoRecentePorPosicao).min().orElse(0);
            List<Integer> candidatas = IntStream.range(0, 5).filter(i -> usoRecentePorPosicao[i] == menorUso).boxed().toList();
            ordem.add(candidatas.get(sorte.nextInt(candidatas.size())), gabarito);
        }
        int indice = IntStream.range(0, ordem.size()).filter(i -> ordem.get(i).correta()).findFirst().orElseThrow();
        return new ItemMontado(item, List.copyOf(ordem), indice);
    }
}
