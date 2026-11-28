package com.example.EnemDaily_backend.service.mentor;

import com.example.EnemDaily_backend.model.EstudoAssunto;
import com.example.EnemDaily_backend.model.MentorRegistro;
import com.example.EnemDaily_backend.repository.EstudoAssuntoRepository;
import com.example.EnemDaily_backend.repository.MentorRegistroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

/**
 * Grava o progresso do aluno em cada assunto. É a única porta de escrita de "estudado" e "revisado":
 * a lista de conteúdos e o "Meu mentor" passam por aqui, então os dois sempre mostram o mesmo.
 */
@Service
public class ProgressoEstudoService {
    public static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    static final int MAX_ADIAR_DIAS = 14;

    private final EstudoAssuntoRepository estudos;
    private final MentorRegistroRepository registros;
    private final CatalogoMentor catalogo;

    public ProgressoEstudoService(EstudoAssuntoRepository estudos, MentorRegistroRepository registros, CatalogoMentor catalogo) {
        this.estudos = estudos;
        this.registros = registros;
        this.catalogo = catalogo;
    }

    public static LocalDate hoje() {
        return LocalDate.now(ZONA);
    }

    /** Marca como estudado. "Já domino" conta como estudado, mas não entra no histórico do dia. Idempotente. */
    @Transactional
    public void marcarEstudado(UUID usuario, long assuntoId, boolean jaSabia) {
        EstudoAssunto e = obter(usuario, assuntoId);
        if (e.estudado()) return;
        LocalDate hoje = hoje();
        var item = catalogo.item(assuntoId).orElse(null);
        int minutos = item == null ? 0 : Math.max(0, item.minutos() - e.getMinutosFeitos());
        concluir(e, hoje, jaSabia, item != null && item.habilidade());
        estudos.save(e);
        if (!jaSabia) registros.save(new MentorRegistro(usuario, assuntoId, MentorRegistro.ESTUDO, hoje, minutos));
    }

    /** Registra uma parte de um assunto longo. Se completar o tempo do assunto, ele passa a contar como estudado. */
    @Transactional
    public void marcarParte(UUID usuario, long assuntoId, int minutos) {
        if (minutos < 5 || minutos > 240) throw new IllegalArgumentException("Tempo da parte inválido.");
        EstudoAssunto e = obter(usuario, assuntoId);
        if (e.estudado()) return;
        LocalDate hoje = hoje();
        e.setMinutosFeitos(e.getMinutosFeitos() + minutos);
        e.setPartesFeitas(e.getPartesFeitas() + 1);
        var item = catalogo.item(assuntoId).orElse(null);
        if (item != null && e.getMinutosFeitos() >= item.minutos()) concluir(e, hoje, false, item.habilidade());
        estudos.save(e);
        registros.save(new MentorRegistro(usuario, assuntoId, MentorRegistro.PARTE, hoje, minutos));
    }

    /** Volta o assunto para "não estudado" e tira do histórico as marcações de estudo dele. */
    @Transactional
    public void desfazerEstudo(UUID usuario, long assuntoId) {
        EstudoAssunto e = estudos.findByUsuarioIdAndAssuntoId(usuario, assuntoId).orElse(null);
        if (e == null) return;
        e.setEstudadoEm(null);
        e.setJaSabia(false);
        e.setRevisoes(0);
        e.setUltimaRevisao(null);
        e.setProximaRevisao(null);
        e.setMinutosFeitos(0);
        e.setPartesFeitas(0);
        registros.deleteAll(registros.findAllByUsuarioIdAndAssuntoIdAndTipoIn(usuario, assuntoId, java.util.List.of(MentorRegistro.ESTUDO, MentorRegistro.PARTE)));
        if (e.getAdiadoAte() == null && !e.isRemovido()) estudos.delete(e);
        else estudos.save(e);
    }

    /**
     * Registra uma revisão. Com dificuldade, a próxima vem em 4 dias e o intervalo não avança (o assunto
     * precisa ser reaprendido antes de espaçar mais).
     */
    @Transactional
    public void marcarRevisado(UUID usuario, long assuntoId, boolean dificil) {
        EstudoAssunto e = estudos.findByUsuarioIdAndAssuntoId(usuario, assuntoId)
                .filter(EstudoAssunto::estudado)
                .orElseThrow(() -> new IllegalArgumentException("Esse assunto ainda não foi estudado."));
        LocalDate hoje = hoje();
        if (hoje.equals(e.getUltimaRevisao())) return;
        var item = catalogo.item(assuntoId).orElse(null);
        boolean habilidade = item != null && item.habilidade();
        if (!dificil) e.setRevisoes(e.getRevisoes() + 1);
        e.setUltimaRevisao(hoje);
        e.setProximaRevisao(PlanejadorMentor.proximaRevisao(hoje, e.getRevisoes(), habilidade, dificil));
        estudos.save(e);
        int minutos = habilidade ? PlanejadorMentor.MIN_TREINO : PlanejadorMentor.MIN_REVISAO;
        registros.save(new MentorRegistro(usuario, assuntoId, MentorRegistro.REVISAO, hoje, minutos));
    }

