package com.example.EnemDaily_backend.service.ia;

import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.service.ia.ItemElaborado.AlternativaElaborada;
import com.example.EnemDaily_backend.service.ia.ItemElaborado.Tabela;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
public class PromptsQuestao {

    public record InfoArea(String chave, String disciplinaEnem, String nome) {}

    public record Referencia(Integer ano, String texto) {}

    public record Recente(String assunto, String conceito, String inicioTexto) {}

    public static final Map<AreaEnum, InfoArea> AREAS = new EnumMap<>(Map.of(
            AreaEnum.NATUREZAS, new InfoArea("natureza", "ciencias-natureza", "Ciências da Natureza e suas Tecnologias"),
            AreaEnum.HUMANAS, new InfoArea("humanas", "ciencias-humanas", "Ciências Humanas e suas Tecnologias"),
            AreaEnum.EXATAS, new InfoArea("matematica", "matematica", "Matemática e suas Tecnologias"),
            AreaEnum.LINGUAGENS, new InfoArea("linguagens", "linguagens", "Linguagens, Códigos e suas Tecnologias")
    ));

    private static final Pattern IMAGEM_MD = Pattern.compile("!\\[[^\\]]*]\\([^)]*\\)");
    private static final Pattern LINGUA_ESTRANGEIRA = Pattern.compile("(?i)ingl[eê]s|espanhol|l[ií]ngua estrangeira");
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final String elaborador;
    private final String resolvedor;
    private final String revisor;
    private final Map<AreaEnum, String> modulos = new EnumMap<>(AreaEnum.class);
    private final JsonNode esquemaElaborador;
    private final JsonNode esquemaResolvedor;
    private final JsonNode esquemaRevisor;

