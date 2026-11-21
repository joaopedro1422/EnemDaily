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

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
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
