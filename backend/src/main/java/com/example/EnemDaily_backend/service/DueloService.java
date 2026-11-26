package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.comunidade.ComunidadeDTOs;
import com.example.EnemDaily_backend.Enum.StatusAmizade;
import com.example.EnemDaily_backend.Enum.StatusDuelo;
import com.example.EnemDaily_backend.Interface.PlacarDoDia;
import com.example.EnemDaily_backend.model.Duelo;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.AmizadeRepository;
import com.example.EnemDaily_backend.repository.BloqueioRepository;
import com.example.EnemDaily_backend.repository.DueloRepository;
import com.example.EnemDaily_backend.repository.EventRepository;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class DueloService {
    public static final int MAX_CONVITES_PENDENTES = 5;
    public static final int DIAS_A_FRENTE = 7;
    private static final EnumSet<StatusDuelo> ATIVOS = EnumSet.of(StatusDuelo.PENDENTE, StatusDuelo.AGENDADO);

    private final DueloRepository dueloRepository;
    private final EventRepository eventRepository;
    private final UsuarioRepository usuarioRepository;
    private final AmizadeRepository amizadeRepository;
    private final BloqueioRepository bloqueioRepository;
    private final LembreteService lembretes;

    public DueloService(DueloRepository dueloRepository, EventRepository eventRepository, UsuarioRepository usuarioRepository,
                        AmizadeRepository amizadeRepository, BloqueioRepository bloqueioRepository, LembreteService lembretes) {
        this.dueloRepository = dueloRepository;
        this.eventRepository = eventRepository;
        this.usuarioRepository = usuarioRepository;
        this.amizadeRepository = amizadeRepository;
        this.bloqueioRepository = bloqueioRepository;
        this.lembretes = lembretes;
    }

    private LocalDate hoje() { return LocalDate.now(); }

    private long respostasNoDia(Usuario u, LocalDate dia) {
        return eventRepository.respostasNoPeriodo(u.getId(), dia.atStartOfDay(), dia.plusDays(1).atStartOfDay());
    }

    private PlacarDoDia placar(Usuario u, LocalDate dia) {
        return eventRepository.placarNoPeriodo(u.getId(), dia.atStartOfDay(), dia.plusDays(1).atStartOfDay());
    }

    private static int n(Long v) { return v == null ? 0 : v.intValue(); }

    private static String arroba(Usuario u) { return "@" + u.getUsuario(); }


    public String motivoSemDuelo(Usuario eu, Usuario outro) {
        if (eu.getId().equals(outro.getId())) return "Você não pode duelar com você mesmo.";
        if (outro.isDemo()) return "Essa conta ainda não foi criada.";
        if (bloqueioRepository.existeEntre(eu, outro)) return "Não é possível duelar com essa pessoa.";
        if (Boolean.TRUE.equals(outro.getDuelosSoAmigos())) {
            boolean amigos = amizadeRepository.entre(eu, outro).map(a -> a.getStatus() == StatusAmizade.ACEITA).orElse(false);
            if (!amigos) return arroba(outro) + " só aceita duelos de amigos.";
        }
        return null;
    }

    public ComunidadeDTOs.Disponibilidade disponibilidade(Usuario eu, Usuario outro) {
        String motivo = motivoSemDuelo(eu, outro);
        if (motivo != null) return new ComunidadeDTOs.Disponibilidade(false, motivo, null);
        LocalDate hoje = hoje();
        String motivoHoje = null;
        if (respostasNoDia(eu, hoje) > 0) motivoHoje = "Você já respondeu hoje, então o duelo pode ser a partir de amanhã.";
        else if (respostasNoDia(outro, hoje) > 0) motivoHoje = arroba(outro) + " já respondeu hoje, então o duelo pode ser a partir de amanhã.";
        else if (dueloRepository.existeNoDia(eu, outro, hoje, ATIVOS)) motivoHoje = "Vocês já têm um duelo marcado para hoje.";
        LocalDate primeiro = motivoHoje == null ? hoje : hoje.plusDays(1);
        return new ComunidadeDTOs.Disponibilidade(motivoHoje == null, motivoHoje, primeiro.toString());
    }

    @Transactional
    public ComunidadeDTOs.Duelo desafiar(Usuario eu, ComunidadeDTOs.NovoDuelo dto) {
        if (dto == null || dto.usuario() == null || dto.dia() == null) throw new RegraException(HttpStatus.BAD_REQUEST, "Escolha quem desafiar e o dia do duelo.");
        Usuario outro = usuarioRepository.findByUsuario(dto.usuario().trim().replaceFirst("^@", "").toLowerCase())
                .orElseThrow(() -> new RegraException(HttpStatus.NOT_FOUND, "Não encontramos esse usuário."));
        String motivo = motivoSemDuelo(eu, outro);
        if (motivo != null) throw new RegraException(HttpStatus.FORBIDDEN, motivo);

        LocalDate dia;
        try { dia = LocalDate.parse(dto.dia()); } catch (DateTimeParseException e) { throw new RegraException(HttpStatus.BAD_REQUEST, "Data inválida."); }
        LocalDate hoje = hoje();
        if (dia.isBefore(hoje)) throw new RegraException(HttpStatus.BAD_REQUEST, "Escolha hoje ou um dia futuro.");
        if (dia.isAfter(hoje.plusDays(DIAS_A_FRENTE))) throw new RegraException(HttpStatus.BAD_REQUEST, "Dá para marcar no máximo com " + DIAS_A_FRENTE + " dias de antecedência.");
        if (dia.equals(hoje)) {
            if (respostasNoDia(eu, hoje) > 0) throw new RegraException(HttpStatus.CONFLICT, "Você já respondeu hoje. Marque o duelo a partir de amanhã.");
            if (respostasNoDia(outro, hoje) > 0) throw new RegraException(HttpStatus.CONFLICT, arroba(outro) + " já respondeu hoje. Marque o duelo a partir de amanhã.");
        }
        if (dueloRepository.existeNoDia(eu, outro, dia, ATIVOS)) throw new RegraException(HttpStatus.CONFLICT, "Vocês já têm um duelo marcado para esse dia.");
        if (dueloRepository.contarEnviados(eu, StatusDuelo.PENDENTE) >= MAX_CONVITES_PENDENTES)
            throw new RegraException(HttpStatus.TOO_MANY_REQUESTS, "Você já tem " + MAX_CONVITES_PENDENTES + " convites esperando resposta. Espere alguém responder.");

        Duelo d = dueloRepository.save(new Duelo(eu, outro, dia));
        avisarDepoisDoCommit(d.getId());
        return paraDto(d, eu);
    }

    // O push sai só depois que o convite foi gravado, e em segundo plano: quem desafia não espera o celular do outro responder.
    private void avisarDepoisDoCommit(UUID dueloId) {
        Runnable enviar = () -> CompletableFuture.runAsync(() -> lembretes.avisarConvite(dueloId));
        if (!TransactionSynchronizationManager.isSynchronizationActive()) { enviar.run(); return; }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { enviar.run(); }
        });
    }

    private Duelo carregar(UUID id, Usuario eu) {
        Duelo d = dueloRepository.findById(id).orElseThrow(() -> new RegraException(HttpStatus.NOT_FOUND, "Duelo não encontrado."));
        if (!d.participa(eu.getId())) throw new RegraException(HttpStatus.FORBIDDEN, "Esse duelo não é seu.");
        atualizar(d);
        return d;
    }

    @Transactional
    public ComunidadeDTOs.Duelo aceitar(UUID id, Usuario eu) {
        Duelo d = carregar(id, eu);
        if (!d.getDesafiado().getId().equals(eu.getId())) throw new RegraException(HttpStatus.FORBIDDEN, "Só quem foi desafiado pode aceitar.");
        if (d.getStatus() == StatusDuelo.EXPIRADO)
            throw new RegraException(HttpStatus.CONFLICT, "Esse convite expirou: alguém já respondeu no dia marcado. Que tal remarcar?");
        if (d.getStatus() != StatusDuelo.PENDENTE) throw new RegraException(HttpStatus.CONFLICT, "Esse convite não está mais aberto.");
        d.setStatus(StatusDuelo.AGENDADO);
        d.setRespondidoEm(LocalDateTime.now());
        return paraDto(dueloRepository.save(d), eu);
    }

    @Transactional
    public ComunidadeDTOs.Duelo recusar(UUID id, Usuario eu) {
        Duelo d = carregar(id, eu);
        if (!d.getDesafiado().getId().equals(eu.getId())) throw new RegraException(HttpStatus.FORBIDDEN, "Só quem foi desafiado pode recusar.");
        if (d.getStatus() == StatusDuelo.PENDENTE) {
            d.setStatus(StatusDuelo.RECUSADO);
            d.setRespondidoEm(LocalDateTime.now());
            dueloRepository.save(d);
        }
        return paraDto(d, eu);
    }

    @Transactional
    public ComunidadeDTOs.Duelo cancelar(UUID id, Usuario eu) {
        Duelo d = carregar(id, eu);
        boolean comecou = d.getStatus() == StatusDuelo.AGENDADO && !d.getDia().isAfter(hoje())
                && (respostasNoDia(d.getDesafiante(), d.getDia()) > 0 || respostasNoDia(d.getDesafiado(), d.getDia()) > 0);
        if (!ATIVOS.contains(d.getStatus())) throw new RegraException(HttpStatus.CONFLICT, "Esse duelo já terminou.");
        if (comecou) throw new RegraException(HttpStatus.CONFLICT, "O duelo já começou e não pode mais ser cancelado.");
        if (d.getStatus() == StatusDuelo.PENDENTE && !d.getDesafiante().getId().equals(eu.getId()))
            throw new RegraException(HttpStatus.FORBIDDEN, "Para não aceitar, use recusar.");
        d.setStatus(StatusDuelo.CANCELADO);
        d.setRespondidoEm(LocalDateTime.now());
        return paraDto(dueloRepository.save(d), eu);
    }

    @Transactional
    public void marcarVisto(UUID id, Usuario eu) {
        Duelo d = carregar(id, eu);
        if (d.getDesafiante().getId().equals(eu.getId())) d.setVistoDesafiante(true);
        else d.setVistoDesafiado(true);
        dueloRepository.save(d);
    }

    @Transactional
    public void cancelarEntre(Usuario a, Usuario b) {
        for (Duelo d : dueloRepository.entre(a, b, ATIVOS)) {
            if (d.getStatus() == StatusDuelo.AGENDADO && !d.getDia().isAfter(hoje())) continue;
            d.setStatus(StatusDuelo.CANCELADO);
            d.setRespondidoEm(LocalDateTime.now());
            dueloRepository.save(d);
        }
    }


    private boolean atualizar(Duelo d) {
        LocalDate hoje = hoje();
        if (d.getStatus() == StatusDuelo.PENDENTE) {
            boolean vencido = d.getDia().isBefore(hoje)
                    || (d.getDia().equals(hoje) && (respostasNoDia(d.getDesafiante(), hoje) > 0 || respostasNoDia(d.getDesafiado(), hoje) > 0));
            if (vencido) { d.setStatus(StatusDuelo.EXPIRADO); dueloRepository.save(d); return true; }
        } else if (d.getStatus() == StatusDuelo.AGENDADO && d.getDia().isBefore(hoje)) {
            concluir(d);
            return true;
        }
        return false;
    }

    private void concluir(Duelo d) {
        PlacarDoDia a = placar(d.getDesafiante(), d.getDia()), b = placar(d.getDesafiado(), d.getDia());
        d.setXpDesafiante(n(a.getXp()));
        d.setXpDesafiado(n(b.getXp()));
        d.setAcertosDesafiante(n(a.getAcertos()));
        d.setAcertosDesafiado(n(b.getAcertos()));
        d.setTempoDesafiante(n(a.getTempo()));
        d.setTempoDesafiado(n(b.getTempo()));
        int comparacao = Integer.compare(n(a.getXp()), n(b.getXp()));
        if (comparacao == 0) comparacao = Integer.compare(n(a.getAcertos()), n(b.getAcertos()));
        if (comparacao == 0 && n(a.getRespostas()) > 0 && n(b.getRespostas()) > 0) comparacao = Integer.compare(n(b.getTempo()), n(a.getTempo()));
        d.setVencedorId(comparacao > 0 ? d.getDesafiante().getId() : comparacao < 0 ? d.getDesafiado().getId() : null);
        d.setStatus(StatusDuelo.CONCLUIDO);
        dueloRepository.save(d);
    }

    @Scheduled(cron = "0 2 0 * * *")
    @Transactional
    public void fecharDiasAnteriores() {
        dueloRepository.vencidos(hoje(), ATIVOS).forEach(this::atualizar);
    }


    @Transactional
    public ComunidadeDTOs.Duelos listar(Usuario eu) {
        List<Duelo> todos = dueloRepository.doUsuario(eu, EnumSet.of(StatusDuelo.PENDENTE, StatusDuelo.AGENDADO, StatusDuelo.CONCLUIDO));
        todos.forEach(this::atualizar);
        UUID id = eu.getId();
        List<ComunidadeDTOs.Duelo> recebidos = todos.stream().filter(d -> d.getStatus() == StatusDuelo.PENDENTE && d.getDesafiado().getId().equals(id)).map(d -> paraDto(d, eu)).toList();
        List<ComunidadeDTOs.Duelo> enviados = todos.stream().filter(d -> d.getStatus() == StatusDuelo.PENDENTE && d.getDesafiante().getId().equals(id)).map(d -> paraDto(d, eu)).toList();
        List<ComunidadeDTOs.Duelo> agendados = todos.stream().filter(d -> d.getStatus() == StatusDuelo.AGENDADO)
                .sorted(Comparator.comparing(Duelo::getDia)).map(d -> paraDto(d, eu)).toList();
        List<Duelo> concluidos = todos.stream().filter(d -> d.getStatus() == StatusDuelo.CONCLUIDO).toList();
        List<ComunidadeDTOs.Duelo> historico = concluidos.stream().limit(40).map(d -> paraDto(d, eu)).toList();
        return new ComunidadeDTOs.Duelos(recebidos, enviados, agendados, historico, placarDe(concluidos, id));
    }

    @Transactional
    public ComunidadeDTOs.Notificacoes notificacoes(Usuario eu, long amizades) {
        ComunidadeDTOs.Duelos tudo = listar(eu);
        LocalDate limite = hoje().minusDays(7);
        List<ComunidadeDTOs.Duelo> resultados = tudo.historico().stream()
                .filter(d -> !d.visto() && !LocalDate.parse(d.dia()).isBefore(limite)).toList();
        List<ComunidadeDTOs.Duelo> hoje = tudo.agendados().stream().filter(d -> "AO_VIVO".equals(d.status())).toList();
        return new ComunidadeDTOs.Notificacoes(amizades, tudo.recebidos().size(), tudo.recebidos(), resultados, hoje);
    }

    @Transactional
    public ComunidadeDTOs.Placar placarEntre(Usuario eu, Usuario outro) {
        List<Duelo> entre = dueloRepository.entre(eu, outro, EnumSet.of(StatusDuelo.AGENDADO, StatusDuelo.CONCLUIDO));
        entre.forEach(this::atualizar);
        return placarDe(entre.stream().filter(d -> d.getStatus() == StatusDuelo.CONCLUIDO).toList(), eu.getId());
    }

    @Transactional
    public ComunidadeDTOs.Duelo ativoEntre(Usuario eu, Usuario outro) {
        List<Duelo> ativos = dueloRepository.entre(eu, outro, ATIVOS);
        ativos.forEach(this::atualizar);
        return ativos.stream().filter(d -> ATIVOS.contains(d.getStatus())).min(Comparator.comparing(Duelo::getDia)).map(d -> paraDto(d, eu)).orElse(null);
    }

    public int[] estatisticas(Usuario u) {
        List<Duelo> c = dueloRepository.doUsuario(u, EnumSet.of(StatusDuelo.CONCLUIDO));
        int v = (int) c.stream().filter(d -> u.getId().equals(d.getVencedorId())).count();
        return new int[]{v, c.size()};
    }

    private ComunidadeDTOs.Placar placarDe(List<Duelo> concluidos, UUID eu) {
        int v = 0, der = 0, e = 0;
        for (Duelo d : concluidos) {
            if (d.getVencedorId() == null) e++;
            else if (d.getVencedorId().equals(eu)) v++;
            else der++;
        }
        return new ComunidadeDTOs.Placar(v, der, e);
    }

    private ComunidadeDTOs.UsuarioMini mini(Usuario u) {
        return new ComunidadeDTOs.UsuarioMini(u.getId(), u.getNome(), u.getUsuario(), u.getAvatar());
    }

    public ComunidadeDTOs.Duelo paraDto(Duelo d, Usuario eu) {
        boolean souDesafiante = d.getDesafiante().getId().equals(eu.getId());
        Usuario oponente = souDesafiante ? d.getDesafiado() : d.getDesafiante();
        boolean aoVivo = d.getStatus() == StatusDuelo.AGENDADO && d.getDia().equals(hoje());
        int meuXp = 0, xpOp = 0, meusAc = 0, acOp = 0, minhasR = 0, respOp = 0;
        if (aoVivo) {
            PlacarDoDia meu = placar(eu, d.getDia()), dele = placar(oponente, d.getDia());
            meuXp = n(meu.getXp()); xpOp = n(dele.getXp());
            meusAc = n(meu.getAcertos()); acOp = n(dele.getAcertos());
            minhasR = n(meu.getRespostas()); respOp = n(dele.getRespostas());
        } else if (d.getStatus() == StatusDuelo.CONCLUIDO) {
            meuXp = Objects.requireNonNullElse(souDesafiante ? d.getXpDesafiante() : d.getXpDesafiado(), 0);
            xpOp = Objects.requireNonNullElse(souDesafiante ? d.getXpDesafiado() : d.getXpDesafiante(), 0);
            meusAc = Objects.requireNonNullElse(souDesafiante ? d.getAcertosDesafiante() : d.getAcertosDesafiado(), 0);
            acOp = Objects.requireNonNullElse(souDesafiante ? d.getAcertosDesafiado() : d.getAcertosDesafiante(), 0);
        }
        String resultado = d.getStatus() != StatusDuelo.CONCLUIDO ? null
                : d.getVencedorId() == null ? "EMPATE" : d.getVencedorId().equals(eu.getId()) ? "VITORIA" : "DERROTA";
        boolean visto = souDesafiante ? d.isVistoDesafiante() : d.isVistoDesafiado();
        return new ComunidadeDTOs.Duelo(d.getId(), d.getDia().toString(), aoVivo ? "AO_VIVO" : d.getStatus().name(), souDesafiante, mini(oponente),
                meuXp, xpOp, meusAc, acOp, minhasR, respOp, resultado, visto, d.getCriadoEm() == null ? null : d.getCriadoEm().toString());
    }
}
