package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.comunidade.ComunidadeDTOs;
import com.example.EnemDaily_backend.Enum.StatusAmizade;
import com.example.EnemDaily_backend.model.Amizade;
import com.example.EnemDaily_backend.model.Bloqueio;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.AmizadeRepository;
import com.example.EnemDaily_backend.repository.BloqueioRepository;
import com.example.EnemDaily_backend.repository.EventRepository;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class ComunidadeService {
    private final UsuarioRepository usuarioRepository;
    private final AmizadeRepository amizadeRepository;
    private final BloqueioRepository bloqueioRepository;
    private final EventRepository eventRepository;
    private final DueloService dueloService;
    private final EscolaService escolaService;

    public ComunidadeService(UsuarioRepository usuarioRepository, AmizadeRepository amizadeRepository, BloqueioRepository bloqueioRepository,
                             EventRepository eventRepository, DueloService dueloService, EscolaService escolaService) {
        this.escolaService = escolaService;
        this.usuarioRepository = usuarioRepository;
        this.amizadeRepository = amizadeRepository;
        this.bloqueioRepository = bloqueioRepository;
        this.eventRepository = eventRepository;
        this.dueloService = dueloService;
    }


    public Usuario porArroba(String usuario) {
        String chave = usuario == null ? "" : usuario.trim().replaceFirst("^@", "").toLowerCase();
        return usuarioRepository.findByUsuario(chave)
                .filter(u -> !u.isDemo())
                .orElseThrow(() -> new RegraException(HttpStatus.NOT_FOUND, "Não encontramos @" + chave + "."));
    }

    private Usuario recarregar(Usuario u) {
        return usuarioRepository.findById(u.getId()).orElseThrow(() -> new RegraException(HttpStatus.UNAUTHORIZED, "Sessão expirada."));
    }

    private ComunidadeDTOs.UsuarioMini mini(Usuario u) {
        return new ComunidadeDTOs.UsuarioMini(u.getId(), u.getNome(), u.getUsuario(), u.getAvatar());
    }

    private static int acertos(com.example.EnemDaily_backend.model.Area a) { return a == null ? 0 : a.getAcertos(); }

    public String relacao(Usuario eu, Usuario outro) {
        if (eu.getId().equals(outro.getId())) return "EU";
        if (bloqueioRepository.findByBloqueadorAndBloqueado(eu, outro).isPresent()) return "BLOQUEADO";
        return amizadeRepository.entre(eu, outro)
                .map(a -> a.getStatus() == StatusAmizade.ACEITA ? "AMIGOS" : a.getSolicitante().getId().equals(eu.getId()) ? "ENVIADA" : "RECEBIDA")
                .orElse("NENHUMA");
    }

    private ComunidadeDTOs.UsuarioComunidade cartao(Usuario eu, Usuario u) {
        return new ComunidadeDTOs.UsuarioComunidade(u.getId(), u.getNome(), u.getUsuario(), u.getAvatar(), u.getXpTotal(),
                eventRepository.sequenciaAtualDiasAtivos(u.getId()), relacao(eu, u), Boolean.TRUE.equals(u.getPerfilPrivado()));
    }


    @Transactional(readOnly = true)
    public List<ComunidadeDTOs.UsuarioComunidade> buscar(Usuario eu, String termo) {
        String q = termo == null ? "" : termo.trim().replaceFirst("^@", "").replaceAll("[%_\\\\]", "");
        if (q.length() < 2) return List.of();
        Set<UUID> escondidos = new HashSet<>(bloqueioRepository.quemBloqueou(eu));
        return usuarioRepository.buscar(q, PageRequest.of(0, 24)).stream()
                .filter(u -> !escondidos.contains(u.getId()))
                .limit(20)
                .map(u -> cartao(eu, u))
                .toList();
    }

    @Transactional
    public ComunidadeDTOs.PerfilPublico perfil(Usuario eu, String usuario) {
        Usuario u = porArroba(usuario);
        if (!u.getId().equals(eu.getId()) && bloqueioRepository.findByBloqueadorAndBloqueado(u, eu).isPresent())
            throw new RegraException(HttpStatus.NOT_FOUND, "Não encontramos @" + u.getUsuario() + ".");
        String rel = relacao(eu, u);
        boolean privado = Boolean.TRUE.equals(u.getPerfilPrivado());
        boolean veCampus = !privado || "AMIGOS".equals(rel) || "EU".equals(rel);
        UUID amizadeId = amizadeRepository.entre(eu, u).map(Amizade::getId).orElse(null);
        boolean eu0 = "EU".equals(rel);
        String motivo = eu0 ? null : dueloService.motivoSemDuelo(eu, u);
        ComunidadeDTOs.Disponibilidade disp = eu0 || motivo != null ? null : dueloService.disponibilidade(eu, u);
        int[] est = dueloService.estatisticas(u);
        return new ComunidadeDTOs.PerfilPublico(
                u.getId(), u.getNome(), u.getUsuario(), u.getAvatar(), u.getXpTotal(), veCampus ? u.getEmblemas() : "",
                eventRepository.sequenciaAtualDiasAtivos(u.getId()), eventRepository.maiorSequenciaDiasAtivos(u.getId()),
                veCampus ? eventRepository.contarDiasAtivos(u.getId()) : 0, veCampus,
                veCampus ? acertos(u.getLinguagens()) : 0, veCampus ? acertos(u.getHumanas()) : 0,
                veCampus ? acertos(u.getNaturezas()) : 0, veCampus ? acertos(u.getExatas()) : 0,
                rel, amizadeId, privado,
                !eu0 && motivo == null, motivo, disp != null && disp.hoje(),
                eu0 ? new ComunidadeDTOs.Placar(0, 0, 0) : dueloService.placarEntre(eu, u),
                eu0 ? null : dueloService.ativoEntre(eu, u),
                est[0], est[1],
                veCampus ? escolaService.minha(u).map(EscolaService.Opcao::nome).orElse(null) : null);
    }


    @Transactional(readOnly = true)
    public List<ComunidadeDTOs.UsuarioComunidade> amigos(Usuario eu) {
        return amizadeRepository.doUsuario(eu, StatusAmizade.ACEITA).stream()
                .map(a -> a.getSolicitante().getId().equals(eu.getId()) ? a.getDestinatario() : a.getSolicitante())
                .map(u -> cartao(eu, u))
                .toList();
    }

    @Transactional
    public ComunidadeDTOs.Solicitacoes solicitacoes(Usuario eu) {
        var recebidas = amizadeRepository.recebidasPendentes(eu).stream()
                .map(a -> new ComunidadeDTOs.SolicitacaoAmizade(a.getId(), mini(a.getSolicitante()), a.getCriadaEm().toString())).toList();
        var enviadas = amizadeRepository.enviadasPendentes(eu).stream()
                .map(a -> new ComunidadeDTOs.SolicitacaoAmizade(a.getId(), mini(a.getDestinatario()), a.getCriadaEm().toString())).toList();
        var duelos = dueloService.listar(eu);
        return new ComunidadeDTOs.Solicitacoes(recebidas, enviadas, duelos.recebidos(), duelos.enviados());
    }

    @Transactional
    public ComunidadeDTOs.Notificacoes notificacoes(Usuario eu) {
        return dueloService.notificacoes(eu, amizadeRepository.contarRecebidasPendentes(eu));
    }

    @Transactional
    public String solicitarAmizade(Usuario eu, String usuario) {
        Usuario outro = porArroba(usuario);
        if (outro.getId().equals(eu.getId())) throw new RegraException(HttpStatus.BAD_REQUEST, "Você não pode se adicionar.");
        if (bloqueioRepository.existeEntre(eu, outro)) throw new RegraException(HttpStatus.FORBIDDEN, "Não é possível adicionar essa pessoa.");
        Optional<Amizade> existente = amizadeRepository.entre(eu, outro);
        if (existente.isPresent()) {
            Amizade a = existente.get();
            if (a.getStatus() == StatusAmizade.PENDENTE && a.getDestinatario().getId().equals(eu.getId())) {
                a.setStatus(StatusAmizade.ACEITA);
                a.setRespondidaEm(LocalDateTime.now());
                amizadeRepository.save(a);
                return "AMIGOS";
            }
            return relacao(eu, outro);
        }
        amizadeRepository.save(new Amizade(eu, outro));
        return "ENVIADA";
    }

    @Transactional
    public void aceitarAmizade(Usuario eu, UUID id) {
        Amizade a = amizadeRepository.findById(id).orElseThrow(() -> new RegraException(HttpStatus.NOT_FOUND, "Solicitação não encontrada."));
        if (!a.getDestinatario().getId().equals(eu.getId())) throw new RegraException(HttpStatus.FORBIDDEN, "Essa solicitação não é para você.");
        if (a.getStatus() == StatusAmizade.ACEITA) return;
        a.setStatus(StatusAmizade.ACEITA);
        a.setRespondidaEm(LocalDateTime.now());
        amizadeRepository.save(a);
    }

    @Transactional
    public void removerAmizade(Usuario eu, UUID id) {
        Amizade a = amizadeRepository.findById(id).orElseThrow(() -> new RegraException(HttpStatus.NOT_FOUND, "Solicitação não encontrada."));
        if (!a.getSolicitante().getId().equals(eu.getId()) && !a.getDestinatario().getId().equals(eu.getId()))
            throw new RegraException(HttpStatus.FORBIDDEN, "Essa amizade não é sua.");
        amizadeRepository.delete(a);
    }


    @Transactional
    public void bloquear(Usuario eu, String usuario) {
        Usuario outro = porArroba(usuario);
        if (outro.getId().equals(eu.getId())) throw new RegraException(HttpStatus.BAD_REQUEST, "Você não pode se bloquear.");
        if (bloqueioRepository.findByBloqueadorAndBloqueado(eu, outro).isEmpty()) bloqueioRepository.save(new Bloqueio(eu, outro));
        amizadeRepository.entre(eu, outro).ifPresent(amizadeRepository::delete);
        dueloService.cancelarEntre(eu, outro);
    }

    @Transactional
    public void desbloquear(Usuario eu, String usuario) {
        Usuario outro = porArroba(usuario);
        bloqueioRepository.findByBloqueadorAndBloqueado(eu, outro).ifPresent(bloqueioRepository::delete);
    }

    @Transactional(readOnly = true)
    public ComunidadeDTOs.Privacidade privacidade(Usuario eu) {
        Usuario u = recarregar(eu);
        return new ComunidadeDTOs.Privacidade(Boolean.TRUE.equals(u.getPerfilPrivado()), Boolean.TRUE.equals(u.getDuelosSoAmigos()));
    }

    @Transactional
    public ComunidadeDTOs.Privacidade salvarPrivacidade(Usuario eu, ComunidadeDTOs.Privacidade p) {
        Usuario u = recarregar(eu);
        u.setPerfilPrivado(p.perfilPrivado());
        u.setDuelosSoAmigos(p.duelosSoAmigos());
        usuarioRepository.save(u);
        return new ComunidadeDTOs.Privacidade(p.perfilPrivado(), p.duelosSoAmigos());
    }
}
