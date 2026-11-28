package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.model.EscolaLivre;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.EscolaLivreRepository;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Escola do aluno. A lista oficial vem do Censo Escolar 2024 (INEP, dados abertos): escolas em atividade com
 * ensino médio ou EJA de ensino médio. O que o aluno digita e não está na lista vira uma opção livre, que
 * aparece na busca para os próximos.
 */
@Service
public class EscolaService {

    static final String ARQUIVO = "escolas/escolas-ensino-medio.csv";
    static final int LIMITE = 20;

    /** tipo: "inep" ou "livre"; local: "Município · UF" (só INEP); rede: "publica"/"privada" (só INEP). */
    public record Opcao(String tipo, Long codigo, Long idLivre, String nome, String local, String rede) {}

    private record Escola(long codigo, String nome, String local, String rede, String chaveNome, String chaveTudo) {}

    private static final Set<String> MINUSCULAS = Set.of("de", "da", "do", "das", "dos", "e");
    private static final Set<String> SIGLAS = Set.of(
            "ee", "eeb", "eef", "eefm", "eeefm", "eeem", "eem", "eemti", "eeep", "ce", "ced", "cef", "cem", "cei",
            "ceja", "ceeja", "cesec", "ceti", "cetep", "cepi", "ciep", "cmef", "cm", "eja", "eci", "ecit", "erem",
            "emef", "emeb", "etec", "fatec", "sesi", "senai", "sesc", "senac", "cefet", "ud", "ef", "ltda", "ifpb",
            "ifpe", "ifce", "ifba", "ifsp", "ifrj", "ifmg", "ifsc", "ifrs", "ifpr", "ifg", "ifam", "ifpa", "ifrn");
    /** Abreviações de título sem vogal que ficam só com a inicial maiúscula (Dr, Sr). */
    private static final Set<String> TITULOS = Set.of("dr", "dra", "sr", "sra", "jr", "sto", "sta");
    private static final Pattern ROMANO = Pattern.compile("^(i{1,3}|iv|v|vi{1,3}|ix|x)$");
    private static final Pattern SEM_VOGAL = Pattern.compile("^[^aeiou]{2,}$");

    private final EscolaLivreRepository livres;
    private final UsuarioRepository usuarios;
    private volatile List<Escola> lista;
    private volatile Map<Long, Escola> porCodigo;

    public EscolaService(EscolaLivreRepository livres, UsuarioRepository usuarios) {
        this.livres = livres;
        this.usuarios = usuarios;
    }

    // ---------------------------------------------------------------- busca

    public List<Opcao> buscar(String q) {
        String consulta = normalizar(q);
        if (consulta.length() < 2) return List.of();
        String[] termos = consulta.split(" ");
        List<Opcao> saida = new ArrayList<>();

        // Opções livres primeiro quando batem, porque são exatamente o que outros alunos digitaram.
        for (EscolaLivre l : livres.findTop200ByChaveContaining(termos[0])) {
            if (Arrays.stream(termos).allMatch(l.getChave()::contains)) saida.add(new Opcao("livre", null, l.getId(), l.getNome(), null, null));
            if (saida.size() >= 5) break;
        }

        carregar().stream()
                .filter(e -> Arrays.stream(termos).allMatch(e.chaveTudo()::contains))
                .sorted(Comparator.comparingInt((Escola e) -> relevancia(e, consulta, termos)).thenComparingInt(e -> e.nome().length()))
                .limit(LIMITE - saida.size())
                .forEach(e -> saida.add(opcao(e)));
        return saida;
    }

    /** 0: nome começa com a busca; 1: todos os termos no nome; 2: precisou da cidade/UF. */
    private static int relevancia(Escola e, String consulta, String[] termos) {
        if (e.chaveNome().startsWith(consulta) || e.chaveNome().contains(" " + consulta)) return 0;
        return Arrays.stream(termos).allMatch(e.chaveNome()::contains) ? 1 : 2;
    }

    // ---------------------------------------------------------------- escola do aluno

