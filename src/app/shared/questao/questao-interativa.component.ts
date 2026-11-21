import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { SomService } from '../som/som.service';
import { Questao } from '../../models/questao';
import { TextoBaseComponent } from './texto-base.component';
import { ResolucaoComponent } from './resolucao.component';

@Component({
  selector: 'ed-questao-interativa',
  standalone: true,
  imports: [TextoBaseComponent, ResolucaoComponent],
  template: `
    <article class="folha qi" [style.--a]="cor" [style.--at]="corTexto" aria-label="Questão">
      <div class="folha-cab">
        <div class="folha-q"><span>Questão</span><b>01</b></div>
        <div class="folha-meta">
          <span class="folha-caderno">{{ caderno }}</span>
          <span class="folha-assunto">{{ questao.assunto }}</span>
        </div>
        @if (respondida) { <span class="carimbo" [class.ok]="acertou">{{ acertou ? 'Certa' : 'Errada' }}</span> }
      </div>
      <div class="folha-corpo">
        <ed-texto-base [questao]="questao" />
        <p class="folha-enunciado" [innerHTML]="questao.enunciado"></p>
        <ol class="alts" aria-label="Alternativas">
          @for (alt of questao.alternativas; track $index; let i = $index) {
            <li>
              <button type="button" class="alt {{ estado(i) }}" [disabled]="respondida" [attr.aria-pressed]="selecionada === i" (click)="marcar(i)">
                <span class="bolha">
                  <svg class="tinta" viewBox="0 0 34 34" aria-hidden="true"><path class="rabisco" d="M9 9 22 6 6 14 27 9 5 19 29 14 6 24 29 20 9 28 27 25 14 30"/><circle class="cheia" cx="17" cy="17" r="16"/></svg>
                  <span class="letra">{{ letras[i] }}</span>
                  <svg class="marca-ok" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4C11 3.5 3.6 12.5 4.2 24.6 4.8 36 13 44 24.8 43.6 36.4 43.2 44.4 35 43.8 23.2 43.2 12 35.6 4.6 23 5.2 18 5.5 13 7.4 10 10"/></svg>
                  <svg class="marca-erro" viewBox="0 0 48 48" aria-hidden="true"><path d="M10 10 38 38M38 10 10 38"/></svg>
                </span>
                <span class="alt-texto" [innerHTML]="alt.texto"></span>
              </button>
            </li>
          }
        </ol>
      </div>
      @if (!respondida) {
        <div class="qi-acao">
          <button class="qi-btn" type="button" [disabled]="selecionada === null" (click)="confirmar()">
            {{ selecionada === null ? 'Escolha uma alternativa' : 'Confirmar resposta' }}
          </button>
        </div>
      }
    </article>
    @if (respondida) {
      <ed-resolucao class="qi-resolucao" [questao]="questao" [selecionada]="selecionada" />
    }
  `,
  styleUrls: ['../../desafio/desafio.component.css'],
  styles: [`
    :host { display: grid; gap: 14px; }
    .qi { animation: none; }
    .qi-acao { padding: 6px 18px 18px; }
    .qi-btn { width: 100%; height: 50px; border: 0; border-radius: 14px; background: var(--ed-caneta); color: var(--ed-sobre-caneta); font: 800 15.5px var(--ed-fonte); cursor: pointer; }
    .qi-btn:disabled { background: var(--ed-pauta-forte); color: var(--ed-tinta-3); cursor: default; }
    @media (min-width: 760px) { .qi-acao { padding: 6px 32px 22px; } }
  `]
})
export class QuestaoInterativaComponent {
  @Input({ required: true }) questao!: Questao;
  @Input() caderno = 'Questão de treino';
  @Input() cor = 'var(--ed-caneta)';
  @Input() corTexto = 'var(--ed-caneta-texto)';
  @Output() respondeu = new EventEmitter<boolean>();

  private som = inject(SomService);
  readonly letras = ['A', 'B', 'C', 'D', 'E'];
  selecionada: number | null = null;
  respondida = false;

  get acertou(): boolean { return this.selecionada !== null && !!this.questao.alternativas[this.selecionada]?.correta; }

  marcar(i: number) {
    if (this.respondida) return;
    if (this.selecionada !== i) this.som.caneta();
    this.selecionada = i;
  }

  confirmar() {
    if (this.selecionada === null) return;
    this.respondida = true;
    this.respondeu.emit(this.acertou);
  }

  estado(i: number): string {
    if (!this.respondida) return i === this.selecionada ? 'marcada' : '';
    const alt = this.questao.alternativas[i];
    if (alt.correta) return i === this.selecionada ? 'certa marcada' : 'certa';
    if (i === this.selecionada) return 'errada marcada';
    return 'apagada';
  }
}
