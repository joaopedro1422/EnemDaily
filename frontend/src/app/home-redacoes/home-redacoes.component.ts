import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Redacao, mockRedacoes } from '../models/redacao';
import { Usuario } from '../models/usuario';
import { AuthServiceService } from '../services/auth-service.service';
import { RedacaoService } from '../services/redacao.service';
import { UsuarioService } from '../services/usuario.service';
import { AnexosRedacaoComponent } from '../modal/anexos-redacao/anexos-redacao.component';
import { FirebaseServiceService } from '../services/firebase-service.service';
import { NovaRedacaoModalComponent } from '../modal/nova-redacao-modal/nova-redacao-modal.component';
import { EstruturasPremiumService } from '../services/estruturas-premium.service';
import { IconeComponent } from '../shared/icone/icone.component';
import { COMPETENCIAS, InfoCompetencia } from './competencias';
import { FAVORITAR_PAGINAS } from '../shared/dia';

Chart.register(...registerables);

type Tom = 'bom' | 'alerta' | 'info';

interface ResumoC {
  info: InfoCompetencia;
  media: number;
  melhor: number;
  qtd: number;
  delta: number | null;
  nivel: number;
}

interface Insight { icone: string; tom: Tom; titulo: string; texto: string; }

interface ItemHist {
  r: Redacao;
  numero: number;
  data: Date;
  dia: string;
  mes: string;
  temComp: boolean;
}

interface GrupoMes { chave: string; rotulo: string; itens: ItemHist[]; }

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

@Component({
  selector: 'app-home-redacoes',
  imports: [NovaRedacaoModalComponent, AnexosRedacaoComponent, IconeComponent, CarregandoComponent],
  templateUrl: './home-redacoes.component.html',
  styleUrl: './home-redacoes.component.css'
})
export class HomeRedacoesComponent implements OnInit, AfterViewInit, OnDestroy {
  graficoRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('grafico') set grafico(el: ElementRef<HTMLCanvasElement> | undefined) {
    const novo = el?.nativeElement !== this.graficoRef?.nativeElement;
    this.graficoRef = el;
    if (el && novo) setTimeout(() => this.desenharGrafico());
  }

  readonly competencias = COMPETENCIAS;
  usuario: Usuario | null = null;
  redacoes: Redacao[] = [];
  carregando = true;
  mostrarModal = false;
  fabRecolhido = false;
  favorito = false;
  readonly favoritarPaginas = FAVORITAR_PAGINAS;
  visao: 'nota' | 'comp' = 'nota';
  analise: 'fechada' | 'gerando' | 'pronta' = 'fechada';
  etapaAnalise = '';
  excluindo: number | null = null;
  detalhe: ResumoC | null = null;
  fechandoDetalhe = false;

  media = 0;
  melhor: { nota: number; data: Date | null } = { nota: 0, data: null };
  ultima: { nota: number; delta: number | null } | null = null;
  resumoC: ResumoC[] = [];
  foco: ResumoC | null = null;
  /** Base pessoal: a média das médias das competências do aluno. */
  base = 0;
  atencao = new Set<ResumoC>();

  /**
   * Uma competência pede atenção quando fica meio nível (20 pontos) ou mais abaixo da base do aluno,
   * ou quando está abaixo de 160 e não acima da base. Com 180 ou mais nunca entra: já é nota alta.
   */
  private precisaAtencao(media: number): boolean {
    if (media >= 180) return false;
    return media <= this.base - 20 || (media < 160 && media <= this.base);
  }
  insights: Insight[] = [];
  historico: GrupoMes[] = [];
  legenda: { nome: string; cor: string; valor: number | null }[] = [];

  private ordenadas: Redacao[] = [];
  private chart?: Chart;
  /** Linhas escondidas pela legenda (pela sigla), mantidas ao redesenhar. */
  ocultas = new Set<string>();
  @ViewChild('rolagem') rolagem?: ElementRef<HTMLDivElement>;

