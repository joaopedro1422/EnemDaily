import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { COR_ERRO } from '../dia';

const POSICOES = [
  { x: 32.5, y: 32.5 },
  { x: 67.5, y: 32.5 },
  { x: 32.5, y: 67.5 },
  { x: 67.5, y: 67.5 },
];

@Component({
  selector: 'ed-simbolo-dia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 100 100" [attr.aria-label]="rotulo" role="img">
      @for (p of posicoes; track $index) {
        <circle class="anel" [attr.cx]="p.x" [attr.cy]="p.y" r="13.2" [attr.stroke]="corAnel" />
      }
      @for (p of posicoes; track $index) {
        @if (preenchimento($index); as cor) {
          @if (cor === erro) {
            <g class="ponto" [class.animar]="animar">
              <circle [attr.cx]="p.x" [attr.cy]="p.y" r="7.6" [attr.fill]="corErro" />
              <path class="xis" [attr.d]="xis(p)" [attr.stroke]="corXis" />
            </g>
          } @else {
            <circle class="ponto" [class.animar]="animar" [attr.cx]="p.x" [attr.cy]="p.y" r="7.6" [attr.fill]="cor" />
          }
        }
      }
    </svg>
  `,
  styles: [`
    :host { display: inline-block; width: 28px; height: 28px; flex: none; }
    svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .anel { fill: none; stroke-width: 5.6; }
    .xis { fill: none; stroke-width: 1.8; stroke-linecap: round; }
    .ponto { transform-box: fill-box; transform-origin: center; }
    .ponto.animar { animation: ed-tinta var(--ed-t-tinta) var(--ed-curva-tinta) both; }
  `]
})
export class SimboloDiaComponent {
  readonly posicoes = POSICOES;
  @Input() cores: (string | null)[] | null = null;
  @Input() corAnel = 'var(--ed-caneta)';
  @Input() corMarca = 'var(--ed-caneta)';
  @Input() animar = true;
  @Input() corErro = 'var(--ed-pauta-forte)';
  @Input() corXis = 'rgba(255, 255, 255, .8)';
  readonly erro = COR_ERRO;

  xis(p: { x: number; y: number }): string {
    const d = 2.5;
    return `M${p.x - d} ${p.y - d}L${p.x + d} ${p.y + d}M${p.x + d} ${p.y - d}L${p.x - d} ${p.y + d}`;
  }

  preenchimento(i: number): string | null {
    if (!this.cores) return i < 3 ? this.corMarca : null;
    return this.cores[i] ?? null;
  }

  get rotulo(): string {
    if (!this.cores) return 'enem.daily';
    const feitas = this.cores.filter(Boolean).length;
    const acertos = this.cores.filter(c => c && c !== COR_ERRO).length;
    return `${feitas} de 4 questões de hoje respondidas, ${acertos} ${acertos === 1 ? 'acerto' : 'acertos'}`;
  }
}
