import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AREAS_CONTEUDO, ChaveAreaConteudo, ResumoConteudo, infoAreaConteudo } from '../../models/conteudo';
import { ConteudoService } from '../../services/conteudo.service';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { SeoService } from '../seo';

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

  readonly areas = AREAS_CONTEUDO;
  readonly info = infoAreaConteudo;
  todos: ResumoConteudo[] = [];
  carregando = true;
  busca = '';
  area: ChaveAreaConteudo | '' = '';

  ngOnInit() {
    this.seo.aplicar({
      titulo: 'Conteúdos para o ENEM: resumos e como cada assunto cai na prova',
      descricao: 'Resumos de cada assunto do ENEM, explicando como o tema cai na prova e os erros mais comuns, com questões inéditas para treinar.',
      caminho: '/conteudos'
    });
    this.conteudos.publicados().subscribe(l => { this.todos = l; this.carregando = false; });
  }

  ngOnDestroy() { this.seo.limpar(); }

  private normalizar(s: string): string {
    return (s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  }

  get filtrados(): ResumoConteudo[] {
    const b = this.normalizar(this.busca.trim());
    return this.todos.filter(c => (!this.area || c.area === this.area)
      && (!b || this.normalizar(c.assunto + ' ' + c.titulo + ' ' + c.descricao).includes(b)));
  }

  get grupos(): { area: ChaveAreaConteudo; itens: ResumoConteudo[] }[] {
    const f = this.filtrados;
    return AREAS_CONTEUDO.map(a => ({ area: a.chave, itens: f.filter(c => c.area === a.chave) })).filter(g => g.itens.length);
  }

  contar(area: ChaveAreaConteudo): number { return this.todos.filter(c => c.area === area).length; }
}
