import { Component, Input, OnChanges, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ConteudoService } from '../../services/conteudo.service';
import { ResumoConteudo } from '../../models/conteudo';
import { Questao } from '../../models/questao';
import { IconeComponent } from '../icone/icone.component';

@Component({
  selector: 'ed-resolucao',
  standalone: true,
  imports: [IconeComponent, RouterLink, AsyncPipe],
  template: `
    <section class="rs" aria-label="Resolução comentada">
      <header class="rs-cab">
        <span class="rs-rot">Resolução comentada</span>
        <span class="rs-gab">Gabarito <b>{{ letraCerta }}</b></span>
      </header>

      @if (questao.resolucao) {
        @if (temAnalises) {
          <div class="rs-foco">
            @for (i of destaques; track i) {
              @if (questao.alternativas[i]; as alt) {
                <div class="rs-alt" [class.certa]="alt.correta" [class.sua]="i === selecionada">
                  <span class="rs-letra" aria-hidden="true">{{ letras[i] }}</span>
                  <div class="rs-alt-corpo">
                    <div class="rs-alt-topo">
                      <span class="rs-veredito">{{ i === selecionada ? (alt.correta ? 'Você acertou' : 'Sua resposta está errada') : 'A resposta certa' }}</span>
                    </div>
                    <p class="rs-alt-texto" [innerHTML]="alt.texto"></p>
                    @if (alt.analise) { <div class="rs-html rs-analise" [innerHTML]="alt.analise"></div> }
                  </div>
                </div>
              }
            }
          </div>
        }

        <details class="rs-exp">
          <summary><ed-icone nome="pen-line" [tamanho]="15" />Como resolver<ed-icone class="rs-seta" nome="chevron-down" [tamanho]="18" /></summary>
          <div class="rs-html rs-exp-corpo" [innerHTML]="questao.resolucao"></div>
        </details>

        @if (temAnalises) {
          <details class="rs-exp">
            <summary><ed-icone nome="clipboard-list" [tamanho]="15" />Todas as alternativas<ed-icone class="rs-seta" nome="chevron-down" [tamanho]="18" /></summary>
            <ol class="rs-alts rs-exp-corpo">
              @for (alt of questao.alternativas; track $index; let i = $index) {
                <li class="rs-alt" [class.certa]="alt.correta" [class.sua]="i === selecionada">
                  <span class="rs-letra" aria-hidden="true">{{ letras[i] }}</span>
                  <div class="rs-alt-corpo">
                    <div class="rs-alt-topo">
                      <span class="rs-veredito">{{ alt.correta ? 'Certa' : 'Errada' }}</span>
                      @if (i === selecionada) { <span class="rs-sua">Sua resposta</span> }
                    </div>
                    <p class="rs-alt-texto" [innerHTML]="alt.texto"></p>
                    @if (alt.analise) { <div class="rs-html rs-analise" [innerHTML]="alt.analise"></div> }
                  </div>
                </li>
              }
            </ol>
          </details>
        }

        @if (questao.explicacao) {
          <details class="rs-exp">
            <summary><ed-icone nome="book-open" [tamanho]="15" />Entenda o assunto<ed-icone class="rs-seta" nome="chevron-down" [tamanho]="18" /></summary>
            <div class="rs-exp-corpo">
              @if (habilidade; as h) {
                <p class="rs-hab"><b>{{ h.codigo }}</b><span>{{ h.texto }}</span></p>
              }
              <div class="rs-html" [innerHTML]="questao.explicacao"></div>
            </div>
          </details>
        }
      } @else {
        <div class="rs-html rs-unico" [innerHTML]="questao.explicacao"></div>
      }

      @if (conteudo$ | async; as c) {
        <a class="rs-link" [routerLink]="['/conteudos', c.area, c.slug]">Estudar {{ c.assunto }}<ed-icone nome="arrow-right" [tamanho]="15" /></a>
      } @else if (questao.linkEstudo) {
        <a class="rs-link" [href]="questao.linkEstudo" target="_blank" rel="noopener">Revisar o conteúdo<ed-icone nome="arrow-right" [tamanho]="15" /></a>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .rs { display: grid; gap: 4px; padding: 18px; background: var(--ed-folha); border: 1px solid var(--ed-pauta); border-radius: var(--ed-r-cartao); }
    .rs-cab { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid var(--ed-pauta); }
    .rs-rot { font-size: 11.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--ed-tinta-3); }
    .rs-gab { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--ed-tinta-2); }
    .rs-gab b { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--ed-ok); color: var(--ed-ok); font-weight: 800; }

    .rs-bloco { padding: 16px 0 4px; }
    .rs-bloco + .rs-bloco { border-top: 1px dashed var(--ed-pauta-forte); }
    .rs-tit { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 15px; font-weight: 800; letter-spacing: -.01em; color: var(--ed-tinta); }
    .rs-tit ed-icone { width: 28px; height: 28px; border-radius: 8px; display: inline-grid; place-items: center; background: var(--ed-caneta-suave); color: var(--ed-caneta-texto); }

    .rs-html { font-family: var(--ed-fonte-leitura); font-size: 15.5px; line-height: 1.7; color: var(--ed-tinta); overflow-wrap: anywhere; }
    .rs-html :is(p, ul, ol) { margin: 0 0 10px; }
    .rs-html :is(ul, ol) { padding-left: 20px; }
    .rs-html li { margin-bottom: 4px; }
    .rs-html > :last-child { margin-bottom: 0; }
    .rs-unico { margin: 12px 0 6px; }

    .rs-alts { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .rs-alt { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 12px; padding: 12px; border-radius: 12px; background: var(--ed-fundo-2); border: 1.5px solid transparent; }
    .rs-alt.certa { background: var(--ed-ok-suave); border-color: color-mix(in srgb, var(--ed-ok) 40%, transparent); }
    .rs-alt.sua:not(.certa) { background: var(--ed-erro-suave); border-color: color-mix(in srgb, var(--ed-erro) 35%, transparent); }
    .rs-letra { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--ed-tinta-3); color: var(--ed-tinta-2); font-size: 14px; font-weight: 800; background: var(--ed-folha); }
    .rs-alt.certa .rs-letra { border-color: var(--ed-ok); background: var(--ed-ok); color: #FFFFFF; }
    .rs-alt.sua:not(.certa) .rs-letra { border-color: var(--ed-erro); color: var(--ed-erro); }
    .rs-alt-corpo { display: grid; gap: 4px; min-width: 0; }
    .rs-alt-topo { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 30px; }
    .rs-veredito { font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ed-tinta-3); }
    .rs-alt.certa .rs-veredito { color: var(--ed-ok); }
    .rs-alt.sua:not(.certa) .rs-veredito { color: var(--ed-erro); }
    .rs-sua { padding: 2px 8px; border-radius: 999px; background: var(--ed-folha); border: 1px solid var(--ed-pauta-forte); font-size: 11.5px; font-weight: 700; color: var(--ed-tinta-2); }
    .rs-alt-texto { margin: 0; font-family: var(--ed-fonte-leitura); font-size: 14px; line-height: 1.5; color: var(--ed-tinta-2); font-style: italic; }
    .rs-analise { font-size: 15px; line-height: 1.65; }

    .rs-foco { display: grid; gap: 8px; padding: 14px 0 6px; }
    .rs-exp { border-top: 1px solid var(--ed-pauta); }
    .rs-exp:first-of-type { margin-top: 8px; }
    .rs-exp summary { list-style: none; display: flex; align-items: center; gap: 8px; padding: 14px 2px; cursor: pointer; font-size: 15px; font-weight: 800; letter-spacing: -.01em; color: var(--ed-tinta); }
    .rs-exp summary::-webkit-details-marker { display: none; }
    .rs-exp summary > ed-icone:first-child { width: 28px; height: 28px; border-radius: 8px; display: inline-grid; place-items: center; background: var(--ed-caneta-suave); color: var(--ed-caneta-texto); }
    .rs-seta { margin-left: auto; color: var(--ed-tinta-3); transition: transform var(--ed-t-rapido); }
    .rs-exp[open] .rs-seta { transform: rotate(180deg); }
    .rs-exp-corpo { padding: 0 0 14px; }
    .rs-hab { display: flex; gap: 8px; align-items: baseline; margin: 0 0 10px; padding: 8px 10px; border-radius: 10px; background: var(--ed-fundo-2); font-size: 13px; line-height: 1.45; color: var(--ed-tinta-2); }
    .rs-hab b { flex: none; padding: 1px 7px; border-radius: 6px; background: var(--ed-caneta); color: var(--ed-sobre-caneta); font-size: 12px; font-weight: 800; letter-spacing: .04em; }

    .rs-link { justify-self: start; display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; color: var(--ed-caneta-texto); font: 700 14.5px var(--ed-fonte); text-decoration: none; }
    .rs-link:hover { text-decoration: underline; text-underline-offset: 3px; }
  `]
})
export class ResolucaoComponent implements OnChanges {
  private conteudos = inject(ConteudoService);
  conteudo$: Observable<ResumoConteudo | null> = of(null);

  ngOnChanges() {
    this.conteudo$ = this.questao?.area && this.questao.assunto ? this.conteudos.doAssunto(this.questao.area, this.questao.assunto) : of(null);
  }

  @Input({ required: true }) questao!: Questao;
  @Input() selecionada: number | null = null;

  readonly letras = ['A', 'B', 'C', 'D', 'E'];

  get letraCerta(): string {
    const i = this.questao.alternativas.findIndex(a => a.correta);
    return i >= 0 ? this.letras[i] : '—';
  }

  get destaques(): number[] {
    const certa = this.questao.alternativas.findIndex(a => a.correta);
    const marcada = this.selecionada;
    if (marcada === null || marcada < 0 || marcada === certa) return [marcada ?? certa].filter(i => i >= 0);
    return [marcada, certa].filter(i => i >= 0);
  }

  get temAnalises(): boolean {
    return this.questao.alternativas.some(a => !!a.analise);
  }

  get habilidade(): { codigo: string; texto: string } | null {
    const h = this.questao.habilidade?.trim();
    if (!h) return null;
    const m = h.match(/^(H\d{1,2})\s*[-–:.]\s*(.+)$/i);
    return m ? { codigo: m[1].toUpperCase(), texto: m[2] } : null;
  }
}
