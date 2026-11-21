import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { IconeComponent } from '../../shared/icone/icone.component';
import { AREAS } from '../../shared/dia';
import { SIM } from './dados';
import { graficoDeLinhas } from './grafico-mock';

/** Cópia estática da tela de Simulados (mesmo HTML e CSS), com dados de exemplo. */
@Component({
  selector: 'ld-mock-simulados',
  standalone: true,
  imports: [IconeComponent],
  templateUrl: './mock-simulados.component.html',
  styleUrls: ['./mock-simulados.css']
})
export class MockSimuladosComponent implements AfterViewInit, OnDestroy {
  @Input() visao: 'dias' | 'areas' = 'dias';
  @Input() fab = true;
  @ViewChild('grafico') canvas?: ElementRef<HTMLCanvasElement>;

  readonly s = SIM;
  readonly meses = [
    { rotulo: 'outubro de 2026', itens: [SIM.lista[5], SIM.lista[4]] },
    { rotulo: 'setembro de 2026', itens: [SIM.lista[3], SIM.lista[2]] }
  ];
  private chart?: Chart;

  get legenda() {
    return this.visao === 'dias'
      ? [{ nome: '1º dia', cor: '#2836C6', valor: 69 }, { nome: '2º dia', cor: '#D08C21', valor: 53 }]
      : [{ nome: 'Linguagens', cor: '#C7455A', valor: 33 }, { nome: 'Humanas', cor: '#12A5E1', valor: 36 }, { nome: 'Naturezas', cor: '#36B37D', valor: 27 }, { nome: 'Matemática', cor: '#D08C21', valor: 26 }];
  }

  partes(it: (typeof SIM.lista)[number]) {
    const chaves = it.dia === 1 ? ['linguagens', 'humanas'] : ['naturezas', 'exatas'];
    const valor: Record<string, number | undefined> = { linguagens: it.lc, humanas: it.ch, naturezas: it.cn, exatas: it.mt };
    return chaves.map(c => { const a = AREAS.find(x => x.chave === c)!; return { sigla: a.sigla, cor: a.cor, corTexto: a.corTexto, icone: a.icone, valor: valor[c] }; });
  }

  dataDe(it: (typeof SIM.lista)[number]) { const [d, m] = it.data.split(' '); return { dia: d, mes: m }; }

  ngAfterViewInit() { this.desenhar(); }

  trocar(v: 'dias' | 'areas') { this.visao = v; this.desenhar(); }

  private desenhar() {
    if (!this.canvas) return;
    this.chart?.destroy();
    const l = SIM.lista, por = (dia: 1 | 2, f: (x: (typeof l)[number]) => number | undefined) => l.map(x => (x.dia === dia ? f(x) ?? null : null));
    this.chart = graficoDeLinhas(this.canvas.nativeElement, this.visao === 'dias'
      ? { rotulos: l.map(x => '#' + x.n), min: 35, max: 90, passo: 10, series: [{ nome: '1º dia', cor: '#2836C6', dados: por(1, x => x.total) }, { nome: '2º dia', cor: '#D08C21', dados: por(2, x => x.total) }] }
      : { rotulos: l.map(x => '#' + x.n), min: 15, max: 45, passo: 5, series: [
          { nome: 'Linguagens', cor: '#C7455A', dados: por(1, x => x.lc) }, { nome: 'Humanas', cor: '#12A5E1', dados: por(1, x => x.ch) },
          { nome: 'Naturezas', cor: '#36B37D', dados: por(2, x => x.cn) }, { nome: 'Matemática', cor: '#D08C21', dados: por(2, x => x.mt) }] });
  }

  ngOnDestroy() { this.chart?.destroy(); }
}
