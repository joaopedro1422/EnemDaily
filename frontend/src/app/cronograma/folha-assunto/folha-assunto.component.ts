import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssuntoMini, DetalheAssunto, Tarefa, dataLocal } from '../../models/cronograma';
import { infoAreaConteudo } from '../../models/conteudo';
import { CronogramaService } from '../../services/cronograma.service';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';

export type AcaoAssunto = 'iniciar' | 'concluir' | 'parte' | 'terminar' | 'tranquila' | 'dificil' | 'nao-consegui' | 'ja-domino'
  | 'remover' | 'restaurar' | 'nao-estudado' | 'estudei' | 'redacao-feita';

/** Onde o assunto apareceu: decide quais ações fazem sentido. */
export type ContextoAssunto = 'hoje' | 'previsto' | 'fora' | 'removido' | 'feito';

@Component({
  selector: 'app-folha-assunto',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, IconeComponent, CarregandoComponent],
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
  detalhe: DetalheAssunto | null = null;
  erro = false;
  fechando = false;
  menu = false;
  marcados = new Set<number>();
  /** Na hora de concluir, reabre a orientação ("Como cai no ENEM"). */
  verGuia = false;
  /** Flashcards virados agora, e os que já tiveram a resposta vista ao menos uma vez. */
  virados = new Set<number>();
  revelados = new Set<number>();

  get redacao(): boolean { return this.tarefa?.tipo === 'redacao'; }
  get revisao(): boolean { return this.tarefa?.tipo === 'revisao' || this.tarefa?.tipo === 'treino'; }
  get emPartes(): boolean { return (this.tarefa?.partes ?? 0) > 1; }
  /** Parte que ainda não fecha o assunto: os flashcards cobrem o assunto todo, então não travam aqui. */
  get parteIntermediaria(): boolean { return this.emPartes && this.tarefa!.parte < this.tarefa!.partes; }

  /** Estudo de hoje ainda não começado: a folha só orienta (o que procurar) e termina em "Entendi". */
  get guia(): boolean { return this.contexto === 'hoje' && this.tarefa?.tipo === 'estudo' && !this.tarefa.iniciada; }
  /** Hora de concluir: marcar o que domina e virar os flashcards. */
  get concluindo(): boolean { return this.contexto === 'hoje' && !this.redacao && !this.guia; }
  /** Concluir exige todos os itens marcados e todos os cards virados (menos em parte intermediária). */
  get trava(): boolean { return this.concluindo && !this.parteIntermediaria; }
  get totalCards(): number { return this.detalhe?.flashcards.length ?? 0; }
  get totalDominar(): number { return this.detalhe?.dominar.length ?? 0; }
  get faltamItens(): boolean { return this.marcados.size < this.totalDominar; }
  get faltamCards(): boolean { return this.revelados.size < this.totalCards; }
  /** Se os detalhes não carregaram, não trava o aluno por um erro nosso. */
  get liberado(): boolean {
    if (!this.trava || this.erro) return true;
    return !!this.detalhe && !this.faltamItens && !this.faltamCards;
  }
  get textoTrava(): string {
    if (!this.detalhe) return 'Carregando';
    if (this.faltamItens && this.faltamCards) return 'Marque os itens e vire os cards';
    return this.faltamItens ? 'Marque todos os itens para concluir' : 'Vire todos os cards para concluir';
  }

  ngOnInit() {
    if (this.redacao || !this.assunto) return;
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

  virar(i: number) {
    const v = new Set(this.virados);
    if (v.has(i)) v.delete(i); else v.add(i);
    this.virados = v;
    if (!this.revelados.has(i)) this.revelados = new Set(this.revelados).add(i);
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
