import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthServiceService } from '../services/auth-service.service';
import { QuestaoServiceService } from '../services/questao-service.service';
import { UsuarioService } from '../services/usuario.service';
import { AREAS, ChaveArea, InfoArea, formatarNumero } from '../shared/dia';
import { contagemEnem } from '../shared/enem';
import { IconeComponent } from '../shared/icone/icone.component';
import { SimboloDiaComponent } from '../shared/simbolo-dia/simbolo-dia.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { CampusComponent } from '../shared/campus/campus.component';
import { EspadasComponent } from '../shared/duelo/espadas.component';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { CelularComponent } from './celular/celular.component';
import { MockSimuladosComponent } from './mocks/mock-simulados.component';
import { MockRedacoesComponent } from './mocks/mock-redacoes.component';
import { QuestaoExemploComponent } from './exemplo/questao-exemplo.component';
import { Progresso, calcularProgresso } from '../shared/campus/campus';
import { ExtrasCampus } from '../shared/campus/especiais';

interface LinhaHero { info: InfoArea; assunto: string | null; }

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, IconeComponent, SimboloDiaComponent, CarregandoComponent, CampusComponent, EspadasComponent, AvatarComponent, CelularComponent, MockSimuladosComponent, MockRedacoesComponent, QuestaoExemploComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy {
  private auth = inject(AuthServiceService);
  private questoes = inject(QuestaoServiceService);
  private usuarios = inject(UsuarioService);
  private subs = new Subscription();

  readonly formatarNumero = formatarNumero;
  readonly contagem = contagemEnem();
  readonly ano = new Date().getFullYear();
  linhas: LinhaHero[] = AREAS.map(info => ({ info, assunto: null }));
  carregados = 0;
  respondentes = 0;
  tempoRestante = '';
  exemplo: ChaveArea | null = null;

  /** Quanto tempo cada etapa fica na tela. A de 3 meses é a mais longa: além das peças, os prédios grandes chegam um depois do outro. */
  readonly etapasCampus: { rotulo: string; progresso: Progresso; extras: ExtrasCampus; ms: number }[] = [
    this.etapa_('1º dia', [1, 1, 0, 1], 1, 3200),
    this.etapa_('4º dia', [3, 3, 3, 3], 4, 3800),
    this.etapa_('20º dia', [16, 15, 15, 14], 20, 5200),
    this.etapa_('1 mês', [23, 23, 22, 22], 30, 6000),
    this.etapa_('3 meses', [70, 68, 67, 65], 90, 16000)
  ];
  private proximaEtapa?: ReturnType<typeof setTimeout>;
  etapa = 0;
  readonly rankingDemo = [
    { nome: 'Marina', avatar: 'ed1|ameixa|arcos|prata|medicina||', xp: '2.480', pct: 100 },
    { nome: 'Rafael', avatar: 'ed1|caneta|orbita|bronze|engenharia||', xp: '2.315', pct: 93 },
    { nome: 'Bia', avatar: 'ed1|humanas|pontos|nenhuma||', xp: '1.960', pct: 79 },
    { nome: 'Caio', avatar: 'ed1|matematica|diagonal|nenhuma||', xp: '1.720', pct: 69 }
  ];

  get campusAgora() { return this.etapasCampus[this.etapa]; }

  private etapa_(rotulo: string, a: number[], dias: number, ms: number) {
    const acertos = { linguagens: a[0], humanas: a[1], naturezas: a[2], exatas: a[3] };
    return { rotulo, ms, progresso: calcularProgresso({ acertos, diasAtivos: dias }), extras: { acertos: a.reduce((x, y) => x + y, 0), simulados: 0, redacoes: 0, maiorSequencia: dias, diasAtivos: dias } };
  }
  get diasEnem(): number | null { return this.contagem && !this.contagem.hoje ? this.contagem.dias : null; }
  get anoEnem(): number { return this.contagem?.edicao.ano ?? new Date().getFullYear(); }

  ngOnInit() {
    this.relogio();
    this.subs.add(interval(1000).subscribe(() => this.relogio()));
    this.agendarEtapa();
    this.usuarios.getUsuariosHoje().subscribe({ next: n => (this.respondentes = (n ?? 0) * 3), error: () => {} });
    for (const l of this.linhas) {
      this.questoes.getQuestaoDoDia(l.info.chave).subscribe({
        next: q => { l.assunto = q?.assunto ?? null; this.carregados++; },
        error: () => this.carregados++
      });
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    clearTimeout(this.proximaEtapa);
  }

  private agendarEtapa() {
    this.proximaEtapa = setTimeout(() => {
      this.etapa = (this.etapa + 1) % this.etapasCampus.length;
      this.agendarEtapa();
    }, this.campusAgora.ms);
  }

  private relogio() {
    const agora = new Date(), meia = new Date();
    meia.setHours(24, 0, 0, 0);
    const s = Math.max(0, Math.floor((meia.getTime() - agora.getTime()) / 1000));
    const p = (n: number) => String(n).padStart(2, '0');
    this.tempoRestante = `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
  }

  responder(area: ChaveArea = 'linguagens') {
    this.exemplo = area;
  }

  criarConta() { this.auth.open(); }

  irPara(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