    /**
     * Desfaz a última marcação de hoje nesse assunto (estudo, parte ou revisão), sem mexer no que foi feito em
     * outros dias. Devolve false se não havia nada marcado hoje.
     */
    @Transactional
    public boolean desfazerHoje(UUID usuario, long assuntoId) {
        LocalDate hoje = hoje();
        MentorRegistro ultimo = registros.findAllByUsuarioIdAndData(usuario, hoje).stream()
                .filter(r -> r.getAssuntoId().equals(assuntoId))
                .max(java.util.Comparator.comparing(MentorRegistro::getCriadoEm, java.util.Comparator.nullsFirst(java.util.Comparator.naturalOrder()))
                        .thenComparing(MentorRegistro::getId))
                .orElse(null);
        EstudoAssunto e = estudos.findByUsuarioIdAndAssuntoId(usuario, assuntoId).orElse(null);
        if (ultimo == null || e == null) return false;
        switch (ultimo.getTipo()) {
            case MentorRegistro.REVISAO -> {
                e.setRevisoes(Math.max(0, e.getRevisoes() - 1));
                e.setUltimaRevisao(null);
                e.setProximaRevisao(hoje);
            }
            case MentorRegistro.PARTE -> {
                e.setMinutosFeitos(Math.max(0, e.getMinutosFeitos() - ultimo.getMinutos()));
                e.setPartesFeitas(Math.max(0, e.getPartesFeitas() - 1));
                if (hoje.equals(e.getEstudadoEm())) limparEstudo(e);
            }
            default -> limparEstudo(e);
        }
        registros.delete(ultimo);
        estudos.save(e);
        return true;
    }

    private static void limparEstudo(EstudoAssunto e) {
        e.setEstudadoEm(null);
        e.setJaSabia(false);
        e.setRevisoes(0);
        e.setUltimaRevisao(null);
        e.setProximaRevisao(null);
    }

    @Transactional
    public void adiar(UUID usuario, long assuntoId, int dias) {
        if (dias < 1 || dias > MAX_ADIAR_DIAS) throw new IllegalArgumentException("Dá para adiar de 1 a " + MAX_ADIAR_DIAS + " dias.");
        EstudoAssunto e = obter(usuario, assuntoId);
        LocalDate ate = hoje().plusDays(dias);
        if (e.estudado()) {
            // Revisão: empurra a data dela.
            if (e.getProximaRevisao() != null) e.setProximaRevisao(ate);
        } else {
            e.setAdiadoAte(ate);
        }
        estudos.save(e);
    }

    @Transactional
    public void remover(UUID usuario, long assuntoId, boolean remover) {
        EstudoAssunto e = obter(usuario, assuntoId);
        e.setRemovido(remover);
        if (!remover && !e.estudado() && e.getAdiadoAte() == null && e.getMinutosFeitos() == 0 && e.getIniciadoEm() == null) {
            if (e.getId() != null) estudos.delete(e);
            return;
        }
        estudos.save(e);
    }

    /** O aluno leu a orientação do dia e começou o estudo. */
    @Transactional
    public void iniciar(UUID usuario, long assuntoId) {
        EstudoAssunto e = obter(usuario, assuntoId);
        if (e.estudado()) return;
        e.setIniciadoEm(hoje());
        estudos.save(e);
    }

    private void concluir(EstudoAssunto e, LocalDate hoje, boolean jaSabia, boolean habilidade) {
        e.setEstudadoEm(hoje);
        e.setJaSabia(jaSabia);
        e.setRevisoes(0);
        e.setUltimaRevisao(null);
        e.setProximaRevisao(jaSabia ? hoje.plusDays(14) : PlanejadorMentor.proximaRevisao(hoje, 0, habilidade, false));
        e.setAdiadoAte(null);
    }

    private EstudoAssunto obter(UUID usuario, long assuntoId) {
        return estudos.findByUsuarioIdAndAssuntoId(usuario, assuntoId).orElseGet(() -> new EstudoAssunto(usuario, assuntoId));
    }
}