  /** Cada redação ganha pelo menos 56px: com muitas, o gráfico rola para o lado em vez de espremer. */
  get larguraGrafico(): number {
    return this.ordenadas.length * 56 + 56;
  }

  alternarSerie(i: number, nome: string) {
    this.ocultas.has(nome) ? this.ocultas.delete(nome) : this.ocultas.add(nome);
    if (!this.chart) return;
    this.chart.setDatasetVisibility(i, !this.ocultas.has(nome));
    this.chart.update();
  }

  private rolarParaOFim() {
    setTimeout(() => { const r = this.rolagem?.nativeElement; if (r) r.scrollLeft = r.scrollWidth; });
  }
  private sub?: Subscription;
  private vistaPronta = false;

  constructor(private authService: AuthServiceService, private premium: EstruturasPremiumService, private redacaoService: RedacaoService, private usuarioService: UsuarioService, private router: Router, private firebase: FirebaseServiceService) {}

  ngOnInit(): void {
    this.sub = this.authService.usuario$.subscribe(u => {
      if (!u) {
        this.router.navigate(['/Home']);
        return;
      }
      const primeiro = !this.usuario;
      this.usuario = u;
      this.favorito = u.pagFavorita === 'redacoes';
      if (!primeiro) return;
      if (u.demo) this.aplicar(mockRedacoes);
      else this.redacaoService.getRedacoes().subscribe({ next: res => this.aplicar(res ?? []), error: () => (this.carregando = false) });
    });
  }

  ngAfterViewInit(): void {
    this.vistaPronta = true;
    setTimeout(() => (this.fabRecolhido = true), 2200);
    this.desenharGrafico();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.chart?.destroy();
  }

