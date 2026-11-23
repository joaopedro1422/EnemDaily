import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { MOCK_SIMULADOS, Simulado } from '../models/simulado';
import { Usuario } from '../models/usuario';
import { AuthServiceService } from '../services/auth-service.service';
import { SimuladoService } from '../services/simulado.service';
import { NovoSimuladoModalComponent } from '../modal/novo-simulado-modal/novo-simulado-modal.component';
import { UsuarioService } from '../services/usuario.service';
import { notaEstimada } from '../shared/tri';
import { RedacaoService } from '../services/redacao.service';
import { mockRedacoes } from '../models/redacao';
import { EstruturasPremiumService } from '../services/estruturas-premium.service';
import { IconeComponent } from '../shared/icone/icone.component';
import { AREAS, ChaveArea, InfoArea, FAVORITAR_PAGINAS } from '../shared/dia';

Chart.register(...registerables);

type Visao = 'dias' | 'areas';
type Filtro = 'todos' | 1 | 2;
type Tom = 'bom' | 'alerta' | 'info';

interface ResumoDia {
  dia: 1 | 2;
  nome: string;
  areas: string;
  qtd: number;
  media: number;
  melhor: number;
  ultimo: number | null;
  delta: number | null;
}

interface ResumoArea {
  info: InfoArea;
  dia: 1 | 2;
  qtd: number;
  media: number;
  pct: number;
  melhor: number;
  delta: number | null;
  nota: number;
}

interface Insight {
  icone: string;
  tom: Tom;
  titulo: string;
  texto: string;
}

interface ItemHistorico {
  s: Simulado;
  data: Date;
  dia: string;
  mes: string;
  total: number;
  partes: { sigla: string; cor: string; corTexto: string; icone: string; valor: number }[];
}

interface GrupoMes {
  chave: string;
  rotulo: string;
  itens: ItemHistorico[];
}

const ORDEM_DIA: Record<1 | 2, ChaveArea[]> = { 1: ['linguagens', 'humanas'], 2: ['naturezas', 'exatas'] };
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

@Component({
  selector: 'app-home-simulados',
  imports: [NovoSimuladoModalComponent, IconeComponent, CarregandoComponent],
  templateUrl: './home-simulados.component.html',
  styleUrl: './home-simulados.component.css'
})
export class HomeSimuladosComponent implements OnInit, AfterViewInit, OnDestroy {
  graficoRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('grafico') set grafico(el: ElementRef<HTMLCanvasElement> | undefined) {
    const novo = el?.nativeElement !== this.graficoRef?.nativeElement;
    this.graficoRef = el;
    if (el && novo) setTimeout(() => this.desenharGrafico());
  }

  usuario: Usuario | null = null;
  simulados: Simulado[] = [];
  carregando = true;
  mostrarModal = false;
  fabRecolhido = false;
  favorito = false;
  readonly favoritarPaginas = FAVORITAR_PAGINAS;
  analise: 'fechada' | 'gerando' | 'pronta' = 'fechada';
  etapaAnalise = '';
  visao: Visao = 'dias';
  filtro: Filtro = 'todos';
  abertas = new Set<number>();
  excluindo: number | null = null;

  dias: ResumoDia[] = [];
  areas: ResumoArea[] = [];
  projecao: number | null = null;
  notaGeral: number | null = null;
  mediaRedacao: number | null = null;
  insights: Insight[] = [];
  historico: GrupoMes[] = [];
  legenda: { nome: string; cor: string; valor: number | null }[] = [];

  private chart?: Chart;
  private sub?: Subscription;
  private vistaPronta = false;

  constructor(private authService: AuthServiceService, private premium: EstruturasPremiumService, private simuladosService: SimuladoService, private router: Router, private usuarioService: UsuarioService, private redacaoService: RedacaoService) {}

