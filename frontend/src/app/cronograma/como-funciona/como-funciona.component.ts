import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Orientacao } from '../../models/cronograma';
import { IconeComponent } from '../../shared/icone/icone.component';

/** Os avisos fundamentais do cronograma: no primeiro acesso e no botão "?". */
@Component({
  selector: 'app-como-funciona',
  standalone: true,
  imports: [IconeComponent],
  template: `
    <div class="cf" [class.fechando]="fechando" role="dialog" aria-modal="true" aria-labelledby="cf-titulo">
      <div class="cf-fundo" (click)="primeiraVez ? null : fechar()"></div>
      <section class="cf-folha">
        <span class="cf-alca" aria-hidden="true"></span>
        <header class="cf-cab">
          <span class="cf-selo"><ed-icone nome="calendar-check" [tamanho]="22" /></span>
          <h2 id="cf-titulo">Como o cronograma funciona</h2>
          @if (!primeiraVez) {
            <button class="cf-x" type="button" (click)="fechar()" aria-label="Fechar"><ed-icone nome="x" [tamanho]="20" /></button>
          }
        </header>
        <ul class="cf-lista">
          @for (p of pontos; track p.titulo; let i = $index) {
            <li [style.--i]="i">
              <span class="cf-ico"><ed-icone [nome]="p.icone" [tamanho]="18" /></span>
              <div><b>{{ p.titulo }}</b><p>{{ p.texto }}</p></div>
            </li>
          }
        </ul>
        <button class="cf-btn" type="button" (click)="entendi()">{{ primeiraVez ? 'Entendi, vamos montar' : 'Entendi' }}</button>
      </section>
    </div>
  `,
  styles: [`
    .cf { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: flex-end; justify-content: center; font-family: var(--ed-fonte); color: var(--ed-tinta); }
    .cf-fundo { position: absolute; inset: 0; background: rgba(12, 16, 38, .55); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); animation: cf-aparecer 240ms ease both; }
    @keyframes cf-aparecer { from { opacity: 0; } }
    .cf-folha { position: relative; width: 100%; max-width: 520px; max-height: 92svh; overflow-y: auto; display: grid; gap: 18px; padding: 10px 20px calc(20px + env(safe-area-inset-bottom)); border-radius: 26px 26px 0 0; background: var(--ed-folha); box-shadow: 0 -20px 50px -20px rgba(12, 16, 38, .5); animation: cf-subir 380ms cubic-bezier(.2, .9, .25, 1) both; }
    @keyframes cf-subir { from { transform: translateY(100%); } }
    .cf.fechando .cf-fundo { opacity: 0; transition: opacity 220ms; }
    .cf.fechando .cf-folha { transform: translateY(100%); transition: transform 240ms ease-in; }
    .cf-alca { justify-self: center; width: 40px; height: 4px; border-radius: 2px; background: var(--ed-pauta-forte); }
    .cf-cab { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; }
    .cf-selo { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--ed-caneta); color: #FFFFFF; }
    .cf-cab h2 { font-size: 21px; font-weight: 800; letter-spacing: -.03em; line-height: 1.15; }
    .cf-x { width: 38px; height: 38px; border-radius: 50%; border: 0; display: grid; place-items: center; background: var(--ed-fundo-2); color: var(--ed-tinta-2); cursor: pointer; }
    .cf-lista { list-style: none; display: grid; gap: 14px; }
    .cf-lista li { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; animation: ed-surgir 380ms var(--ed-curva) both; animation-delay: calc(80ms + var(--i) * 70ms); }
    .cf-ico { width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; background: var(--ed-caneta-suave); color: var(--ed-caneta-texto); }
    .cf-lista b { font-size: 15px; font-weight: 800; letter-spacing: -.01em; }
    .cf-lista p { margin-top: 2px; font-size: 14px; line-height: 1.5; color: var(--ed-tinta-2); }
    .cf-btn { height: 50px; border: 0; border-radius: 14px; background: var(--ed-caneta); color: var(--ed-sobre-caneta); font: 800 15.5px var(--ed-fonte); cursor: pointer; transition: background var(--ed-t-rapido), transform var(--ed-t-rapido); }
    .cf-btn:hover { background: var(--ed-caneta-hover); }
    .cf-btn:active { transform: scale(.98); }
    @media (min-width: 640px) {
      .cf { align-items: center; padding: 24px; }
      .cf-folha { border-radius: 26px; padding: 24px 26px; animation: cf-entrar 340ms cubic-bezier(.2, 1.1, .4, 1) both; }
      @keyframes cf-entrar { from { opacity: 0; transform: translateY(18px) scale(.97); } }
      .cf.fechando .cf-folha { transform: scale(.97); opacity: 0; transition: transform 220ms, opacity 220ms; }
      .cf-alca { display: none; }
    }
  `]
})
export class ComoFuncionaComponent {
  @Input({ required: true }) orientacao!: Orientacao;
  /** No primeiro acesso não dá para fechar sem confirmar. */
  @Input() primeiraVez = false;
  @Output() fechou = new EventEmitter<boolean>();

  fechando = false;

  get pontos() {
    const o = this.orientacao;
    return [
      { icone: 'calendar-check', titulo: 'Organiza seus estudos', texto: o.oQueE },
      { icone: 'book-open', titulo: 'Você estuda do seu jeito', texto: o.oQueNaoE },
      { icone: 'check', titulo: 'Você marca o que concluiu', texto: o.comoConcluir },
      { icone: 'target', titulo: 'Direção, não garantia', texto: o.resultado }
    ];
  }

  @HostListener('document:keydown.escape')
  aoEsc() { if (!this.primeiraVez) this.fechar(); }

  entendi() { this.sair(true); }

  fechar() { this.sair(false); }

  private sair(confirmou: boolean) {
    if (this.fechando) return;
    this.fechando = true;
    setTimeout(() => this.fechou.emit(confirmou), 230);
  }
}
