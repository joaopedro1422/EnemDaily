import { LandingComponent } from '../landing/landing.component';
import { DueloHojeComponent } from '../shared/duelo/duelo-hoje.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { Recomendacao, UsuarioService } from '../services/usuario.service';
import { ConteudoService } from '../services/conteudo.service';
import { chaveConteudoDaQuestao } from '../models/conteudo';
import { BonusStatus } from '../models/questao';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { take } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { Usuario, XpAnoAreas } from '../models/usuario';
import { Simulado } from '../models/simulado';
import { Redacao } from '../models/redacao';
import { FooterComponent } from '../footer/footer.component';
import { BannerInicialComponent } from '../modal/banner-inicial/banner-inicial.component';
import { OnboardingBalloonComponent } from '../shared/onboarding-balloon/onboarding-balloon.component';
import { AuthServiceService } from '../services/auth-service.service';
import { QuestaoServiceService } from '../services/questao-service.service';
import { SimuladoService } from '../services/simulado.service';
import { RedacaoService } from '../services/redacao.service';
import { Contagem, contagemEnem } from '../shared/enem';
import { EstruturasPremiumService } from '../services/estruturas-premium.service';
import { ResumoSemanalComponent } from '../resumo-semanal/resumo-semanal.component';
import { BoasVindasComponent } from '../boas-vindas/boas-vindas.component';
import { IconeComponent } from '../shared/icone/icone.component';
import { SimboloDiaComponent } from '../shared/simbolo-dia/simbolo-dia.component';
import { ResumoDiaComponent, ResultadoArea } from '../shared/resumo-dia/resumo-dia.component';
import { AREAS, FAVORITAR_PAGINAS, MODO_TESTE, ChaveArea, EstadoArea, InfoArea, coresDoDia, estadoArea, formatarNumero, hojeISO } from '../shared/dia';
import { CampusComponent } from '../shared/campus/campus.component';
import { Progresso, TOTAL_PECAS, progressoDoUsuario, totalDePecas } from '../shared/campus/campus';

Chart.register(...registerables);

interface LinhaDia {
  info: InfoArea;
  estado: EstadoArea;
  assunto: string | null;
  disponivel: boolean;
}

interface DesempenhoArea {
  info: InfoArea;
  acertos: number;
  respondidas: number;
  porcentagem: number;
  sequencia: number;
  xp: number;
}

interface DiaSemana {
  rotulo: string;
  feito: boolean;
  hoje: boolean;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const BONUS = [
  { dias: 4, valor: 10 },
  { dias: 8, valor: 15 },
  { dias: 20, valor: 20 },
];
const assuntosCache: { data: string; assuntos: Partial<Record<ChaveArea, string | null>> } = { data: '', assuntos: {} };

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, BannerInicialComponent, OnboardingBalloonComponent, IconeComponent, SimboloDiaComponent, CampusComponent, CarregandoComponent, ResumoSemanalComponent, BoasVindasComponent, DueloHojeComponent, LandingComponent, ResumoDiaComponent],
  templateUrl: './home-component.component.html',
  styleUrl: './home-component.component.css'
})
export class HomeComponentComponent implements OnInit, OnDestroy {
  usuarioLogado: Usuario | null = null;
  mostrarModal = false;
  mostrarOnboarding = false;

  readonly formatarNumero = formatarNumero;
  readonly bonusMarcos = BONUS;
  readonly anoAtual = new Date().getFullYear();
  saudacao = '';
  contagem: Contagem | null = contagemEnem();
  diasMostrados = 0;
  dataExtenso = '';
  tempoRestante = '';

  linhasDia: LinhaDia[] = [];
  coresDia: (string | null)[] = [null, null, null, null];
  feitasHoje = 0;
  assuntosCarregados = false;
  desempenho: DesempenhoArea[] = [];
  semana: DiaSemana[] = [];
  progressoCampus: Progresso = progressoDoUsuario(null);
  acesasCampus: Partial<Record<'linguagens' | 'humanas' | 'naturezas' | 'exatas', boolean>> | null = null;
  totalPecas = 0;
  readonly totalCampus = TOTAL_PECAS;

  respondidas = 0;
  acertos = 0;
  taxaAcerto = 0;
  tempoMedio = '0:00';
  xpAno = 0;
  recomendacao: Recomendacao | null = null;
  linksEstudo: Record<string, string> = {};
  private conteudos = inject(ConteudoService);
  private ultimaRecomendacao = '';

