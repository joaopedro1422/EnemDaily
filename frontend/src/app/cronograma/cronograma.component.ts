import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AssuntoMini, ConfigEntrada, DiaCalendario, Fase, NOMES_FASE, NOMES_PESO, Painel, Tarefa, dataLocal
} from '../models/cronograma';
import { infoAreaConteudo } from '../models/conteudo';
import { CronogramaService } from '../services/cronograma.service';
import { IconeComponent } from '../shared/icone/icone.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { SomService } from '../shared/som/som.service';
import { ComoFuncionaComponent } from './como-funciona/como-funciona.component';
import { MontagemComponent } from './montagem/montagem.component';
import { GeracaoComponent } from './geracao/geracao.component';
import { AcaoAssunto, ContextoAssunto, FolhaAssuntoComponent } from './folha-assunto/folha-assunto.component';
import { AjustesCronogramaComponent } from './ajustes/ajustes.component';

interface Folha { assunto: AssuntoMini | null; tarefa: Tarefa | null; contexto: ContextoAssunto; }
interface Aviso { texto: string; desfazer?: () => void; erro?: boolean; }
type Ponto = 'feito' | 'falta' | 'previsto';
interface DiaFaixa { data: string; semana: string; dia: number; mes: string | null; hoje: boolean; livre: boolean; pontos: Ponto[]; }
interface Trecho { fase: Fase; nome: string; dias: number; periodo: string; }

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

@Component({
  selector: 'app-cronograma',
  standalone: true,
  imports: [IconeComponent, CarregandoComponent, ComoFuncionaComponent, MontagemComponent, GeracaoComponent,
    FolhaAssuntoComponent, AjustesCronogramaComponent],
  templateUrl: './cronograma.component.html',
  styleUrl: './cronograma.component.css'
})
export class CronogramaComponent implements OnInit, OnDestroy {
  private api = inject(CronogramaService);
  private router = inject(Router);
  private som = inject(SomService);

  @ViewChild('faixa') faixa?: ElementRef<HTMLElement>;

  readonly info = infoAreaConteudo;
  readonly fases = NOMES_FASE;
  readonly pesos = NOMES_PESO;

  painel: Painel | null = null;
  carregando = true;
  falhou = false;

  ajuda: 'primeira' | 'normal' | null = null;
  montagem: 'criar' | 'editar' | null = null;
  gerando: { modo: 'criar' | 'editar'; pronto: boolean } | null = null;
  revelar = false;
  ajustes = false;
  folha: Folha | null = null;
  ocupado = false;
  /** Revisão em que o aluno tocou no check: pergunta "como foi?" na própria linha. */
  perguntaRevisao: number | null = null;
  confirmandoNaoDeu = false;
  bemVindoFechado = false;
  aviso: Aviso | null = null;

  /** Dia escolhido no calendário; nulo = hoje. */
  selecionado: string | null = null;
  carregandoDia = false;
  faixaDias: DiaFaixa[] = [];
  trechos: Trecho[] = [];
  posHoje = 0;
  private cache = new Map<string, DiaCalendario>();
  private avisoTimer?: ReturnType<typeof setTimeout>;
  private rolou = false;

  ngOnInit() {
    this.carregar();
  }

  ngOnDestroy() {
    clearTimeout(this.avisoTimer);
  }

  carregar() {
    this.carregando = true;
    this.falhou = false;
    this.api.painel().subscribe({
      next: p => {
        this.atualizar(p);
        this.carregando = false;
        if (!p.configurado) this.ajuda = 'primeira';
      },
      error: (e: HttpErrorResponse) => {
        this.carregando = false;
        if (e.status === 404 || e.status === 401) { this.router.navigate(['/Home']); return; }
        this.falhou = true;
      }
    });
  }

