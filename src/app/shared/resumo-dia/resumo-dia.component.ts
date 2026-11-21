import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { SomService } from '../som/som.service';
import { IconeComponent } from '../icone/icone.component';

export interface ResultadoArea { nome: string; cor: string; acertou: boolean; }

@Component({
  selector: 'ed-resumo-dia',
  standalone: true,
  imports: [IconeComponent],
  template: `
    <div class="rd" role="dialog" aria-modal="true" aria-labelledby="rd-titulo">
      <div class="rd-fundo" (click)="fechar.emit()"></div>
      <section class="rd-cartao">
        <button class="rd-x" type="button" (click)="fechar.emit()" aria-label="Fechar"><ed-icone nome="x" [tamanho]="18" /></button>
        <span class="rd-data">enem<span class="pt"></span>daily · {{ data }}</span>
        <h2 id="rd-titulo">Dia completo!</h2>

        <div class="rd-bolhas" [attr.aria-label]="acertos + ' de 4 acertos'">
          @for (r of resultados; track r.nome; let i = $index) {
            <span class="rd-bolha" [class.cheia]="preenchidas.has(i)" [style.--c]="r.cor" [attr.title]="r.nome + (r.acertou ? ': acertou' : ': errou')"></span>
          }
        </div>

        <ul class="rd-legenda" aria-label="Legenda">
          @for (r of resultados; track r.nome) {
            <li><i [style.background]="r.cor"></i>{{ r.nome }}</li>
          }
        </ul>

        <div class="rd-numeros">
          @if (sequencia > 0) {
            <span class="rd-seq"><span class="rd-fogo" aria-hidden="true"><ed-icone nome="flame" [tamanho]="22" /></span><b>{{ sequencia }}</b>{{ sequencia === 1 ? 'dia' : 'dias' }}</span>
          }
          <span class="rd-xp"><b>+{{ xp }}</b>XP</span>
        </div>

        <button class="rd-compartilhar" type="button" (click)="compartilhar()" [disabled]="gerando">
          <ed-icone nome="arrow-up" [tamanho]="18" />{{ gerando ? 'Preparando...' : copiado ? 'Copiado!' : 'Compartilhar' }}
        </button>
      </section>
    </div>
  `,
  styles: [`
    .rd { position: fixed; inset: 0; z-index: 1500; display: grid; place-items: center; padding: 20px; font-family: var(--ed-fonte); }
    .rd-fundo { position: absolute; inset: 0; background: rgba(8, 11, 30, .62); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: rd-aparece 260ms ease both; }
    @keyframes rd-aparece { from { opacity: 0; } }
    .rd-cartao { position: relative; isolation: isolate; overflow: hidden; width: 100%; max-width: 360px; display: grid; justify-items: center; gap: 18px; padding: 30px 24px 24px; border-radius: 28px; color: #FFFFFF; text-align: center;
      background: radial-gradient(120% 90% at 50% 0%, #3442D8 0%, #2836C6 45%, #1A2290 100%); box-shadow: 0 40px 80px -30px rgba(8, 11, 30, .8); animation: rd-sobe 520ms cubic-bezier(.2, 1.2, .3, 1) both; }
    .rd-cartao::before { content: ''; position: absolute; inset: 0; z-index: -1; background-image: radial-gradient(rgba(255, 255, 255, .12) 1.4px, transparent 1.6px); background-size: 18px 18px; -webkit-mask-image: linear-gradient(to bottom, #000, transparent 70%); mask-image: linear-gradient(to bottom, #000, transparent 70%); }
    @keyframes rd-sobe { from { transform: translateY(30px) scale(.94); opacity: 0; } }
    .rd-x { position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%; border: 0; display: grid; place-items: center; background: rgba(255, 255, 255, .14); color: #FFFFFF; cursor: pointer; }
    .rd-data { font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: rgba(255, 255, 255, .72); }
    .pt { display: inline-block; width: 4px; height: 4px; margin: 0 1px; border-radius: 50%; background: #FFD66B; vertical-align: 2px; }
    h2 { margin: -8px 0 0; font-size: 30px; font-weight: 800; letter-spacing: -.035em; }
    .rd-bolhas { display: grid; grid-template-columns: repeat(2, 84px); gap: 16px; margin: 4px 0; }
    .rd-bolha { position: relative; width: 84px; height: 84px; border-radius: 50%; border: 5px solid rgba(255, 255, 255, .5); transition: border-color 200ms ease, box-shadow 300ms ease; }
    .rd-bolha::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: var(--c); transform: scale(0); }
    .rd-bolha.cheia { border-color: rgba(255, 255, 255, .95); box-shadow: 0 10px 24px -10px rgba(0, 0, 0, .55); }
    .rd-bolha.cheia::after { animation: rd-tinta 460ms cubic-bezier(.3, 1.5, .5, 1) both; }
    @keyframes rd-tinta { 0% { transform: scale(0); } 100% { transform: scale(1); } }
    .rd-legenda { list-style: none; margin: -4px 0 0; padding: 0; display: grid; grid-template-columns: repeat(2, 84px); column-gap: 16px; row-gap: 4px; justify-items: center; font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, .75); white-space: nowrap; }
    .rd-legenda li { display: inline-flex; align-items: center; gap: 5px; }
    .rd-legenda i { width: 9px; height: 9px; border-radius: 50%; box-shadow: 0 0 0 1.5px rgba(255, 255, 255, .8); }
    .rd-numeros { display: flex; align-items: center; justify-content: center; gap: 22px; }
    .rd-seq, .rd-xp { display: inline-flex; align-items: baseline; gap: 6px; font-size: 16px; font-weight: 700; color: rgba(255, 255, 255, .85); }
    .rd-seq b, .rd-xp b { font-size: 34px; font-weight: 800; letter-spacing: -.03em; color: #FFFFFF; font-variant-numeric: tabular-nums; }
    .rd-fogo { align-self: center; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: #FF7A1A; color: #FFFFFF; box-shadow: 0 0 0 4px rgba(255, 122, 26, .25); }
    .rd-compartilhar { width: 100%; height: 54px; margin-top: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 16px; background: #FFFFFF; color: #2836C6; font: 800 16.5px var(--ed-fonte); cursor: pointer; box-shadow: 0 14px 30px -16px rgba(0, 0, 0, .6); }
    .rd-compartilhar:active { transform: scale(.98); }
    @media (prefers-reduced-motion: reduce) { .rd-cartao, .rd-fundo, .rd-bolha.cheia::after { animation: none; transform: none; } }
  `]
})
export class ResumoDiaComponent implements OnInit, OnDestroy {
  @Input() resultados: ResultadoArea[] = [];
  @Input() sequencia = 0;
  @Input() xp = 0;
  @Output() fechar = new EventEmitter<void>();

