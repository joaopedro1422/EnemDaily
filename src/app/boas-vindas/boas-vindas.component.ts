import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconeComponent } from '../shared/icone/icone.component';
import { AREAS } from '../shared/dia';
import { calcularProgresso, paletaDe, renderizarCampus, Progresso } from '../shared/campus/campus';

interface Passo { fala: string; titulo?: string; visual: 'areas' | 'campus' | 'obras'; }

@Component({
  selector: 'app-boas-vindas',
  imports: [IconeComponent],
  templateUrl: './boas-vindas.component.html',
  styleUrl: './boas-vindas.component.css'
})
export class BoasVindasComponent implements OnInit, OnDestroy {
  @Input() nome = '';
  @Input() progresso: Progresso | null = null;
  @Output() fechar = new EventEmitter<'comecar' | 'pular'>();

  readonly areas = AREAS;
  passos: Passo[] = [];
  atual = 0;
  texto = '';
  falando = false;
  fechando = false;
  cenaCampus: SafeHtml = '';
  cenaObras: SafeHtml = '';
  ciclo = 0;
  private relogio: any;
  private timers: any[] = [];

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    const primeiro = (this.nome || '').trim().split(/\s+/)[0];
    this.passos = [
      { visual: 'areas', titulo: 'Seja muito bem-vindo(a) ao enem.daily', fala: `${primeiro ? primeiro + ', todo' : 'Todo'} dia chegam 4 questões novas: uma de cada área do ENEM. Quanto mais rápido você acerta, mais XP você ganha.` },
      { visual: 'campus', fala: 'Cada acerto constrói uma peça do seu campus, e cada dia que você volta a universidade cresce. Veja onde você pode chegar.' },
      { visual: 'obras', fala: 'Seu campus começa assim: as obras do prédio da reitoria já começaram. O resto é com você!' }
    ];
    const noite = new Date().getHours() >= 18 || new Date().getHours() < 6;
    const P = paletaDe(noite);
    const vb = (svg: string, c: number[]) => svg.replace(/viewBox="[^"]*"/, `viewBox="${c.join(' ')}"`);
    const inicio = calcularProgresso({ acertos: { linguagens: 0, humanas: 0, naturezas: 0, exatas: 0 }, diasAtivos: 0 });
    const demo = calcularProgresso({ acertos: { linguagens: 34, humanas: 34, naturezas: 34, exatas: 34 }, diasAtivos: 45 });
    const c1 = renderizarCampus(demo, P, { novasDesde: inicio, atrasoInicial: 400, intervalo: 38, extras: { acertos: 136, diasAtivos: 45 } });
    this.cenaCampus = this.sanitizer.bypassSecurityTrustHtml(vb(c1.svg, c1.terreno));
    const meu = this.progresso ?? inicio;
    const c2 = renderizarCampus(meu, P, {});
    this.cenaObras = this.sanitizer.bypassSecurityTrustHtml(vb(c2.svg, c2.terreno));
    this.falar();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    clearInterval(this.relogio);
    this.timers.forEach(clearTimeout);
  }

  get passo(): Passo {
    return this.passos[this.atual];
  }

  get ultimo(): boolean {
    return this.atual === this.passos.length - 1;
  }

  private falar() {
    clearInterval(this.relogio);
    const alvo = this.passo.fala;
    this.texto = '';
    this.falando = true;
    this.ciclo++;
    let i = 0;
    this.relogio = setInterval(() => {
      i += 2;
      this.texto = alvo.slice(0, i);
      if (i >= alvo.length) {
        clearInterval(this.relogio);
        this.falando = false;
      }
    }, 28);
  }

  @HostListener('document:keydown.enter')
  avancar() {
    if (this.falando) {
      clearInterval(this.relogio);
      this.texto = this.passo.fala;
      this.falando = false;
      return;
    }
    if (this.ultimo) return this.sair('comecar');
    this.atual++;
    this.falar();
  }

  voltar() {
    if (this.atual === 0) return;
    this.atual--;
    this.falar();
  }

  @HostListener('document:keydown.escape')
  pular() {
    this.sair('pular');
  }

  private sair(motivo: 'comecar' | 'pular') {
    if (this.fechando) return;
    this.fechando = true;
    this.timers.push(setTimeout(() => this.fechar.emit(motivo), 320));
  }
}
