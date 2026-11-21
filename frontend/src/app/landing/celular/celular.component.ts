import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { IconeComponent } from '../../shared/icone/icone.component';
import { SimboloDiaComponent } from '../../shared/simbolo-dia/simbolo-dia.component';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

@Component({
  selector: 'ld-celular',
  standalone: true,
  imports: [IconeComponent, SimboloDiaComponent, AvatarComponent],
  template: `
    <div class="cel-caixa" [style.width.px]="380 * escala" [style.height.px]="780 * escala">
      <div class="cel" [style.transform]="'scale(' + escala + ')'">
        <div class="cel-tela">
          <div class="cel-status" aria-hidden="true">
            <b>9:41</b>
            <span class="cel-ilha"></span>
            <span class="cel-sinais"><i></i><i></i><i></i><i></i><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor"/><rect x="2" y="2" width="16" height="8" rx="1.6" fill="currentColor"/><rect x="23.5" y="4" width="1.8" height="4" rx=".9" fill="currentColor"/></svg></span>
          </div>
          <div class="cel-topo" aria-hidden="true">
            <ed-icone nome="menu" [tamanho]="22" />
            <span class="cel-marca"><ed-simbolo-dia [animar]="false" /><span class="wm">enem<i class="pt"></i>daily</span></span>
            <span class="cel-xp">{{ xp }} XP</span>
            <span class="cel-av"><ed-avatar valor="ed1|ameixa|arcos|prata|medicina||" nome="Marina Lopes" [tamanho]="34" [encher]="true" /></span>
          </div>
          <div class="cel-conteudo" #rolagem><ng-content /></div>
          <span class="cel-home" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: inline-block; }
    .cel-caixa { position: relative; }
    .cel { position: absolute; top: 0; left: 0; width: 380px; height: 780px; transform-origin: 0 0; padding: 10px; border-radius: 56px; background: linear-gradient(145deg, #2A3046, #0E1222 55%, #23293D); box-shadow: 0 0 0 1.5px #3A4260 inset, 0 40px 80px -30px rgba(15, 21, 80, .55), 0 18px 36px -18px rgba(8, 11, 30, .5); }
    .cel::before { content: ''; position: absolute; left: -3px; top: 150px; width: 3px; height: 60px; border-radius: 2px; background: #1A1F33; box-shadow: 0 80px 0 #1A1F33; }
    .cel-tela { position: relative; width: 360px; height: 760px; border-radius: 46px; overflow: hidden; background: var(--ed-papel); display: flex; flex-direction: column; isolation: isolate; }
    .cel-status { flex: none; height: 46px; padding: 0 26px 0 32px; display: flex; align-items: center; justify-content: space-between; font: 700 15px var(--ed-fonte); color: var(--ed-tinta); }
    .cel-ilha { position: absolute; left: 50%; top: 11px; width: 108px; height: 30px; margin-left: -54px; border-radius: 16px; background: #0A0D18; }
    .cel-sinais { display: inline-flex; align-items: flex-end; gap: 2px; height: 12px; }
    .cel-sinais i { width: 3px; border-radius: 1px; background: currentColor; }
    .cel-sinais i:nth-child(1) { height: 4px; } .cel-sinais i:nth-child(2) { height: 6px; } .cel-sinais i:nth-child(3) { height: 9px; } .cel-sinais i:nth-child(4) { height: 12px; }
    .cel-sinais svg { width: 26px; height: 12px; margin-left: 6px; }
    .cel-topo { flex: none; height: 56px; padding: 0 14px 0 16px; display: flex; align-items: center; gap: 10px; color: var(--ed-tinta); border-bottom: 1px solid var(--ed-pauta); }
    .cel-marca { display: inline-flex; align-items: center; gap: 2px; margin-left: 4px; }
    .cel-marca ed-simbolo-dia { width: 27px; height: 27px; }
    .cel-marca .wm { font-size: 19px; }
    .cel-marca .wm .pt { background: var(--ed-caneta); }
    .cel-xp { margin-left: auto; padding: 6px 11px; border-radius: 999px; background: var(--ed-caneta-suave); color: var(--ed-caneta-texto); font: 800 12.5px var(--ed-fonte); }
    .cel-av { width: 34px; height: 34px; border-radius: 50%; }
    .cel-conteudo { position: relative; flex: 1; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; overscroll-behavior: contain; }
    .cel-conteudo::-webkit-scrollbar { display: none; }
    .cel-home { position: absolute; left: 50%; bottom: 8px; width: 120px; height: 5px; margin-left: -60px; border-radius: 3px; background: rgba(18, 26, 51, .7); z-index: 5; }
  `]
})
export class CelularComponent implements AfterViewInit, OnDestroy {
  @Input() escala = 1;
  @Input() xp = '6.953';
  @Input() rolar = '';
  @Input() paradas: string[] = [];
  @ViewChild('rolagem', { static: true }) rolagem!: ElementRef<HTMLDivElement>;

  private zone = inject(NgZone);
  private obs?: IntersectionObserver;
  private timer?: ReturnType<typeof setTimeout>;
  private passo = 0;
  private visivel = false;
  private tocou = false;

  ngAfterViewInit() {
    const el = this.rolagem.nativeElement;
    setTimeout(() => { if (this.rolar) el.scrollTop = this.posicao(this.rolar); }, 120);
    if (!this.paradas.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.addEventListener('pointerdown', () => (this.tocou = true), { once: true });
    el.addEventListener('wheel', () => (this.tocou = true), { once: true, passive: true });
    this.zone.runOutsideAngular(() => {
      this.obs = new IntersectionObserver(([e]) => {
        this.visivel = e.isIntersecting;
        if (this.visivel && !this.timer) this.proximo(1600);
      }, { threshold: .45 });
      this.obs.observe(el);
    });
  }

  private proximo(espera: number) {
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (!this.visivel || this.tocou) return;
      this.passo = (this.passo + 1) % this.paradas.length;
      this.rolagem.nativeElement.scrollTo({ top: this.posicao(this.paradas[this.passo]), behavior: 'smooth' });
      this.proximo(2600);
    }, espera);
  }

  irPara(seletor: string) {
    this.tocou = true;
    this.rolagem.nativeElement.scrollTo({ top: this.posicao(seletor), behavior: 'smooth' });
  }

  private posicao(seletor: string): number {
    const c = this.rolagem.nativeElement, alvo = c.querySelector(seletor) as HTMLElement | null;
    if (!alvo) return 0;
    const dy = (alvo.getBoundingClientRect().top - c.getBoundingClientRect().top) / (this.escala || 1);
    return Math.max(0, c.scrollTop + dy - 12);
  }

  ngOnDestroy() { this.obs?.disconnect(); clearTimeout(this.timer); }
}
