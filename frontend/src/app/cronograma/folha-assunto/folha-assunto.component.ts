import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AssuntoMini, DetalheAssunto, NOMES_PESO, Tarefa, dataLocal } from '../../models/cronograma';
import { infoAreaConteudo } from '../../models/conteudo';
import { CronogramaService } from '../../services/cronograma.service';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';

export type AcaoAssunto = 'concluir' | 'parte' | 'terminar' | 'tranquila' | 'dificil' | 'nao-consegui' | 'ja-domino'
  | 'remover' | 'restaurar' | 'nao-estudado' | 'estudei' | 'redacao-feita';

/** Onde o assunto apareceu: decide quais ações fazem sentido. */
export type ContextoAssunto = 'hoje' | 'previsto' | 'fora' | 'removido' | 'feito';

@Component({
  selector: 'app-folha-assunto',
  standalone: true,
  imports: [RouterLink, IconeComponent, CarregandoComponent],
  templateUrl: './folha-assunto.component.html',
  styleUrl: './folha-assunto.component.css'
})
export class FolhaAssuntoComponent implements OnInit {
  private api = inject(CronogramaService);

  @Input() assunto: AssuntoMini | null = null;
  @Input() tarefa: Tarefa | null = null;
  @Input() contexto: ContextoAssunto = 'hoje';
  /** Ação em andamento (o botão mostra carregando). */
  @Input() ocupado = false;
  @Output() acao = new EventEmitter<AcaoAssunto>();
  @Output() fechou = new EventEmitter<void>();

  readonly info = infoAreaConteudo;
  readonly pesos = NOMES_PESO;
  detalhe: DetalheAssunto | null = null;
  erro = false;
  fechando = false;
  menu = false;
  marcados = new Set<number>();
  card = 0;
  virado = false;
  verCards = false;

  get redacao(): boolean { return this.tarefa?.tipo === 'redacao'; }
  get revisao(): boolean { return this.tarefa?.tipo === 'revisao' || this.tarefa?.tipo === 'treino'; }
  get emPartes(): boolean { return (this.tarefa?.partes ?? 0) > 1; }

  ngOnInit() {
    if (this.redacao || !this.assunto) return;
    this.verCards = this.contexto === 'hoje' && this.revisao;
    this.api.detalhe(this.assunto.id).subscribe({ next: d => (this.detalhe = d), error: () => (this.erro = true) });
  }

  @HostListener('document:keydown.escape')
  aoEsc() { this.fechar(); }

  fechar() {
    if (this.fechando) return;
    this.fechando = true;
    setTimeout(() => this.fechou.emit(), 230);
  }

  emitir(a: AcaoAssunto) {
    if (this.ocupado) return;
    this.menu = false;
    this.acao.emit(a);
  }

  alternar(i: number) {
    const s = new Set(this.marcados);
    if (s.has(i)) s.delete(i); else s.add(i);
    this.marcados = s;
  }

  proximoCard(delta: number) {
    const n = this.detalhe?.flashcards.length ?? 0;
    if (!n) return;
    this.virado = false;
    this.card = (this.card + delta + n) % n;
  }

  get rotuloTarefa(): string | null {
    const t = this.tarefa;
    if (!t) return null;
    if (t.tipo === 'estudo') return t.partes > 1 ? `Parte ${t.parte} de ${t.partes}` : 'Estudo';
    if (t.tipo === 'revisao') return t.revisaoFinal ? 'Revisão final' : 'Revisão';
    if (t.tipo === 'treino') return 'Treino';
    return null;
  }

  get situacao(): string | null {
    const d = this.detalhe;
    if (!d) return null;
    if (d.situacao === 'estudado' && d.estudadoEm) {
      const quando = dataLocal(d.estudadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
      return `Estudado em ${quando}` + (d.revisoes ? ` · ${d.revisoes} ${d.revisoes === 1 ? 'revisão' : 'revisões'}` : '');
    }
    if (d.situacao === 'removido') return 'Fora do seu plano';
    return null;
  }

  get nomesPre(): string {
    const nomes = this.detalhe?.prerequisitos.map(p => p.nome) ?? [];
    return nomes.length <= 1 ? nomes.join('') : nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1];
  }

  get linkConteudo(): string[] | null {
    const c = this.assunto?.conteudo;
    return c ? ['/conteudos', ...c.split('/')] : null;
  }
}