    public PromptsQuestao(ObjectMapper mapper) {
        elaborador = ler("prompts/elaborador.md");
        resolvedor = ler("prompts/resolvedor.md");
        revisor = ler("prompts/revisor.md");
        AREAS.forEach((area, info) -> modulos.put(area, ler("prompts/area-" + info.chave() + ".md")));
        try {
            esquemaElaborador = mapper.readTree(ler("prompts/esquemas/elaborador.json"));
            esquemaResolvedor = mapper.readTree(ler("prompts/esquemas/resolvedor.json"));
            esquemaRevisor = mapper.readTree(ler("prompts/esquemas/revisor.json"));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public JsonNode esquemaElaborador() { return esquemaElaborador; }
    public JsonNode esquemaResolvedor() { return esquemaResolvedor; }
    public JsonNode esquemaRevisor() { return esquemaRevisor; }

    public String moduloArea(AreaEnum area) {
        return modulos.get(area);
    }

    public static AreaEnum areaPorChave(String chave) {
        return AREAS.entrySet().stream().filter(e -> e.getValue().chave().equalsIgnoreCase(chave)).map(Map.Entry::getKey).findFirst().orElse(null);
    }

    public String instrucoesElaborador(AreaEnum area) {
        return elaborador + "\n\n" + modulos.get(area);
    }

    public String instrucoesRevisor(AreaEnum area) {
        return revisor + "\n\n" + modulos.get(area);
    }

    public String instrucoesResolvedor(AreaEnum area) {
        return resolvedor + "\n\n<area>" + AREAS.get(area).nome() + "</area>\n";
    }

    public String tarefa(AreaEnum area, String assunto, LocalDate dia, List<Referencia> referencias, List<Recente> recentes) {
        StringBuilder sb = new StringBuilder();
        sb.append("<tarefa>\nElabore um item inédito do ENEM.\n")
                .append("- Área: ").append(AREAS.get(area).nome()).append("\n")
                .append("- Assunto: ").append(assunto).append("\n")
                .append("- Escolha, na Matriz de Referência, a habilidade que melhor se aplica a esse assunto, e construa o item para avaliá-la de fato.\n")
                .append("- Dificuldade: média, um item que cerca de metade dos participantes acerta e que discrimina bem quem domina a habilidade.\n")
                .append("- Data de publicação: ").append(DATA.format(dia)).append(". Contextos atuais são bem-vindos, mas use apenas fatos de que você tem certeza.\n");
        if (LINGUA_ESTRANGEIRA.matcher(assunto).find()) {
            sb.append("- Item de língua estrangeira: o texto-base é escrito em ")
                    .append(assunto.toLowerCase().contains("espanhol") ? "espanhol" : "inglês")
                    .append(" autêntico e natural; o enunciado e as alternativas são em português, como no ENEM.\n");
        }
        sb.append("</tarefa>\n");

        if (!referencias.isEmpty()) {
            sb.append("\n<textos_base_de_itens_oficiais>\nTextos-base de itens reais do ENEM do mesmo assunto ou da mesma área. Use-os só para calibrar gênero, extensão, registro e a forma de citar fontes. Não copie, não parafraseie e não reaproveite os mesmos contextos, dados ou números.\n");
            for (Referencia r : referencias) {
                sb.append("<item_oficial").append(r.ano() == null ? "" : " ano=\"" + r.ano() + "\"").append(">\n")
                        .append(limparReferencia(r.texto())).append("\n</item_oficial>\n");
            }
            sb.append("</textos_base_de_itens_oficiais>\n");
        }

        if (!recentes.isEmpty()) {
            sb.append("\n<itens_recentes_do_enem_daily>\nItens publicados recentemente nesta área. Escolha um contexto, uma situação e um conceito diferentes destes:\n");
            for (Recente r : recentes) {
                sb.append("- ").append(r.assunto());
                if (r.conceito() != null && !r.conceito().equalsIgnoreCase(r.assunto())) sb.append(" | ").append(r.conceito());
                if (r.inicioTexto() != null && !r.inicioTexto().isBlank()) sb.append(" | \"").append(r.inicioTexto()).append("...\"");
                sb.append("\n");
            }
            sb.append("</itens_recentes_do_enem_daily>\n");
        }
        return sb.toString();
    }

    public String revisao(String tarefa, String versaoAnteriorJson, ItemMontado apresentado, List<String> problemas) {
        StringBuilder sb = new StringBuilder();
        sb.append("<tarefa_original>\n").append(tarefa).append("</tarefa_original>\n\n")
                .append("<versao_anterior>\n").append(versaoAnteriorJson).append("\n</versao_anterior>\n\n");
        if (apresentado != null) {
            sb.append("<ordem_em_que_as_alternativas_foram_apresentadas_aos_avaliadores>\n");
            for (int i = 0; i < apresentado.ordem().size(); i++) {
                sb.append(ItemMontado.letra(i)).append(") ").append(apresentado.ordem().get(i).texto())
                        .append(i == apresentado.indiceGabarito() ? "   [gabarito da versão anterior]" : "").append("\n");
            }
            sb.append("</ordem_em_que_as_alternativas_foram_apresentadas_aos_avaliadores>\n\n");
        }
        sb.append("<problemas_encontrados>\n");
        for (int i = 0; i < problemas.size(); i++) sb.append(i + 1).append(". ").append(problemas.get(i)).append("\n");
        sb.append("</problemas_encontrados>\n\n")
                .append("<instrucoes_da_revisao>\n")
                .append("- Corrija todos os problemas acima e preserve o que está bom.\n")
                .append("- Se houver dúvida sobre o gabarito, resolva o item do zero antes de decidir quem tem razão. Se a versão anterior estava certa, torne o item tão claro que a dúvida desapareça.\n")
                .append("- Se a ideia central não se sustentar, troque o contexto, mantendo área, assunto e habilidade.\n")
                .append("- Releia o item inteiro depois de corrigir: uma correção não pode criar outro problema.\n")
                .append("- Entregue o item completo, no mesmo formato.\n")
                .append("</instrucoes_da_revisao>\n");
        return sb.toString();
    }

    public String paraResolver(ItemMontado m) {
        return "<item>\n" + blocoDoItem(m) + "</item>\n\nResolva o item e audite-o.";
    }

    public String paraRevisar(AreaEnum area, ItemMontado m, VerificadorItem.Resultado lint) {
        ItemElaborado it = m.item();
        StringBuilder sb = new StringBuilder("<item>\n");
        sb.append("Área: ").append(AREAS.get(area).nome()).append("\n")
                .append("Disciplina: ").append(it.disciplina()).append("\n")
                .append("Competência declarada: ").append(it.competencia()).append("\n")
                .append("Habilidade declarada: ").append(it.habilidade()).append("\n")
                .append("Conceito-chave: ").append(it.conceitoChave()).append("\n\n")
                .append(blocoDoItem(m))
                .append("\nGABARITO INDICADO PELO ELABORADOR: ").append(m.letraGabarito()).append("\n</item>\n\n");

        sb.append("<hipoteses_de_erro_dos_distratores>\n");
        for (int i = 0; i < m.ordem().size(); i++) {
            AlternativaElaborada a = m.ordem().get(i);
            if (!a.correta()) sb.append(ItemMontado.letra(i)).append(") ").append(a.hipoteseDeErro()).append("\n");
        }
        sb.append("</hipoteses_de_erro_dos_distratores>\n\n");

        sb.append("<verificacao_numerica>\n");
        if (it.verificacaoNumerica() == null) sb.append("Item sem cálculo declarado.\n");
        else sb.append("Expressão: ").append(it.verificacaoNumerica().expressao())
                .append("\nResultado declarado: ").append(VerificadorItem.formatar(it.verificacaoNumerica().resultado()))
                .append(lint.valorCalculado() == null ? "" : "\nValor calculado pelo sistema: " + VerificadorItem.formatar(lint.valorCalculado()))
                .append(it.verificacaoNumerica().unidade() == null ? "" : "\nUnidade: " + it.verificacaoNumerica().unidade()).append("\n");
        sb.append("</verificacao_numerica>\n\n");

        sb.append("<resolucao_do_elaborador>\n").append(it.resolucao()).append("\n</resolucao_do_elaborador>\n\n");
        sb.append("<analise_das_alternativas>\n");
        for (int i = 0; i < m.ordem().size(); i++) sb.append(ItemMontado.letra(i)).append(") ").append(m.ordem().get(i).analise()).append("\n");
        sb.append("</analise_das_alternativas>\n\n");
        sb.append("<explicacao_do_assunto>\n").append(it.explicacaoAssunto()).append("\n</explicacao_do_assunto>\n\n");
        sb.append("<alertas_automaticos>\n");
        if (lint.avisos().isEmpty()) sb.append("Nenhum.\n");
        else lint.avisos().forEach(a -> sb.append("- ").append(a).append("\n"));
        sb.append("</alertas_automaticos>\n\nAvalie o item.");
        return sb.toString();
    }

    private String blocoDoItem(ItemMontado m) {
        ItemElaborado it = m.item();
        StringBuilder sb = new StringBuilder("TEXTO-BASE\n");
        if (it.textoBase() != null && it.textoBase().paragrafos() != null) {
            sb.append(String.join("\n\n", it.textoBase().paragrafos())).append("\n");
        }
        Tabela t = it.textoBase() == null ? null : it.textoBase().tabela();
        if (t != null) {
            sb.append("\n[TABELA").append(t.titulo() == null ? "" : ": " + t.titulo()).append("]\n")
                    .append("| ").append(String.join(" | ", t.colunas())).append(" |\n");
            for (List<String> linha : t.linhas()) sb.append("| ").append(String.join(" | ", linha)).append(" |\n");
            if (t.nota() != null) sb.append(t.nota()).append("\n");
        }
        if (it.textoBase() != null && it.textoBase().fonte() != null) sb.append("\nFonte: ").append(it.textoBase().fonte()).append("\n");
        sb.append("\nENUNCIADO\n").append(it.enunciado()).append("\n\nALTERNATIVAS\n");
        sb.append(IntStream.range(0, m.ordem().size())
                .mapToObj(i -> ItemMontado.letra(i) + ") " + m.ordem().get(i).texto())
                .collect(Collectors.joining("\n"))).append("\n");
        return sb.toString();
    }

    private static String limparReferencia(String texto) {
        String t = IMAGEM_MD.matcher(texto == null ? "" : texto).replaceAll("[figura]")
                .replace(' ', ' ')
                .replaceAll("[ \\t]+", " ")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
        return t.length() > 1800 ? t.substring(0, 1800) + " [...]" : t;
    }

    private static String ler(String caminho) {
        try {
            return new String(new ClassPathResource(caminho).getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível ler " + caminho, e);
        }
    }
}
