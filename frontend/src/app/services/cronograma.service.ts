import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APIURL } from '../models/Environment';
import { ConfigEntrada, DetalheAssunto, DiaCalendario, HojeResumo, Painel } from '../models/cronograma';

/** API do "Meu cronograma". Toda ação devolve o painel já recalculado. */
@Injectable({ providedIn: 'root' })
export class CronogramaService {
  private http = inject(HttpClient);
  private base = `${APIURL}/mentor`;

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser') ?? ''}` });
  }

  painel(): Observable<Painel> { return this.http.get<Painel>(this.base, { headers: this.headers }); }

  dias(de: string, ate: string): Observable<DiaCalendario[]> {
    return this.http.get<DiaCalendario[]>(`${this.base}/dias`, { headers: this.headers, params: { de, ate } });
  }

  hoje(): Observable<HojeResumo> { return this.http.get<HojeResumo>(`${this.base}/hoje`, { headers: this.headers }); }

  salvar(config: ConfigEntrada): Observable<Painel> { return this.http.put<Painel>(`${this.base}/plano`, config, { headers: this.headers }); }

  apagar(): Observable<unknown> { return this.http.delete(`${this.base}/plano`, { headers: this.headers }); }

  notificacoes(ativo: boolean): Observable<Painel> { return this.http.put<Painel>(`${this.base}/notificacoes`, { ativo }, { headers: this.headers }); }


  naoConseguiDia(): Observable<Painel> { return this.post('/hoje/nao-consegui'); }

  redacao(feita: boolean): Observable<Painel> { return this.post('/redacao', { feita }); }

  detalhe(id: number): Observable<DetalheAssunto> { return this.http.get<DetalheAssunto>(`${this.base}/assuntos/${id}`, { headers: this.headers }); }

  estudado(id: number, jaSabia = false): Observable<Painel> { return this.post(`/assuntos/${id}/estudado`, { jaSabia }); }

  naoEstudado(id: number): Observable<Painel> { return this.http.delete<Painel>(`${this.base}/assuntos/${id}/estudado`, { headers: this.headers }); }

  iniciar(id: number): Observable<Painel> { return this.post(`/assuntos/${id}/iniciar`); }
  parte(id: number): Observable<Painel> { return this.post(`/assuntos/${id}/parte`); }

  revisado(id: number, dificil: boolean): Observable<Painel> { return this.post(`/assuntos/${id}/revisado`, { dificil }); }

  desfazer(id: number): Observable<Painel> { return this.post(`/assuntos/${id}/desfazer`); }

  naoConsegui(id: number): Observable<Painel> { return this.post(`/assuntos/${id}/nao-consegui`); }

  remover(id: number): Observable<Painel> { return this.post(`/assuntos/${id}/remover`); }

  restaurar(id: number): Observable<Painel> { return this.post(`/assuntos/${id}/restaurar`); }

  private post(caminho: string, corpo: unknown = {}): Observable<Painel> {
    return this.http.post<Painel>(`${this.base}${caminho}`, corpo, { headers: this.headers });
  }
}
