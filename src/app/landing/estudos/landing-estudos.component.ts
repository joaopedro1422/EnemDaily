import { Component, ViewChild, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthServiceService } from '../../services/auth-service.service';
import { IconeComponent } from '../../shared/icone/icone.component';
import { SimboloDiaComponent } from '../../shared/simbolo-dia/simbolo-dia.component';
import { CelularComponent } from '../celular/celular.component';
import { MockSimuladosComponent } from '../mocks/mock-simulados.component';
import { MockRedacoesComponent } from '../mocks/mock-redacoes.component';

interface Recurso { icone: string; titulo: string; texto: string; alvo: string; }

/** Landing da gestão de estudos (simulados e redações), com as telas reais em celulares. */
@Component({
  selector: 'app-landing-estudos',
  standalone: true,
  imports: [RouterLink, IconeComponent, SimboloDiaComponent, CelularComponent, MockSimuladosComponent, MockRedacoesComponent],
  templateUrl: './landing-estudos.component.html',
  styleUrls: ['../landing.component.css', './landing-estudos.component.css']
})
export class LandingEstudosComponent {
  private auth = inject(AuthServiceService);
  private router = inject(Router);
  @ViewChild('celSim') celSim?: CelularComponent;
  @ViewChild('celRed') celRed?: CelularComponent;

  readonly ano = new Date().getFullYear();
  logado = false;
  simAtivo = 0;
  redAtivo = 0;

  readonly recursosSim: Recurso[] = [
    { icone: 'target', titulo: 'Projeção para os 180 itens', texto: 'Somando suas médias do 1º e do 2º dia, você vê quantas questões está acertando na prova inteira e uma nota estimada pela TRI, já com a redação.', alvo: '.kpis' },
    { icone: 'activity', titulo: 'Cada área, lado a lado', texto: 'Média, melhor resultado e variação em Linguagens, Humanas, Naturezas e Matemática. Fica claro onde você está forte e onde está perdendo pontos.', alvo: '.areas-card' },
    { icone: 'chart-column', titulo: 'Evolução em um gráfico', texto: 'Simulado a simulado, por dia de prova ou por área. Dá para ver se aquele mês de revisão fez diferença.', alvo: '.grafico-card' },
    { icone: 'sparkles', titulo: 'Análise do que fazer agora', texto: 'Tendências, sequências de melhora e a área que mais rende estudar, escritas em português claro.', alvo: '.insights-card' },
    { icone: 'pen-line', titulo: 'Histórico com anotações', texto: 'Cada simulado guarda os acertos por área e as suas observações: o que errou e o que revisar.', alvo: '.hist-card' }
  ];

  readonly recursosRed: Recurso[] = [
    { icone: 'target', titulo: 'Nota média e projeção', texto: 'Sua média, a melhor nota e quanto a última subiu, com a faixa em que você deve tirar no ENEM.', alvo: '.kpis' },
    { icone: 'pen-line', titulo: 'As 5 competências, uma a uma', texto: 'Média e nível de C1 a C5, com a competência que mais vale a pena treinar marcada como foco.', alvo: '.comp-card' },
    { icone: 'chart-column', titulo: 'Evolução da nota', texto: 'A nota de cada redação ou de cada competência ao longo do tempo.', alvo: '.grafico-card' },
    { icone: 'sparkles', titulo: 'Análise e histórico', texto: 'O que está subindo, onde você trava e todas as redações com tema e notas por competência.', alvo: '.insights-card' }
  ];

  constructor() {
    this.auth.usuario$.subscribe(u => (this.logado = !!u && !u.demo));
  }

  mostrarSim(i: number) { this.simAtivo = i; this.celSim?.irPara(this.recursosSim[i].alvo); }
  mostrarRed(i: number) { this.redAtivo = i; this.celRed?.irPara(this.recursosRed[i].alvo); }

  comecar() {
    if (this.logado) this.router.navigate(['/simulados']);
    else this.auth.open();
  }
}
