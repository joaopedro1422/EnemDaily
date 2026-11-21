import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { IconeComponent } from '../../shared/icone/icone.component';
import { COMPETENCIAS } from '../../home-redacoes/competencias';
import { RED } from './dados';
import { graficoDeLinhas } from './grafico-mock';

/** Cópia estática da tela de Redações (mesmo HTML e CSS), com dados de exemplo. */
@Component({
  selector: 'ld-mock-redacoes',
  standalone: true,
  imports: [IconeComponent],
  templateUrl: './mock-redacoes.component.html',
  styleUrls: ['./mock-redacoes.css']
})
export class MockRedacoesComponent implements AfterViewInit, OnDestroy {
  @Input() visao: 'nota' | 'comp' = 'nota';
  /** Abre a folha de detalhe de uma competência (índice 0 a 4), como quando a pessoa toca nela. */
  @Input() detalhe: number | null = null;
  @Input() fab = true;
  @ViewChild('grafico') canvas?: ElementRef<HTMLCanvasElement>;

  readonly r = RED;
  readonly competencias = COMPETENCIAS;
  readonly meses = [
    { rotulo: 'novembro de 2026', itens: [RED.lista[4]] },
    { rotulo: 'outubro de 2026', itens: [RED.lista[3]] },
    { rotulo: 'setembro de 2026', itens: [RED.lista[2], RED.lista[1]] }
  ];
  private chart?: Chart;

  get foco() { return RED.comps[4]; }
  get aberto() { return this.detalhe === null ? null : RED.comps[this.detalhe]; }
  get legenda() { return this.visao === 'nota' ? [] : RED.comps.map(c => ({ nome: c.info.sigla, cor: c.info.cor, valor: c.media })); }

  dataDe(it: (typeof RED.lista)[number]) { const [d, m] = it.data.split(' '); return { dia: d, mes: m }; }

  ngAfterViewInit() { this.desenhar(); }

  trocar(v: 'nota' | 'comp') { this.visao = v; this.desenhar(); }

  private desenhar() {
    if (!this.canvas) return;
    this.chart?.destroy();
    const l = RED.lista, rot = l.map(x => '#' + x.n);
    this.chart = graficoDeLinhas(this.canvas.nativeElement, this.visao === 'nota'
      ? { rotulos: rot, min: 600, max: 1000, passo: 100, valores: true, series: [{ nome: 'Nota', cor: '#2836C6', dados: l.map(x => x.nota), area: true }] }
      : { rotulos: rot, min: 0, max: 200, passo: 40, series: COMPETENCIAS.map((c, i) => ({ nome: c.sigla, cor: c.cor, dados: l.map(x => x.c[i]) })) });
  }

  ngOnDestroy() { this.chart?.destroy(); }
}
