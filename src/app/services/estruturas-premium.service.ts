import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { SimuladoService } from './simulado.service';
import { RedacaoService } from './redacao.service';
import { AuthServiceService } from './auth-service.service';
import { MOCK_SIMULADOS } from '../models/simulado';
import { mockRedacoes } from '../models/redacao';
import { Usuario } from '../models/usuario';
import { ExtrasCampus } from '../shared/campus/especiais';

export interface ContagemEstudos { acertos: number; simulados: number; redacoes: number; maiorSequencia: number; diasAtivos: number; xp: number; carregado: boolean; }

export const acertosTotais = (u: Usuario | null | undefined) =>
  (u?.linguagens?.acertos ?? 0) + (u?.humanas?.acertos ?? 0) + (u?.naturezas?.acertos ?? 0) + (u?.exatas?.acertos ?? 0);

/** Junta o que libera os marcos do campus: total de acertos, simulados e redações registrados. */
@Injectable({ providedIn: 'root' })
export class EstruturasPremiumService {
  private estado = new BehaviorSubject<ContagemEstudos>({ acertos: 0, simulados: 0, redacoes: 0, maiorSequencia: 0, diasAtivos: 0, xp: 0, carregado: false });
  readonly contagem$ = this.estado.asObservable();
  readonly extras$ = this.estado.pipe(map(c => (c.carregado ? this.paraExtras(c) : null)));
  private usuarioId: string | null = null;

  constructor(private simuladoService: SimuladoService, private redacaoService: RedacaoService, authService: AuthServiceService) {
    authService.usuario$.subscribe(u => {
      const id = u ? String(u.id) + (u.demo ? ':demo' : '') : null;
      const acertos = acertosTotais(u);
      const maiorSequencia = Math.max(u?.maiorSequencia ?? 0, u?.streakDiasAtivos ?? 0);
      const diasAtivos = u?.qntDiasAtivos ?? 0;
      const xp = u?.xpTotal ?? 0;
      if (id === this.usuarioId) {
        if (acertos !== this.estado.value.acertos || maiorSequencia !== this.estado.value.maiorSequencia || diasAtivos !== this.estado.value.diasAtivos || xp !== this.estado.value.xp) this.estado.next({ ...this.estado.value, acertos, maiorSequencia, diasAtivos, xp });
        return;
      }
      this.usuarioId = id;
      if (!u) {
        this.estado.next({ acertos: 0, simulados: 0, redacoes: 0, maiorSequencia: 0, diasAtivos: 0, xp: 0, carregado: false });
        return;
      }
      if (u.demo) {
        this.estado.next({ acertos, simulados: MOCK_SIMULADOS.length, redacoes: mockRedacoes.length, maiorSequencia, diasAtivos, xp, carregado: true });
        return;
      }
      this.estado.next({ acertos, simulados: 0, redacoes: 0, maiorSequencia, diasAtivos, xp, carregado: false });
      this.carregar();
    });
  }

  get atual(): ContagemEstudos {
    return this.estado.value;
  }

  carregar() {
    let pendentes = 2;
    const fim = () => { if (--pendentes === 0) this.estado.next({ ...this.estado.value, carregado: true }); };
    this.simuladoService.getSimulados().subscribe({ next: l => { this.estado.next({ ...this.estado.value, simulados: l?.length ?? 0 }); fim(); }, error: fim });
    this.redacaoService.getRedacoes().subscribe({ next: l => { this.estado.next({ ...this.estado.value, redacoes: l?.length ?? 0 }); fim(); }, error: fim });
  }

  definirSimulados(n: number) {
    this.estado.next({ ...this.estado.value, simulados: n, carregado: true });
  }

  definirRedacoes(n: number) {
    this.estado.next({ ...this.estado.value, redacoes: n, carregado: true });
  }

  paraExtras(c: ContagemEstudos): ExtrasCampus {
    return { acertos: c.acertos, simulados: c.simulados, redacoes: c.redacoes, maiorSequencia: c.maiorSequencia, diasAtivos: c.diasAtivos, xp: c.xp };
  }
}
