import { SomService } from '../som/som.service';
import { ExtrasCampus } from './especiais';
import { ChangeDetectorRef, Component, inject, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { Caixa, Destaque, Peca, Progresso, Trilha, caixaDaRegiao, caixaEm, paletaDe, regiao, renderizarCampus } from './campus';

const NUVENS: [number, number, number, number][] = [[8, 6, 58, 70], [52, 14, 46, 95], [28, 24, 36, 120]];

@Component({
  selector: 'ed-campus',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cv-palco ed-campus-palco" [class.cv-noite]="noite" [class.cv-interativo]="interativo">
      <div class="cv-ceu" aria-hidden="true">
        @if (!noite) {
          @for (n of nuvens; track $index) {
            <svg class="cv-nuvem" [style.left.%]="n[0] - 30" [style.top.%]="n[1]" [style.width.px]="n[2] * 1.6" [style.animation-duration.s]="n[3]" [style.animation-delay.s]="-$index * 30" viewBox="0 0 120 50"><g fill="#FFFFFF"><ellipse cx="38" cy="32" rx="30" ry="15"/><ellipse cx="66" cy="24" rx="26" ry="20"/><ellipse cx="88" cy="34" rx="24" ry="13"/></g></svg>
          }
          @if (ceu) {
            <svg class="cv-passaros" viewBox="0 0 70 24"><g fill="none" stroke="#3A4366" stroke-width="1.6" stroke-linecap="round"><path d="M2,10 q5,-6 9,0 q4,-6 9,0"/><path d="M30,4 q4,-5 7,0 q3,-5 7,0"/><path d="M48,14 q4,-5 7,0 q3,-5 7,0"/></g></svg>
          }
        }
      </div>
      <div class="cv-cena" #cena
           (pointerdown)="iniciarArraste($event)" (pointermove)="arrastar($event)" (pointerup)="soltar($event)" (pointercancel)="soltar($event)"
           (wheel)="rolar($event)" (dblclick)="enquadrar()"></div>
      @if (interativo) {
        <div class="ed-campus-zoom">
          <button type="button" (click)="zoom(.8)" aria-label="Aproximar">+</button>
          <button type="button" (click)="zoom(1.25)" aria-label="Afastar">−</button>
          <button type="button" (click)="enquadrar()" aria-label="Ver o campus inteiro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
        </div>
      }
      @if (avisos) {
        <div class="ed-campus-aviso" [class.mostra]="!!aviso" aria-live="polite">
          @if (aviso) {
            <i [style.background]="aviso.cor"></i>
            <span><small>{{ aviso.rotulo }}</small><b>{{ aviso.nome }}</b></span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    ed-campus { display: block; position: relative; }
    .ed-campus-palco { position: absolute; inset: 0; border-radius: inherit; }
    .ed-campus-zoom { position: absolute; right: 12px; bottom: 12px; z-index: 3; display: grid; gap: 6px; }
    .ed-campus-zoom button { width: 36px; height: 36px; border-radius: 10px; border: 0; background: rgba(255,255,255,.92); color: #121A33; font: 700 18px var(--ed-fonte); display: grid; place-items: center; cursor: pointer; box-shadow: 0 4px 14px -8px rgba(18,26,51,.5); }
    .ed-campus-zoom button svg { width: 17px; height: 17px; }
    .ed-campus-aviso { position: absolute; left: 50%; bottom: 12px; z-index: 3; transform: translate(-50%, 14px); opacity: 0; display: flex; align-items: center; gap: 10px; background: #121A33; color: #FFFFFF; border-radius: 14px; padding: 9px 14px 9px 12px; max-width: calc(100% - 24px); white-space: nowrap; pointer-events: none; box-shadow: 0 12px 30px -14px rgba(5,10,30,.7); transition: opacity 240ms var(--ed-curva), transform 240ms var(--ed-curva); }
    .ed-campus-aviso.mostra { opacity: 1; transform: translate(-50%, 0); }
    .ed-campus-aviso i { width: 10px; height: 10px; border-radius: 50%; flex: none; }
    .ed-campus-aviso small { display: block; font-size: 11px; font-weight: 600; color: rgba(255,255,255,.7); }
    .ed-campus-aviso b { display: block; font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; }
  `]
})
export class CampusComponent implements OnChanges, OnInit, OnDestroy {
  private som = inject(SomService);
  @Input({ required: true }) progresso!: Progresso;
  @Input() modo: 'dia' | 'noite' | 'auto' = 'auto';
  @Input() memoria?: string;
  @Input() interativo = false;
  @Input() avisos = true;
  @Input() sons = true;
  @Input() foco: Trilha | null = null;
  @Input() aproximar = 1;
  @Input() extras: ExtrasCampus | null = null;
  @Input() intervalo = 520;
  @Input() passeio = true;
  @Input() acesas: Partial<Record<Trilha, boolean>> | null = null;
  @Output() novas = new EventEmitter<Peca[]>();
  @ViewChild('cena', { static: true }) cenaRef!: ElementRef<HTMLDivElement>;

  readonly nuvens = NUVENS;
  noite = false;
  ceu = false;
  aviso: { rotulo: string; nome: string; cor: string } | null = null;

  private iniciado = false;
  private ultimo: Progresso | null = null;
  private ultimosExtras: ExtrasCampus | null = null;
  private vb: Caixa | null = null;
  private terreno: Caixa | null = null;
  private quadro = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private arraste: { x: number; y: number; vb: Caixa; id: number } | null = null;

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.iniciado = true;
    this.desenhar(true);
  }

  ngOnChanges(m: SimpleChanges): void {
    if (!this.iniciado) return;
    if (m['progresso'] || m['modo'] || m['extras'] || m['acesas']) this.desenhar(!!m['progresso'] || !!m['extras']);
    if (m['foco'] && !m['progresso']) this.aplicarFoco(true);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.quadro);
    this.timers.forEach(clearTimeout);
  }

  private get chaveMemoria() { return this.memoria ? `ed-campus:${this.memoria}` : ''; }

  private lerMemoria(): Progresso | null {
    if (!this.chaveMemoria) return null;
    try { const v = localStorage.getItem(this.chaveMemoria); return v ? JSON.parse(v) : null; } catch { return null; }
  }

  private salvarMemoria(p: Progresso) {
    if (!this.chaveMemoria) return;
    try { localStorage.setItem(this.chaveMemoria, JSON.stringify(p)); } catch { }
  }

  private desenhar(mudouProgresso: boolean) {
    if (!this.progresso) return;
    const hora = new Date().getHours();
    this.noite = this.modo === 'noite' || (this.modo === 'auto' && (hora >= 18 || hora < 6));

    let desde: Progresso | null = null;
    if (mudouProgresso) {
      const base = this.ultimo ?? this.lerMemoria();
      if (base && (Object.keys(this.progresso) as Trilha[]).every(t => (base[t] ?? 0) <= this.progresso[t])) desde = base;
      this.salvarMemoria(this.progresso);
      this.ultimo = { ...this.progresso };
    }

    let extrasAntes: ExtrasCampus | null = null;
    if (mudouProgresso && this.extras) {
      extrasAntes = this.ultimosExtras;
      if (!extrasAntes && this.chaveMemoria) { try { extrasAntes = JSON.parse(localStorage.getItem(this.chaveMemoria + ':extras') || 'null'); } catch { } }
      this.ultimosExtras = { ...this.extras };
      if (this.chaveMemoria) { try { localStorage.setItem(this.chaveMemoria + ':extras', JSON.stringify(this.extras)); } catch { } }
    }
    const cena = renderizarCampus(this.progresso, paletaDe(this.noite), { novasDesde: desde, extras: this.extras, extrasAntes, acesas: this.acesas, intervalo: this.intervalo, atrasoInicial: this.intervalo < 200 ? 120 : undefined });
    this.ceu = cena.ceu;
    const anterior = this.vb;
    const terrenoAnterior = this.terreno;
    this.terreno = cena.terreno;
    this.cenaRef.nativeElement.innerHTML = cena.svg;

    const alvo = this.alvoCamera();
    const cresceu = !!terrenoAnterior && (terrenoAnterior[2] !== cena.terreno[2] || terrenoAnterior[3] !== cena.terreno[3]);
    if (anterior && (cresceu || !mudouProgresso)) {
      this.definirViewBox(anterior);
      if (cresceu) this.animarCamera(alvo, 1100);
    } else if (!anterior && desde) {
      const velho = renderizarCampus(desde, paletaDe(this.noite)).terreno;
      const mudou = velho.some((v, i) => Math.abs(v - cena.terreno[i]) > .5);
      this.definirViewBox(mudou && !this.foco ? velho : alvo);
      if (mudou && !this.foco) this.animarCamera(alvo, 1100);
    } else {
      this.definirViewBox(alvo);
    }

    if (mudouProgresso && (cena.novas.length || cena.destaques.length)) {
      this.agendarAvisos(cena.novas, cena.destaques);
      if (cena.novas.length) this.novas.emit(cena.novas);
    }
    if (mudouProgresso && cena.destaques.length && !this.foco && this.passeio) this.mostrarDestaques(cena.destaques);
    this.cdr.markForCheck();
  }

  private alvoCamera(): Caixa {
    const r = this.foco ? caixaDaRegiao(this.foco, this.progresso) : null;
    if (r) return r;
    const t = this.terreno!;
    if (this.aproximar <= 1) return t;
    const w = t[2] / this.aproximar, h = t[3] / this.aproximar;
    return [t[0] + (t[2] - w) / 2, t[1] + (t[3] - h) * .6, w, h];
  }

  private aplicarFoco(animar: boolean) {
    const alvo = this.alvoCamera();
    if (animar) this.animarCamera(alvo, 900);
    else this.definirViewBox(alvo);
  }

  private agendarAvisos(novas: Peca[], destaques: Destaque[] = []) {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (!this.avisos) return;
    const pecas = novas.slice(0, 12);
    pecas.forEach((p, i) => {
      this.timers.push(setTimeout(() => this.zone.run(() => {
        const r = regiao(p.trilha);
        this.aviso = { rotulo: p.trilha === 'geral' ? '+1 melhoria · Universidade' : `+1 peça · ${r.nome}`, nome: p.nome, cor: r.cor };
        if (this.sons) this.som.pop();
        this.cdr.markForCheck();
      }), 350 + i * 520));
    });
    destaques.forEach(d => this.timers.push(setTimeout(() => this.zone.run(() => {
      this.aviso = { rotulo: d.rotulo, nome: d.nome, cor: d.cor };
      if (this.sons) { if (d.terreno) this.som.terreno(); else this.som.pop(); }
      this.cdr.markForCheck();
    }), d.atraso + 250)));
    const fim = Math.max(350 + pecas.length * 520, ...destaques.map(d => d.atraso + (d.terreno ? 2600 : 1600)));
    this.timers.push(setTimeout(() => this.zone.run(() => { this.aviso = null; this.cdr.markForCheck(); }), fim + 900));
  }

  private mostrarDestaques(destaques: Destaque[]) {
    destaques.forEach(d => this.timers.push(setTimeout(() => this.animarCamera(caixaEm(d.x, d.y, d.terreno ? 11 : 7.5, .62), 1000), Math.max(0, d.atraso - 900))));
    const fim = Math.max(...destaques.map(d => d.atraso + (d.terreno ? 2600 : 1600)));
    this.timers.push(setTimeout(() => this.animarCamera(this.alvoCamera(), 1200), fim));
  }

  private definirViewBox(c: Caixa) {
    this.vb = [...c] as Caixa;
    const svg = this.cenaRef.nativeElement.querySelector('svg');
    svg?.setAttribute('viewBox', c.map(v => Math.round(v * 10) / 10).join(' '));
  }

  private animarCamera(alvo: Caixa, dur: number) {
    cancelAnimationFrame(this.quadro);
    const de = this.vb ?? alvo, t0 = performance.now();
    this.zone.runOutsideAngular(() => {
      const passo = (t: number) => {
        const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        this.definirViewBox(de.map((v, i) => v + (alvo[i] - v) * e) as Caixa);
        if (k < 1) this.quadro = requestAnimationFrame(passo);
      };
      this.quadro = requestAnimationFrame(passo);
    });
  }

  enquadrar() {
    if (!this.interativo || !this.terreno) return;
    this.animarCamera(this.alvoCamera(), 600);
  }

  zoom(fator: number, cx = .5, cy = .5) {
    if (!this.vb) return;
    const [x, y, w, h] = this.vb;
    const limite = this.terreno ? this.terreno[2] * 1.4 : w * 4;
    const nw = Math.max(160, Math.min(limite, w * fator)), nh = nw * h / w;
    this.animarCamera([x + (w - nw) * cx, y + (h - nh) * cy, nw, nh], 260);
  }

  rolar(e: WheelEvent) {
    if (!this.interativo) return;
    e.preventDefault();
    const r = this.cenaRef.nativeElement.getBoundingClientRect();
    this.zoom(e.deltaY > 0 ? 1.12 : .89, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }

  iniciarArraste(e: PointerEvent) {
    if (!this.interativo || !this.vb) return;
    cancelAnimationFrame(this.quadro);
    this.arraste = { x: e.clientX, y: e.clientY, vb: [...this.vb] as Caixa, id: e.pointerId };
    this.cenaRef.nativeElement.setPointerCapture(e.pointerId);
    this.cenaRef.nativeElement.classList.add('cv-arrastando');
  }

  arrastar(e: PointerEvent) {
    if (!this.arraste || e.pointerId !== this.arraste.id) return;
    const r = this.cenaRef.nativeElement.getBoundingClientRect();
    const [x, y, w, h] = this.arraste.vb;
    const escala = Math.max(w / r.width, h / r.height);
    this.definirViewBox([x - (e.clientX - this.arraste.x) * escala, y - (e.clientY - this.arraste.y) * escala, w, h]);
  }

  soltar(e: PointerEvent) {
    if (!this.arraste) return;
    this.cenaRef.nativeElement.releasePointerCapture?.(e.pointerId);
    this.cenaRef.nativeElement.classList.remove('cv-arrastando');
    this.arraste = null;
  }
}
