import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ComunidadeService } from '../../services/comunidade.service';
import { Duelo } from '../../models/comunidade';
import { AvatarComponent } from '../avatar/avatar.component';
import { IconeComponent } from '../icone/icone.component';

/** Cartão da home com o placar ao vivo dos duelos marcados para hoje. */
@Component({
  selector: 'ed-duelo-hoje',
  standalone: true,
  imports: [RouterLink, AvatarComponent, IconeComponent],
  template: `
    @if (duelos.length) {
      <div class="dh-trilho" #trilho (scroll)="aoRolar()" (pointerdown)="pausar()" (touchstart)="pausar()">
        @for (d of duelos; track d.id; let i = $index) {
          <a class="dh" routerLink="/amigos" [queryParams]="{ aba: 'duelos' }" [attr.aria-label]="'Duelo de hoje contra @' + d.oponente.usuario">
            <span class="dh-cab"><i class="dh-vivo"></i>Duelo de hoje<ed-icone nome="swords" [tamanho]="15" /></span>
            <span class="dh-placar">
              <span class="dh-lado"><b>{{ d.meuXp }}</b><small>Você · {{ d.minhasRespostas }}/4</small></span>
              <span class="dh-meio">
                <ed-avatar [valor]="d.oponente.avatar" [nome]="d.oponente.nome || d.oponente.usuario" [tamanho]="34" />
              </span>
              <span class="dh-lado dir"><b>{{ d.xpOponente }}</b><small>&#64;{{ d.oponente.usuario }} · {{ d.respostasOponente }}/4</small></span>
            </span>
            <span class="dh-barra" [style.--p]="pct(d.meuXp, d.xpOponente) + '%'"><i></i></span>
            <span class="dh-dica">{{ dica(d.meuXp, d.xpOponente, d.minhasRespostas) }}</span>
            @if (duelos.length > 1) {
              <span class="dh-pontos" role="tablist" aria-label="Duelos de hoje">
                @for (x of duelos; track x.id; let j = $index) {
                  <button type="button" role="tab" [class.ativo]="j === atual" [attr.aria-label]="'Duelo ' + (j + 1) + ' de ' + duelos.length"
                          (click)="$event.preventDefault(); $event.stopPropagation(); irPara(j)">
                    @if (j === atual) { <i [class.parado]="parado"></i> }
                  </button>
                }
              </span>
            }
          </a>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    :host:empty { display: none; }
    .dh-trilho { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; border-radius: 20px; }
    .dh-trilho::-webkit-scrollbar { display: none; }
    .dh-trilho > .dh { flex: 0 0 100%; scroll-snap-align: start; }
    .dh-pontos { display: flex; justify-content: center; gap: 5px; margin-top: 2px; }
    .dh-pontos button { position: relative; width: 7px; height: 7px; padding: 0; border: 0; border-radius: 999px; background: rgba(255, 255, 255, .35); cursor: pointer; overflow: hidden; transition: width 300ms var(--ed-curva); }
    .dh-pontos button.ativo { width: 26px; background: rgba(255, 255, 255, .3); }
    .dh-pontos i { position: absolute; inset: 0; border-radius: inherit; background: #FFFFFF; transform-origin: left; animation: dh-encher 6.5s linear both; }
    .dh-pontos i.parado { animation: none; transform: none; }
    @keyframes dh-encher { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    .dh { display: grid; gap: 10px; padding: 14px 16px; border-radius: 20px; text-decoration: none; color: #FFFFFF; background: radial-gradient(120% 160% at 0% 0%, #3442D8 0%, #1C2590 55%, #0F1550 100%); box-shadow: 0 16px 30px -20px rgba(28, 37, 144, .9); transition: transform var(--ed-t-rapido); font-family: var(--ed-fonte); }
    .dh:active { transform: scale(.99); }
    .dh-cab { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #FFD66B; }
    .dh-cab ed-icone { margin-left: auto; color: rgba(255, 255, 255, .7); }
    .dh-vivo { width: 8px; height: 8px; border-radius: 50%; background: #FF6B6B; animation: dh-pulso 1.6s infinite; }
    @keyframes dh-pulso { 0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, .6); } 70% { box-shadow: 0 0 0 8px rgba(255, 107, 107, 0); } 100% { box-shadow: none; } }
    .dh-placar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; }
    .dh-lado { display: grid; gap: 1px; }
    .dh-lado.dir { text-align: right; }
    .dh-lado b { font-size: 28px; font-weight: 800; letter-spacing: -.03em; line-height: 1; font-variant-numeric: tabular-nums; }
    .dh-lado small { font-size: 12px; color: rgba(255, 255, 255, .72); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dh-meio { display: grid; place-items: center; padding: 3px; border-radius: 50%; background: rgba(255, 255, 255, .16); }
    .dh-barra { height: 6px; border-radius: 3px; background: rgba(255, 214, 107, .9); overflow: hidden; }
    .dh-barra i { display: block; height: 100%; width: var(--p); background: #FFFFFF; transition: width 600ms var(--ed-curva); }
    .dh-dica { font-size: 13.5px; font-weight: 600; color: rgba(255, 255, 255, .85); }
  `]
})
export class DueloHojeComponent implements OnInit, OnDestroy {
  private comunidade = inject(ComunidadeService);
  @ViewChild('trilho') trilho?: ElementRef<HTMLDivElement>;
  duelos: Duelo[] = [];
  atual = 0;
  parado = false;
  private sub?: Subscription;
  private relogio: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.sub = this.comunidade.notificacoes$.subscribe(n => {
      this.duelos = n?.hoje ?? [];
      if (this.atual >= this.duelos.length) this.atual = 0;
      this.iniciar();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.relogio) clearInterval(this.relogio);
  }

  private iniciar() {
    if (this.relogio) clearInterval(this.relogio);
    this.relogio = null;
    if (this.duelos.length < 2 || this.parado) return;
    this.relogio = setInterval(() => this.irPara((this.atual + 1) % this.duelos.length, false), 6500);
  }

  irPara(i: number, manual = true) {
    this.atual = i;
    const t = this.trilho?.nativeElement;
    if (t) t.scrollTo({ left: i * t.clientWidth, behavior: 'smooth' });
    if (manual) this.iniciar();
  }

  aoRolar() {
    const t = this.trilho?.nativeElement;
    if (!t || !t.clientWidth) return;
    const i = Math.round(t.scrollLeft / t.clientWidth);
    if (i !== this.atual) this.atual = i;
  }

  pausar() {
    this.parado = true;
    if (this.relogio) clearInterval(this.relogio);
    this.relogio = null;
  }

  pct(a: number, b: number) { const t = a + b; return t ? Math.round((a / t) * 100) : 50; }
  dica(meu: number, dele: number, feitas: number) {
    if (feitas >= 4) return meu > dele ? 'Você terminou na frente. Agora é esperar a meia-noite.' : 'Você já respondeu tudo. O resultado sai à meia-noite.';
    if (meu > dele) return 'Você está na frente. Continue respondendo!';
    if (meu < dele) return `Faltam ${dele - meu + 1} XP para virar. Bora responder!`;
    return 'Tudo empatado. Cada questão conta.';
  }
}
