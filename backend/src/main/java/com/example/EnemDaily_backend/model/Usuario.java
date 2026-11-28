package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.DTO.UsuarioRequestDTO;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "tb_usuarios")
public class Usuario {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;
    private String nome;
    private String email;
    private String usuario;
    private String senha;
    private String tokenSessao;
    private int xpTotal;
    private int streak;
    @Column(columnDefinition = "integer default 0")
    private Integer maiorSequenciaAcertos = 0;
    private int diasAtivosStreak;
    private boolean demo;
    @Column(name = "pag_favorita", columnDefinition = "varchar(255) default 'nenhuma'")
    private String pagFavorita;
    @Column(columnDefinition = "boolean default true")
    private Boolean onboardingVisto = false;
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<GrupoUsuario> grupos = new ArrayList<>();
    private int questoesRespondidasTotal;
    private int questoesAcertadasTotal;
    private int semanasCompletadas;
    @Column(name = "emblemas", columnDefinition = "varchar(500) default ''")
    private String emblemas;
    private String avatar;
    @Column(columnDefinition = "boolean default false")
    private Boolean perfilPrivado = false;
    @Column(columnDefinition = "boolean default false")
    private Boolean duelosSoAmigos = false;
    /** Escola informada pelo aluno: código INEP (lista oficial) ou uma opção digitada (tb_escola_livre). */
    private Long escolaInep;
    private Long escolaLivreId;
    private boolean d1;
    private boolean d7;
    private boolean d30;
    private LocalDateTime dataCadastro;
    private LocalDate dataUtilmoAcesso;
    private boolean natRespondidaHj;
    private boolean humRespondidaHj;
    private boolean lingRespondidaHj;
    private boolean exatRespondidaHj;
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "questoesRespondidas", column = @Column(name = "nat_questoes")),
            @AttributeOverride(name = "acertos", column = @Column(name = "nat_acertos")),
            @AttributeOverride(name = "streak", column = @Column(name = "nat_streak")),
            @AttributeOverride(name = "xp", column = @Column(name = "nat_xp")),
            @AttributeOverride(name = "tempoGasto", column = @Column(name = "nat_tempo")),
            @AttributeOverride(name = "ultimaResposta", column = @Column(name = "nat_ultima_resposta")),
            @AttributeOverride(name = "acertoHoje", column = @Column(name = "nat_acerto_hoje"))
    })
    private Area naturezas;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "questoesRespondidas", column = @Column(name = "hum_questoes")),
            @AttributeOverride(name = "acertos", column = @Column(name = "hum_acertos")),
            @AttributeOverride(name = "streak", column = @Column(name = "hum_streak")),
            @AttributeOverride(name = "xp", column = @Column(name = "hum_xp")),
            @AttributeOverride(name = "tempoGasto", column = @Column(name = "hum_tempo")),
            @AttributeOverride(name = "ultimaResposta", column = @Column(name = "hum_ultima_resposta")),
            @AttributeOverride(name = "acertoHoje", column = @Column(name = "hum_acerto_hoje"))
    })
    private Area humanas;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "questoesRespondidas", column = @Column(name = "lin_questoes")),
            @AttributeOverride(name = "acertos", column = @Column(name = "lin_acertos")),
            @AttributeOverride(name = "streak", column = @Column(name = "lin_streak")),
            @AttributeOverride(name = "xp", column = @Column(name = "lin_xp")),
            @AttributeOverride(name = "tempoGasto", column = @Column(name = "lin_tempo")),
            @AttributeOverride(name = "ultimaResposta", column = @Column(name = "lin_ultima_resposta")),
            @AttributeOverride(name = "acertoHoje", column = @Column(name = "lin_acerto_hoje"))
    })
    private Area linguagens;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "questoesRespondidas", column = @Column(name = "exa_questoes")),
            @AttributeOverride(name = "acertos", column = @Column(name = "exa_acertos")),
            @AttributeOverride(name = "streak", column = @Column(name = "exa_streak")),
            @AttributeOverride(name = "xp", column = @Column(name = "exa_xp")),
            @AttributeOverride(name = "tempoGasto", column = @Column(name = "exa_tempo")),
            @AttributeOverride(name = "ultimaResposta", column = @Column(name = "exat_ultima_resposta")),
            @AttributeOverride(name = "acertoHoje", column = @Column(name = "exat_acerto_hoje"))
    })
    private Area exatas;
    public Usuario(UsuarioRequestDTO dto){
        this.nome = dto.nome();
        this.avatar = dto.avatar();
        this.email = dto.email();
        this.senha = dto.senha();
        this.usuario = dto.usuario().toLowerCase();
        this.xpTotal = 0;
        this.streak = 0;
        this.diasAtivosStreak = 1;
        this.questoesRespondidasTotal = 0;
        this.questoesAcertadasTotal = 0;
        this.naturezas = new Area();
        this.humanas = new Area();
        this.linguagens = new Area();
        this.demo = dto.demo();
        this.exatas = new Area();
        this.dataCadastro = LocalDateTime.now();
        this.dataUtilmoAcesso = LocalDate.now();
        this.natRespondidaHj = false;
        this.humRespondidaHj = false;
        this.exatRespondidaHj = false;
        this.lingRespondidaHj = false;
        this.tokenSessao = "";
        this.d1 = false;
        this.d7 = false;
        this.d30 = false;
        this.pagFavorita= "nenhuma";
        this.emblemas = "";
    }

    public void registraDadosUsuario(int xp, int tempoGasto, boolean correta){
        this.xpTotal += xp;
        LocalDate hoje = LocalDate.now();
        if(this.dataUtilmoAcesso.equals(hoje.minusDays(1))) {
            this.diasAtivosStreak ++;
        }
        else if (this.dataUtilmoAcesso == hoje){

        }
        else{
            this.diasAtivosStreak = 1;
        }
        this.dataUtilmoAcesso = hoje;
        this.questoesRespondidasTotal ++;
        if(correta){
            this.questoesAcertadasTotal ++;
            this.streak ++;
            if (this.streak > recordeDeAcertos()) this.maiorSequenciaAcertos = this.streak;
        }
        else{
            this.streak = 0;
        }
    }

    /** Maior sequência de acertos seguidos já feita (contas antigas começam pela sequência atual). */
    public int recordeDeAcertos() {
        return Math.max(this.maiorSequenciaAcertos == null ? 0 : this.maiorSequenciaAcertos, this.streak);
    }

    public String adicionaEmblema(String emblema){
        if(this.emblemas.equals("")){
            this.emblemas += emblema;
        }
        else{
            this.emblemas += "|" + emblema;
        }
        return this.emblemas;
    }

}
