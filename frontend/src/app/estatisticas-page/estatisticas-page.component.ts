import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthServiceService } from '../services/auth-service.service';
import { Area, Usuario } from '../models/usuario';
import { AssuntoResumo } from '../models/questao';
import { APIURL } from '../models/Environment';
import { ResumoSemanalComponent } from '../resumo-semanal/resumo-semanal.component';
import { IconeComponent } from '../shared/icone/icone.component';
import { AREAS, ChaveArea, InfoArea, formatarNumero } from '../shared/dia';

type Nivel = 'dominado' | 'progresso' | 'revisar';

interface ResumoArea {
  info: InfoArea;
  area: Area;
  pct: number;
}

interface LinhaAssunto {
  nome: string;
  acertos: number;
  total: number;
  pct: number;
  nivel: Nivel;
}

const RAIO = 52;

@Component({
  selector: 'app-estatisticas-page',
  imports: [IconeComponent, CarregandoComponent, ResumoSemanalComponent],
  templateUrl: './estatisticas-page.component.html',
  styleUrl: './estatisticas-page.component.css'
})
export class EstatisticasPageComponent implements OnInit, OnDestroy {
  usuario: Usuario | null = null;
  resumos: ResumoArea[] = [];
  ativa: ChaveArea = 'linguagens';
  assuntos: AssuntoResumo[] = [];
  carregandoAssuntos = true;
  filtro: 'todos' | Nivel = 'todos';
  mostrarResumo = false;
  readonly circunferencia = 2 * Math.PI * RAIO;
  readonly raio = RAIO;
  readonly formatarNumero = formatarNumero;
  readonly rotulos: Record<Nivel, string> = { dominado: 'Dominado', progresso: 'Em progresso', revisar: 'Revisar' };
  private sub?: Subscription;

  constructor(private authService: AuthServiceService, private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const param = this.route.snapshot.queryParamMap.get('area');
    if (param) {
      if (!AREAS.some(a => a.chave === param)) {
        this.router.navigate(['/Home']);
        return;
      }
      this.ativa = param as ChaveArea;
    }

    this.sub = this.authService.usuario$.subscribe(u => {
      this.usuario = u;
      if (!u) return;
      this.resumos = AREAS.map(info => {
        const area = u[info.chave];
        return { info, area, pct: area.questoesRespondidas ? Math.round((area.acertos / area.questoesRespondidas) * 100) : 0 };
      });
    });

    const headers = new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser')}` });
    this.http.get<AssuntoResumo[]>(APIURL + '/usuarios/relatorio-assuntos', { headers }).subscribe({
      next: res => {
        this.assuntos = res ?? [];
        this.carregandoAssuntos = false;
      },
      error: () => (this.carregandoAssuntos = false)
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  escolher(chave: ChaveArea) {
    this.ativa = chave;
    this.filtro = 'todos';
    this.router.navigate([], { queryParams: { area: chave }, replaceUrl: true });
  }

  get atual(): ResumoArea | undefined {
    return this.resumos.find(r => r.info.chave === this.ativa);
  }

  get offset(): number {
    return this.circunferencia * (1 - (this.atual?.pct ?? 0) / 100);
  }

  get tempoMedio(): string {
    const a = this.atual?.area;
    if (!a?.questoesRespondidas) return '—';
    const s = Math.floor(a.tempoGasto / a.questoesRespondidas);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  get totalRespondidas(): number {
    return this.resumos.reduce((s, r) => s + r.area.questoesRespondidas, 0);
  }

  get pctGeral(): number {
    const t = this.totalRespondidas;
    return t ? Math.round((this.resumos.reduce((s, r) => s + r.area.acertos, 0) / t) * 100) : 0;
  }

  get linhas(): LinhaAssunto[] {
    return this.assuntos
      .filter(a => a.area === this.ativa.toUpperCase() && a.totalRespostas > 0)
      .map(a => {
        const pct = Math.round((a.totalAcertos / a.totalRespostas) * 100);
        const nivel: Nivel = pct >= 70 ? 'dominado' : pct >= 40 ? 'progresso' : 'revisar';
        return { nome: a.assunto, acertos: a.totalAcertos, total: a.totalRespostas, pct, nivel };
      })
      .sort((a, b) => b.pct - a.pct || b.total - a.total);
  }

  get linhasFiltradas(): LinhaAssunto[] {
    const l = this.linhas;
    return this.filtro === 'todos' ? l : l.filter(x => x.nivel === this.filtro);
  }

  contar(n: Nivel): number {
    return this.linhas.filter(l => l.nivel === n).length;
  }

  get paraRevisar(): LinhaAssunto[] {
    return this.linhas.filter(l => l.nivel === 'revisar').sort((a, b) => a.pct - b.pct || b.total - a.total).slice(0, 3);
  }
}
