import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Duas espadas que entram pelos lados, se cruzam com faísca e ficam flutuando. */
@Component({
  selector: 'ed-espadas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="es" [class.anima]="animar" [style.width.px]="tamanho" [style.height.px]="tamanho * .72" viewBox="0 0 200 144" aria-hidden="true">
      <defs>
        <linearGradient id="es-lamina" x1="0" x2="1">
          <stop offset="0" stop-color="#F4F7FF"/><stop offset=".5" stop-color="#C9D2E8"/><stop offset="1" stop-color="#8E9AB8"/>
        </linearGradient>
        <linearGradient id="es-ouro" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#FFE39A"/><stop offset=".55" stop-color="#E0A93A"/><stop offset="1" stop-color="#B57B1E"/>
        </linearGradient>
        <radialGradient id="es-brilho"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".95"/><stop offset=".45" stop-color="#FFD66B" stop-opacity=".45"/><stop offset="1" stop-color="#FFD66B" stop-opacity="0"/></radialGradient>
        <g id="es-espada">
          <path d="M0,-78 L6.5,-66 L6.5,22 L-6.5,22 L-6.5,-66 Z" fill="url(#es-lamina)"/>
          <path d="M0,-78 L0,22" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="1.3"/>
          <rect x="-21" y="22" width="42" height="8" rx="4" fill="url(#es-ouro)"/>
          <circle cx="-21" cy="26" r="4.6" fill="url(#es-ouro)"/><circle cx="21" cy="26" r="4.6" fill="url(#es-ouro)"/>
          <rect x="-4.4" y="30" width="8.8" height="26" rx="3" [attr.fill]="cabo"/>
          <path d="M-4.4,35 L4.4,38 M-4.4,41 L4.4,44 M-4.4,47 L4.4,50" stroke="#000" stroke-opacity=".22" stroke-width="1.6"/>
          <circle cx="0" cy="60" r="6.4" fill="url(#es-ouro)"/>
        </g>
      </defs>
      <circle class="es-brilho" cx="100" cy="58" r="58" fill="url(#es-brilho)"/>
      <g class="es-faiscas" stroke="#FFD66B" stroke-width="3.2" stroke-linecap="round">
        <path d="M100,30 L100,16"/><path d="M122,40 L133,31"/><path d="M78,40 L67,31"/><path d="M128,60 L142,60"/><path d="M72,60 L58,60"/>
      </g>
      <g transform="translate(100 62)">
        <g class="es-esq"><use href="#es-espada" transform="rotate(-42) translate(0 28)"/></g>
        <g class="es-dir"><use href="#es-espada" transform="rotate(42) translate(0 28)"/></g>
      </g>
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; }
    .es { overflow: visible; display: block; }
    .es-brilho, .es-faiscas { opacity: 0; transform-box: fill-box; transform-origin: center; }
    .es.anima .es-esq { animation: es-esq 640ms cubic-bezier(.3, 1.4, .5, 1) both, es-flutua 3.2s ease-in-out 900ms infinite; }
    .es.anima .es-dir { animation: es-dir 640ms cubic-bezier(.3, 1.4, .5, 1) both, es-flutua2 3.2s ease-in-out 900ms infinite; }
    .es.anima .es-brilho { animation: es-brilho 1.4s ease-out 460ms both; }
    .es.anima .es-faiscas { animation: es-faisca 700ms ease-out 480ms both; }
    .es:not(.anima) .es-brilho { opacity: .5; }
    @keyframes es-esq { from { transform: translate(-90px, 30px) rotate(-40deg); opacity: 0; } 60% { opacity: 1; } to { transform: none; } }
    @keyframes es-dir { from { transform: translate(90px, 30px) rotate(40deg); opacity: 0; } 60% { opacity: 1; } to { transform: none; } }
    @keyframes es-flutua { 50% { transform: translateY(-3px) rotate(-1.5deg); } }
    @keyframes es-flutua2 { 50% { transform: translateY(-3px) rotate(1.5deg); } }
    @keyframes es-brilho { 0% { opacity: 0; transform: scale(.3); } 25% { opacity: 1; transform: scale(1.1); } 100% { opacity: .45; transform: scale(1); } }
    @keyframes es-faisca { 0% { opacity: 0; transform: scale(.4); } 30% { opacity: 1; } 100% { opacity: 0; transform: scale(1.35); } }
    @media (prefers-reduced-motion: reduce) { .es.anima .es-esq, .es.anima .es-dir, .es.anima .es-brilho, .es.anima .es-faiscas { animation: none; } .es-brilho { opacity: .5; } }
  `]
})
export class EspadasComponent {
  @Input() tamanho = 150;
  @Input() animar = true;
  @Input() cabo = '#2836C6';
}