  /** Todo painel novo (depois de cada ação) refaz o calendário e a jornada. */
  private atualizar(p: Painel) {
    this.painel = p;
    this.cache.clear();
    (p.dias ?? []).forEach(d => this.cache.set(d.data, d));
    if (this.selecionado && !this.cache.has(this.selecionado)) this.buscarDias(this.selecionado);
    this.montarFaixa();
    this.montarJornada();
    if (!this.rolou && p.configurado) {
      this.rolou = true;
      setTimeout(() => this.centralizar(this.diaSel, false));
    }
  }

  // ---------------------------------------------------------------- calendário

  get diaSel(): string { return this.selecionado ?? this.painel?.hoje ?? ''; }
  get ehHoje(): boolean { return !!this.painel && this.diaSel === this.painel.hoje; }
  get passado(): boolean { return !!this.painel && this.diaSel < this.painel.hoje; }
  get diaAtual(): DiaCalendario | null { return this.cache.get(this.diaSel) ?? null; }

  /** Hoje: o que falta e o que já foi feito. Outros dias: só leitura. */
  get tarefasDoDia(): Tarefa[] {
    if (this.ehHoje) return this.painel?.hojeTarefas ?? [];
    return this.diaAtual?.tarefas ?? [];
  }
  get pendentes(): Tarefa[] { return this.tarefasDoDia.filter(t => !t.feita); }
  get feitas(): Tarefa[] { return this.tarefasDoDia.filter(t => t.feita); }

  selecionar(data: string) {
    if (!this.painel) return;
    this.selecionado = data === this.painel.hoje ? null : data;
    this.perguntaRevisao = null;
    this.confirmandoNaoDeu = false;
    if (!this.cache.has(data)) this.buscarDias(data);
    this.centralizar(data, true);
  }

  voltarHoje() {
    if (this.painel) this.selecionar(this.painel.hoje);
  }

  private buscarDias(data: string) {
    const p = this.painel;
    if (!p) return;
    const fim = somar(data, 27);
    const limite = somar(p.prova, -1);
    this.carregandoDia = true;
    this.api.dias(somar(data, -3), fim > limite ? limite : fim).subscribe({
      next: lista => { lista.forEach(d => this.cache.set(d.data, d)); this.carregandoDia = false; },
      error: () => { this.carregandoDia = false; }
    });
  }

  private centralizar(data: string, suave: boolean) {
    const faixa = this.faixa?.nativeElement;
    const card = faixa?.querySelector<HTMLElement>(`[data-dia="${data}"]`);
    if (!faixa || !card) return;
    const alvo = card.offsetLeft - faixa.clientWidth / 2 + card.offsetWidth / 2;
    faixa.scrollTo({ left: Math.max(0, alvo), behavior: suave ? 'smooth' : 'auto' });
  }

  private montarFaixa() {
    const p = this.painel;
    if (!p?.configurado) { this.faixaDias = []; return; }
    let mesAnterior = -1;
    this.faixaDias = (p.mapa ?? []).map((d, i) => {
      const dt = dataLocal(d.data);
      const mes = dt.getMonth() !== mesAnterior || i === 0
        ? dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') : null;
      mesAnterior = dt.getMonth();
      const pontos: Ponto[] = [];
      const plan = d.planejadas ?? 0;
      if (d.data < p.hoje) {
        for (let k = 0; k < Math.min(3, d.feitas); k++) pontos.push('feito');
        for (let k = d.feitas; k < Math.min(3, plan); k++) pontos.push('falta');
      } else if (d.data === p.hoje) {
        const feitas = p.hojeTarefas.filter(t => t.feita).length;
        const total = p.hojeTarefas.length;
        for (let k = 0; k < Math.min(3, total); k++) pontos.push(k < feitas ? 'feito' : 'previsto');
      } else {
        for (let k = 0; k < Math.min(3, plan); k++) pontos.push('previsto');
      }
      return { data: d.data, semana: SEMANA[dt.getDay()], dia: dt.getDate(), mes, hoje: d.data === p.hoje, livre: !pontos.length, pontos };
    });
  }

  // ---------------------------------------------------------------- jornada

