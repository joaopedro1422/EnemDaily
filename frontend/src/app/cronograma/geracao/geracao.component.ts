import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { IconeComponent } from '../../shared/icone/icone.component';

const CORES = ['var(--ed-lc)', 'var(--ed-ch)', 'var(--ed-cn)', 'var(--ed-mt)'];

/**
 * Tela de "montando seu cronograma". Fica no ar pelo menos alguns segundos, mesmo que o servidor responda
 * antes: o aluno precisa sentir que o plano foi feito para ele. Só termina quando o tempo mínimo passou e a
 * resposta chegou.
 */
@Component({
  selector: 'app-geracao',
  standalone: true,
  imports: [IconeComponent],
  template: `
    <div class="gr" [class.saindo]="saindo" role="status" aria-live="polite">
      <div class="gr-centro">
        <div class="gr-grade" aria-hidden="true">
          @for (c of celulas; track $index) {
            <i [style.--d.ms]="c.atraso" [style.--c]="c.cor" [class.vazia]="!c.cor"></i>
          }
        </div>
        <div class="gr-texto">
          @if (!concluido) {
            @for (f of frases; track f; let i = $index) {
              @if (i === etapa) { <p>{{ f }}</p> }
            }
          } @else {
            <p class="gr-pronto"><span><ed-icone nome="check" [tamanho]="16" [traco]="3" /></span>{{ modo === 'editar' ? 'Plano reorganizado' : 'Seu cronograma está pronto' }}</p>
          }
        </div>
        <div class="gr-barra" aria-hidden="true"><i [style.width.%]="progresso"></i></div>
      </div>
    </div>
  `,
  styles: [`
    .gr { position: fixed; inset: 0; z-index: 1300; display: grid; place-items: center; padding: 24px; color: #FFFFFF; font-family: var(--ed-fonte);
          background: radial-gradient(120% 90% at 50% 0%, #3A49E0 0%, #2836C6 40%, #141B5E 100%); animation: gr-entrar 300ms ease both; }
    @keyframes gr-entrar { from { opacity: 0; } }
    .gr.saindo { opacity: 0; transform: scale(1.03); transition: opacity 420ms ease, transform 420ms ease; }
    .gr-centro { width: min(360px, 100%); display: grid; justify-items: center; gap: 26px; }
    .gr-grade { display: grid; grid-template-columns: repeat(14, 1fr); grid-auto-rows: 1fr; gap: 5px; width: 100%; }
    .gr-grade i { aspect-ratio: 1; border-radius: 4px; background: rgba(255, 255, 255, .1); animation: gr-celula 520ms cubic-bezier(.2, 1.3, .4, 1) both; animation-delay: var(--d); }
    .gr-grade i:not(.vazia) { background: var(--c); }
    @keyframes gr-celula { from { opacity: 0; transform: scale(.2); } }
    .gr-texto { min-height: 26px; display: grid; place-items: center; text-align: center; }
    .gr-texto p { font-size: 16.5px; font-weight: 700; letter-spacing: -.01em; animation: gr-frase 900ms ease both; }
    @keyframes gr-frase { 0% { opacity: 0; transform: translateY(6px); } 18%, 82% { opacity: 1; transform: none; } 100% { opacity: 0; transform: translateY(-4px); } }
    .gr-texto .gr-pronto { display: inline-flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 800; animation: gr-pronto 420ms cubic-bezier(.2, 1.4, .4, 1) both; }
    .gr-pronto span { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: #FFFFFF; color: #2836C6; }
    @keyframes gr-pronto { from { opacity: 0; transform: scale(.85); } }
    .gr-barra { width: 100%; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, .16); overflow: hidden; }
    .gr-barra i { display: block; height: 100%; border-radius: inherit; background: #FFFFFF; transition: width 600ms var(--ed-curva); }
    @media (prefers-reduced-motion: reduce) {
      .gr-grade i, .gr-texto p { animation: none; }
    }
  `]
})
export class GeracaoComponent implements OnInit, OnChanges, OnDestroy {
  /** A resposta do servidor já chegou. */
  @Input() pronto = false;
  @Input() modo: 'criar' | 'editar' = 'criar';
  @Output() fim = new EventEmitter<void>();

  readonly frasesCriar = ['Lendo o que mais cai no ENEM', 'Ordenando os pré-requisitos', 'Encaixando na sua semana', 'Agendando as revisões', 'Ajustando os últimos detalhes'];
  readonly frasesEditar = ['Recalculando com o novo tempo', 'Reencaixando os assuntos', 'Ajustando as revisões'];
  celulas: { atraso: number; cor: string | null }[] = [];
  etapa = 0;
  progresso = 6;
  concluido = false;
  saindo = false;
  private minimoPassou = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  get frases(): string[] { return this.modo === 'editar' ? this.frasesEditar : this.frasesCriar; }

  ngOnInit() {
    const reduzido = matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duracao = this.modo === 'editar' ? 2600 : 4600;
    // 14 colunas x 7 linhas: a grade se preenche coluna a coluna, como as semanas do ano.
    for (let col = 0; col < 14; col++) {
      for (let lin = 0; lin < 7; lin++) {
        const cheia = (col * 7 + lin * 3) % 5 !== 0 && !(lin === 6 && col % 3 !== 0);
        this.celulas[lin * 14 + col] = { atraso: reduzido ? 0 : col * (duracao / 22) + lin * 26, cor: cheia ? CORES[(col + lin) % 4] : null };
      }
    }
    const passo = duracao / this.frases.length;
    this.frases.forEach((_, i) => this.timers.push(setTimeout(() => {
      this.etapa = i;
      this.progresso = Math.round(((i + 1) / (this.frases.length + 1)) * 100);
    }, i * passo)));
    this.timers.push(setTimeout(() => { this.minimoPassou = true; this.talvezTerminar(); }, duracao));
  }

  ngOnChanges() { this.talvezTerminar(); }

  ngOnDestroy() { this.timers.forEach(clearTimeout); }

  private talvezTerminar() {
    if (!this.minimoPassou || !this.pronto || this.concluido) return;
    this.concluido = true;
    this.progresso = 100;
    this.timers.push(setTimeout(() => (this.saindo = true), 900));
    this.timers.push(setTimeout(() => this.fim.emit(), 1320));
  }
}
