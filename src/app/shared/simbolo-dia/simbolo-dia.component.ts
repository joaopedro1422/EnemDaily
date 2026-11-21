import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

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
          <circle class="ponto" [class.animar]="animar" [attr.cx]="p.x" [attr.cy]="p.y" r="7.6" [attr.fill]="cor" />
        }
      }
    </svg>
  `,
  styles: [`
    :host { display: inline-block; width: 28px; height: 28px; flex: none; }
    svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .anel { fill: none; stroke-width: 5.6; }
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

  preenchimento(i: number): string | null {
    if (!this.cores) return i < 3 ? this.corMarca : null;
    return this.cores[i] ?? null;
  }

  get rotulo(): string {
    if (!this.cores) return 'enem.daily';
    const feitas = this.cores.filter(Boolean).length;
    return `${feitas} de 4 questões de hoje respondidas`;
  }
}
