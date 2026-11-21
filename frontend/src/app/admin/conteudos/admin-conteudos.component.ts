import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../services/admin.service';
import { AREAS_CONTEUDO, ChaveAreaConteudo, ItemConteudoAdmin, PaginaConteudo, infoAreaConteudo } from '../../models/conteudo';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { ConteudoArtigoComponent } from '../../conteudos/artigo/conteudo-artigo.component';

type Campos = Pick<PaginaConteudo, 'titulo' | 'seoTitulo' | 'seoDescricao' | 'resumo' | 'comoCai' | 'paraNaoErrar'>;

@Component({
  selector: 'app-admin-conteudos',
  standalone: true,
  imports: [FormsModule, RouterLink, IconeComponent, CarregandoComponent, ConteudoArtigoComponent],
  templateUrl: './admin-conteudos.component.html',
  styleUrl: './admin-conteudos.component.css'
})
export class AdminConteudosComponent implements OnInit {
  private api = inject(AdminService);

  readonly areas = AREAS_CONTEUDO;
  readonly info = infoAreaConteudo;
  itens: ItemConteudoAdmin[] = [];
  area: ChaveAreaConteudo = 'linguagens';
  filtroStatus: '' | 'sem' | 'rascunho' | 'publicado' = '';

  selecionado: ItemConteudoAdmin | null = null;
  pagina: PaginaConteudo | null = null;
  campos: Campos = this.vazio();
  original = JSON.stringify(this.campos);
  aba: 'editar' | 'previa' = 'editar';
  carregandoPagina = false;
  ocupado: '' | 'gerando' | 'salvando' | 'publicando' | 'excluindo' = '';
  mensagem = '';
  erro = '';
  confirmandoExclusao = false;

  ngOnInit() { this.carregarLista(); }

  carregarLista() {
    this.api.conteudos().subscribe({ next: l => (this.itens = l), error: e => this.falhou(e) });
  }

  get daArea(): ItemConteudoAdmin[] {
    return this.itens.filter(i => i.area === this.area && (!this.filtroStatus || i.status === this.filtroStatus));
  }

  contar(area: ChaveAreaConteudo, status?: string): number {
    return this.itens.filter(i => i.area === area && (!status || i.status === status)).length;
  }

  get alterado(): boolean { return JSON.stringify(this.campos) !== this.original; }

  abrir(item: ItemConteudoAdmin) {
    if (this.alterado && !confirm('Há alterações não salvas. Descartar?')) return;
    this.selecionado = item;
    this.pagina = null;
    this.campos = this.vazio();
    this.original = JSON.stringify(this.campos);
    this.mensagem = this.erro = '';
    this.confirmandoExclusao = false;
    this.aba = 'editar';
    setTimeout(() => { if (innerWidth < 980) document.querySelector('.ac-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    if (!item.conteudoId) return;
    this.carregandoPagina = true;
    this.api.conteudoDoAssunto(item.assuntoId).subscribe({
      next: p => { this.carregandoPagina = false; if (p) this.receber(p); },
      error: e => { this.carregandoPagina = false; this.falhou(e); }
    });
  }

  gerar() {
    if (!this.selecionado) return;
    if (this.pagina?.publicado && !confirm('Gerar de novo substitui o texto e tira a página do ar até você publicar de novo. Continuar?')) return;
    if (!this.pagina?.publicado && this.campos.resumo && !confirm('Gerar de novo substitui o texto atual. Continuar?')) return;
    this.executar('gerando', this.api.gerarConteudo(this.selecionado.assuntoId), 'Rascunho gerado. Revise e publique quando estiver bom.');
  }

  salvar() {
    if (!this.selecionado) return;
    this.executar('salvando', this.api.salvarConteudo(this.selecionado.assuntoId, this.campos), 'Alterações salvas.');
  }

  alternarPublicacao() {
    if (!this.selecionado || !this.pagina) return;
    const publicar = !this.pagina.publicado;
    if (this.alterado) {
      this.erro = 'Salve as alterações antes de ' + (publicar ? 'publicar.' : 'tirar do ar.');
      return;
    }
    this.executar('publicando', this.api.publicarConteudo(this.selecionado.assuntoId, publicar), publicar ? 'Publicado. O site atualiza em alguns minutos.' : 'Página tirada do ar.');
  }

  excluir() {
    if (!this.selecionado) return;
    if (!this.confirmandoExclusao) { this.confirmandoExclusao = true; return; }
    this.ocupado = 'excluindo';
    this.api.excluirConteudo(this.selecionado.assuntoId).subscribe({
      next: () => {
        this.ocupado = '';
        this.pagina = null;
        this.campos = this.vazio();
        this.original = JSON.stringify(this.campos);
        this.confirmandoExclusao = false;
        this.mensagem = 'Conteúdo excluído.';
        this.atualizarItem(null);
      },
      error: e => { this.ocupado = ''; this.falhou(e); }
    });
  }

  get previa(): PaginaConteudo | null {
    if (!this.selecionado) return null;
    return {
      ...(this.pagina ?? { id: null, assuntoId: this.selecionado.assuntoId, publicado: false, atualizadoEm: new Date().toISOString(), publicadoEm: null, questao: null, relacionados: [] }),
      area: this.selecionado.area, assunto: this.selecionado.assunto, slug: this.selecionado.slug ?? '',
      ...this.campos
    } as PaginaConteudo;
  }

  get endereco(): string {
    return this.pagina ? `${location.origin}/conteudos/${this.pagina.area}/${this.pagina.slug}` : '';
  }

  tamanho(s: string | null | undefined): number { return (s ?? '').length; }

  private executar(acao: AdminConteudosComponent['ocupado'], obs: import('rxjs').Observable<PaginaConteudo>, ok: string) {
    this.ocupado = acao;
    this.mensagem = this.erro = '';
    obs.subscribe({
      next: p => { this.ocupado = ''; this.receber(p); this.mensagem = ok; },
      error: e => { this.ocupado = ''; this.falhou(e); }
    });
  }

  private receber(p: PaginaConteudo) {
    this.pagina = p;
    this.campos = { titulo: p.titulo, seoTitulo: p.seoTitulo, seoDescricao: p.seoDescricao, resumo: p.resumo, comoCai: p.comoCai, paraNaoErrar: p.paraNaoErrar };
    this.original = JSON.stringify(this.campos);
    this.atualizarItem(p);
  }

  private atualizarItem(p: PaginaConteudo | null) {
    const s = this.selecionado;
    if (!s) return;
    const novo: ItemConteudoAdmin = { ...s, conteudoId: p?.id ?? null, status: !p ? 'sem' : p.publicado ? 'publicado' : 'rascunho', atualizadoEm: p?.atualizadoEm ?? null, slug: p?.slug ?? s.slug };
    this.itens = this.itens.map(i => (i.assuntoId === s.assuntoId ? novo : i));
    this.selecionado = novo;
  }

  private falhou(e: unknown) {
    const r = e as HttpErrorResponse;
    this.erro = r?.status === 0 ? 'Sem conexão com o backend.' : r?.status === 403 ? 'Acesso de admin recusado.' : (r?.error?.erro ?? 'Algo deu errado.');
  }

  private vazio(): Campos {
    return { titulo: '', seoTitulo: '', seoDescricao: '', resumo: '', comoCai: '', paraNaoErrar: '' };
  }
}
