import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { SomService } from '../shared/som/som.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import confetti from 'canvas-confetti';
import { Emblema, EMBLEMAS_MOCK, Usuario } from '../models/usuario';
import { Correcao, Questao } from '../models/questao';
import { HttpErrorResponse } from '@angular/common/http';
import { QuestaoServiceService } from '../services/questao-service.service';
import { AuthServiceService } from '../services/auth-service.service';
import { RankingStoreServiceService } from '../services/ranking-store-service.service';
import { Alert } from '../alerts';
import { IconeComponent } from '../shared/icone/icone.component';
import { EstruturasPremiumService, acertosTotais } from '../services/estruturas-premium.service';
import { NovoEmblemaComponent } from '../modal/novo-emblema/novo-emblema.component';
import { TextoBaseComponent } from '../shared/questao/texto-base.component';
import { ResolucaoComponent } from '../shared/questao/resolucao.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { ResumoDiaComponent, ResultadoArea } from '../shared/resumo-dia/resumo-dia.component';
import { AREAS, ChaveArea, InfoArea, hojeISO } from '../shared/dia';
import { nomeDoNivel } from '../shared/campus/acabamentos';
import { NEGOCIOS, negociosAbertos } from '../shared/campus/alimentacao';
import { nivelAcabamento, Peca, Progresso, TOTAL_PECAS, caixaEm, novasPecas, paletaDe, progressoDoUsuario, proximaPeca, regiao, renderizarCampus, totalDePecas } from '../shared/campus/campus';

export type AreaKey = ChaveArea;
type Fase = 'capa' | 'prova' | 'corrigindo' | 'resultado';

interface PecaNova {
  nome: string;
  regiao: string;
  cor: string;
  svg: SafeHtml;
  noite: boolean;
  numero: number;
  extras: string[];
}

interface PecaEspera {
  nome: string;
  regiao: string;
  cor: string;
}

const TEMPO_TOTAL = 210;

@Component({
  selector: 'app-desafio',
  imports: [IconeComponent, CarregandoComponent, NovoEmblemaComponent, TextoBaseComponent, ResolucaoComponent, ResumoDiaComponent],
  templateUrl: './desafio.component.html',
  styleUrl: './desafio.component.css'
})
export class DesafioComponent implements OnInit, OnDestroy {
  area!: ChaveArea;
  info!: InfoArea;
  numero = 1;
  fase: Fase = 'capa';
  questao: Questao | null = null;
  falhouCarregar = false;
  selecionada: number | null = null;
  tempoRestante = TEMPO_TOTAL;
  readonly tempoTotal = TEMPO_TOTAL;
  esgotou = false;
  resultado: 'acerto' | 'erro' | null = null;
  usuario: Usuario | null = null;
  confirmandoSaida = false;
  emblemasNovos: Emblema[] = [];
  private acertosAntes = 0;
  private acertosDepois = 0;

  xpBase = 0;
  xpGanho = 0;
  xpMostrado = 0;
  bonusPct = 0;
  tempoGasto = 0;
  aguardandoServidor = false;
  revisao = false;
  respondidaEm = '';
  direto = false;
  resumoDia: { resultados: ResultadoArea[]; sequencia: number; xp: number } | null = null;
  private proximaDireta = false;
  pecaNova: PecaNova | null = null;
  pecaEspera: PecaEspera | null = null;
  conquistas: { icone: string; texto: string }[] = [];
  proxima: InfoArea | null = null;
  readonly totalCampus = TOTAL_PECAS;
  readonly letras = ['A', 'B', 'C', 'D', 'E'];
  dataCurta = '';
  codigoPagina = '';

  private carregou = false;
  private contou = false;
  private relogio: any;
  private timers: any[] = [];
  private subs = new Subscription();
  private progressoAntes: Progresso = progressoDoUsuario(null);
  private somTambores = Object.assign(new Audio('tambores.mp3'), { volume: 0.45 });
  private somXp = new Audio('xp.mp3');
  private som = inject(SomService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private questaoService: QuestaoServiceService,
    private authService: AuthServiceService,
    private rankingStore: RankingStoreServiceService,
    private premium: EstruturasPremiumService
  ) {}

