package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.RedacaoRequestDTO;
import com.example.EnemDaily_backend.model.Redacao;
import com.example.EnemDaily_backend.model.RedacaoAnexo;
import com.example.EnemDaily_backend.repository.RedacaoRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RedacaoService {

    /** Até 3 fotos ou 1 PDF por redação. */
    static final int MAX_FOTOS = 3;
    static final long MAX_FOTO = 3L * 1024 * 1024;
    static final long MAX_PDF = 10L * 1024 * 1024;
    private static final Set<String> TIPOS_FOTO = Set.of("image/jpeg", "image/webp");
    private static final String PREFIXO_URL = "https://firebasestorage.googleapis.com/";

    public static class AnexoInvalido extends RuntimeException {
        public AnexoInvalido(String msg) { super(msg); }
    }

    private final RedacaoRepository redacaoRepository;
    public RedacaoService(RedacaoRepository redacaoRepository){
        this.redacaoRepository = redacaoRepository;
    }

    public List<Redacao> salvaRedacao(RedacaoRequestDTO dto, UUID idUsuario){
        Redacao novaRedacao = new Redacao();
        novaRedacao.setData(dto.data());
        novaRedacao.setTema(dto.tema());
        novaRedacao.setIdUsuario(idUsuario);
        novaRedacao.setNota(dto.nota());
        novaRedacao.setC1(dto.c1());
        novaRedacao.setC2(dto.c2());
        novaRedacao.setC3(dto.c3());
        novaRedacao.setC4(dto.c4());
        novaRedacao.setC5(dto.c5());
        novaRedacao.setAnexos(validaAnexos(dto.anexos(), idUsuario));
        redacaoRepository.save(novaRedacao);
        redacaoRepository.flush();
        return getRedacoesUsuario(idUsuario);
    }

    /** O arquivo sobe direto do navegador para o Storage; aqui confere se o que chegou é do próprio aluno e está dentro dos limites. */
    static List<RedacaoAnexo> validaAnexos(List<RedacaoAnexo> anexos, UUID idUsuario) {
        if (anexos == null || anexos.isEmpty()) return new ArrayList<>();
        long pdfs = anexos.stream().filter(a -> "application/pdf".equals(a.getTipo())).count();
        if (pdfs > 1 || (pdfs == 1 && anexos.size() > 1)) throw new AnexoInvalido("Envie 1 PDF ou até 3 fotos, sem misturar.");
        if (anexos.size() > MAX_FOTOS) throw new AnexoInvalido("No máximo 3 fotos por redação.");
        String pasta = "redacoes/" + idUsuario + "/";
        List<RedacaoAnexo> ok = new ArrayList<>();
        for (RedacaoAnexo a : anexos) {
            boolean pdf = "application/pdf".equals(a.getTipo());
            if (!pdf && !TIPOS_FOTO.contains(a.getTipo())) throw new AnexoInvalido("Tipo de arquivo não aceito.");
            if (a.getCaminho() == null || !a.getCaminho().startsWith(pasta) || a.getCaminho().contains("..")) throw new AnexoInvalido("Arquivo de outra pasta.");
            if (a.getUrl() == null || !a.getUrl().startsWith(PREFIXO_URL)) throw new AnexoInvalido("Link de arquivo inválido.");
            if (a.getTamanho() <= 0 || a.getTamanho() > (pdf ? MAX_PDF : MAX_FOTO)) throw new AnexoInvalido("Arquivo grande demais.");
            String nome = a.getNome() == null || a.getNome().isBlank() ? (pdf ? "redacao.pdf" : "foto.jpg") : a.getNome().strip();
            ok.add(new RedacaoAnexo(a.getCaminho(), a.getUrl(), nome.length() > 160 ? nome.substring(0, 160) : nome, a.getTipo(), a.getTamanho()));
        }
        return ok;
    }

    public List<Redacao> getRedacoesUsuario(UUID idUsuario){
        List<Redacao> redacoes = this.redacaoRepository.findAllByIdUsuarioOrderByDataDesc(idUsuario);
        for (int i =0 ; i< redacoes.size(); i++) {
            if(i == redacoes.size()-1){
                redacoes.get(i).setDif(0);
            }
            else{
                redacoes.get(i).setDif(redacoes.get(i).getNota() - redacoes.get(i+1).getNota());
            }

        }
        return redacoes;
    }

    /** Só apaga redação do próprio aluno. */
    public boolean deletaRedacao(long id, UUID idUsuario){
        return redacaoRepository.findById(id)
                .filter(r -> idUsuario.equals(r.getIdUsuario()))
                .map(r -> { redacaoRepository.delete(r); return true; })
                .orElse(false);
    }
}
