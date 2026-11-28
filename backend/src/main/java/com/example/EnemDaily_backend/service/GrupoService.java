package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.*;
import com.example.EnemDaily_backend.model.AtividadeRecente;
import com.example.EnemDaily_backend.model.Grupo;
import com.example.EnemDaily_backend.model.GrupoUsuario;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.EventRepository;
import com.example.EnemDaily_backend.repository.GrupoRepository;
import com.example.EnemDaily_backend.repository.GrupoUsuarioRepository;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class GrupoService {
    private final GrupoRepository grupoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final EventRepository eventRepository;
    private final GrupoUsuarioRepository grupoUsuarioRepository;
    public GrupoService(GrupoRepository grupoRepository, UsuarioRepository usuarioRepository, GrupoUsuarioRepository grupoUsuarioRepository, EventRepository eventRepository, UsuarioService usuarioService){
        this.usuarioRepository = usuarioRepository;
        this.grupoRepository = grupoRepository;
        this.grupoUsuarioRepository = grupoUsuarioRepository;
        this.eventRepository = eventRepository;
        this.usuarioService = usuarioService;
    }
    @Scheduled(cron = "0 0 0 1 * *")
    @Transactional
    public void processarCampeoesMensais(){
        List<Grupo> grupos = grupoRepository.findAll();
        for(Grupo grupo: grupos){
            processaMelhorDoMes(grupo.getId());
        }
    }
    public boolean atualizaGrupo(AlteraGrupoDTO dto){
        Grupo grupo = grupoRepository.findById(dto.id())  .orElseThrow(() -> new RuntimeException("Grupo nao encontrado"));
        grupo.setNome(dto.nome());
        grupo.setImg(dto.img());
        grupo.setAdmVisivel(dto.admVisivel());
        grupoRepository.save(grupo);
        return true;
    }
    public PodioGrupoResponseDTO getMelhoresDoMes(UUID idGrupo, UUID idUsuario){
        String retorno = "";
        YearMonth mesPassado= YearMonth.now().minusMonths(1);
        LocalDateTime fimMes = mesPassado.atEndOfMonth().atTime(23, 59, 59, 999_999_999);
        LocalDateTime inicioMes = mesPassado.atDay(1).atStartOfDay();
        List<GrupoUsuario> result = grupoUsuarioRepository.buscarPodioDoMes(idGrupo, inicioMes, fimMes,3) ;
        List<UsuarioPodioDTO> usuariosPodio = result.stream().limit(3).map(gu -> new UsuarioPodioDTO(gu.getUsuario().getUsuario(), gu.getXpMensal(), gu.getUsuario().getAvatar())).toList();
        int posicao = 0;
        for (int i =0; i < result.size(); i++){
            if(result.get(i).getUsuario().getId().equals(idUsuario)){
                posicao = i+1;
            }
        }
        return new PodioGrupoResponseDTO(posicao, usuariosPodio);
    }
    /** Até quantos pontos de XP de diferença o destaque de ontem é decidido no desempate. */
    static final int FAIXA_EMPATE_XP = 5;

    private record Ontem(GrupoUsuario gu, int xpOntem, int xpHoje, int tempoMedio) {
        int xpFimOntem() { return Math.max(0, gu.getXp() - xpHoje); }
        int xpInicioOntem() { return Math.max(0, xpFimOntem() - xpOntem); }
    }

    /**
     * Destaque de ontem: mais XP; se outros ficaram a até 5 XP, vence quem mais subiu no ranking geral ao longo
     * de ontem e, depois, o menor tempo médio. Vazio quando ninguém do grupo pontuou ontem.
     */
    @Transactional
    public Optional<DestaqueOntemDTO> destaqueOntem(UUID idGrupo) {
        Grupo grupo = grupoRepository.findById(idGrupo).orElseThrow(() -> new RuntimeException("grupo não encontrado"));
        Map<UUID, Object[]> linhas = new HashMap<>();
        for (Object[] l : eventRepository.resumoOntemNoGrupo(idGrupo)) linhas.put(UUID.fromString(String.valueOf(l[0])), l);

        List<Ontem> membros = grupoUsuarioRepository.findAllByGrupo(grupo).stream()
                .filter(gu -> grupo.isAdmVisivel() || !gu.isAdmin())
                .map(gu -> {
                    Object[] l = linhas.get(gu.getUsuario().getId());
                    if (l == null) return new Ontem(gu, 0, 0, 0);
                    int respostas = ((Number) l[4]).intValue();
                    int tempo = ((Number) l[3]).intValue();
                    return new Ontem(gu, ((Number) l[1]).intValue(), ((Number) l[2]).intValue(), respostas > 0 ? Math.round((float) tempo / respostas) : 0);
                }).toList();

        List<Ontem> pontuaram = membros.stream().filter(m -> m.xpOntem() > 0).toList();
        if (pontuaram.isEmpty()) return Optional.empty();

        Map<Ontem, Integer> ganho = new HashMap<>();
        Map<Ontem, Integer> posicaoFim = new HashMap<>();
        for (Ontem m : pontuaram) {
            int antes = 1 + (int) membros.stream().filter(o -> o != m && o.xpInicioOntem() > m.xpInicioOntem()).count();
            int depois = 1 + (int) membros.stream().filter(o -> o != m && o.xpFimOntem() > m.xpFimOntem()).count();
            ganho.put(m, Math.max(0, antes - depois));
            posicaoFim.put(m, depois);
        }

        int topo = pontuaram.stream().mapToInt(Ontem::xpOntem).max().orElse(0);
        // Sem tempo registrado conta como o mais lento no desempate.
        Comparator<Ontem> tempo = Comparator.comparingInt(m -> m.tempoMedio() > 0 ? m.tempoMedio() : Integer.MAX_VALUE);
        List<Ontem> faixa = pontuaram.stream()
                .filter(m -> m.xpOntem() >= topo - FAIXA_EMPATE_XP)
                .sorted(Comparator.<Ontem>comparingInt(ganho::get).reversed()
                        .thenComparing(tempo)
                        .thenComparing(Comparator.comparingInt(Ontem::xpOntem).reversed()))
                .toList();

        Ontem v = faixa.get(0);
        String desempate = null;
        if (faixa.size() > 1) {
            Ontem segundo = faixa.get(1);
            if (!ganho.get(v).equals(ganho.get(segundo))) desempate = "posicoes";
            else if (tempo.compare(v, segundo) != 0) desempate = "tempo";
        }
        Usuario u = v.gu().getUsuario();
        return Optional.of(new DestaqueOntemDTO(u.getId(), u.getUsuario(), u.getAvatar(),
                LocalDate.now(ZoneId.of("America/Sao_Paulo")).minusDays(1), v.xpOntem(), ganho.get(v), posicaoFim.get(v),
                v.tempoMedio(), desempate, pontuaram.size()));
    }

    public void processaMelhorDoMes(UUID idGrupo){
        LocalDateTime fimMes = LocalDateTime.now();
        LocalDateTime inicioMes = fimMes.minusMonths(1).withDayOfMonth(1).withHour(0).withMinute(0);
        List<GrupoUsuario> result = grupoUsuarioRepository.buscarPodioDoMes(idGrupo, inicioMes, fimMes,1) ;
        if(!result.isEmpty()){
            GrupoUsuario campeao = result.get(0);
            campeao.setXpMensal(0);
            campeao.addTituloMensal();
            Usuario usuario = campeao.getUsuario();
            if(!usuario.getEmblemas().contains("campeao_mes")){
                usuario.adicionaEmblema("campeao_mes");
                usuarioRepository.save(usuario);
            }

            grupoUsuarioRepository.save(campeao);
        }

    }
    @Transactional
    public NovoGrupoResponseDTO salvaGrupo(GrupoRequestDTO dto, UUID idAdm){
        Grupo grupo = new Grupo(dto, idAdm);
        grupo = grupoRepository.save(grupo);
        Usuario admin = usuarioRepository.findById(idAdm)
                .orElseThrow(() -> new RuntimeException("Usuário admin não encontrado"));
        GrupoUsuario grupoUsuario = new GrupoUsuario();
        grupoUsuario.setGrupo(grupo);
        grupoUsuario.setUsuario(admin);
        grupoUsuario.setAdmin(true);
        grupoUsuario.setDataEntrada(LocalDateTime.now());
        GrupoUsuario novoGrupoUsuario =   grupoUsuarioRepository.save(grupoUsuario);
        grupoUsuarioRepository.flush();
        return new NovoGrupoResponseDTO(grupo.getId(), usuarioService.getUsuarioResponseDTO(novoGrupoUsuario.getUsuario()));
    }

    public void deletaGrupo(UUID id){
        this.grupoRepository.deleteById(id);
    }
    public List<GrupoResumidoResponseDTO> getGruposPublicos(UUID idUsuario){
        List<Grupo> grupos = grupoRepository.findAllByPublico(true);
        List<GrupoResumidoResponseDTO> gruposReponse = grupos.stream().map(g ->  new GrupoResumidoResponseDTO(g.getNome(), usuarioService.getPosicaoUsuario(g.getMembros(), idUsuario), g.getId()
                , g.getImg(),g.getMembros().size(), g.isPublico(), g.isNaturezas()
                , g.isHumanas(), g.isLinguagens(), g.isExatas())).toList();
        return gruposReponse;
    }
    public GrupoResponseDTO getGrupo(UUID id){
        Grupo grupo = grupoRepository.findById(id)  .orElseThrow(() -> new RuntimeException("grupo não encontrado"));
        List<GrupoUsuario> usuariosGrupo = grupoUsuarioRepository.findAllByGrupo(grupo);
        System.out.println("Grupo encontrado:" + grupo.getNome());
        List<UsuarioGrupoResponseDTO> usuariosResponse = usuariosGrupo.stream().map(gu -> new UsuarioGrupoResponseDTO(gu.getUsuario().getId(), gu.isAdmin(),gu.getUsuario().getEmblemas(),  gu.getUsuario().getUsuario()
                                                                                                                        ,gu.getUsuario().getAvatar()
                                                                                                                        , gu.getUsuario().getXpTotal()
                                                                                                                        , gu.getXp()
                                                                                                                        , gu.getUsuario().getStreak()
                                                                                                                        , calcularTempoMedioGrupo(gu.getUsuario(), gu.getGrupo())
                                                                                                                        , eventRepository.xpSemanalNoGrupo(gu.getUsuario().getId(), gu.getGrupo().getId())
                                                                                                                        , eventRepository.xpMensalNoGrupo(gu.getUsuario().getId(), gu.getGrupo().getId())
                                                                                                                        , eventRepository.xpHojeNoGrupo(gu.getUsuario().getId(), gu.getGrupo().getId())
                                                                                                                        , eventRepository.sequenciaAtualDiasAtivos(gu.getUsuario().getId())
                                                                                                                        , gu.getTitulosMensais()
                                                                                                                        , gu.getUsuario().getLinguagens().getAcertos()
                                                                                                                        , gu.getUsuario().getHumanas().getAcertos()
                                                                                                                        , gu.getUsuario().getNaturezas().getAcertos()
                                                                                                                        , gu.getUsuario().getExatas().getAcertos()
                                                                                                                        , eventRepository.contarDiasAtivos(gu.getUsuario().getId())
                                                                                                                        , eventRepository.primeiraRespostaHoje(gu.getUsuario().getId()))).toList();
        return new GrupoResponseDTO(
                grupo.getNome(),
                grupo.getId(),
                grupo.getIdAdm(),
                grupo.isAdmVisivel(),
                grupo.getDataCriacao(),
                grupo.getImg(),
                grupo.isPublico(),
                grupo.isNaturezas(),
                grupo.isHumanas(),
                grupo.isLinguagens(),
                grupo.isExatas(),
                usuariosResponse,
                grupo.getAtividadesRecentes()
        );
    }
    public void deletaUsuarioGrupoBrasil(UUID idUsuario){
        UUID idGrupo = UUID.fromString("16599b34-57a9-41e3-b1cb-eb255671c3f1");
        Grupo grupo = grupoRepository.findById(idGrupo) .orElseThrow(() -> new RuntimeException("grupo nao encontrado"));;
        Usuario usuario = usuarioRepository.findById(idUsuario) .orElseThrow(() -> new RuntimeException("usuario nao encontrado"));
        GrupoUsuario grupoUsuario = grupoUsuarioRepository.findGrupoUsuarioByUsuarioAndGrupo(usuario,grupo);
        if (grupoUsuario != null) {
            grupoUsuarioRepository.delete(grupoUsuario);
            grupoUsuarioRepository.flush();
        }
    }

    public void tornaUsuarioAdmBr(UUID idUsuario){
        UUID idGrupo = UUID.fromString("16599b34-57a9-41e3-b1cb-eb255671c3f1");
        Grupo grupo = grupoRepository.findById(idGrupo) .orElseThrow(() -> new RuntimeException("grupo nao encontrado"));;
        Usuario usuario = usuarioRepository.findById(idUsuario) .orElseThrow(() -> new RuntimeException("usuario nao encontrado"));
        GrupoUsuario grupoUsuario = grupoUsuarioRepository.findGrupoUsuarioByUsuarioAndGrupo(usuario,grupo);
        if (grupoUsuario != null) {
            grupoUsuario.setAdmin(true);
            grupoUsuarioRepository.save(grupoUsuario);
            grupo.setIdAdm(idUsuario);
            grupoRepository.save(grupo);
            grupoUsuarioRepository.flush();
        }
    }
    public List<GrupoResumidoResponseDTO> deletaUsuarioGrupo(UUID idGrupo, UUID idUsuario){
        Grupo grupo = grupoRepository.findById(idGrupo) .orElseThrow(() -> new RuntimeException("grupo nao encontrado"));;
        Usuario usuario = usuarioRepository.findById(idUsuario) .orElseThrow(() -> new RuntimeException("usuario nao encontrado"));
        GrupoUsuario grupoUsuario = grupoUsuarioRepository.findGrupoUsuarioByUsuarioAndGrupo(usuario,grupo);
        if (grupoUsuario != null) {
            grupoUsuarioRepository.delete(grupoUsuario);
            grupoUsuarioRepository.flush();
        }
        return this.usuarioService.getGruposUsuario(usuario);
    }
    private int calcularXpGrupo(Usuario u, Grupo g) {
        int xp = 0;

        if (g.isExatas()) xp += u.getExatas().getXp();
        if (g.isNaturezas()) xp += u.getNaturezas().getXp();
        if (g.isHumanas()) xp += u.getHumanas().getXp();
        if (g.isLinguagens()) xp += u.getLinguagens().getXp();

        return xp;
    }

    private int calcularTempoMedioGrupo(Usuario u, Grupo g) {
        int tempo = 0;
        int qntQuestoes = 0;

        if (g.isExatas()){
            tempo += u.getExatas().getTempoGasto();
            qntQuestoes += u.getExatas().getQuestoesRespondidas();
        }
        if (g.isNaturezas()){
            tempo += u.getNaturezas().getTempoGasto();
            qntQuestoes += u.getNaturezas().getQuestoesRespondidas();
        }
        if (g.isHumanas()){
            tempo += u.getHumanas().getTempoGasto();
            qntQuestoes += u.getHumanas().getQuestoesRespondidas();
        }
        if (g.isLinguagens()){
            tempo += u.getLinguagens().getTempoGasto();
            qntQuestoes += u.getLinguagens().getQuestoesRespondidas();
        }
        System.out.println("tempo:" + tempo);
        System.out.println("questoes:" + qntQuestoes);
        if(tempo == 0 || qntQuestoes == 0){
            return 0;
        }
        int media = tempo / qntQuestoes;

        return media;
    }
    public GrupoResponseDTO addUsuarioGrupo(UUID idUsuario, UUID idGrupo){
        GrupoUsuario novoGrupoUsuario = new GrupoUsuario();
        Usuario usuario = this.usuarioRepository.findById(idUsuario).orElseThrow(() -> new RuntimeException("Usuario não encontrado"));
        Grupo grupo = grupoRepository.findById(idGrupo).orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        if(grupoUsuarioRepository.existsByUsuarioAndGrupo(usuario,grupo)){
            throw new RuntimeException("Usuario ja está presente no grupo");
        }
        novoGrupoUsuario.setGrupo(grupo);
        novoGrupoUsuario.setUsuario(usuario);
        novoGrupoUsuario.setDataEntrada(LocalDateTime.now());
        novoGrupoUsuario.setAdmin(false);
        grupoUsuarioRepository.save(novoGrupoUsuario);
        grupoUsuarioRepository.flush();
        return getGrupo(grupo.getId());
    }
}
