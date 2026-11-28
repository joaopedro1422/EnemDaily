import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConfigCronograma } from '../../models/cronograma';
import { infoAreaConteudo } from '../../models/conteudo';
import { EstadoLembrete, PwaService } from '../../services/pwa.service';
import { IconeComponent } from '../../shared/icone/icone.component';

/** Ajustes do cronograma: preferências, lembretes e recomeçar. */
@Component({
  selector: 'app-ajustes-cronograma',
  standalone: true,
  imports: [IconeComponent],
  template: `
    <div class="aj" [class.fechando]="fechando" role="dialog" aria-modal="true" aria-labelledby="aj-titulo">
      <div class="aj-fundo" (click)="fechar()"></div>
      <section class="aj-folha">
        <span class="aj-alca" aria-hidden="true"></span>
        <header class="aj-cab">
          <h2 id="aj-titulo">Ajustes do cronograma</h2>
          <button class="aj-x" type="button" (click)="fechar()" aria-label="Fechar"><ed-icone nome="x" [tamanho]="20" /></button>
        </header>

        <button class="aj-item" type="button" (click)="sair('editar')">
          <span class="aj-ico"><ed-icone nome="settings-2" [tamanho]="18" /></span>
          <span class="aj-txt"><b>Tempo e preferências</b><small>{{ resumoConfig }}</small></span>
          <ed-icone nome="chevron-right" [tamanho]="18" />
        </button>

        <div class="aj-item estatico">
          <span class="aj-ico"><ed-icone nome="bell" [tamanho]="18" /></span>
          <span class="aj-txt"><b>Lembretes</b><small>{{ textoLembrete }}</small></span>
          @if (lembrete === 'ativo') {
            <input type="checkbox" role="switch" [checked]="config.notificacoes" (change)="alternar($event)" aria-label="Lembretes do cronograma" />
          } @else if (lembrete === 'inativo') {
            <button class="aj-mini" type="button" (click)="ativarAparelho()" [disabled]="ativando">Ativar</button>
          }
        </div>

        <button class="aj-item" type="button" (click)="sair('ajuda')">
          <span class="aj-ico"><ed-icone nome="circle-help" [tamanho]="18" /></span>
          <span class="aj-txt"><b>Como o cronograma funciona</b></span>
          <ed-icone nome="chevron-right" [tamanho]="18" />
        </button>

        @if (!confirmando) {
          <button class="aj-refazer" type="button" (click)="confirmando = true"><ed-icone nome="rotate-ccw" [tamanho]="16" />Refazer do zero</button>
        } @else {
          <div class="aj-confirma">
            <p>O plano é montado de novo. Os assuntos que você já estudou continuam marcados.</p>
            <div>
              <button class="aj-sim" type="button" (click)="sair('refazer')">Refazer</button>
              <button class="aj-nao" type="button" (click)="confirmando = false">Cancelar</button>
            </div>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .aj { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: flex-end; justify-content: center; font-family: var(--ed-fonte); color: var(--ed-tinta); }
    .aj-fundo { position: absolute; inset: 0; background: rgba(12, 16, 38, .5); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); animation: aj-aparecer 220ms ease both; }
    @keyframes aj-aparecer { from { opacity: 0; } }
    .aj-folha { position: relative; width: 100%; max-width: 520px; display: grid; gap: 8px; padding: 10px 16px calc(18px + env(safe-area-inset-bottom)); border-radius: 26px 26px 0 0; background: var(--ed-folha); box-shadow: 0 -20px 50px -20px rgba(12, 16, 38, .5); animation: aj-subir 340ms cubic-bezier(.2, .9, .25, 1) both; }
    @keyframes aj-subir { from { transform: translateY(100%); } }
    .aj.fechando .aj-fundo { opacity: 0; transition: opacity 200ms; }
    .aj.fechando .aj-folha { transform: translateY(100%); transition: transform 230ms ease-in; }
    .aj-alca { justify-self: center; width: 40px; height: 4px; border-radius: 2px; background: var(--ed-pauta-forte); }
    .aj-cab { display: flex; justify-content: space-between; align-items: center; padding: 2px 4px 6px; }
    .aj-cab h2 { font-size: 20px; font-weight: 800; letter-spacing: -.03em; }
    .aj-x { width: 38px; height: 38px; border-radius: 50%; border: 0; display: grid; place-items: center; background: var(--ed-fundo-2); color: var(--ed-tinta-2); cursor: pointer; }
    .aj-item { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; min-height: 62px; padding: 10px 12px; border-radius: 16px; border: 0; background: var(--ed-fundo-2); color: var(--ed-tinta); text-align: left; font-family: var(--ed-fonte); cursor: pointer; transition: background var(--ed-t-rapido); }
    .aj-item:not(.estatico):hover { background: var(--ed-pauta); }
    .aj-item.estatico { cursor: default; }
    .aj-item > ed-icone { color: var(--ed-tinta-3); }
    .aj-ico { width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; background: var(--ed-folha); color: var(--ed-caneta-texto); }
    .aj-txt b { display: block; font-size: 15px; font-weight: 700; }
    .aj-txt small { display: block; margin-top: 2px; font-size: 13px; color: var(--ed-tinta-3); }
    .aj-item input[type="checkbox"] { appearance: none; width: 46px; height: 28px; border-radius: 999px; background: var(--ed-pauta-forte); position: relative; cursor: pointer; transition: background var(--ed-t-medio); }
    .aj-item input[type="checkbox"]::after { content: ""; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0, 0, 0, .25); transition: transform var(--ed-t-medio) var(--ed-curva); }
    .aj-item input[type="checkbox"]:checked { background: var(--ed-ok); }
    .aj-item input[type="checkbox"]:checked::after { transform: translateX(18px); }
    .aj-mini { height: 34px; padding: 0 14px; border-radius: 10px; border: 0; background: var(--ed-caneta); color: var(--ed-sobre-caneta); font: 800 13.5px var(--ed-fonte); cursor: pointer; }
    .aj-refazer { justify-self: center; display: inline-flex; align-items: center; gap: 7px; height: 42px; margin-top: 4px; padding: 0 14px; border: 0; background: transparent; color: var(--ed-tinta-3); font: 700 14px var(--ed-fonte); cursor: pointer; }
    .aj-refazer:hover { color: var(--ed-tinta); }
    .aj-confirma { display: grid; gap: 10px; margin-top: 4px; padding: 14px; border-radius: 16px; border: 1px solid var(--ed-pauta); animation: ed-surgir 220ms var(--ed-curva) both; }
    .aj-confirma p { font-size: 14px; line-height: 1.45; color: var(--ed-tinta-2); }
    .aj-confirma div { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .aj-sim, .aj-nao { height: 44px; border-radius: 12px; border: 0; font: 800 14.5px var(--ed-fonte); cursor: pointer; }
    .aj-sim { background: var(--ed-tinta); color: var(--ed-folha); }
    .aj-nao { background: var(--ed-fundo-2); color: var(--ed-tinta); }
    @media (min-width: 640px) {
      .aj { align-items: center; padding: 24px; }
      .aj-folha { border-radius: 26px; padding: 20px; animation: aj-entrar 300ms cubic-bezier(.2, 1.1, .4, 1) both; }
      @keyframes aj-entrar { from { opacity: 0; transform: translateY(16px) scale(.97); } }
      .aj.fechando .aj-folha { transform: scale(.97); opacity: 0; transition: transform 200ms, opacity 200ms; }
      .aj-alca { display: none; }
    }
  `]
})
export class AjustesCronogramaComponent implements OnInit, OnDestroy {
  private pwa = inject(PwaService);
  private sub?: Subscription;