  data = '';
  gerando = false;
  copiado = false;

  get acertos(): number { return this.resultados.filter(r => r.acertou).length; }

  private som = inject(SomService);
  private timers: ReturnType<typeof setTimeout>[] = [];
  preenchidas = new Set<number>();

  ngOnInit() {
    this.data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    let passo = 0;
    this.resultados.forEach((r, i) => {
      if (!r.acertou) return;
      const nota = passo++;
      this.timers.push(setTimeout(() => { this.preenchidas.add(i); this.som.bolinha(nota, true); }, 650 + nota * 420));
    });
    if (this.sequencia > 1) this.timers.push(setTimeout(() => this.som.fogo(), 650 + passo * 420 + 250));
  }

  ngOnDestroy() { this.timers.forEach(clearTimeout); }

  @HostListener('document:keydown.escape') aoEsc() { this.fechar.emit(); }

  async compartilhar() {
    const texto = `Completei o desafio de hoje do enem.daily: ${this.acertos} de 4 acertos, +${this.xp} XP`
      + (this.sequencia > 1 ? ` e ${this.sequencia} dias seguidos 🔥` : '') + `\n${location.origin}`;
    this.gerando = true;
    try {
      const imagem = await this.gerarImagem();
      const arquivo = imagem ? new File([imagem], 'enem-daily-hoje.png', { type: 'image/png' }) : null;
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (arquivo && nav.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: texto });
      } else if (navigator.share) {
        await navigator.share({ text: texto });
      } else if (imagem) {
        const url = URL.createObjectURL(imagem);
        const a = document.createElement('a');
        a.href = url; a.download = 'enem-daily-hoje.png'; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        await navigator.clipboard?.writeText(texto).catch(() => {});
        this.copiado = true;
      }
    } catch { /* compartilhamento cancelado */ }
    this.gerando = false;
  }

  private gerarImagem(): Promise<Blob | null> {
    const L = 1080, A = 1350;
    const c = document.createElement('canvas');
    c.width = L; c.height = A;
    const g = c.getContext('2d');
    if (!g) return Promise.resolve(null);
    const fundo = g.createRadialGradient(L / 2, 0, 80, L / 2, 0, A);
    fundo.addColorStop(0, '#3442D8'); fundo.addColorStop(.45, '#2836C6'); fundo.addColorStop(1, '#1A2290');
    g.fillStyle = fundo; g.fillRect(0, 0, L, A);
    g.fillStyle = 'rgba(255,255,255,.08)';
    for (let y = 30; y < 560; y += 46) for (let x = 30; x < L; x += 46) { g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill(); }

    const fonte = getComputedStyle(document.documentElement).getPropertyValue('--ed-fonte').trim() || 'sans-serif';
    g.textAlign = 'center';
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.font = `800 34px ${fonte}`;
    g.fillText(`ENEM.DAILY · ${this.data}`, L / 2, 150);
    g.fillStyle = '#FFFFFF';
    g.font = `800 92px ${fonte}`;
    g.fillText('Dia completo!', L / 2, 262);

    const cores = this.resultados.map(r => this.corReal(r.cor));
    const r = 132, gap = 52, cx0 = L / 2 - r - gap / 2, cy0 = 470;
    this.resultados.forEach((res, i) => {
      const cx = cx0 + (i % 2) * (2 * r + gap), cy = cy0 + Math.floor(i / 2) * (2 * r + gap);
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2);
      if (res.acertou) { g.fillStyle = cores[i]; g.fill(); }
      g.lineWidth = 14; g.strokeStyle = res.acertou ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.45)'; g.stroke();
    });

    g.font = `600 30px ${fonte}`;
    const itens = this.resultados.map((res, i) => ({ nome: res.nome, cor: cores[i], w: g.measureText(res.nome).width }));
    g.textAlign = 'left';
    itens.forEach((it, i) => {
      const centro = cx0 + (i % 2) * (2 * r + gap), y = 990 + Math.floor(i / 2) * 50;
      const xl = centro - (22 + 12 + it.w) / 2;
      g.beginPath(); g.arc(xl + 11, y, 11, 0, Math.PI * 2); g.fillStyle = it.cor; g.fill();
      g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.8)'; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText(it.nome, xl + 34, y + 11);
    });
    g.textAlign = 'center';

    const yNum = 1160;
    g.font = `800 96px ${fonte}`;
    g.fillStyle = '#FFFFFF';
    const xpTxt = `+${this.xp} XP`;
    if (this.sequencia > 0) {
      const seqTxt = `${this.sequencia} ${this.sequencia === 1 ? 'dia' : 'dias'}`;
      g.textAlign = 'left';
      const wSeq = g.measureText(seqTxt).width, wXp = g.measureText(xpTxt).width;
      const total = 96 + 20 + wSeq + 90 + wXp;
      let x = L / 2 - total / 2;
      g.beginPath(); g.arc(x + 48, yNum - 34, 48, 0, Math.PI * 2); g.fillStyle = '#FF7A1A'; g.fill();
      this.desenharFogo(g, x + 48, yNum - 34);
      x += 96 + 20;
      g.fillStyle = '#FFFFFF'; g.fillText(seqTxt, x, yNum);
      x += wSeq + 90;
      g.fillText(xpTxt, x, yNum);
    } else {
      g.fillText(xpTxt, L / 2, yNum);
    }
    g.textAlign = 'center';
    g.font = `700 34px ${fonte}`;
    g.fillStyle = 'rgba(255,255,255,.7)';
    g.fillText(location.host, L / 2, 1270);
    return new Promise(res => c.toBlob(b => res(b), 'image/png'));
  }

  private desenharFogo(g: CanvasRenderingContext2D, cx: number, cy: number) {
    g.save();
    g.translate(cx - 26, cy - 30);
    g.scale(2.2, 2.2);
    g.fillStyle = '#FFFFFF';
    g.fill(new Path2D('M12 2c.5 3.5 3.5 5.5 4.6 8.4 1.5 4-1 9.6-4.6 9.6-3.8 0-6.4-3.2-5.9-6.8.3-2 1.6-3.4 2.4-4.6.5 1.5 1.2 2.4 2.2 2.8C10.2 9.6 11 5.4 12 2z'));
    g.restore();
  }

  private corReal(cor: string): string {
    const m = cor.match(/var\((--[^)]+)\)/);
    return (m ? getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() : cor) || '#2836C6';
  }
}