  ngOnInit(): void {
    this.sub = this.authService.usuario$.subscribe(u => {
      if (!u) {
        this.router.navigate(['/Home']);
        return;
      }
      const primeiro = !this.usuario;
      this.usuario = u;
      this.favorito = u.pagFavorita === 'simulados';
      if (!primeiro) return;
      this.carregarRedacoes(!!u.demo);
      if (u.demo) {
        this.aplicar(MOCK_SIMULADOS);
      } else {
        this.simuladosService.getSimulados().subscribe({
          next: res => this.aplicar(res ?? []),
          error: () => (this.carregando = false)
        });
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => (this.fabRecolhido = true), 2200);
    this.vistaPronta = true;
    this.desenharGrafico();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.chart?.destroy();
  }

  private carregarRedacoes(demo: boolean) {
    const usar = (lista: { nota: number }[]) => {
      const notas = (lista ?? []).map(r => r.nota).filter(n => n > 0);
      this.mediaRedacao = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null;
      if (this.simulados.length) this.recalcular();
    };
    if (demo) usar(mockRedacoes);
    else this.redacaoService.getRedacoes().subscribe({ next: usar, error: () => {} });
  }

  private aplicar(lista: Simulado[]) {
    this.premium.definirSimulados(lista.length);
    this.simulados = [...lista];
    this.carregando = false;
    this.recalcular();
    setTimeout(() => this.desenharGrafico());
  }

  private doDia(d: 1 | 2): Simulado[] {
    return this.simulados.filter(s => s.dia === d).sort((a, b) => a.numeracao - b.numeracao || this.dataDe(a).getTime() - this.dataDe(b).getTime());
  }

  private dataDe(s: Simulado): Date {
    const v = String(s.data ?? '');
    const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) return new Date(+br[3], +br[2] - 1, +br[1]);
    const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    return new Date(v);
  }

  private recalcular() {
    const media = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0);

    this.dias = ([1, 2] as const).map(d => {
      const lista = this.doDia(d);
      const tot = lista.map(s => s.acertosTotais);
      const ultimo = tot.length ? tot[tot.length - 1] : null;
      const anterior = tot.length > 1 ? tot[tot.length - 2] : null;
      return {
        dia: d,
        nome: `${d}º dia`,
        areas: d === 1 ? 'Linguagens e Humanas' : 'Naturezas e Matemática',
        qtd: lista.length,
        media: Math.round(media(tot)),
        melhor: tot.length ? Math.max(...tot) : 0,
        ultimo,
        delta: ultimo !== null && anterior !== null ? ultimo - anterior : null
      };
    });

    this.areas = AREAS.map(info => {
      const dia: 1 | 2 = ORDEM_DIA[1].includes(info.chave) ? 1 : 2;
      const vals = this.doDia(dia).map(s => s[info.chave] as number);
      const m = media(vals);
      return {
        info,
        dia,
        qtd: vals.length,
        media: Math.round(m),
        pct: Math.round((m / 45) * 100),
        melhor: vals.length ? Math.max(...vals) : 0,
        delta: vals.length > 1 ? vals[vals.length - 1] - vals[vals.length - 2] : null,
        nota: vals.length ? notaEstimada(info.chave, m) : 0
      };
    });
    const comNota = this.areas.filter(a => a.qtd);
    const objetivas = comNota.reduce((s, a) => s + a.nota, 0);
    this.notaGeral = comNota.length === 4 ? Math.round(this.mediaRedacao !== null ? (objetivas + this.mediaRedacao) / 5 : objetivas / 4) : null;

    const [d1, d2] = this.dias;
    this.projecao = d1.qtd && d2.qtd ? Math.round(d1.media + d2.media) : null;
    this.montarHistorico();
    this.montarInsights();
  }

  private montarHistorico() {
    const filtrados = this.simulados
      .filter(s => this.filtro === 'todos' || s.dia === this.filtro)
      .map(s => {
        const data = this.dataDe(s);
        const partes = ORDEM_DIA[s.dia as 1 | 2].map(c => {
          const a = AREAS.find(x => x.chave === c)!;
          return { sigla: a.sigla, cor: a.cor, corTexto: a.corTexto, icone: a.icone, valor: s[c] as number };
        });
        return { s, data, dia: String(data.getDate()).padStart(2, '0'), mes: MESES[data.getMonth()] ?? '', total: s.acertosTotais, partes };
      })
      .sort((a, b) => b.data.getTime() - a.data.getTime() || b.s.numeracao - a.s.numeracao || b.s.dia - a.s.dia);

    const grupos = new Map<string, GrupoMes>();
    for (const it of filtrados) {
      const chave = isNaN(it.data.getTime()) ? 'sem-data' : `${it.data.getFullYear()}-${it.data.getMonth()}`;
      if (!grupos.has(chave)) {
        const rotulo = isNaN(it.data.getTime()) ? 'Sem data' : it.data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        grupos.set(chave, { chave, rotulo, itens: [] });
      }
      grupos.get(chave)!.itens.push(it);
    }
    this.historico = [...grupos.values()];
  }