  @Input({ required: true }) config!: ConfigCronograma;
  @Output() escolha = new EventEmitter<'editar' | 'ajuda' | 'refazer' | 'fechar'>();
  @Output() notificacoes = new EventEmitter<boolean>();

  lembrete: EstadoLembrete = 'carregando';
  fechando = false;
  confirmando = false;
  ativando = false;

  ngOnInit() { this.sub = this.pwa.lembrete$.subscribe(e => (this.lembrete = e)); }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  @HostListener('document:keydown.escape')
  aoEsc() { this.fechar(); }

  get resumoConfig(): string {
    const total = this.config.disponibilidade.reduce((a, b) => a + b, 0);
    const h = Math.floor(total / 60), m = total % 60;
    const tempo = `${h ? h + ' h' : ''}${h && m ? ' ' : ''}${m ? m + ' min' : ''} por semana`;
    const foco = this.config.foco.map(a => infoAreaConteudo(a).curto).join(' e ');
    return foco ? `${tempo} · foco em ${foco}` : tempo;
  }

  get textoLembrete(): string {
    switch (this.lembrete) {
      case 'ativo': return this.config.notificacoes ? 'De manhã o plano do dia, à noite um lembrete' : 'Desligados';
      case 'inativo': return 'Ative as notificações neste aparelho';
      case 'negado': return 'Notificações bloqueadas no navegador';
      case 'precisa-instalar': return 'Instale o app para receber notificações';
      default: return 'Indisponível neste aparelho';
    }
  }

  alternar(e: Event) {
    this.notificacoes.emit((e.target as HTMLInputElement).checked);
  }

  async ativarAparelho() {
    this.ativando = true;
    try {
      await this.pwa.ativarLembrete();
      if (!this.config.notificacoes) this.notificacoes.emit(true);
    } finally {
      this.ativando = false;
    }
  }

  fechar() { this.sair('fechar'); }

  sair(e: 'editar' | 'ajuda' | 'refazer' | 'fechar') {
    if (this.fechando) return;
    this.fechando = true;
    setTimeout(() => this.escolha.emit(e), 220);
  }
}