  ngOnInit() {
    document.body.classList.add('modo-prova');
    const hoje = new Date();
    this.dataCurta = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
    this.subs.add(this.authService.usuario$.subscribe(u => (this.usuario = u)));
    if (!this.usuario) {
      this.router.navigate(['/Home']);
      return;
    }
    this.subs.add(this.route.paramMap.subscribe(params => this.iniciar(params.get('area'))));
  }

  ngOnDestroy() {
    document.body.classList.remove('modo-prova');
    this.pararRelogio();
    this.timers.forEach(clearTimeout);
    this.subs.unsubscribe();
    this.somTambores.pause();
  }

  private iniciar(param: string | null) {
    const info = AREAS.find(a => a.chave === param);
    if (!info) {
      this.router.navigate(['/Home']);
      return;
    }
    const direto = this.proximaDireta;
    this.proximaDireta = false;
    this.area = info.chave;
    this.info = info;
    this.numero = AREAS.indexOf(info) + 1;
    const d = new Date();
    this.codigoPagina = `*${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${info.sigla}0${this.numero}*`;

    if (this.usuario?.[info.chave]?.ultimaResposta === hojeISO()) {
      this.abrirRevisao();
      return;
    }

    this.direto = direto;
    if (direto) this.contou = true;
    this.questaoService.getQuestaoDoDia(this.area).subscribe({
      next: q => {
        this.questao = q;
        this.carregou = true;
        this.abrirProva();
      },
      error: err => {
        this.falhouCarregar = true;
        this.direto = false;
        if (err.status === 401) {
          this.authService.logout();
          Alert.toast('Novo login detectado em outro dispositivo', 'error');
        }
      }
    });
  }

  /** Questão já respondida hoje: abre direto no resultado, com a alternativa marcada e a resolução. */
  private abrirRevisao() {
    this.revisao = true;
    this.questaoService.getRevisao(this.area).subscribe({
      next: r => {
        this.revisao = true;
        this.questao = r.questao;
        this.selecionada = r.alternativa;
        this.esgotou = r.alternativa === null && r.tempoGasto >= TEMPO_TOTAL;
        this.resultado = r.acerto ? 'acerto' : 'erro';
        this.xpGanho = this.xpMostrado = r.xp;
        this.tempoGasto = r.tempoGasto;
        this.respondidaEm = r.respondidaEm;
        this.carregou = true;
        this.fase = 'resultado';
        const hoje = hojeISO();
        this.proxima = AREAS.find(a => a.chave !== this.area && this.usuario?.[a.chave]?.ultimaResposta !== hoje) ?? null;
      },
      error: () => this.router.navigate(['/Home'])
    });
  }

  comecar() {
    if (!this.carregou) return;
    this.contou = true;
    this.abrirProva();
  }

  get bonusSequencia(): number {
    const d = this.usuario?.streakDiasAtivos ?? 0;
    return d >= 20 ? 20 : d >= 8 ? 15 : d >= 4 ? 10 : 0;
  }

  get nomeRegiao(): string {
    return regiao(this.area).nome;
  }

  private abrirProva() {
    if (!this.carregou || !this.contou || this.fase !== 'capa') return;
    this.fase = 'prova';
    window.scrollTo({ top: 0 });
    this.relogio = setInterval(() => {
      this.tempoRestante--;
      if (this.tempoRestante <= 0) {
        this.tempoRestante = 0;
        this.esgotou = true;
        this.enviar();
      }
    }, 1000);
    if (this.usuario) {
      this.usuario[this.area].ultimaResposta = hojeISO();
      this.authService.atualizarUsuario(this.usuario);
    }
  }

  private pararRelogio() {
    if (this.relogio) clearInterval(this.relogio);
    this.relogio = null;
  }

  private depois(fn: () => void, ms: number) {
    this.timers.push(setTimeout(fn, ms));
  }