  private dataDe(r: Redacao): Date {
    const v = String(r.data ?? '');
    const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) return new Date(+br[3], +br[2] - 1, +br[1]);
    return new Date(v);
  }

  private temComp(r: Redacao): boolean {
    return COMPETENCIAS.some(c => (r[c.chave] ?? 0) > 0);
  }

  private aplicar(lista: Redacao[]) {
    this.premium.definirRedacoes(lista.length);
    const vistos = new Set<number>();
    this.redacoes = lista.filter(r => (vistos.has(r.id) ? false : (vistos.add(r.id), true)));
    this.ordenadas = [...this.redacoes].sort((a, b) => this.dataDe(a).getTime() - this.dataDe(b).getTime() || a.id - b.id);
    this.carregando = false;
    this.recalcular();
    setTimeout(() => this.desenharGrafico());
  }

  private recalcular() {
    const notas = this.ordenadas.map(r => r.nota);
    this.media = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : 0;
    const top = [...this.ordenadas].sort((a, b) => b.nota - a.nota)[0];
    this.melhor = { nota: top?.nota ?? 0, data: top ? this.dataDe(top) : null };
    this.ultima = notas.length ? { nota: notas[notas.length - 1], delta: notas.length > 1 ? notas[notas.length - 1] - notas[notas.length - 2] : null } : null;

    const comComp = this.ordenadas.filter(r => this.temComp(r));
    this.resumoC = COMPETENCIAS.map(info => {
      const v = comComp.map(r => r[info.chave] ?? 0);
      const media = v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
      return { info, media, melhor: v.length ? Math.max(...v) : 0, qtd: v.length, delta: v.length > 1 ? v[v.length - 1] - v[v.length - 2] : null, nivel: Math.round(media / 40) };
    });
    const comDados = this.resumoC.filter(c => c.qtd);
    this.base = comDados.length ? Math.round(comDados.reduce((s, c) => s + c.media, 0) / comDados.length) : 0;
    this.atencao = new Set(comDados.filter(c => this.precisaAtencao(c.media)));
    this.foco = [...this.atencao].sort((a, b) => a.media - b.media)[0] ?? null;

    this.montarHistorico();
    this.montarInsights();
  }

  private montarHistorico() {
    const numeros = new Map(this.ordenadas.map((r, i) => [r.id, i + 1]));
    const itens = [...this.ordenadas].reverse().map(r => {
      const data = this.dataDe(r);
      return { r, numero: numeros.get(r.id) ?? 0, data, dia: String(data.getDate()).padStart(2, '0'), mes: MESES[data.getMonth()] ?? '', temComp: this.temComp(r) };
    });
    const grupos = new Map<string, GrupoMes>();
    for (const it of itens) {
      const ok = !isNaN(it.data.getTime());
      const chave = ok ? `${it.data.getFullYear()}-${it.data.getMonth()}` : 'sem-data';
      if (!grupos.has(chave)) grupos.set(chave, { chave, rotulo: ok ? it.data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sem data', itens: [] });
      grupos.get(chave)!.itens.push(it);
    }
    this.historico = [...grupos.values()];
  }

  private montarInsights() {
    const lista: Insight[] = [];
    const notas = this.ordenadas.map(r => r.nota);
    if (!notas.length) return;

    const base = Math.round(this.media / 20) * 20;
    lista.push({ icone: 'target', tom: 'info', titulo: `Projeção: entre ${base} e ${Math.min(1000, base + 40)} pontos`, texto: `Com base na média das suas ${notas.length} redações. Cada nível a mais em uma competência vale 40 pontos.` });

    let seq = 0;
    for (let i = notas.length - 1; i > 0 && notas[i] > notas[i - 1]; i--) seq++;
    if (seq >= 2) lista.push({ icone: 'flame', tom: 'bom', titulo: `${seq} redações seguidas subindo a nota`, texto: `Da ${notas.length - seq}ª para a ${notas.length}ª você ganhou ${notas[notas.length - 1] - notas[notas.length - 1 - seq]} pontos.` });

    if (notas.length >= 3) {
      const inicio = notas.slice(0, Math.min(2, notas.length - 1));
      const fim = notas.slice(-2);
      const dif = Math.round(fim.reduce((a, b) => a + b, 0) / fim.length - inicio.reduce((a, b) => a + b, 0) / inicio.length);
      if (dif >= 40) lista.push({ icone: 'trending-up', tom: 'bom', titulo: `+${dif} pontos desde as primeiras redações`, texto: 'Comparando a média das duas primeiras com a das duas últimas.' });
      else if (dif <= -40) lista.push({ icone: 'activity', tom: 'alerta', titulo: `Suas últimas notas caíram ${-dif} pontos`, texto: 'Vale revisar as correções das últimas redações para entender o que mudou.' });
    }

    if (this.foco) lista.push({ icone: 'target', tom: 'alerta', titulo: `Foco em ${this.foco.info.sigla} · ${this.foco.info.nome}`, texto: `Média ${this.foco.media}/200, ${this.base - this.foco.media} pontos abaixo da sua base (${this.base}).${this.atencao.size > 1 ? ` Também pedem atenção: ${[...this.atencao].filter(c => c !== this.foco).map(c => c.info.sigla).join(', ')}.` : ''} ${this.foco.info.dica}` });

    const maximas = this.resumoC.filter(c => c.qtd >= 2 && c.media === 200);
    if (maximas.length) lista.push({ icone: 'trophy', tom: 'bom', titulo: `200 em ${maximas.map(c => c.info.sigla).join(', ')} em todas as redações`, texto: 'Aproveitamento total. Mantenha a mesma estratégia nessas competências.' });
    else {
      const fortes = this.resumoC.filter(c => c.qtd && c.media >= 180);
      if (fortes.length) lista.push({ icone: 'trophy', tom: 'bom', titulo: `Pontos fortes: ${fortes.map(c => c.info.sigla).join(', ')}`, texto: 'Média de 180 ou mais. A chance de tirar 200 nelas é alta.' });
    }

    const subiram = this.resumoC.filter(c => c.delta !== null && c.delta > 0);
    if (subiram.length) lista.push({ icone: 'arrow-up', tom: 'bom', titulo: `Última redação: subiu em ${subiram.map(c => c.info.sigla).join(', ')}`, texto: subiram.map(c => `${c.info.sigla} +${c.delta}`).join(' · ') + ' em relação à anterior.' });

    const freq = new Map<number, number>();
    notas.forEach(n => freq.set(n, (freq.get(n) ?? 0) + 1));
    const [valor, vezes] = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
    if (vezes > 2) lista.push({ icone: 'chart-column', tom: 'info', titulo: `${valor} é a sua nota mais comum`, texto: `Ela apareceu em ${vezes} redações. Subir um nível em ${this.foco?.info.sigla ?? 'uma competência'} rompe esse patamar.` });

    const semComp = this.ordenadas.filter(r => !this.temComp(r)).length;
    if (semComp) lista.push({ icone: 'clipboard-list', tom: 'info', titulo: `${semComp} ${semComp === 1 ? 'redação está' : 'redações estão'} sem as competências`, texto: 'Registrar a nota de cada competência deixa a análise muito mais precisa.' });

    this.insights = lista;
  }

  gerarAnalise() {
    this.analise = 'gerando';
    const etapas = ['Lendo suas redações…', 'Comparando as competências…', 'Medindo sua evolução…', 'Montando sua análise…'];
    etapas.forEach((e, i) => setTimeout(() => (this.etapaAnalise = e), i * 420));
    setTimeout(() => (this.analise = 'pronta'), etapas.length * 420 + 150);
  }

  trocarVisao(v: 'nota' | 'comp') {
    if (v === this.visao) return;
    this.visao = v;
    this.desenharGrafico();
  }

  private css(v: string, reserva: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || reserva;
  }

  private desenharGrafico() {
    const canvas = this.graficoRef?.nativeElement;
    if (!this.vistaPronta || !canvas || !this.ordenadas.length) {
      this.chart?.destroy();
      this.chart = undefined;
      return;
    }
    const labels = this.ordenadas.map((_, i) => `#${i + 1}`);
    const superficie = this.css('--ed-folha', '#FFFFFF');
    const caneta = this.css('--ed-caneta', '#2836C6');
    let datasets: any[];
    let teto: number;
    let passo: number;
    if (this.visao === 'nota') {
      teto = 1000;
      passo = 100;
      const ctx = canvas.getContext('2d')!;
      const deg = ctx.createLinearGradient(0, 0, 0, 280);
      deg.addColorStop(0, caneta + '30');
      deg.addColorStop(1, caneta + '00');
      datasets = [{ label: 'Nota', data: this.ordenadas.map(r => r.nota), borderColor: caneta, backgroundColor: deg, fill: 'origin', borderWidth: 3, tension: .3, pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: caneta, pointBorderColor: superficie, pointBorderWidth: 2, pointHitRadius: 14 }];
      this.legenda = [];
    } else {
      teto = 200;
      passo = 40;
      datasets = COMPETENCIAS.map(c => ({
        label: `${c.sigla} · ${c.nome}`,
        data: this.ordenadas.map(r => (this.temComp(r) ? r[c.chave] : null)),
        hidden: this.ocultas.has(c.sigla),
        borderColor: c.cor, backgroundColor: c.cor, borderWidth: 2, tension: .3, spanGaps: true,
        pointRadius: 3.5, pointHoverRadius: 6, pointBackgroundColor: c.cor, pointBorderColor: superficie, pointBorderWidth: 2, pointHitRadius: 12
      }));
      this.legenda = this.resumoC.map(c => ({ nome: c.info.sigla, cor: c.info.cor, valor: c.qtd ? c.media : null }));
    }
    const valores = datasets.flatMap(d => d.data).filter((v: number | null): v is number => v !== null);
    const minimo = this.visao === 'nota' ? Math.max(0, Math.floor((Math.min(...valores) - 80) / 100) * 100) : 0;
    const fonte = { family: 'Schibsted Grotesk, Arial, sans-serif', size: 12, weight: 600 as const };
    const texto = this.css('--ed-tinta-3', '#626A80');
    const grade = this.css('--ed-pauta', '#D9DEE8');

    this.chart?.destroy();
    this.chart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      plugins: [ChartDataLabels],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: 'easeOutCubic' },
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: this.visao === 'nota' ? 26 : 8, right: 12, left: 4 } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: texto, font: fonte } },
          y: { min: minimo, max: teto, grid: { color: grade }, border: { display: false }, ticks: { color: texto, font: fonte, stepSize: passo, maxTicksLimit: 6 } }
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: this.visao === 'nota',
            align: 'top', anchor: 'center', offset: 6, clamp: true,
            color: this.css('--ed-tinta', '#121A33'),
            backgroundColor: superficie, borderRadius: 6, padding: { top: 2, bottom: 2, left: 5, right: 5 },
            font: { family: 'Schibsted Grotesk, Arial, sans-serif', size: 12, weight: 800 },
            formatter: (v: number) => v
          },
          tooltip: {
            backgroundColor: '#121A33', padding: 12, cornerRadius: 10, boxPadding: 6, usePointStyle: true,
            titleFont: { ...fonte, size: 13, weight: 800 }, bodyFont: { ...fonte, size: 13 },
            callbacks: {
              title: (items: any[]) => {
                const r = this.ordenadas[items[0]?.dataIndex ?? 0];
                return `Redação ${items[0]?.label ?? ''}${r ? ' · ' + this.dataDe(r).toLocaleDateString('pt-BR') : ''}`;
              },
              label: (item: any) => ` ${item.dataset.label}: ${item.formattedValue} de ${teto}`
            }
          }
        } as any
      }
    });
    this.rolarParaOFim();
  }

  abrirDetalhe(c: ResumoC) {
    this.fechandoDetalhe = false;
    this.detalhe = c;
  }

  @HostListener('document:keydown.escape')
  fecharDetalhe() {
    if (!this.detalhe) return;
    this.fechandoDetalhe = true;
    setTimeout(() => {
      this.detalhe = null;
      this.fechandoDetalhe = false;
    }, 240);
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  fecharModal(lista?: Redacao[]) {
    this.mostrarModal = false;
    if (lista) this.aplicar(lista);
  }


  pedirExclusao(id: number) {
    if (this.usuario?.demo) {
      this.authService.open();
      return;
    }
    this.excluindo = id;
  }

  /** Redação cujos uploads estão abertos no modal. */
  vendoAnexos: { titulo: string; r: Redacao } | null = null;

  excluir(id: number) {
    const caminhos = (this.redacoes.find(r => r.id === id)?.anexos ?? []).map(a => a.caminho);
    this.redacaoService.deletaRedacao(id).subscribe({
      next: res => {
        this.excluindo = null;
        if (caminhos.length) this.firebase.apagaAnexosRedacao(caminhos);
        this.aplicar(Array.isArray(res) ? res : this.redacoes.filter(r => r.id !== id));
      },
      error: () => (this.excluindo = null)
    });
  }

  toggleFavorito() {
    const novo = this.favorito ? 'nenhuma' : 'redacoes';
    this.favorito = !this.favorito;
    this.usuarioService.setPaginaFavorita(novo).subscribe({
      next: res => { if (res) this.authService.atualizarUsuario(res); },
      error: () => (this.favorito = !this.favorito)
    });
  }

  sinal(n: number | null): string {
    if (n === null) return '';
    return n > 0 ? `+${n}` : String(n);
  }

  dataCurta(d: Date | null): string {
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : '—';
  }
}
