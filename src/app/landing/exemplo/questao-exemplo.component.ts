import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { QuestaoServiceService } from '../../services/questao-service.service';
import { AuthServiceService } from '../../services/auth-service.service';
import { Questao } from '../../models/questao';
import { SomService } from '../../shared/som/som.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PECAS_BASE, caixaEm, calcularProgresso, paletaDe, regiao, renderizarCampus, totalDePecas, ultimaPeca } from '../../shared/campus/campus';
import { AREAS, ChaveArea, InfoArea } from '../../shared/dia';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { TextoBaseComponent } from '../../shared/questao/texto-base.component';
import { ResolucaoComponent } from '../../shared/questao/resolucao.component';

type Fase = 'carregando' | 'prova' | 'corrigindo' | 'resultado' | 'vazia';

@Component({
  selector: 'ld-questao-exemplo',
  standalone: true,
  imports: [IconeComponent, CarregandoComponent, TextoBaseComponent, ResolucaoComponent],
  templateUrl: './questao-exemplo.component.html',
  styleUrls: ['../../desafio/desafio.component.css', './questao-exemplo.component.css']
})
export class QuestaoExemploComponent implements OnInit, OnDestroy {
  @Input() area: ChaveArea = 'linguagens';
  @Output() fechar = new EventEmitter<void>();

  private questoes = inject(QuestaoServiceService);
  private auth = inject(AuthServiceService);
  private som = inject(SomService);
  private sanitizer = inject(DomSanitizer);
  obra: { svg: SafeHtml; nome: string; regiao: string; cor: string; total: number; noite: boolean; construindo: boolean; svgObra: SafeHtml } | null = null;

  private montarObra() {
    const dias = 90;
    const t = this.area;
    let n = 20;
    while (n < 90 && totalDePecas(calcularProgresso({ acertos: { linguagens: n, humanas: n, naturezas: n, exatas: n }, diasAtivos: dias })) < 300) n++;
    const acertos = { linguagens: n, humanas: n, naturezas: n, exatas: n };
    const depois = calcularProgresso({ acertos, diasAtivos: dias });
    depois[t] = Math.min(depois[t], PECAS_BASE[t]);
    let k = depois[t] - 1;
    for (let i = depois[t] - 1; i >= 0; i--) {
      const p = ultimaPeca(t, { ...depois, [t]: i + 1 });
      if (p && /·.*(andar|amplia|telhado|cobertura)/i.test(p.nome)) { k = i; break; }
    }
    depois[t] = k + 1;
    const antes = { ...depois, [t]: k };
    const peca = ultimaPeca(t, depois);
    if (!peca) return null;
    const total = Object.values(acertos).reduce((a, b) => a + b, 0);
    const extras = { acertos: total, simulados: 0, redacoes: 0, maiorSequencia: dias, diasAtivos: dias };
    const h = new Date().getHours();
    const noite = h >= 18 || h < 6;
    const camera = caixaEm(peca.ax, peca.ay, 6.5, .62);
    const parado = renderizarCampus(antes, paletaDe(noite), { extras, camera });
    const cena = renderizarCampus(depois, paletaDe(noite), { novasDesde: antes, extras, extrasAntes: extras, atrasoInicial: 250, intervalo: 500, camera });
    const r = regiao(t);
    return {
      svg: this.sanitizer.bypassSecurityTrustHtml(parado.svg), svgObra: this.sanitizer.bypassSecurityTrustHtml(cena.svg),
      nome: peca.nome, regiao: r.nome, cor: r.cor, total: totalDePecas(depois), noite, construindo: false
    };
  }

  readonly areas = AREAS;
  readonly letras = ['A', 'B', 'C', 'D', 'E'];
  info: InfoArea = AREAS[0];
  questao: Questao | null = null;
  fase: Fase = 'carregando';
  selecionada: number | null = null;
  fechando = false;

  get acertou(): boolean { return this.selecionada !== null && !!this.questao?.alternativas[this.selecionada]?.correta; }
  get letraCerta(): string {
    const i = this.questao?.alternativas.findIndex(a => a.correta) ?? -1;
    return i >= 0 ? this.letras[i] : '—';
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.carregar(this.area);
  }

  ngOnDestroy() { document.body.style.overflow = ''; }

  carregar(area: ChaveArea) {
    this.area = area;
    this.info = AREAS.find(a => a.chave === area) ?? AREAS[0];
    this.fase = 'carregando';
    this.selecionada = null;
    this.questao = null;
    this.questoes.getQuestaoExemplo(area).subscribe({
      next: q => { this.questao = q; this.fase = q && q.alternativas?.length ? 'prova' : 'vazia'; },
      error: () => (this.fase = 'vazia')
    });
  }

  selecionar(i: number) {
    if (this.fase !== 'prova') return;
    if (this.selecionada !== i) this.som.caneta();
    this.selecionada = i;
  }

  confirmar() {
    if (this.fase !== 'prova' || this.selecionada === null) return;
    this.fase = 'corrigindo';
    setTimeout(() => {
      this.fase = 'resultado';
      this.obra = this.montarObra();
      setTimeout(() => this.rolarAte('.qe-res .res-campus'), 150);
      setTimeout(() => {
        if (!this.obra) return;
        this.obra = { ...this.obra, svg: this.obra.svgObra, construindo: true };
        setTimeout(() => this.som.pop(), 850);
      }, 1900);
    }, 2000);
  }

  private rolarAte(seletor: string) {
    const area = document.querySelector<HTMLElement>('.qe-rolagem');
    const alvo = document.querySelector<HTMLElement>(seletor);
    if (!area || !alvo) return;
    const ra = area.getBoundingClientRect(), rb = alvo.getBoundingClientRect();
    const topo = area.scrollTop + (rb.top - ra.top) - Math.max(12, (area.clientHeight - rb.height) / 2);
    area.scrollTo({ top: Math.max(0, topo), behavior: 'smooth' });
  }

  estadoAlt(i: number): string {
    if (this.fase === 'resultado' && this.questao) {
      const alt = this.questao.alternativas[i];
      if (alt.correta) return i === this.selecionada ? 'certa marcada' : 'certa';
      if (i === this.selecionada) return 'errada marcada';
      return 'apagada';
    }
    if (i === this.selecionada) return this.fase === 'corrigindo' ? 'marcada corrigindo' : 'marcada';
    return '';
  }

  outraArea() {
    const i = AREAS.findIndex(a => a.chave === this.area);
    this.carregar(AREAS[(i + 1) % AREAS.length].chave);
    document.querySelector('.qe-rolagem')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  criarConta() {
    this.sair();
    setTimeout(() => this.auth.open(), 260);
  }

  @HostListener('document:keydown', ['$event'])
  teclado(e: KeyboardEvent) {
    if (e.key === 'Escape') { this.sair(); return; }
    if (this.fase !== 'prova' || !this.questao) return;
    const i = 'abcde'.indexOf(e.key.toLowerCase());
    if (i >= 0 && i < this.questao.alternativas.length) this.selecionar(i);
    if (e.key === 'Enter' && this.selecionada !== null) this.confirmar();
  }

  sair() {
    if (this.fechando) return;
    this.fechando = true;
    setTimeout(() => this.fechar.emit(), 240);
  }
}
