import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import confetti from 'canvas-confetti';
import { DestaqueOntem } from '../../models/grupo';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { formatarNumero } from '../../shared/dia';

/** Momento em que o XP começa a contar e os confetes saem (acompanha a coreografia do CSS). */
const REVELAR_MS = 950;

/**
 * Tela cheia com o destaque do grupo no dia anterior. Abre na primeira visita do dia ao grupo; um toque
 * em qualquer lugar (depois da revelação) ou o botão fecha.
 */
@Component({
  selector: 'app-destaque-ontem',
  standalone: true,
  imports: [AvatarComponent, IconeComponent],
  templateUrl: './destaque-ontem.component.html',
  styleUrl: './destaque-ontem.component.css'
})
export class DestaqueOntemComponent implements OnInit, OnDestroy {
  @Input({ required: true }) destaque!: DestaqueOntem;
  @Input() nomeGrupo = '';
  /** Quem está vendo é o próprio destaque. */
  @Input() souEu = false;
  @Output() close = new EventEmitter<void>();

  xp = 0;
  saindo = false;
  readonly formatarNumero = formatarNumero;
  /** Estrelinhas da arte: posição (%), atraso (ms) e tamanho (px). */
  readonly estrelas = [
    [12, 18, 0, 10], [84, 14, 600, 8], [22, 40, 1200, 6], [90, 38, 300, 12], [8, 62, 900, 8], [78, 58, 1500, 6],
    [30, 10, 1800, 7], [66, 26, 450, 6], [50, 6, 1100, 9], [16, 82, 700, 7], [88, 78, 1300, 9], [40, 90, 200, 6]
  ].map(([x, y, d, s]) => ({ x, y, d, s }));
  private podeFechar = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    const reduzido = matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduzido) {
      this.xp = this.destaque.xp;
      this.podeFechar = true;
      return;
    }
    this.timers.push(setTimeout(() => this.contar(this.destaque.xp), REVELAR_MS));
    this.timers.push(setTimeout(() => this.festejar(), REVELAR_MS - 150));
    this.timers.push(setTimeout(() => (this.podeFechar = true), 1700));
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    this.timers.forEach(clearTimeout);
  }

  get dataLonga(): string {
    const [a, m, d] = this.destaque.data.split('-').map(Number);
    const t = new Date(a, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  get tempo(): string {
    const s = this.destaque.tempoMedio;
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}min${String(s % 60).padStart(2, '0')}s`;
  }

  /** Toque no fundo: só fecha depois da revelação, para não sumir por um toque acidental. */
  tocarFundo() {
    if (this.podeFechar) this.fechar();
  }

  @HostListener('document:keydown.escape')
  fechar() {
    if (this.saindo) return;
    this.saindo = true;
    this.timers.push(setTimeout(() => this.close.emit(), 360));
  }

  private contar(ate: number) {
    const inicio = performance.now();
    const dur = 1000;
    const passo = (t: number) => {
      const k = Math.min(1, (t - inicio) / dur);
      this.xp = Math.round(ate * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  private festejar() {
    const base = { colors: ['#F7D56A', '#FFFFFF', '#8E9BFF', '#FFE9A8'], disableForReducedMotion: true, zIndex: 1300, ticks: 240, scalar: .9 };
    confetti({ ...base, particleCount: 70, spread: 75, startVelocity: 38, origin: { x: .5, y: .36 } });
    this.timers.push(setTimeout(() => {
      confetti({ ...base, particleCount: 35, angle: 60, spread: 55, origin: { x: 0, y: .75 } });
      confetti({ ...base, particleCount: 35, angle: 120, spread: 55, origin: { x: 1, y: .75 } });
    }, 260));
  }
}
