import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { PaginaConteudo } from '../../models/conteudo';
import { ConteudoService } from '../../services/conteudo.service';
import { AuthServiceService } from '../../services/auth-service.service';
import { ConteudoArtigoComponent } from '../artigo/conteudo-artigo.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { SeoService } from '../seo';

@Component({
  selector: 'app-conteudo-pagina',
  standalone: true,
  imports: [ConteudoArtigoComponent, CarregandoComponent, RouterLink],
  template: `
    <main class="cp">
      @if (pagina) {
        <app-conteudo-artigo [pagina]="pagina" [logado]="logado" [estudado]="estudado" (alternarEstudado)="alternarEstudado()" (criarConta)="criarConta()" (irAoDesafio)="irAoDesafio()" />
      } @else if (naoEncontrado) {
        <div class="cp-vazio">
          <h1>Conteúdo não encontrado</h1>
          <p>Esse assunto ainda não tem página publicada.</p>
          <a routerLink="/conteudos">Ver todos os conteúdos</a>
        </div>
      } @else {
        <div class="cp-vazio"><ed-carregando [tamanho]="48" /></div>
      }
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100svh; background: var(--ed-folha); }
    .cp-vazio { min-height: 60svh; display: grid; place-content: center; gap: 10px; text-align: center; padding: 24px; font-family: var(--ed-fonte); color: var(--ed-tinta-2); }
    .cp-vazio h1 { margin: 0; font-size: 26px; color: var(--ed-tinta); }
    .cp-vazio a { color: var(--ed-caneta-texto); font-weight: 700; }
  `]
})
export class ConteudoPaginaComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private conteudos = inject(ConteudoService);
  private auth = inject(AuthServiceService);
  private seo = inject(SeoService);
  private subs = new Subscription();

  pagina: PaginaConteudo | null = null;
  naoEncontrado = false;
  logado = false;
  /** null até saber; só é carregado para quem está logado. */
  estudado: boolean | null = null;
  private estudados: Set<string> | null = null;
  private salvando = false;

  ngOnInit() {
    this.subs.add(this.auth.usuario$.subscribe(u => {
      this.logado = !!u;
      this.estudados = null;
      this.atualizarEstudado();
      if (u) this.conteudos.estudados().subscribe({ next: l => { this.estudados = new Set(l); this.atualizarEstudado(); }, error: () => {} });
    }));
    this.subs.add(this.route.paramMap.pipe(
      switchMap(p => {
        this.pagina = null;
        this.naoEncontrado = false;
        return this.conteudos.pagina(p.get('area') ?? '', p.get('slug') ?? '');
      })
    ).subscribe({
      next: pg => {
        this.pagina = pg;
        this.atualizarEstudado();
        window.scrollTo({ top: 0 });
        this.aplicarSeo(pg);
      },
      error: () => (this.naoEncontrado = true)
    }));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.seo.limpar();
  }

  criarConta() { this.auth.open(); }

  private atualizarEstudado() {
    this.estudado = this.pagina && this.estudados ? this.estudados.has(`${this.pagina.area}/${this.pagina.slug}`) : null;
  }

  /** Marca na hora e desfaz se o servidor recusar. */
  alternarEstudado() {
    const pg = this.pagina;
    if (!pg || !this.estudados || this.salvando) return;
    const k = `${pg.area}/${pg.slug}`;
    const marcar = !this.estudados.has(k);
    const aplicar = (sim: boolean) => { if (sim) this.estudados?.add(k); else this.estudados?.delete(k); this.atualizarEstudado(); };
    aplicar(marcar);
    this.salvando = true;
    this.conteudos.marcarEstudado(pg.area, pg.slug, marcar).subscribe({
      next: () => (this.salvando = false),
      error: () => { this.salvando = false; aplicar(!marcar); }
    });
  }

  irAoDesafio() { this.router.navigate(['/Home']); }

  private aplicarSeo(pg: PaginaConteudo) {
    const caminho = `/conteudos/${pg.area}/${pg.slug}`;
    const titulo = pg.seoTitulo || pg.titulo || pg.assunto;
    const descricao = pg.seoDescricao || '';
    this.seo.aplicar({
      titulo, descricao, caminho,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: pg.titulo || pg.assunto,
        description: descricao,
        inLanguage: 'pt-BR',
        about: pg.assunto,
        educationalLevel: 'Ensino médio',
        dateModified: pg.atualizadoEm,
        datePublished: pg.publicadoEm,
        mainEntityOfPage: location.origin + caminho,
        publisher: { '@type': 'Organization', name: 'enem.daily' }
      }
    });
  }
}
