package com.example.EnemDaily_backend.service;
import com.example.EnemDaily_backend.model.Area;

import com.example.EnemDaily_backend.DTO.*;
import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.Enum.EventType;
import com.example.EnemDaily_backend.Interface.AssuntoResumo;
import com.example.EnemDaily_backend.model.*;
import com.example.EnemDaily_backend.repository.EventRepository;
import com.example.EnemDaily_backend.repository.GrupoRepository;
import com.example.EnemDaily_backend.repository.GrupoUsuarioRepository;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final GrupoUsuarioRepository grupoUsuarioRepository;
    private final GrupoRepository grupoRepository;
    private final GrupoStreamService streamService;
    private final EventRepository eventRepository;
    public UsuarioService(UsuarioRepository usuarioRepository, EventRepository eventRepository, GrupoUsuarioRepository grupoUsuarioRepository, GrupoStreamService streamService, GrupoRepository grupoRepository)
    {
        this.grupoRepository = grupoRepository;
        this.usuarioRepository = usuarioRepository;
        this.grupoUsuarioRepository = grupoUsuarioRepository;
        this.eventRepository = eventRepository;
        this.streamService = streamService;
    }

    public List<UsuarioResumidoResponseDTO> getUsuarios(){
        return usuarioRepository.findAll().stream().map(u -> new UsuarioResumidoResponseDTO(u.getId(), u.getNome(), u.getUsuario())).toList();
    }

    public Usuario getById(UUID id){
        return usuarioRepository.findById(id).get();
    }

    public UsuarioResponseDTO salvaUsuario(Usuario usuario){
        this.usuarioRepository.save(usuario);
        return getUsuarioResponseDTO(usuario);
    }

    public List<com.example.EnemDaily_backend.Interface.ResumoSemanalLinha> getResumoSemanal(UUID idUsuario){
        return eventRepository.resumoSemanal(idUsuario);
    }
    public List<AssuntoResumo> getResumoAssuntos(UUID idUsuario){

        return eventRepository.resumoAssuntos(idUsuario);
    }
    @Cacheable(value = "usuariosHoje", sync = true)
    public int getUsuariosAtivosHoje() {
        System.out.println("Buscando no banco de dados... (Cache Vazio)");
        return eventRepository.countDistinctUsersRespondedToday();
    }
    @Scheduled(fixedRate = 600000)
    @CacheEvict(value = "usuariosHoje", allEntries = true)
    public void limparCacheUsuarios() {
        System.out.println("Limpando cache de usuários ativos...");
    }

    private Usuario verificaEmblemas(Usuario usuario, RespostaDTO resposta){
        if(usuario.getQuestoesRespondidasTotal() >= 1 && !usuario.getEmblemas().contains("1_respostas")){
            usuario.adicionaEmblema("1_respostas");
        }
        List<AreaEnum> areasAcertadas = eventRepository.areasAcertadasHoje(usuario.getId());
        if(areasAcertadas.size() == 4 && !usuario.getEmblemas().contains("4_dia")){
            usuario.adicionaEmblema("4_dia");
        }
        if (resposta.tempoGasto() <= 60 && resposta.acerto()) {
            String areaNome = resposta.area().name();
            if (areaNome.equals("HUMANAS")) {
                if (!usuario.getEmblemas().contains("tempo_hum")) {
                    usuario.adicionaEmblema("tempo_hum");
                }
            } else if (areaNome.equals("NATUREZAS")) {
                if (!usuario.getEmblemas().contains("tempo_nat")) {
                    usuario.adicionaEmblema("tempo_nat");
                }
            } else if (areaNome.equals("EXATAS")) {
                if (!usuario.getEmblemas().contains("tempo_mat")) {
                    usuario.adicionaEmblema("tempo_mat");
                }
            } else if (areaNome.equals("LINGUAGENS")) {
                if (!usuario.getEmblemas().contains("tempo_lin")) {
                    usuario.adicionaEmblema("tempo_lin");
                }
            }
        }
        if(usuario.getQuestoesAcertadasTotal() >= 20 && !usuario.getEmblemas().contains("20_acertos")){
            usuario.adicionaEmblema("20_acertos");
        }
        if(usuario.getNaturezas().getAcertos() >= 10 && !usuario.getEmblemas().contains("10_acertos_nat")){
            usuario.adicionaEmblema("10_acertos_nat");
        }
        if(usuario.getHumanas().getAcertos() >= 10 && !usuario.getEmblemas().contains("10_acertos_hum")){
            usuario.adicionaEmblema("10_acertos_hum");
        }

        if(usuario.getLinguagens().getAcertos() >= 10 && !usuario.getEmblemas().contains("10_acertos_lin")){
            usuario.adicionaEmblema("10_acertos_lin");
        }

        if(usuario.getExatas().getAcertos() >= 10 && !usuario.getEmblemas().contains("10_acertos_mat")){
            usuario.adicionaEmblema("10_acertos_mat");
        }
        if(usuario.getQuestoesRespondidasTotal() >= 25 && !usuario.getEmblemas().contains("25_respostas")){
            usuario.adicionaEmblema("25_respostas");
        }
        if(usuario.getQuestoesRespondidasTotal() >= 50 && !usuario.getEmblemas().contains("50_respostas")){
            usuario.adicionaEmblema("50_respostas");
        }
        if(usuario.getStreak() == 5 && !usuario.getEmblemas().contains("5_acertos_consec")){
            usuario.adicionaEmblema("5_acertos_consec");
        }
        if(usuario.getDiasAtivosStreak() == 7 && !usuario.getEmblemas().contains("7_streak")){
            usuario.adicionaEmblema("7_streak");
        }
        if(usuario.getDiasAtivosStreak() == 3 && !usuario.getEmblemas().contains("3_streak")){
            usuario.adicionaEmblema("3_streak");
        }

        return usuario;
    }

    public UsuarioResponseDTO registraResposta(RespostaDTO resposta, Usuario usuario){
        resposta.area().registraDados(usuario,resposta.xp(), resposta.tempoGasto(), resposta.acerto());
        usuario.registraDadosUsuario(resposta.xp(), resposta.tempoGasto(), resposta.acerto());
        Map<String, Object> context = new HashMap<>();
        context.put("xp", resposta.xp());
        if (resposta.xpBase() != null) context.put("xpBase", Math.max(0, Math.min(resposta.xpBase(), resposta.xp())));
        context.put("assunto", resposta.assunto());
        context.put("area", resposta.area());
        context.put("acerto", resposta.acerto());
        context.put("tempoGasto", resposta.tempoGasto());
        if (resposta.alternativa() != null) context.put("alternativa", resposta.alternativa());
        if (resposta.questaoId() != null) context.put("questaoId", resposta.questaoId());
        Event event = new Event();
        event.setIdUsuario(usuario.getId());
        event.setTipo(EventType.RESPOSTA_QUESTAO);
        event.setData(LocalDateTime.now());
        event.setJsonContext(context);
        eventRepository.save(event);
        eventRepository.flush();
        List<GrupoUsuario> gruposUsuarios = grupoUsuarioRepository.findAllByUsuario(usuario);

        setAreasRespondidasHoje(usuario);
        if (!usuario.isDemo()) usuario = this.verificaEmblemas(usuario, resposta);
        usuarioRepository.save(usuario);
        if (resposta.acerto()) {
            for (GrupoUsuario gu : gruposUsuarios) {
                Grupo grupo = gu.getGrupo();
                String areaResposta = resposta.area().toString();
                if (isGrupoCompativelComArea(grupo, areaResposta)) {
                    gu.addXp(resposta.xp());
                    adicionarAtividade(gu.getGrupo().getId(), usuario.getUsuario());
                    grupoUsuarioRepository.save(gu);
                    UUID idGrupo = grupo.getId();
                    long seq = streamService.nextSeq(idGrupo);
                    var evt = new RankingDeltaEvent(idGrupo, usuario.getUsuario(), resposta.xp(), seq);
                    streamService.publishDelta(idGrupo, evt);
                }
            }
        }
        return  getUsuarioResponseDTO(usuario);
    }
    /** Questão bônus: soma o XP ao aluno, à área e aos grupos, sem contar como questão do dia. */
    public UsuarioResponseDTO registraBonus(Usuario usuario, AreaEnum area, Long questaoId, boolean acerto, int xp, int tempo, Integer alternativa, java.time.LocalDate erradaEm) {
        if (xp > 0) {
            usuario.setXpTotal(usuario.getXpTotal() + xp);
            Area dados = switch (area) {
                case NATUREZAS -> usuario.getNaturezas();
                case HUMANAS -> usuario.getHumanas();
                case EXATAS -> usuario.getExatas();
                case LINGUAGENS -> usuario.getLinguagens();
            };
            dados.setXp(dados.getXp() + xp);
        }
        Map<String, Object> context = new HashMap<>();
        context.put("xp", xp);
        context.put("area", area);
        context.put("acerto", acerto);
        context.put("tempoGasto", tempo);
        context.put("questaoId", questaoId);
        if (alternativa != null) context.put("alternativa", alternativa);
        if (erradaEm != null) context.put("erradaEm", erradaEm.toString());
        Event event = new Event();
        event.setIdUsuario(usuario.getId());
        event.setTipo(EventType.RESPOSTA_BONUS);
        event.setData(LocalDateTime.now());
        event.setJsonContext(context);
        eventRepository.save(event);
        usuarioRepository.save(usuario);
        if (acerto && xp > 0) {
            for (GrupoUsuario gu : grupoUsuarioRepository.findAllByUsuario(usuario)) {
                Grupo grupo = gu.getGrupo();
                if (!isGrupoCompativelComArea(grupo, area.toString())) continue;
                gu.addXp(xp);
                grupoUsuarioRepository.save(gu);
                long seq = streamService.nextSeq(grupo.getId());
                streamService.publishDelta(grupo.getId(), new RankingDeltaEvent(grupo.getId(), usuario.getUsuario(), xp, seq));
            }
        }
        return getUsuarioResponseDTO(usuario);
    }

    private boolean isGrupoCompativelComArea(Grupo grupo, String area) {
        return (grupo.isHumanas() && "HUMANAS".equals(area)) ||
                (grupo.isExatas() && "EXATAS".equals(area)) ||
                (grupo.isLinguagens() && "LINGUAGENS".equals(area)) ||
                (grupo.isNaturezas() && "NATUREZAS".equals(area));
    }
    public int getDiasAtivos(UUID usuarioId) {
        return (int) eventRepository.contarDiasAtivos(usuarioId);
    }

    public List<GrupoResumidoResponseDTO> getGruposUsuario(Usuario usuario){
        List<GrupoUsuario> gruposUsuarios = grupoUsuarioRepository.findAllByUsuario(usuario);
        ;
        List<GrupoResumidoResponseDTO> gruposReponse = gruposUsuarios.stream().map(gu ->  new GrupoResumidoResponseDTO(gu.getGrupo().getNome(),getPosicaoUsuario(gu.getGrupo().getMembros(), usuario.getId()),gu.getGrupo().getId()
                , gu.getGrupo().getImg(),gu.getGrupo().getMembros().size(), gu.getGrupo().isPublico(), gu.getGrupo().isNaturezas()
                , gu.getGrupo().isHumanas(), gu.getGrupo().isLinguagens(), gu.getGrupo().isExatas())).toList();
        return gruposReponse;
    }

    public void alteraUsuario(Usuario usuario){
        usuarioRepository.save(usuario);
    }
    public UsuarioResponseDTO getUsuarioResponseDTO(Usuario usuario){
        List<Integer> dias = eventRepository.diasAtivosSemana(usuario.getId());
        Set<Integer> diasSet = new HashSet<>(dias);
        PresencaSemanalDTO presenca = new PresencaSemanalDTO(
                diasSet.contains(0),
                diasSet.contains(1),
                diasSet.contains(2),
                diasSet.contains(3),
                diasSet.contains(4),
                diasSet.contains(5),
                diasSet.contains(6)
        );
        return  new UsuarioResponseDTO(usuario.getId(),usuario.getDataUtilmoAcesso(), usuario.getPagFavorita(), usuario.getEmblemas(), usuario.getNome(), usuario.getUsuario(), usuario.getAvatar(), usuario.isDemo() && !DemoService.EMAIL.equals(usuario.getEmail()),
                usuario.getXpTotal(), eventRepository.xpHoje(usuario.getId()),  usuario.getStreak(),getStreakDiasAtivos(usuario.getId()), eventRepository.contarDiasAtivos(usuario.getId()),  usuario.getNaturezas(), usuario.getHumanas(), usuario.getLinguagens(), usuario.getExatas(),
                usuario.isHumRespondidaHj(), usuario.isExatRespondidaHj(), usuario.isLingRespondidaHj(), usuario.isNatRespondidaHj(), presenca, getXpAnoAtual(usuario.getId()), getGruposUsuario(usuario), eventRepository.maiorSequenciaDiasAtivos(usuario.getId()), !Boolean.FALSE.equals(usuario.getOnboardingVisto()), usuario.getEmail(), usuario.recordeDeAcertos());
    }
    private int calcularXpGrupo(Usuario u, Grupo g) {
        int xp = 0;
        if (g.isExatas()) xp += u.getExatas().getXp();
        if (g.isNaturezas()) xp += u.getNaturezas().getXp();
        if (g.isHumanas()) xp += u.getHumanas().getXp();
        if (g.isLinguagens()) xp += u.getLinguagens().getXp();
        return xp;
    }

    public int getStreakDiasAtivos(UUID idUsuario){
        return (int) eventRepository.sequenciaAtualDiasAtivos(idUsuario);
    }
    public int getPosicaoUsuario(List<GrupoUsuario> usuarios, UUID idUsuario) {
        usuarios.sort(Comparator.comparing(   (GrupoUsuario gu) -> calcularXpGrupo(gu.getUsuario(),gu.getGrupo())).reversed());
        for (int i = 0; i < usuarios.size(); i++) {
            System.out.println(usuarios.get(i).getUsuario().getUsuario());
            if (usuarios.get(i).getUsuario().getId().equals(idUsuario)) {
                return i + 1;
            }
        }
        return -1;
    }
    public void adicionarAtividade(UUID grupoId, String usuario) {
        Grupo grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        AtividadeRecente novaAtividade = new AtividadeRecente();
        novaAtividade.setUsuario(usuario);
        novaAtividade.setDataHora(LocalDateTime.now());
        novaAtividade.setGrupo(grupo);
        grupo.getAtividadesRecentes().add(0, novaAtividade);
        if (grupo.getAtividadesRecentes().size() > 10) {
            grupo.getAtividadesRecentes().remove(10);
        }
        grupoRepository.save(grupo);
    }
    private void setAreasRespondidasHoje(Usuario usuario) {
        List<AreaEnum> areas = eventRepository.areasRespondidasHoje(usuario.getId());
        usuario.setNatRespondidaHj(areas.contains(AreaEnum.NATUREZAS));
        usuario.setHumRespondidaHj(areas.contains(AreaEnum.HUMANAS));
        usuario.setLingRespondidaHj(areas.contains(AreaEnum.LINGUAGENS));
        usuario.setExatRespondidaHj(areas.contains(AreaEnum.EXATAS));
    }
    public List<XpAnoAreasDTO> getXpAnoAtual(UUID usuarioId) {
        return eventRepository.xpPorMesAnoAtual(usuarioId).stream()
                .map(r -> new XpAnoAreasDTO(
                        ((Number) r[0]).intValue(),
                        ((Number) r[1]).intValue(),
                        ((Number) r[2]).intValue(),
                        ((Number) r[3]).intValue(),
                        ((Number) r[4]).intValue()
                ))
                .toList();
    }
}
