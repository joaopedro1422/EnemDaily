import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AssuntoMini, ConfigEntrada, DiaSemana, NOMES_FASE, NOMES_PESO, Painel, Tarefa, dataLocal
} from '../models/cronograma';
import { infoAreaConteudo } from '../models/conteudo';
import { CronogramaService } from '../services/cronograma.service';
import { IconeComponent } from '../shared/icone/icone.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { SomService } from '../shared/som/som.service';
import { ComoFuncionaComponent } from './como-funciona/como-funciona.component';
import { MontagemComponent } from './montagem/montagem.component';
import { GeracaoComponent } from './geracao/geracao.component';
import { MapaAnoComponent } from './mapa-ano/mapa-ano.component';
import { AcaoAssunto, ContextoAssunto, FolhaAssuntoComponent } from './folha-assunto/folha-assunto.component';
import { AjustesCronogramaComponent } from './ajustes/ajustes.component';

interface Folha { assunto: AssuntoMini | null; tarefa: Tarefa | null; contexto: ContextoAssunto; }
interface Aviso { texto: string; desfazer?: () => void; erro?: boolean; }

@Component({
  selector: 'app-cronograma',
  standalone: true,
  imports: [IconeComponent, CarregandoComponent, ComoFuncionaComponent, MontagemComponent, GeracaoComponent,
    MapaAnoComponent, FolhaAssuntoComponent, AjustesCronogramaComponent],
  templateUrl: './cronograma.component.html',
  styleUrl: './cronograma.component.css'
})
export class CronogramaComponent implements OnInit, OnDestroy {
  private api = inject(CronogramaService);
  private router = inject(Router);
  private som = inject(SomService);

  readonly info = infoAreaConteudo;
  readonly fases = NOMES_FASE;
  readonly pesos = NOMES_PESO;
  readonly iniciais = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

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
  diaSelecionado: string | null = null;
  bemVindoFechado = false;
  aviso: Aviso | null = null;
  private avisoTimer?: ReturnType<typeof setTimeout>;

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
        this.painel = p;
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

  // ---------------------------------------------------------------- dados derivados

  get pendentes(): Tarefa[] { return this.painel?.hojeTarefas.filter(t => !t.feita) ?? []; }
  get feitas(): Tarefa[] { return this.painel?.hojeTarefas.filter(t => t.feita) ?? []; }
  get totalHoje(): number { return this.painel?.hojeTarefas.length ?? 0; }

  get progressoHoje(): number {
    return this.totalHoje ? this.feitas.length / this.totalHoje : 0;
  }

  get antesDoInicio(): boolean {
    const p = this.painel;
    return !!p?.config && p.config.inicio > p.hoje;
  }

  get amanha(): { nome: string; data: string } | null {
    const p = this.painel;
    if (!p) return null;
    const futuro = p.semana.find(d => d.data > p.hoje && d.tarefas.some(t => t.assunto));
    const t = futuro?.tarefas.find(x => x.assunto);
    if (futuro && t?.assunto) return { nome: t.assunto.nome, data: futuro.data };
    const prox = p.proximos[0];
    return prox ? { nome: prox.assunto.nome, data: prox.data } : null;
  }

  get diaAberto(): DiaSemana | null {
    if (!this.painel || !this.diaSelecionado || this.diaSelecionado === this.painel.hoje) return null;
    return this.painel.semana.find(d => d.data === this.diaSelecionado) ?? null;
  }

  dataLonga(iso: string): string {
    return dataLocal(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  dataCurta(iso: string): string {
    return dataLocal(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
  }

  diaDoMes(iso: string): number { return dataLocal(iso).getDate(); }

  /** Pontinhos de carga prevista nos dias que ainda vão chegar (até 3). */
  pontos(d: DiaSemana): number[] {
    if (!this.painel || d.data <= this.painel.hoje) return [];
    return Array.from({ length: Math.min(3, d.planejadas ?? 0) }, (_, i) => i);
  }

  pct(v: number): number { return Math.round(v * 100); }

  /** Arco do anel de progresso (circunferência de raio 16 ≈ 100,5). */
  arco(feitas: number, total: number | null): string {
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

  chaveTarefa(t: Tarefa, i: number): string {
    return `${t.tipo}-${t.assunto?.id ?? 'r'}-${t.feita}-${i}`;
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
      next: p => { this.painel = p; this.diaSelecionado = null; this.gerando = { modo, pronto: true }; },
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
        next: () => this.api.painel().subscribe(p => { this.painel = p; this.montagem = 'criar'; }),
        error: () => this.mostrar({ texto: 'Não foi possível refazer agora.', erro: true })
      });
    }
  }

  notificacoes(ativo: boolean) {
    this.executar(this.api.notificacoes(ativo), ativo ? 'Lembretes ligados' : 'Lembretes desligados');
  }

  // ---------------------------------------------------------------- ações do dia

  /** Check na linha da tarefa. */
  check(t: Tarefa, ev?: Event) {
    ev?.stopPropagation();
    if (this.ocupado || t.feita) return;
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
    if (!a) return;
    this.perguntaRevisao = null;
    const texto = dificil ? `${a.nome} volta em 4 dias` : `${a.nome} revisado`;
    this.executar(this.api.revisado(a.id, dificil), texto, () => this.desfazer(a.id), true);
  }

  concluirDia() {
    const ids = this.pendentes.map(t => t.assunto?.id).filter((x): x is number => x != null);
    this.executar(this.api.concluirDia(), 'Dia concluído', ids.length ? () => this.desfazerVarios(ids) : undefined, true);
  }

  naoDeuHoje() {
    this.confirmandoNaoDeu = false;
    this.executar(this.api.naoConseguiDia(), 'Tudo bem. O que faltou foi para os próximos dias.');
  }

  private desfazer(id: number) {
    this.executar(this.api.desfazer(id), 'Desfeito');
  }

  private desfazerVarios(ids: number[]) {
    const proximo = (i: number) => {
      if (i >= ids.length) { this.mostrar({ texto: 'Desfeito' }); return; }
      this.api.desfazer(ids[i]).subscribe({ next: p => { this.painel = p; proximo(i + 1); }, error: () => proximo(i + 1) });
    };
    this.esconderAviso();
    proximo(0);
  }

  // ---------------------------------------------------------------- folha do assunto

  abrir(t: Tarefa | null, assunto: AssuntoMini | null, contexto: ContextoAssunto) {
    if (this.ocupado) return;
    this.perguntaRevisao = null;
    this.folha = { tarefa: t, assunto: assunto ?? t?.assunto ?? null, contexto };
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
        this.painel = p;
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