  get tempoTexto(): string {
    const m = Math.floor(this.tempoRestante / 60);
    const s = this.tempoRestante % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  get tempoGastoTexto(): string {
    const m = Math.floor(this.tempoGasto / 60);
    const s = this.tempoGasto % 60;
    return m ? `${m}min ${String(s).padStart(2, '0')}s` : `${s}s`;
  }

  get letraCerta(): string {
    const i = this.questao?.alternativas.findIndex(a => a.correta) ?? -1;
    return i >= 0 ? this.letras[i] : '—';
  }

  get pctTempo(): number {
    return (this.tempoRestante / TEMPO_TOTAL) * 100;
  }

  get alerta(): boolean {
    return this.fase === 'prova' && this.tempoRestante <= 40;
  }

  selecionar(i: number) {
    if (this.fase !== 'prova') return;
    if (this.selecionada !== i) this.som.caneta();
    this.selecionada = i;
  }

  @HostListener('document:keydown', ['$event'])
  atalho(e: KeyboardEvent) {
    if (this.fase === 'capa' && e.key === 'Enter') {
      this.comecar();
      return;
    }
    if (this.fase !== 'prova' || !this.questao || this.confirmandoSaida) return;
    const i = this.letras.indexOf(e.key.toUpperCase());
    if (i >= 0 && i < this.questao.alternativas.length) this.selecionar(i);
    if (e.key === 'Enter' && this.selecionada !== null) this.enviar();
  }

  enviar() {
    if (!this.questao || this.fase !== 'prova') return;
    if (this.selecionada === null && !this.esgotou) return;
    this.pararRelogio();
    this.fase = 'corrigindo';
    this.tempoGasto = TEMPO_TOTAL - this.tempoRestante;
    this.progressoAntes = progressoDoUsuario(this.usuario);
    this.acertosAntes = acertosTotais(this.usuario);
    const emblemasAntes = (this.usuario?.emblemas ?? '').split('|');
    this.som.tocarAudio(this.somTambores, 3);

    const inicio = performance.now();
    this.aguardandoServidor = true;
    this.questaoService.enviarResposta({
      area: this.area.toUpperCase(),
      alternativa: this.esgotou ? null : this.selecionada,
      tempoGasto: this.tempoGasto
    }).subscribe({
      next: c => this.depois(() => this.mostrarCorrecao(c, emblemasAntes), Math.max(0, 1800 - (performance.now() - inicio))),
      error: (e: HttpErrorResponse) => {
        this.somTambores.pause();
        this.aguardandoServidor = false;
        if (e.status === 409) {
          Alert.toast('Você já respondeu essa área hoje', 'error');
          this.router.navigate(['/Home']);
          return;
        }
        this.fase = 'prova';
        Alert.toast('Não foi possível enviar sua resposta. Tente de novo.', 'error');
      }
    });
  }

  private mostrarCorrecao(c: Correcao, emblemasAntes: string[]) {
    this.somTambores.pause();
    this.questao = c.questao;
    this.xpGanho = c.xp;
    this.xpBase = c.xpBase;
    this.bonusPct = c.bonusPct;
    this.resultado = c.acerto ? 'acerto' : 'erro';
    this.fase = 'resultado';
    if (c.acerto) {
      this.som.tocarAudio(this.somXp);
      setTimeout(() => this.celebrar(), 60);
      this.contarXp();
      if (c.bonusPct) this.depois(() => this.som.fogo(), 650);
    }
    this.depois(() => this.aoResponder(c.usuario, emblemasAntes), 100);
    this.depois(() => this.rolarParaResultado(), 1100);
  }

  private rolarParaResultado() {
    const blocos = [document.querySelector('.res-placar'), document.querySelector('.res-campus, .res-espera')].filter((e): e is Element => !!e);
    if (!blocos.length) return;
    const topo = Math.min(...blocos.map(b => b.getBoundingClientRect().top));
    const base = Math.max(...blocos.map(b => b.getBoundingClientRect().bottom));
    const faixa = 62, barra = 96;
    const util = innerHeight - faixa - barra;
    const altura = base - topo;
    const alvo = scrollY + topo - faixa - Math.max(12, (util - altura) / 2);
    window.scrollTo({ top: Math.max(0, alvo), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  private aoResponder(res: Usuario, emblemasAntes: string[]) {
    this.acertosDepois = acertosTotais(res);
    this.aguardandoServidor = false;
    const depois = progressoDoUsuario(res);
    const novas: Peca[] = [...novasPecas(this.progressoAntes, depois)];
    // acabamentos da região e negócios da praça também contam como "o campus cresceu"
    const n0 = nivelAcabamento(this.area, this.progressoAntes), n1 = nivelAcabamento(this.area, depois);
    const centro: Record<string, [number, number]> = { linguagens: [6, 6], humanas: [6, 20], naturezas: [20, 20], exatas: [20, 6] };
    if (n1 > n0) {
      const [ax, ay] = centro[this.area];
      novas.push({ trilha: this.area, ordem: 9999, nome: nomeDoNivel(n1) ?? 'Acabamento novo', ax, ay, chave: ax + ay, camada: 1, anim: 'brota', desenho: () => '' });
    }
    const b0 = negociosAbertos(this.acertosAntes), b1 = negociosAbertos(this.acertosDepois);
    if (b1 > b0 && b1 > 0) {
      novas.push({ trilha: 'geral', ordem: 9999, nome: `${NEGOCIOS[b1 - 1].nome} · Praça de alimentação`, ax: 13, ay: -5, chave: 8, camada: 1, anim: 'brota', desenho: () => '' });
    }
    if (novas.length) this.montarPeca(novas, depois);
    else {
      const p = proximaPeca(this.area, depois);
      if (p) this.pecaEspera = { nome: p.nome, regiao: regiao(this.area).nome, cor: this.info.cor };
    }

    const conquistas: { icone: string; texto: string }[] = [];
    if (this.resultado === 'acerto' && res.streak >= 2) conquistas.push({ icone: 'flame', texto: `${res.streak} acertos seguidos` });
    if (res.streakDiasAtivos > 1) conquistas.push({ icone: 'calendar-check', texto: `${res.streakDiasAtivos} dias seguidos` });
    const hoje = hojeISO();
    if (AREAS.every(a => res[a.chave]?.ultimaResposta === hoje)) conquistas.push({ icone: 'sparkles', texto: `Dia completo · ${res.xpHoje} XP hoje` });
    this.conquistas = conquistas;

    this.proxima = AREAS.find(a => a.chave !== this.area && res[a.chave]?.ultimaResposta !== hoje) ?? null;

    if (AREAS.every(a => res[a.chave]?.ultimaResposta === hoje)) {
      const resumo = {
        resultados: AREAS.map(a => ({ nome: a.nome, cor: a.cor, acertou: !!res[a.chave]?.acertoHoje })),
        sequencia: res.streakDiasAtivos ?? 0,
        xp: res.xpHoje ?? 0
      };
      this.depois(() => (this.resumoDia = resumo), novas.length ? 3600 : 2200);
    }

    if (this.resultado === 'acerto') {
      this.rankingStore.emitRankingUpdate({ grupoId: 'dd1fcbd5-20dc-453d-a3b8-622b6dc40cf0', usuario: res.usuario, xpGanho: this.xpGanho });
    }

    const novos = (res.emblemas ?? '').split('|').filter(c => c && !emblemasAntes.includes(c))
      .map(c => EMBLEMAS_MOCK.find(e => e.codigo === c)).filter((e): e is Emblema => !!e);
    if (novos.length) {
      this.depois(() => (this.emblemasNovos = novos), novas.length ? 4200 : 1600);
    }
  }

  private montarPeca(novas: Peca[], depois: Progresso) {
    const principal = novas.find(p => p.trilha === this.area) ?? novas.find(p => p.trilha !== 'geral') ?? novas[0];
    const h = new Date().getHours();
    const noite = h >= 18 || h < 6;
    const c = this.premium.atual;
    const opcoes = {
      novasDesde: this.progressoAntes,
      extras: { acertos: this.acertosDepois, simulados: c.simulados, redacoes: c.redacoes, maiorSequencia: c.maiorSequencia, diasAtivos: this.usuario?.qntDiasAtivos ?? c.diasAtivos, xp: this.usuario?.xpTotal ?? c.xp },
      extrasAntes: { acertos: this.acertosAntes, simulados: c.simulados, redacoes: c.redacoes, maiorSequencia: c.maiorSequencia, diasAtivos: c.diasAtivos, xp: c.xp },
      atrasoInicial: 700,
      intervalo: 500
    };
    // se a resposta abriu um terreno novo (ex.: praça de alimentação), a câmera vai até ele
    const lote = renderizarCampus(depois, paletaDe(noite), opcoes).destaques.find(d => d.terreno);
    const cena = renderizarCampus(depois, paletaDe(noite), { ...opcoes, camera: lote ? caixaEm(lote.x, lote.y, 10, .62) : caixaEm(principal.ax, principal.ay, 6.5, .62) });
    const r = regiao(principal.trilha);
    this.pecaNova = {
      nome: lote ? lote.nome : principal.nome,
      regiao: r.nome,
      cor: r.cor,
      svg: this.sanitizer.bypassSecurityTrustHtml(cena.svg),
      noite,
      numero: totalDePecas(depois),
      extras: novas.filter(p => p !== principal).map(p => `${p.nome} · ${regiao(p.trilha).nome}`)
    };
    this.depois(() => (lote ? this.som.terreno() : this.som.pop()), 1300);
  }

  private contarXp() {
    const inicio = performance.now();
    const dur = 900;
    const passo = (t: number) => {
      const k = Math.min(1, (t - inicio) / dur);
      this.xpMostrado = Math.round(this.xpGanho * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  private celebrar() {
    const el = document.querySelector('.alt.certa .bolha') as HTMLElement | null;
    const r = el?.getBoundingClientRect();
    const origem = r ? { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } : { x: .5, y: .5 };
    const css = getComputedStyle(document.documentElement);
    const cor = (v: string) => css.getPropertyValue(v).trim() || '#2836C6';
    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 32,
      scalar: .85,
      ticks: 160,
      origin: origem,
      colors: [cor('--ed-caneta'), cor('--ed-lc'), cor('--ed-ch'), cor('--ed-cn'), cor('--ed-mt')],
      disableForReducedMotion: true
    });
  }

  estadoAlt(i: number): string {
    if (this.fase === 'resultado' && this.questao) {
      const alt = this.questao.alternativas[i];
      if (alt.correta) return i === this.selecionada ? 'certa marcada' : 'certa';
      if (i === this.selecionada) return 'errada marcada';
      return 'apagada';
    }
    if (i === this.selecionada) return this.fase === 'corrigindo' ? 'marcada corrigindo' : 'marcada';
    return '';
  }

  sair() {
    if (this.fase === 'prova') {
      this.confirmandoSaida = true;
      return;
    }
    this.router.navigate(['/Home']);
  }

  confirmarSaida() {
    this.confirmandoSaida = false;
    this.router.navigate(['/Home']);
  }

  irPara(destino: 'proxima' | 'painel' | 'campus') {
    if (destino === 'proxima' && this.proxima) {
      this.reiniciar();
      this.proximaDireta = true;
      this.router.navigate(['/desafio', this.proxima.chave]);
    } else {
      this.router.navigate([destino === 'campus' ? '/progresso' : '/Home']);
    }
  }

  private reiniciar() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.fase = 'capa';
    this.carregou = this.contou = false;
    this.questao = null;
    this.selecionada = null;
    this.tempoRestante = TEMPO_TOTAL;
    this.esgotou = false;
    this.resultado = null;
    this.pecaNova = this.pecaEspera = null;
    this.conquistas = [];
    this.xpMostrado = this.xpGanho = this.bonusPct = 0;
    this.revisao = this.direto = false;
    this.resumoDia = null;
    window.scrollTo({ top: 0 });
  }

}