  private montarJornada() {
    const p = this.painel;
    const f = p?.fases;
    if (!p || !f) { this.trechos = []; return; }
    const dias = (a: string, b: string) => Math.max(0, Math.round((dataLocal(b).getTime() - dataLocal(a).getTime()) / 86400000));
    const mes = (iso: string) => dataLocal(iso).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const periodo = (a: string, b: string) => mes(a) === mes(somar(b, -1)) ? mes(a) : `${mes(a)} – ${mes(somar(b, -1))}`;
    this.trechos = [
      { fase: 'base' as Fase, nome: 'Base', dias: dias(f.base, f.aprofundamento), periodo: periodo(f.base, f.aprofundamento) },
      { fase: 'aprofundamento' as Fase, nome: 'Aprofundamento', dias: dias(f.aprofundamento, f.retaFinal), periodo: periodo(f.aprofundamento, f.retaFinal) },
      { fase: 'reta-final' as Fase, nome: 'Reta final', dias: dias(f.retaFinal, p.prova), periodo: periodo(f.retaFinal, p.prova) }
    ].filter(t => t.dias > 0);
    const total = dias(f.base, p.prova) || 1;
    this.posHoje = Math.min(100, Math.max(0, (dias(f.base, p.hoje) / total) * 100));
  }

  // ---------------------------------------------------------------- textos

