import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AREAS_CONTEUDO, ChaveAreaConteudo, ResumoConteudo, infoAreaConteudo } from '../../models/conteudo';
import { ConteudoService } from '../../services/conteudo.service';
import { AuthServiceService } from '../../services/auth-service.service';
import { RecursosService } from '../../services/recursos.service';
import { CronogramaService } from '../../services/cronograma.service';
import { Tarefa } from '../../models/cronograma';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { SeoService } from '../seo';

type Situacao = 'todos' | 'faltam' | 'estudados';
/** Assunto do cronograma de hoje que tem página de conteúdo. */
interface ParaHoje { nome: string; area: string; link: string[]; rotulo: string; feita: boolean; }

@Component({
  selector: 'app-conteudos-indice',
  standalone: true,
  imports: [FormsModule, RouterLink, IconeComponent, CarregandoComponent],
  templateUrl: './conteudos-indice.component.html',
  styleUrl: './conteudos-indice.component.css'
})
export class ConteudosIndiceComponent implements OnInit, OnDestroy {
  private conteudos = inject(ConteudoService);
  private seo = inject(SeoService);
  private auth = inject(AuthServiceService);
  readonly cronograma$ = inject(RecursosService).cronograma$;
  private cronograma = inject(CronogramaService);
  private subs = new Subscription();

  readonly areas = AREAS_CONTEUDO;
  readonly info = infoAreaConteudo;
  todos: ResumoConteudo[] = [];
  carregando = true;
  busca = '';
  area: ChaveAreaConteudo | '' = '';
  situacao: Situacao = 'todos';
  logado = false;
  estudados = new Set<string>();
  private salvando = new Set<string>();
  /** Os assuntos do cronograma de hoje com página de conteúdo. */
  paraHoje: ParaHoje[] = [];

  ngOnInit() {
    this.seo.aplicar({
      titulo: 'Conteúdos para o ENEM: resumos e como cada assunto cai na prova',
      descricao: 'Resumos de cada assunto do ENEM, explicando como o tema cai na prova e os erros mais comuns, com questões inéditas para treinar.',
      caminho: '/conteudos'
    });
    this.conteudos.publicados().subscribe(l => { this.todos = l; this.carregando = false; });
    this.subs.add(this.auth.usuario$.subscribe(u => {
      this.logado = !!u;
      this.estudados = new Set();
      this.situacao = 'todos';
      if (u) this.conteudos.estudados().subscribe({ next: l => (this.estudados = new Set(l)), error: () => {} });
    }));
    this.subs.add(this.cronograma$.subscribe(liberado => {
      this.paraHoje = [];
      if (liberado) this.cronograma.hoje().subscribe({ next: h => (this.paraHoje = h.configurado ? this.montarParaHoje(h.tarefas) : []), error: () => {} });
    }));
  }

  /** Um card por assunto com página: o que falta primeiro, sem repetir. */
  private montarParaHoje(tarefas: Tarefa[]): ParaHoje[] {
    const vistos = new Set<number>();
    const ordenadas = [...tarefas.filter(t => !t.feita), ...tarefas.filter(t => t.feita)];
    const lista: ParaHoje[] = [];
    for (const t of ordenadas) {
      const a = t.assunto;
      if (!a?.conteudo || vistos.has(a.id)) continue;
      vistos.add(a.id);
      const rotulo = t.tipo === 'revisao' ? 'Revisão' : t.tipo === 'treino' ? 'Treino'
        : t.tipo === 'parte' ? 'Parte feita' : t.partes > 1 ? `Parte ${t.parte} de ${t.partes}` : 'Estudo';
      lista.push({ nome: a.nome, area: a.area, link: ['/conteudos', ...a.conteudo.split('/')], rotulo, feita: t.feita });
    }
    return lista;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.seo.limpar();
  }

  private normalizar(s: string): string {
    return (s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  }

  chave(c: ResumoConteudo): string { return `${c.area}/${c.slug}`; }

  estudou(c: ResumoConteudo): boolean { return this.estudados.has(this.chave(c)); }

  /** Marca na hora e desfaz se o servidor recusar. */
  alternarEstudado(c: ResumoConteudo) {
    if (!this.logado) { this.auth.open(); return; }
    const k = this.chave(c);
    if (this.salvando.has(k)) return;
    const marcar = !this.estudados.has(k);
    const aplicar = (sim: boolean) => {
      const novo = new Set(this.estudados);
      if (sim) novo.add(k); else novo.delete(k);
      this.estudados = novo;
    };
    aplicar(marcar);
    this.salvando.add(k);
    this.conteudos.marcarEstudado(c.area, c.slug, marcar).subscribe({
      next: () => this.salvando.delete(k),
      error: () => { this.salvando.delete(k); aplicar(!marcar); }
    });
  }

  get totalEstudados(): number { return this.todos.filter(c => this.estudou(c)).length; }

  get pctEstudados(): number { return this.todos.length ? Math.round(this.totalEstudados / this.todos.length * 100) : 0; }

  get filtrados(): ResumoConteudo[] {
    const b = this.normalizar(this.busca.trim());
    return this.todos.filter(c => (!this.area || c.area === this.area)
      && (this.situacao === 'todos' || (this.situacao === 'estudados') === this.estudou(c))
      && (!b || this.normalizar(c.assunto + ' ' + c.titulo + ' ' + c.descricao).includes(b)));
  }

  get grupos(): { area: ChaveAreaConteudo; itens: ResumoConteudo[] }[] {
    const f = this.filtrados;
    return AREAS_CONTEUDO.map(a => ({ area: a.chave, itens: f.filter(c => c.area === a.chave) })).filter(g => g.itens.length);
  }

  contar(area: ChaveAreaConteudo): number { return this.todos.filter(c => c.area === area).length; }

  estudadosNaArea(area: ChaveAreaConteudo): number { return this.todos.filter(c => c.area === area && this.estudou(c)).length; }

  get mensagemVazia(): { titulo: string; texto: string } {
    if (!this.todos.length) return { titulo: 'Os primeiros conteúdos estão sendo preparados', texto: 'Volte em breve.' };
    const semBusca = !this.busca.trim();
    if (semBusca && this.situacao === 'estudados') {
      return { titulo: 'Nenhum conteúdo marcado ainda', texto: 'Estudou um assunto, aqui ou por fora? Toque em “Já estudei” no card dele.' };
    }
    if (semBusca && this.situacao === 'faltam') {
      return { titulo: 'Você estudou todos os conteúdos daqui', texto: 'Quando sair conteúdo novo, ele aparece nesta lista.' };
    }
    return { titulo: 'Nenhum assunto encontrado', texto: 'Tente outro termo ou outra área.' };
  }
}
