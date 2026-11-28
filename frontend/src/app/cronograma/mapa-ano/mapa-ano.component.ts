import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { DiaMapa, Fase, NOMES_FASE, dataLocal } from '../../models/cronograma';
import { IconeComponent } from '../../shared/icone/icone.component';

interface Celula { data: string; classe: string; titulo: string; }
interface Semana { dias: (Celula | null)[]; fase: Fase; mes: string | null; atual: boolean; inicioFase: string | null; }

/**
 * O caminho até o ENEM: uma coluna por semana, uma linha por dia (seg a dom). O passado mostra o que foi
 * cumprido, hoje pulsa e o futuro mostra a carga prevista. Rola de lado e abre já posicionado em hoje.
 */
@Component({
  selector: 'app-mapa-ano',
  standalone: true,
  imports: [IconeComponent],
  template: `
    <div class="ma-rolagem" #rolagem>
      <div class="ma-grade" [style.--semanas]="semanas.length + 1">
        <div class="ma-coluna ma-rotulos" aria-hidden="true">
          <span class="ma-mes"></span><span class="ma-faixa-vazia"></span>
          @for (d of ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; track $index) { <span class="ma-dia-rot">{{ $index % 2 === 0 ? d : '' }}</span> }
        </div>
        @for (s of semanas; track $index) {
          <div class="ma-coluna" [class.atual]="s.atual" [attr.data-atual]="s.atual ? 1 : null">
            <span class="ma-mes">{{ s.mes ?? '' }}</span>
            <span class="ma-faixa" [class]="'ma-faixa ' + s.fase">@if (s.inicioFase) { <em>{{ s.inicioFase }}</em> }</span>
            @for (c of s.dias; track $index) {
              @if (c) { <i [class]="c.classe" [attr.title]="c.titulo"></i> } @else { <i class="ma-fora"></i> }
            }
          </div>
        }
        <div class="ma-coluna ma-final" aria-hidden="true">
          <span class="ma-mes">ENEM</span><span class="ma-faixa-vazia"></span>
          <span class="ma-bandeira"><ed-icone nome="flag" [tamanho]="16" [traco]="2.4" /></span>
        </div>
      </div>
    </div>
    <div class="ma-legenda" aria-hidden="true">
      <span><i class="ma-cel feito"></i>Feito</span>
      <span><i class="ma-cel parcial"></i>Em parte</span>
      <span><i class="ma-cel previsto-2"></i>Previsto</span>
      <span><i class="ma-cel livre"></i>Livre</span>
    </div>
  `,
  styleUrl: './mapa-ano.component.css'
})
export class MapaAnoComponent implements OnChanges, AfterViewInit {
  @Input({ required: true }) mapa: DiaMapa[] = [];
  @Input({ required: true }) hoje!: string;
  @ViewChild('rolagem') rolagem?: ElementRef<HTMLElement>;

  semanas: Semana[] = [];

  ngOnChanges() {
    this.semanas = this.montar();
  }

  ngAfterViewInit() {
    // Abre com a semana atual a um terço da largura, mostrando um pouco do passado e mais do futuro.
    setTimeout(() => {
      const el = this.rolagem?.nativeElement;
      const atual = el?.querySelector<HTMLElement>('[data-atual]');
      if (el && atual) el.scrollLeft = Math.max(0, atual.offsetLeft - el.clientWidth / 3);
    });
  }

  private montar(): Semana[] {
    const semanas: Semana[] = [];
    let faseAnterior: Fase | null = null;
    let mesAnterior = -1;
    for (let i = 0; i < this.mapa.length; i += 7) {
      const dias = this.mapa.slice(i, i + 7);
      const primeiro = dataLocal(dias[0].data);
      const fase = dias[0].fase;
      const mes = primeiro.getMonth() !== mesAnterior || i === 0
        ? primeiro.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        : null;
      mesAnterior = primeiro.getMonth();
      semanas.push({
        dias: Array.from({ length: 7 }, (_, j) => (dias[j] ? this.celula(dias[j]) : null)),
        fase,
        mes,
        atual: dias.some(d => d.data === this.hoje),
        inicioFase: fase !== faseAnterior ? NOMES_FASE[fase] : null
      });
      faseAnterior = fase;
    }
    return semanas;
  }

  private celula(d: DiaMapa): Celula {
    const data = dataLocal(d.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
    let classe: string;
    let titulo: string;
    if (d.data === this.hoje) {
      classe = 'ma-cel hoje';
      titulo = `Hoje · ${d.feitas} de ${d.planejadas ?? d.feitas}`;
    } else if (d.data < this.hoje) {
      const plan = d.planejadas ?? 0;
      if (d.feitas > 0 && d.feitas >= plan) { classe = 'ma-cel feito'; titulo = `${data} · ${d.feitas} feito${d.feitas > 1 ? 's' : ''}`; }
      else if (d.feitas > 0) { classe = 'ma-cel parcial'; titulo = `${data} · ${d.feitas} de ${plan}`; }
      else if (plan > 0) { classe = 'ma-cel pendente'; titulo = `${data} · não marcado`; }
      else { classe = 'ma-cel livre'; titulo = `${data} · livre`; }
    } else {
      const n = d.planejadas ?? 0;
      classe = n === 0 ? 'ma-cel livre' : `ma-cel previsto-${Math.min(3, n)}`;
      titulo = n === 0 ? `${data} · livre` : `${data} · ${n} previsto${n > 1 ? 's' : ''}`;
    }
    return { data: d.data, classe, titulo };
  }
}