  dataLonga(iso: string): string {
    return dataLocal(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  dataCurta(iso: string): string {
    return dataLocal(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
  }

  pct(v: number): number { return Math.round(v * 100); }

  /** Arco do anel de progresso (circunferência de raio 16 ≈ 100,5). */
  arco(feitas: number, total: number): string {
    const f = total ? Math.min(1, feitas / total) : 0;
    return `${(f * 100.5).toFixed(1)} 100.5`;
  }

  rotulo(t: Tarefa): string {
    if (t.tipo === 'redacao') return 'Redação';
    if (t.tipo === 'parte') return 'Parte feita';
    if (t.tipo === 'treino') return 'Treino';
    if (t.tipo === 'revisao') return t.revisaoFinal ? 'Revisão final' : 'Revisão';
    return t.partes > 1 ? `Parte ${t.parte} de ${t.partes}` : 'Estudo';
  }

  /** "Hoje", "Amanhã", "Ontem" ou o dia da semana. */
  get tituloDia(): string {
    const p = this.painel;
    if (!p) return '';
    if (this.ehHoje) return 'Hoje';
    if (this.diaSel === somar(p.hoje, 1)) return 'Amanhã';
    if (this.diaSel === somar(p.hoje, -1)) return 'Ontem';
    const s = dataLocal(this.diaSel).toLocaleDateString('pt-BR', { weekday: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  get subtituloDia(): string {
    const d = dataLocal(this.diaSel);
    const titulo = this.tituloDia;
    const semana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const data = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    return ['Hoje', 'Amanhã', 'Ontem'].includes(titulo) ? `${semana}, ${data}` : data;
  }

  get amanha(): { nome: string; data: string } | null {
    const p = this.painel;
    if (!p) return null;
    const futuro = (p.dias ?? []).find(d => d.data > p.hoje && d.tarefas.some(t => t.assunto));
    const t = futuro?.tarefas.find(x => x.assunto);
    return futuro && t?.assunto ? { nome: t.assunto.nome, data: futuro.data } : null;
  }

  get antesDoInicio(): boolean {
    const p = this.painel;
    return !!p?.config && this.diaSel < p.config.inicio;
  }

  // ---------------------------------------------------------------- primeiro acesso e montagem

  fecharAjuda(confirmou: boolean) {
    const primeira = this.ajuda === 'primeira';
    this.ajuda = null;
    if (primeira && confirmou) this.montagem = 'criar';
  }

  montar(config: ConfigEntrada) {
    const modo = this.montagem ?? 'criar';
    this.montagem = null;
    this.gerando = { modo, pronto: false };
    this.api.salvar(config).subscribe({
      next: p => { this.selecionado = null; this.rolou = false; this.atualizar(p); this.gerando = { modo, pronto: true }; },
      error: (e: HttpErrorResponse) => {
        this.gerando = null;
        this.mostrar({ texto: e.error?.erro ?? 'Não foi possível montar o cronograma agora.', erro: true });
        this.montagem = modo;
      }
    });
  }

  fimGeracao() {
    this.gerando = null;
    this.revelar = true;
    setTimeout(() => this.centralizar(this.diaSel, false));
    setTimeout(() => (this.revelar = false), 1600);
  }

  cancelarMontagem() {
    const criando = this.montagem === 'criar' && !this.painel?.configurado;
    this.montagem = null;
    if (criando) this.router.navigate(['/Home']);
  }

  // ---------------------------------------------------------------- ajustes

  escolhaAjustes(e: 'editar' | 'ajuda' | 'refazer' | 'fechar') {
    this.ajustes = false;
    if (e === 'editar') this.montagem = 'editar';
    if (e === 'ajuda') this.ajuda = 'normal';
    if (e === 'refazer') {
      this.api.apagar().subscribe({
        next: () => this.api.painel().subscribe(p => { this.atualizar(p); this.montagem = 'criar'; }),
        error: () => this.mostrar({ texto: 'Não foi possível refazer agora.', erro: true })
      });
    }
  }

  notificacoes(ativo: boolean) {
    this.executar(this.api.notificacoes(ativo), ativo ? 'Lembretes ligados' : 'Lembretes desligados');
  }

  // ---------------------------------------------------------------- ações de hoje

  /** Check na linha da tarefa (só hoje). */
  check(t: Tarefa, ev?: Event) {
    ev?.stopPropagation();
    if (this.ocupado || t.feita || !this.ehHoje) return;
    if (t.tipo === 'redacao') {
      this.executar(this.api.redacao(true), 'Redação da semana feita', undefined, true);
      return;
    }
    const a = t.assunto;
    if (!a) return;
    if (t.tipo === 'revisao' || t.tipo === 'treino') {
      this.perguntaRevisao = this.perguntaRevisao === a.id ? null : a.id;
      return;
    }
    const pedido = t.partes > 1 ? this.api.parte(a.id) : this.api.estudado(a.id);
    const texto = t.partes > 1 ? `Parte de hoje feita · ${a.nome}` : `${a.nome} concluído`;
    this.executar(pedido, texto, () => this.desfazer(a.id), true);
  }

  revisar(t: Tarefa, dificil: boolean) {
    const a = t.assunto;
    if (!a || !this.ehHoje) return;
    this.perguntaRevisao = null;
    const texto = dificil ? `${a.nome} volta em 4 dias` : `${a.nome} revisado`;
    this.executar(this.api.revisado(a.id, dificil), texto, () => this.desfazer(a.id), true);
  }

  concluirDia() {
    if (!this.ehHoje) return;
    const ids = this.pendentes.map(t => t.assunto?.id).filter((x): x is number => x != null);
    this.executar(this.api.concluirDia(), 'Dia concluído', ids.length ? () => this.desfazerVarios(ids) : undefined, true);
  }

  naoDeuHoje() {
    if (!this.ehHoje) return;
    this.confirmandoNaoDeu = false;
    this.executar(this.api.naoConseguiDia(), 'Tudo bem. O que faltou foi para os próximos dias.');
  }

  private desfazer(id: number) {
    this.executar(this.api.desfazer(id), 'Desfeito');
  }

  private desfazerVarios(ids: number[]) {
    const proximo = (i: number) => {
      if (i >= ids.length) { this.mostrar({ texto: 'Desfeito' }); return; }
      this.api.desfazer(ids[i]).subscribe({ next: p => { this.atualizar(p); proximo(i + 1); }, error: () => proximo(i + 1) });
    };
    this.esconderAviso();
    proximo(0);
  }

  // ---------------------------------------------------------------- folha do assunto

  abrir(t: Tarefa) {
    if (this.ocupado) return;
    this.perguntaRevisao = null;
    const contexto: ContextoAssunto = t.feita ? 'feito' : this.ehHoje ? 'hoje' : 'previsto';
    this.folha = { tarefa: t, assunto: t.assunto, contexto };
  }

  abrirAssunto(a: AssuntoMini, contexto: ContextoAssunto) {
    if (this.ocupado) return;
    this.folha = { tarefa: null, assunto: a, contexto };
  }

  acaoFolha(acao: AcaoAssunto) {
    const f = this.folha;
    if (!f) return;
    const a = f.assunto;
    const nome = a?.nome ?? '';
    const fechar = () => (this.folha = null);
    switch (acao) {
      case 'redacao-feita': this.executar(this.api.redacao(true), 'Redação da semana feita', undefined, true, fechar); break;
      case 'concluir':
      case 'terminar': this.executar(this.api.estudado(a!.id), `${nome} concluído`, () => this.desfazer(a!.id), true, fechar); break;
      case 'parte': this.executar(this.api.parte(a!.id), `Parte de hoje feita · ${nome}`, () => this.desfazer(a!.id), true, fechar); break;
      case 'tranquila': this.executar(this.api.revisado(a!.id, false), `${nome} revisado`, () => this.desfazer(a!.id), true, fechar); break;
      case 'dificil': this.executar(this.api.revisado(a!.id, true), `${nome} volta em 4 dias`, () => this.desfazer(a!.id), true, fechar); break;
      case 'nao-consegui':
        if (f.tarefa?.tipo === 'redacao') this.executar(this.api.redacao(false), 'Tudo bem. A redação fica para a próxima semana.', undefined, false, fechar);
        else this.executar(this.api.naoConsegui(a!.id), `Tudo bem. ${nome} foi para o próximo dia livre.`, undefined, false, fechar);
        break;
      case 'ja-domino': this.executar(this.api.estudado(a!.id, true), `${nome} marcado como dominado`, () => this.desfazer(a!.id), false, fechar); break;
      case 'estudei': this.executar(this.api.estudado(a!.id), `${nome} marcado como estudado`, () => this.desfazer(a!.id), true, fechar); break;
      case 'nao-estudado': this.executar(this.api.naoEstudado(a!.id), `${nome} voltou para o plano`, undefined, false, fechar); break;
      case 'remover': this.executar(this.api.remover(a!.id), `${nome} saiu do seu plano`, () => this.executar(this.api.restaurar(a!.id), 'Desfeito'), false, fechar); break;
      case 'restaurar': this.executar(this.api.restaurar(a!.id), `${nome} voltou para o seu plano`, undefined, false, fechar); break;
    }
  }

  // ---------------------------------------------------------------- execução e aviso

  private executar(pedido: Observable<Painel>, texto: string, desfazer?: () => void, comemorar = false, depois?: () => void) {
    if (this.ocupado) return;
    this.ocupado = true;
    pedido.subscribe({
      next: p => {
        this.atualizar(p);
        this.ocupado = false;
        if (comemorar) this.som.pop();
        depois?.();
        this.mostrar({ texto, desfazer });
      },
      error: (e: HttpErrorResponse) => {
        this.ocupado = false;
        this.mostrar({ texto: e.error?.erro ?? 'Não foi possível salvar agora. Tente de novo.', erro: true });
      }
    });
  }

  mostrar(a: Aviso) {
    clearTimeout(this.avisoTimer);
    this.aviso = a;
    this.avisoTimer = setTimeout(() => (this.aviso = null), a.desfazer ? 5200 : 3200);
  }

  esconderAviso() {
    clearTimeout(this.avisoTimer);
    this.aviso = null;
  }

  usarDesfazer() {
    const d = this.aviso?.desfazer;
    this.esconderAviso();
    d?.();
  }
}

function somar(iso: string, dias: number): string {
  const d = dataLocal(iso);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
