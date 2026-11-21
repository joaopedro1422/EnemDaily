import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ed-carregando',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <span class="ed-carregando" [class.claro]="claro" [class.mini]="mini" role="status" [attr.aria-label]="texto || 'Carregando'" [style.--tam.px]="mini ? null : tamanho">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <g class="q">
          <circle class="a" cx="32.5" cy="32.5" r="13.2" /><circle class="a" cx="67.5" cy="32.5" r="13.2" />
          <circle class="a" cx="67.5" cy="67.5" r="13.2" /><circle class="a" cx="32.5" cy="67.5" r="13.2" />
          <circle class="p p1" cx="32.5" cy="32.5" r="7.6" /><circle class="p p2" cx="67.5" cy="32.5" r="7.6" />
          <circle class="p p3" cx="67.5" cy="67.5" r="7.6" /><circle class="p p4" cx="32.5" cy="67.5" r="7.6" />
        </g>
      </svg>
      @if (texto && !mini) { <span>{{ texto }}</span> }
    </span>
  `
})
export class CarregandoComponent {
  @Input() tamanho = 48;
  @Input() texto = '';
  @Input() claro = false;
  @Input() mini = false;
}
