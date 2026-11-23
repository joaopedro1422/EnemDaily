import { Component, Input } from '@angular/core';
import { Questao } from '../../models/questao';

@Component({
  selector: 'ed-texto-base',
  standalone: true,
  template: `
    @if (questao.linkImg) { <img class="tb-img" [src]="questao.linkImg" alt="Imagem de apoio da questão" /> }
    @if (questao.texto) { <div class="tb-texto" [innerHTML]="questao.texto"></div> }
    @if (questao.tabela; as t) {
      <figure class="tb-tabela">
        @if (t.titulo) { <figcaption [innerHTML]="t.titulo"></figcaption> }
        <div class="tb-rolagem">
          <table>
            <thead><tr>@for (c of t.colunas; track $index) { <th scope="col" [innerHTML]="c"></th> }</tr></thead>
            <tbody>
              @for (linha of t.linhas; track $index) {
                <tr>@for (c of linha; track $index; let j = $index) {
                  @if (j === 0) { <th scope="row" [innerHTML]="c"></th> } @else { <td [innerHTML]="c"></td> }
                }</tr>
              }
            </tbody>
          </table>
        </div>
        @if (notaVisivel(t.nota)) { <p class="tb-nota" [innerHTML]="t.nota"></p> }
      </figure>
    }
    @if (questao.fonte) { <p class="tb-fonte" [innerHTML]="questao.fonte"></p> }
  `,
  styles: [`
    :host { display: block; min-width: 0; max-width: 100%; margin-bottom: 14px; }
    .tb-img { display: block; max-width: 100%; margin: 0 auto 16px; border-radius: 4px; border: 1px solid var(--ed-pauta); }
    .tb-texto { font-family: var(--ed-fonte-leitura); font-size: 16.5px; line-height: 1.7; color: var(--ed-tinta); white-space: pre-line; text-align: justify; hyphens: auto; }
    .tb-tabela { margin: 16px 0 0; }
    .tb-tabela figcaption { margin-bottom: 8px; text-align: center; font-family: var(--ed-fonte-leitura); font-size: 14.5px; font-weight: 700; color: var(--ed-tinta); }
    .tb-rolagem { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: max-content; border-collapse: collapse; font-family: var(--ed-fonte-leitura); font-size: 14.5px; line-height: 1.4; color: var(--ed-tinta); font-variant-numeric: tabular-nums; }
    th, td { padding: 7px 10px; border: 1px solid var(--ed-tinta-2); text-align: center; vertical-align: middle; }
    thead th { font-weight: 700; background: var(--ed-fundo-2); }
    tbody th { font-weight: 400; text-align: left; }
    .tb-nota { margin-top: 6px; font-size: 12.5px; color: var(--ed-tinta-3); font-style: italic; }
    .tb-fonte { margin-top: 10px; text-align: right; font-family: var(--ed-fonte-leitura); font-size: 12.5px; line-height: 1.45; color: var(--ed-tinta-2); }
    @media (min-width: 760px) { .tb-texto { font-size: 17px; } }
  `]
})
export class TextoBaseComponent {
  @Input({ required: true }) questao!: Questao;

  notaVisivel(nota?: string | null): boolean {
    return !!nota && !/dados\s+(hipot[eé]tic|fict[ií]ci)/i.test(nota);
  }
}