  private montarInsights() {
    const lista: Insight[] = [];
    const [d1, d2] = this.dias;

    if (this.projecao !== null) {
      lista.push({ icone: 'target', tom: 'info', titulo: `Projeção: ~${this.projecao} de 180 acertos`, texto: `Somando suas médias do 1º e do 2º dia, você está com cerca de ${Math.round((this.projecao / 180) * 100)}% de aproveitamento na prova inteira.` });
    }

    for (const d of this.dias) {
      const tot = this.doDia(d.dia).map(s => s.acertosTotais);
      if (tot.length < 3) continue;
      const inicio = tot[0];
      const dif = d.media - inicio;
      if (dif >= 3) lista.push({ icone: 'trending-up', tom: 'bom', titulo: `${d.nome}: +${dif} acertos de média desde o início`, texto: `Você começou com ${inicio} e hoje sua média é ${d.media} em ${d.areas}.` });
      else if (dif <= -3) lista.push({ icone: 'activity', tom: 'alerta', titulo: `${d.nome}: média abaixo do seu começo`, texto: `Sua média (${d.media}) está ${-dif} acertos abaixo do primeiro simulado (${inicio}). Vale revisar ${d.areas}.` });

      let seq = 0;
      for (let i = tot.length - 1; i > 0 && tot[i] > tot[i - 1]; i--) seq++;
      if (seq >= 2) lista.push({ icone: 'flame', tom: 'bom', titulo: `${d.nome}: ${seq} melhoras seguidas`, texto: `Seus últimos ${seq + 1} simulados do ${d.nome} foram melhorando um atrás do outro.` });
    }

    const comDados = this.areas.filter(a => a.qtd > 0);
    if (comDados.length >= 2) {
      const pior = [...comDados].sort((a, b) => a.media - b.media)[0];
      const melhor = [...comDados].sort((a, b) => b.media - a.media)[0];
      if (pior.media < 30) lista.push({ icone: 'target', tom: 'alerta', titulo: `Foco em ${pior.info.nome}`, texto: `É a sua menor média: ${pior.media} de 45. Priorizar essa área tende a render mais pontos na projeção.` });
      if (melhor.media >= 35) lista.push({ icone: 'trophy', tom: 'bom', titulo: `${melhor.info.nome} é o seu ponto forte`, texto: `Média de ${melhor.media} de 45 (${melhor.pct}%). Mantenha o ritmo de questões para não perder o domínio.` });
      const subindo = comDados.filter(a => a.delta !== null && a.delta >= 3);
      if (subindo.length) lista.push({ icone: 'arrow-up', tom: 'bom', titulo: `Último simulado: subiu em ${subindo.map(a => a.info.nome).join(' e ')}`, texto: subindo.map(a => `${a.info.nome} +${a.delta}`).join(' · ') + ' em relação ao simulado anterior.' });
    }

    if (this.notaGeral !== null) {
      lista.unshift({ icone: 'trophy', tom: 'info', titulo: `Nota estimada: ~${this.notaGeral} pontos`, texto: this.mediaRedacao !== null ? `Média das 5 notas, como no boletim do ENEM: as 4 provas objetivas estimadas pela TRI e a média das suas redações (${this.mediaRedacao}).` : 'Média das 4 provas objetivas estimadas pela TRI. Registre redações para incluir a 5ª nota, como no boletim do ENEM.' });
    }

    const freq = new Map<number, number>();
    this.simulados.forEach(s => freq.set(s.acertosTotais, (freq.get(s.acertosTotais) ?? 0) + 1));
    const [valor, vezes] = [...freq.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
    if (vezes > 2) lista.push({ icone: 'chart-column', tom: 'info', titulo: `${valor} acertos é a sua nota mais comum`, texto: `Ela apareceu em ${vezes} simulados. Romper esse patamar é o próximo passo.` });

    if (!d1.qtd || !d2.qtd) {
      const falta = !d1.qtd ? this.dias[0] : this.dias[1];
      lista.push({ icone: 'clipboard-list', tom: 'info', titulo: `Registre um simulado do ${falta.nome}`, texto: `Com os dois dias registrados, calculamos sua projeção para a prova inteira.` });
    }
    this.insights = lista;
  }

  gerarAnalise() {
    this.analise = 'gerando';
    const etapas = ['Lendo seus simulados…', 'Comparando os dois dias…', 'Medindo cada área…', 'Montando sua análise…'];
    etapas.forEach((e, i) => setTimeout(() => (this.etapaAnalise = e), i * 420));
    setTimeout(() => (this.analise = 'pronta'), etapas.length * 420 + 150);
  }

  toggleFavorito() {
    const novo = this.favorito ? 'nenhuma' : 'simulados';
    this.favorito = !this.favorito;
    this.usuarioService.setPaginaFavorita(novo).subscribe({
      next: res => { if (res) this.authService.atualizarUsuario(res); },
      error: () => (this.favorito = !this.favorito)
    });
  }

  trocarVisao(v: Visao) {
    if (v === this.visao) return;
    this.visao = v;
    this.desenharGrafico();
  }

  filtrar(f: Filtro) {
    this.filtro = f;
    this.montarHistorico();
  }

  private cor(v: string, reserva: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || reserva;
  }

  private desenharGrafico() {
    const canvas = this.graficoRef?.nativeElement;
    if (!this.vistaPronta || !canvas || !this.simulados.length) {
      this.chart?.destroy();
      this.chart = undefined;
      return;
    }
    const numeros = [...new Set(this.simulados.map(s => s.numeracao))].sort((a, b) => a - b);
    const porNumero = (d: 1 | 2, f: (s: Simulado) => number) => numeros.map(n => {
      const s = this.simulados.find(x => x.dia === d && x.numeracao === n);
      return s ? f(s) : null;
    });

    let series: { nome: string; cor: string; dados: (number | null)[] }[];
    let teto: number;
    if (this.visao === 'dias') {
      teto = 90;
      series = [
        { nome: '1º dia', cor: this.cor('--ed-caneta', '#2836C6'), dados: porNumero(1, s => s.acertosTotais) },
        { nome: '2º dia', cor: this.cor('--ed-mt', '#D08C21'), dados: porNumero(2, s => s.acertosTotais) }
      ];
    } else {
      teto = 45;
      series = AREAS.map(a => ({
        nome: a.nome,
        cor: this.cor(a.cor.slice(4, -1), '#888'),
        dados: porNumero(ORDEM_DIA[1].includes(a.chave) ? 1 : 2, s => s[a.chave] as number)
      }));
    }
    this.legenda = series.map(s => ({ nome: s.nome, cor: s.cor, valor: [...s.dados].reverse().find(v => v !== null) ?? null }));

    const valores = series.flatMap(s => s.dados).filter((v): v is number => v !== null);
    const minimo = Math.max(0, Math.floor((Math.min(...valores) - 6) / 5) * 5);
    const grade = this.cor('--ed-pauta', '#D9DEE8');
    const texto = this.cor('--ed-tinta-3', '#626A80');
    const superficie = this.cor('--ed-folha', '#FFFFFF');
    const fonte = { family: 'Schibsted Grotesk, Arial, sans-serif', size: 12, weight: 600 as const };

    this.chart?.destroy();
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: numeros.map(n => `#${n}`),
        datasets: series.map(s => ({
          label: s.nome,
          data: s.dados,
          borderColor: s.cor,
          backgroundColor: s.cor,
          borderWidth: 2,
          tension: .3,
          spanGaps: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: s.cor,
          pointBorderColor: superficie,
          pointBorderWidth: 2,
          pointHitRadius: 14
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: 'easeOutCubic' },
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 8, right: 8 } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: texto, font: fonte } },
          y: {
            min: minimo,
            max: teto,
            grid: { color: grade },
            border: { display: false },
            ticks: { color: texto, font: fonte, stepSize: teto === 90 ? 10 : 5, maxTicksLimit: 6 }
          }
        },
        plugins: {
          legend: { display: false },
          datalabels: { display: false },
          tooltip: {
            backgroundColor: '#121A33',
            padding: 12,
            cornerRadius: 10,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: { ...fonte, size: 13, weight: 800 },
            bodyFont: { ...fonte, size: 13 },
            callbacks: {
              title: (items: any[]) => `Simulado ${items[0]?.label ?? ''}`,
              label: (item: any) => ` ${item.dataset.label}: ${item.formattedValue} de ${teto}`
            }
          }
        } as any
      }
    });
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  fecharModal(lista?: Simulado[]) {
    this.mostrarModal = false;
    if (lista) this.aplicar(lista);
  }

  alternarNotas(id: number) {
    this.abertas.has(id) ? this.abertas.delete(id) : this.abertas.add(id);
  }

  pedirExclusao(id: number) {
    if (this.usuario?.demo) {
      this.authService.open();
      return;
    }
    this.excluindo = id;
  }

  excluir(id: number) {
    this.simuladosService.deletaSimulado(id).subscribe({
      next: res => {
        this.excluindo = null;
        this.aplicar(res ?? []);
      },
      error: () => (this.excluindo = null)
    });
  }

  sinal(n: number | null): string {
    if (n === null) return '';
    return n > 0 ? `+${n}` : String(n);
  }
}