  ultimoSimulado: Simulado | null = null;
  totalSimulados = 0;
  mediaRedacoes = 0;
  totalRedacoes = 0;
  estudosCarregados = false;
  sessaoEmOutroAparelho = false;

  private grafico?: Chart;
  private canvas?: ElementRef<HTMLCanvasElement>;
  private subs = new Subscription();

  @ViewChild('graficoXp') set graficoRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.canvas = ref;
    if (ref && this.usuarioLogado) this.desenharGrafico();
  }

  constructor(
    private router: Router,
    private authService: AuthServiceService,
    private questaoService: QuestaoServiceService,
    private simuladoService: SimuladoService,
    private redacaoService: RedacaoService,
    private usuarioService: UsuarioService
  ) {}

  get dataEnem(): string {
    return this.contagem ? this.contagem.data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '') : '';
  }

  get textoContagem(): string {
    const c = this.contagem;
    if (!c) return '';
    if (c.hoje) return 'Hoje é dia de ENEM';
    return `${c.dias} dias para o ENEM ${c.edicao.ano}`;
  }

  private contarDias() {
    const alvo = this.contagem?.dias ?? 0;
    if (!alvo || matchMedia('(prefers-reduced-motion: reduce)').matches) { this.diasMostrados = alvo; return; }
    const inicio = performance.now(), dur = 1100;
    const passo = (t: number) => {
      const k = Math.min(1, (t - inicio) / dur);
      this.diasMostrados = Math.round(alvo * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  ngOnInit(): void {
    this.talvezAbrirResumo();
    this.contarDias();
    this.atualizarRelogio();
    this.subs.add(interval(1000).subscribe(() => this.atualizarRelogio()));
    this.usuarioService.getUsuariosHoje().subscribe({ next: n => (this.respondentesHoje = (n ?? 0) * 3), error: () => {} });

    this.authService.usuario$.pipe(take(1)).subscribe(usuario => {
      if (usuario) this.verificarStreak(usuario);
    });

    this.subs.add(this.authService.usuario$.subscribe(usuario => {
      const entrou = !this.usuarioLogado && !!usuario;
      this.usuarioLogado = usuario;
      if (!usuario) return;
      if (entrou) {
        this.verificarRedirecionamentoFavorito();
        this.carregarAssuntos();
        this.carregarEstudos();
      }
      this.montarPainel(usuario);
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.grafico?.destroy();
  }

  get primeiroNome(): string {
    return this.usuarioLogado?.nome?.trim().split(/\s+/)[0] ?? '';
  }

  get proximaArea(): LinhaDia | null {
    return this.linhasDia.find(l => l.estado === 'pendente' && l.disponivel) ?? null;
  }

  get diaCompleto(): boolean {
    return this.feitasHoje === 4;
  }

  get semQuestoesHoje(): boolean {
    return this.assuntosCarregados && !this.diaCompleto && !this.linhasDia.some(l => l.estado === 'pendente' && l.disponivel);
  }

  get tituloDesafio(): string {
    if (this.diaCompleto) return 'Por hoje é só!';
    if (this.semQuestoesHoje) return 'As questões de hoje estão a caminho.';
    const faltam = 4 - this.feitasHoje;
    return faltam === 1 ? 'Falta apenas 1 questão' : `Faltam apenas ${faltam} questões`;
  }

  get subtituloDesafio(): string {
    const xpHoje = this.usuarioLogado?.xpHoje ?? 0;
    if (this.diaCompleto) return 'Volte amanhã para continuar construindo';
    if (this.semQuestoesHoje) return 'Elas ficam prontas ao longo do dia. Volte daqui a pouco.';
    if (this.feitasHoje > 0 && xpHoje > 0) return `Você já fez ${formatarNumero(xpHoje)} XP hoje. Cada questão vale até 70 XP.`;
    return 'Uma questão por área. Quanto mais rápido você acerta, mais XP ganha.';
  }

  get sequenciaDias(): number {
    return this.usuarioLogado?.streakDiasAtivos ?? 0;
  }

  get bonusAtual(): number {
    return [...BONUS].reverse().find(b => this.sequenciaDias >= b.dias)?.valor ?? 0;
  }

  get proximoBonus(): { dias: number; valor: number } | null {
    return BONUS.find(b => this.sequenciaDias < b.dias) ?? null;
  }

  get textoSequencia(): string {
    const n = this.sequenciaDias;
    if (n === 0) return 'Responda uma questão hoje para começar.';
    if (this.feitasHoje === 0) return `Responda hoje para manter seus ${n} ${n === 1 ? 'dia' : 'dias'}.`;
    const prox = this.proximoBonus;
    if (!prox) return 'Você está com o bônus máximo de XP.';
    const faltam = prox.dias - n;
    return `Mais ${faltam} ${faltam === 1 ? 'dia' : 'dias'} para ganhar +${prox.valor}% de XP.`;
  }

  get progressoBonus(): number {
    return Math.min(100, (this.sequenciaDias / 20) * 100);
  }

  iniciais(nome: string): string {
    return (nome ?? '').trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
  }

  dataCurta(iso: string): string {
    const [, mes, dia] = (iso ?? '').split('-').map(Number);
    if (!mes || !dia) return '';
    return `${dia} ${MESES[mes - 1].toLowerCase()}`;
  }


  bonus: BonusStatus | null = null;
  private bonusPedido = '';
  private carregarBonus(usuario: Usuario) {
    if (usuario.demo) { this.bonus = null; return; }
    const chave = `${usuario.id}:${new Date().toDateString()}:${usuario.xpTotal}`;
    if (chave === this.bonusPedido) return;
    this.bonusPedido = chave;
    this.questaoService.getBonus().subscribe({ next: b => (this.bonus = b?.disponivel ? b : null), error: () => (this.bonus = null) });
  }
  abrirBonus() { this.router.navigate(['/desafio', 'bonus']); }

  abrirConfirmacao(area: ChaveArea) {
    const linha = this.linhasDia.find(l => l.info.chave === area);
    if (!linha || (linha.estado === 'pendente' && !linha.disponivel)) return;
    this.router.navigate(['/desafio', area]);
  }

  readonly modoTeste = MODO_TESTE;
  resumoDia: { resultados: ResultadoArea[]; sequencia: number; xp: number } | null = null;

  abrirResumoDia() {
    const u = this.usuarioLogado;
    if (!u) return;
    this.resumoDia = {
      resultados: AREAS.map(a => ({ nome: a.nome, cor: a.cor, acertou: estadoArea(u, a.chave) === 'acertou' })),
      sequencia: u.streakDiasAtivos ?? 0,
      xp: u.xpHoje ?? 0
    };
  }
  mostrarResumo = false;
  mostrarBoasVindas = false;
  private resumoEsperando = false;

  private boasVindasVerificado = false;

  private talvezAbrirBoasVindas(usuario: Usuario) {
    if (this.boasVindasVerificado) return;
    this.boasVindasVerificado = true;
    if (usuario.demo || usuario.onboardingVisto !== false) return;
    setTimeout(() => (this.mostrarBoasVindas = true), 500);
  }

  fecharBoasVindas(motivo: 'comecar' | 'pular') {
    this.mostrarBoasVindas = false;
    this.usuarioService.marcarOnboardingVisto().subscribe({ next: u => { if (u) this.authService.atualizarUsuario(u); }, error: () => {} });
    if (this.resumoEsperando) { this.resumoEsperando = false; setTimeout(() => (this.mostrarResumo = true), 600); }
    if (motivo === 'comecar') {
      const area = this.proximaArea?.info.chave;
      if (area) this.abrirConfirmacao(area);
    }
  }

  private chaveResumo(): string {
    const d = new Date();
    const domingo = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    return 'resumo-semanal:' + domingo.toLocaleDateString('sv-SE');
  }

  private talvezAbrirResumo() {
    const dia = new Date().getDay();
    if (dia !== 0 && dia !== 1) return;
    try { if (localStorage.getItem(this.chaveResumo())) return; } catch { }
    setTimeout(() => { if (this.mostrarBoasVindas) this.resumoEsperando = true; else this.mostrarResumo = true; }, 1200);
  }

  fecharResumo() {
    this.mostrarResumo = false;
    try { localStorage.setItem(this.chaveResumo(), '1'); } catch { }
  }
  readonly extras$ = inject(EstruturasPremiumService).extras$;
  respondentesHoje = 0;
  mostrarComoFunciona = false;

  @HostListener('document:keydown.escape')
  fecharConfirmacao() {
    this.mostrarComoFunciona = false;
  }

  irParaEstatisticasArea(area: ChaveArea) {
    this.router.navigate(['/estatisticas'], { queryParams: { area } });
  }

  abrirLogin() {
    this.authService.open();
  }

  entrarDeNovo() {
    this.authService.logout();
    this.authService.open();
  }

  abrirCampus() {
    this.router.navigate(['/progresso']);
  }

  fecharBanner() {
    this.mostrarModal = false;
    setTimeout(() => (this.mostrarOnboarding = true), 0);
  }

  processarRetorno(evento: string) {
    if (evento === 'logar') {
      this.authService.login({ email: 'novoUsuario@teste.com', senha: 'senha12' }).subscribe();
    } else if (evento === 'cadastro') {
      this.abrirLogin();
    }
  }

  private montarPainel(usuario: Usuario) {
    this.talvezAbrirBoasVindas(usuario);
    const hora = new Date().getHours();
    this.saudacao = hora >= 5 && hora < 12 ? 'Bom dia' : hora >= 12 && hora < 18 ? 'Boa tarde' : 'Boa noite';
    const data = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    this.dataExtenso = data.charAt(0).toUpperCase() + data.slice(1);

    this.montarLinhasDia();
    this.coresDia = coresDoDia(usuario);

    this.desempenho = AREAS.map(info => {
      const a = usuario[info.chave];
      const respondidas = a?.questoesRespondidas ?? 0;
      const acertos = a?.acertos ?? 0;
      return {
        info, acertos, respondidas,
        porcentagem: respondidas ? Math.round((acertos / respondidas) * 100) : 0,
        sequencia: a?.streak ?? 0,
        xp: a?.xp ?? 0,
      };
    });
    this.respondidas = this.desempenho.reduce((s, d) => s + d.respondidas, 0);
    this.acertos = this.desempenho.reduce((s, d) => s + d.acertos, 0);
    this.taxaAcerto = this.respondidas ? Math.round((this.acertos / this.respondidas) * 100) : 0;
    const tempo = AREAS.reduce((s, i) => s + (usuario[i.chave]?.tempoGasto ?? 0), 0);
    const media = this.respondidas ? Math.floor(tempo / this.respondidas) : 0;
    this.tempoMedio = `${Math.floor(media / 60)}:${String(media % 60).padStart(2, '0')}`;

    const diaHoje = new Date().getDay();
    const p = usuario.presencaSemanal;
    this.semana = [
      { rotulo: 'S', feito: !!p?.segunda, hoje: diaHoje === 1 },
      { rotulo: 'T', feito: !!p?.terca, hoje: diaHoje === 2 },
      { rotulo: 'Q', feito: !!p?.quarta, hoje: diaHoje === 3 },
      { rotulo: 'Q', feito: !!p?.quinta, hoje: diaHoje === 4 },
      { rotulo: 'S', feito: !!p?.sexta, hoje: diaHoje === 5 },
      { rotulo: 'S', feito: !!p?.sabado, hoje: diaHoje === 6 },
      { rotulo: 'D', feito: !!p?.domingo, hoje: diaHoje === 0 },
    ];

    this.progressoCampus = progressoDoUsuario(usuario);
    this.acesasCampus = { linguagens: !!usuario.lingRespHj, humanas: !!usuario.humRespHj, naturezas: !!usuario.natRespHj, exatas: !!usuario.exatRespHj };
    this.totalPecas = totalDePecas(this.progressoCampus);

    this.carregarRecomendacao(usuario);
    this.carregarBonus(usuario);
    this.xpAno = (usuario.xpAnoAreas ?? []).reduce((s, m) => s + (m.naturezas ?? 0) + (m.humanas ?? 0) + (m.linguagens ?? 0) + (m.exatas ?? 0), 0);
    if (this.canvas) this.desenharGrafico();
  }

  private montarLinhasDia() {
    const hoje = hojeISO();
    const cache = assuntosCache.data === hoje ? assuntosCache.assuntos : {};
    this.linhasDia = AREAS.map(info => {
      const assunto = cache[info.chave];
      return {
        info,
        estado: estadoArea(this.usuarioLogado, info.chave),
        assunto: assunto ?? null,
        disponivel: assunto !== null,
      };
    });
    this.feitasHoje = this.linhasDia.filter(l => l.estado !== 'pendente').length;
  }

  private carregarAssuntos() {
    const hoje = hojeISO();
    if (assuntosCache.data === hoje && Object.keys(assuntosCache.assuntos).length === 4) {
      this.assuntosCarregados = true;
      this.montarLinhasDia();
      return;
    }
    assuntosCache.data = hoje;
    assuntosCache.assuntos = {};
    let pendentes = AREAS.length;
    const concluir = () => {
      pendentes--;
      if (pendentes === 0) this.assuntosCarregados = true;
      this.montarLinhasDia();
    };
    for (const info of AREAS) {
      this.questaoService.getQuestaoDoDia(info.chave).subscribe({
        next: questao => {
          assuntosCache.assuntos[info.chave] = questao?.assunto ?? null;
          concluir();
        },
        error: erro => {
          if (erro?.status === 401) this.sessaoEmOutroAparelho = true;
          concluir();
        }
      });
    }
  }

  private carregarEstudos() {
    this.simuladoService.getSimulados().subscribe({
      next: lista => {
        this.totalSimulados = lista?.length ?? 0;
        this.ultimoSimulado = [...(lista ?? [])].sort((a, b) => String(b.data).localeCompare(String(a.data)))[0] ?? null;
        this.estudosCarregados = true;
      },
      error: () => (this.estudosCarregados = true)
    });
    this.redacaoService.getRedacoes().subscribe({
      next: lista => {
        this.totalRedacoes = lista?.length ?? 0;
        this.mediaRedacoes = this.totalRedacoes ? Math.round(lista.reduce((s, r) => s + (r.nota ?? 0), 0) / this.totalRedacoes) : 0;
      },
      error: () => {}
    });
  }

  private carregarRecomendacao(usuario: Usuario) {
    const chave = `${usuario.id}|${usuario.xpTotal}|${coresDoDia(usuario).join()}|${hojeISO()}`;
    if (chave === this.ultimaRecomendacao) return;
    this.ultimaRecomendacao = chave;
    this.usuarioService.getRecomendacao().subscribe({
      next: r => {
        this.recomendacao = r;
        for (const a of r.assuntos) {
          const slug = a.nome.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[ºª]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const area = chaveConteudoDaQuestao(a.area);
          if (area) this.linksEstudo[a.nome] = `/conteudos/${area}/${slug}`;
          this.conteudos.doAssunto(a.area, a.nome).subscribe(c => { if (c) this.linksEstudo[a.nome] = `/conteudos/${c.area}/${c.slug}`; });
        }
      },
      error: () => (this.recomendacao = null)
    });
  }

  nomeArea(area: string | null): string {
    return AREAS.find(a => a.chave === ({ LINGUAGENS: 'linguagens', HUMANAS: 'humanas', NATUREZAS: 'naturezas', EXATAS: 'exatas' } as Record<string, string>)[area ?? ''])?.nome ?? '';
  }

  corArea(area: string | null): string {
    return AREAS.find(a => a.chave === ({ LINGUAGENS: 'linguagens', HUMANAS: 'humanas', NATUREZAS: 'naturezas', EXATAS: 'exatas' } as Record<string, string>)[area ?? ''])?.cor ?? 'var(--ed-caneta)';
  }

  private desenharGrafico() {
    const usuario = this.usuarioLogado;
    if (!usuario || !this.canvas) return;
    const mesAtual = new Date().getMonth();
    const meses = this.normalizarMeses(usuario.xpAnoAreas).slice(0, mesAtual + 1);
    const css = getComputedStyle(document.documentElement);
    const cor = (v: string) => css.getPropertyValue(v).trim();
    const series: { chave: keyof XpAnoAreas; rotulo: string; cor: string }[] = [
      { chave: 'linguagens', rotulo: 'Linguagens', cor: cor('--ed-lc') },
      { chave: 'humanas', rotulo: 'Humanas', cor: cor('--ed-ch') },
      { chave: 'naturezas', rotulo: 'Naturezas', cor: cor('--ed-cn') },
      { chave: 'exatas', rotulo: 'Matemática', cor: cor('--ed-mt') },
    ];
    const acumular = (f: (m: XpAnoAreas) => number) => { let t = 0; return meses.map(m => (t += f(m))); };
    const superficie = cor('--ed-folha');
    const caneta = cor('--ed-caneta');
    const ctx = this.canvas.nativeElement.getContext('2d')!;
    const degrade = ctx.createLinearGradient(0, 0, 0, 260);
    degrade.addColorStop(0, caneta + '33');
    degrade.addColorStop(1, caneta + '00');
    const datasets: any[] = [
      {
        label: 'Total',
        data: acumular(m => series.reduce((t, s) => t + ((m[s.chave] as number) ?? 0), 0)),
        borderColor: caneta, backgroundColor: degrade, fill: 'origin', borderWidth: 3, tension: .35,
        pointRadius: (c: any) => (c.dataIndex === meses.length - 1 ? 5 : 0), pointHoverRadius: 6,
        pointBackgroundColor: caneta, pointBorderColor: superficie, pointBorderWidth: 2, order: 0
      },
      ...series.map(s => ({
        label: s.rotulo,
        data: acumular(m => (m[s.chave] as number) ?? 0),
        borderColor: s.cor, backgroundColor: s.cor, fill: false, borderWidth: 2, tension: .35,
        pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: s.cor, pointBorderColor: superficie, pointBorderWidth: 2, order: 1
      }))
    ];
    const labels = meses.map(m => MESES[m.mes - 1]);

    if (this.grafico) {
      this.grafico.data.labels = labels;
      this.grafico.data.datasets.forEach((d, i) => (d.data = datasets[i].data));
      this.grafico.update();
      return;
    }
    const tinta3 = cor('--ed-tinta-3');
    const pauta = cor('--ed-pauta');
    const fonte = { family: 'Schibsted Grotesk, Arial, sans-serif', size: 12, weight: 500 as const };
    this.grafico = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutCubic' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: cor('--ed-tinta'),
            titleColor: cor('--ed-folha'),
            bodyColor: cor('--ed-folha'),
            footerColor: cor('--ed-folha'),
            titleFont: { ...fonte, weight: 700 },
            bodyFont: fonte,
            footerFont: { ...fonte, weight: 700 },
            padding: 10,
            cornerRadius: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              title: itens => `Até ${itens[0]?.label ?? ''}`,
              label: item => ` ${item.dataset.label}: ${formatarNumero(item.raw as number)} XP`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: tinta3, font: fonte } },
          y: {
            beginAtZero: true,
            grid: { color: pauta }, border: { display: false },
            ticks: { color: tinta3, font: fonte, maxTicksLimit: 5, callback: v => formatarNumero(Number(v)) },
          },
        },
      },
    });
  }

  private normalizarMeses(lista?: XpAnoAreas[]): XpAnoAreas[] {
    const base: XpAnoAreas[] = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, naturezas: 0, humanas: 0, linguagens: 0, exatas: 0 }));
    for (const item of lista ?? []) {
      const i = (item.mes ?? 0) - 1;
      if (i >= 0 && i < 12) base[i] = { ...item };
    }
    return base;
  }

  private atualizarRelogio() {
    const agora = new Date();
    const meiaNoite = new Date();
    meiaNoite.setHours(24, 0, 0, 0);
    const diff = Math.max(0, meiaNoite.getTime() - agora.getTime());
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    this.tempoRestante = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private agendarOnboarding() {
    if (localStorage.getItem('primeiroAcesso')) return;
    localStorage.setItem('primeiroAcesso', 'nao');
    setTimeout(() => { if (!this.usuarioLogado && !this.mostrarBoasVindas) this.mostrarOnboarding = true; }, 6000);
  }

  private verificarStreak(usuario: Usuario) {
    if (!usuario.ultimoAcesso) {
      usuario.streakDiasAtivos = 0;
      this.authService.atualizarUsuario(usuario);
      return;
    }
    const ultimo = new Date(usuario.ultimoAcesso.includes('T') ? usuario.ultimoAcesso : `${usuario.ultimoAcesso}T00:00:00`);
    const hoje = new Date();
    ultimo.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);
    const dias = Math.floor((hoje.getTime() - ultimo.getTime()) / 86_400_000);
    if (dias > 1) {
      usuario.streakDiasAtivos = 0;
      this.authService.atualizarUsuario(usuario);
    }
  }

  private verificarRedirecionamentoFavorito() {
    if (!FAVORITAR_PAGINAS) return;
    const usuario = this.authService.getUsuario();
    if (!usuario || !usuario.pagFavorita || usuario.pagFavorita === 'nenhuma') return;
    const hoje = new Date().toLocaleDateString();
    if (localStorage.getItem('ultimoRedirecionamentoFavorito') === hoje) return;
    localStorage.setItem('ultimoRedirecionamentoFavorito', hoje);
    this.router.navigate([usuario.pagFavorita]);
  }
}