    public Optional<Opcao> minha(Usuario u) {
        if (u.getEscolaInep() != null) return Optional.ofNullable(carregarPorCodigo().get(u.getEscolaInep())).map(EscolaService::opcao);
        if (u.getEscolaLivreId() != null) return livres.findById(u.getEscolaLivreId()).map(l -> new Opcao("livre", null, l.getId(), l.getNome(), null, null));
        return Optional.empty();
    }

    /** codigo: escola do INEP; idLivre: opção livre existente; nome: texto novo. Tudo nulo limpa. */
    @Transactional
    public Optional<Opcao> definir(Usuario u, Long codigo, Long idLivre, String nome) {
        u.setEscolaInep(null);
        u.setEscolaLivreId(null);
        if (codigo != null) {
            if (!carregarPorCodigo().containsKey(codigo)) throw new ContaService.RegraConta("Escola não encontrada.");
            u.setEscolaInep(codigo);
        } else if (idLivre != null) {
            EscolaLivre l = livres.findById(idLivre).orElseThrow(() -> new ContaService.RegraConta("Opção não encontrada."));
            u.setEscolaLivreId(l.getId());
        } else if (nome != null && !nome.isBlank()) {
            String limpo = nome.trim().replaceAll("\\s+", " ");
            if (limpo.length() < 3 || limpo.length() > 100 || !limpo.matches(".*\\p{L}.*")) throw new ContaService.RegraConta("Digite um nome entre 3 e 100 caracteres.");
            String chave = normalizar(limpo);
            EscolaLivre l = livres.findByChave(chave).orElseGet(() -> livres.save(new EscolaLivre(limpo, chave)));
            u.setEscolaLivreId(l.getId());
        }
        usuarios.save(u);
        return minha(u);
    }

    // ---------------------------------------------------------------- lista do INEP

    private List<Escola> carregar() {
        if (lista == null) {
            synchronized (this) {
                if (lista == null) ler();
            }
        }
        return lista;
    }

    private Map<Long, Escola> carregarPorCodigo() {
        carregar();
        return porCodigo;
    }

    private void ler() {
        List<Escola> l = new ArrayList<>(33_000);
        Map<Long, Escola> m = new HashMap<>(44_000);
        try (BufferedReader in = new BufferedReader(new InputStreamReader(new ClassPathResource(ARQUIVO).getInputStream(), StandardCharsets.UTF_8))) {
            in.readLine();
            for (String linha; (linha = in.readLine()) != null; ) {
                String[] c = linha.split(";", -1);
                if (c.length < 5) continue;
                String nome = exibir(c[1]);
                String local = c[2] + " · " + c[3];
                Escola e = new Escola(Long.parseLong(c[0]), nome, local, c[4], normalizar(c[1]), normalizar(c[1] + " " + c[2] + " " + c[3]));
                l.add(e);
                m.put(e.codigo(), e);
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        porCodigo = m;
        lista = List.copyOf(l);
    }

    private static Opcao opcao(Escola e) {
        return new Opcao("inep", e.codigo(), null, e.nome(), e.local(), e.rede());
    }

    /** "EE JOSE DE ALENCAR II" -> "EE Jose de Alencar II". */
    static String exibir(String bruto) {
        String[] partes = bruto.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < partes.length; i++) {
            String p = partes[i];
            String base = p.toLowerCase(Locale.ROOT);
            String limpo = normalizar(base).replaceAll("[^a-z]", "");
            String saida;
            if (limpo.isEmpty()) saida = p;
            else if (i > 0 && MINUSCULAS.contains(limpo)) saida = base;
            else if (SIGLAS.contains(limpo) || ROMANO.matcher(limpo).matches() || (SEM_VOGAL.matcher(limpo).matches() && !TITULOS.contains(limpo)) || (i == 0 && limpo.equals("em"))) saida = p.toUpperCase(Locale.ROOT);
            else saida = Character.toUpperCase(base.charAt(0)) + base.substring(1);
            if (i > 0) sb.append(' ');
            sb.append(saida);
        }
        return sb.toString();
    }

    static String normalizar(String s) {
        if (s == null) return "";
        String semAcento = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return semAcento.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }
}
