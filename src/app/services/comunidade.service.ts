import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { APIURL } from '../models/Environment';
import { Disponibilidade, Duelo, Duelos, Notificacoes, PerfilPublico, Privacidade, Relacao, Solicitacoes, UsuarioComunidade } from '../models/comunidade';

@Injectable({ providedIn: 'root' })
export class ComunidadeService {
  private http = inject(HttpClient);
  private readonly api = APIURL;
  private readonly notif = new BehaviorSubject<Notificacoes | null>(null);
  readonly notificacoes$ = this.notif.asObservable();

  private get headers() {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser') ?? ''}` });
  }

  get notificacoes(): Notificacoes | null { return this.notif.value; }

  /** Mensagem amigável vinda do backend (regras de duelo e amizade). */
  erro(e: unknown, padrao = 'Não foi possível concluir agora. Tente de novo.'): string {
    const r = e as HttpErrorResponse;
    return (r?.error && typeof r.error === 'object' && r.error.mensagem) || padrao;
  }

  private emVoo = false;
  private pendente = false;
  private ultimaBusca = 0;

  /** Busca as notificações sem repetir pedidos: ignora chamadas em sequência (menos de 5 s) e junta as que chegam durante uma busca. */
  atualizarNotificacoes(forcar = false): void {
    if (!localStorage.getItem('tokenUser')) return;
    if (this.emVoo) { this.pendente = this.pendente || forcar; return; }
    if (!forcar && Date.now() - this.ultimaBusca < 5000) return;
    this.emVoo = true;
    this.ultimaBusca = Date.now();
    this.http.get<Notificacoes>(`${this.api}/comunidade/notificacoes`, { headers: this.headers }).subscribe({
      next: n => this.notif.next(n),
      error: () => {},
      complete: () => this.fimBusca()
    }).add(() => this.fimBusca());
  }

  private fimBusca() {
    if (!this.emVoo) return;
    this.emVoo = false;
    if (this.pendente) { this.pendente = false; this.atualizarNotificacoes(true); }
  }

  limparNotificacoes() { this.notif.next(null); }

  // ---------- pessoas
  buscar(q: string): Observable<UsuarioComunidade[]> {
    return this.http.get<UsuarioComunidade[]>(`${this.api}/comunidade/buscar`, { headers: this.headers, params: { q } });
  }
  perfil(usuario: string): Observable<PerfilPublico> {
    return this.http.get<PerfilPublico>(`${this.api}/comunidade/perfil/${encodeURIComponent(usuario)}`, { headers: this.headers });
  }
  amigos(): Observable<UsuarioComunidade[]> {
    return this.http.get<UsuarioComunidade[]>(`${this.api}/comunidade/amigos`, { headers: this.headers });
  }
  solicitacoes(): Observable<Solicitacoes> {
    return this.http.get<Solicitacoes>(`${this.api}/comunidade/solicitacoes`, { headers: this.headers });
  }

  // ---------- amizade
  solicitarAmizade(usuario: string): Observable<{ relacao: Relacao }> {
    return this.http.post<{ relacao: Relacao }>(`${this.api}/comunidade/amizades/${encodeURIComponent(usuario)}`, {}, { headers: this.headers })
      .pipe(tap(() => this.atualizarNotificacoes(true)));
  }
  aceitarAmizade(id: string): Observable<void> {
    return this.http.post<void>(`${this.api}/comunidade/amizades/${id}/aceitar`, {}, { headers: this.headers }).pipe(tap(() => this.atualizarNotificacoes(true)));
  }
  removerAmizade(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/comunidade/amizades/${id}`, { headers: this.headers }).pipe(tap(() => this.atualizarNotificacoes(true)));
  }
  bloquear(usuario: string): Observable<void> {
    return this.http.post<void>(`${this.api}/comunidade/bloqueios/${encodeURIComponent(usuario)}`, {}, { headers: this.headers }).pipe(tap(() => this.atualizarNotificacoes(true)));
  }
  desbloquear(usuario: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/comunidade/bloqueios/${encodeURIComponent(usuario)}`, { headers: this.headers });
  }
  privacidade(): Observable<Privacidade> {
    return this.http.get<Privacidade>(`${this.api}/comunidade/privacidade`, { headers: this.headers });
  }
  salvarPrivacidade(p: Privacidade): Observable<Privacidade> {
    return this.http.put<Privacidade>(`${this.api}/comunidade/privacidade`, p, { headers: this.headers });
  }

  // ---------- duelos
  duelos(): Observable<Duelos> {
    return this.http.get<Duelos>(`${this.api}/duelos`, { headers: this.headers });
  }
  disponibilidade(usuario: string): Observable<Disponibilidade> {
    return this.http.get<Disponibilidade>(`${this.api}/duelos/disponibilidade/${encodeURIComponent(usuario)}`, { headers: this.headers });
  }
  desafiar(usuario: string, dia: string): Observable<Duelo> {
    return this.http.post<Duelo>(`${this.api}/duelos`, { usuario, dia }, { headers: this.headers }).pipe(tap(() => this.atualizarNotificacoes(true)));
  }
  aceitarDuelo(id: string): Observable<Duelo> {
    return this.http.post<Duelo>(`${this.api}/duelos/${id}/aceitar`, {}, { headers: this.headers }).pipe(tap(() => this.atualizarNotificacoes(true)));
  }
  recusarDuelo(id: string): Observable<Duelo> {
    return this.http.post<Duelo>(`${this.api}/duelos/${id}/recusar`, {}, { headers: this.headers }).pipe(tap(() => this.atualizarNotificacoes(true)));
  }
  cancelarDuelo(id: string): Observable<Duelo> {
    return this.http.post<Duelo>(`${this.api}/duelos/${id}/cancelar`, {}, { headers: this.headers }).pipe(tap(() => this.atualizarNotificacoes(true)));
  }
  marcarVisto(id: string): Observable<void> {
    return this.http.post<void>(`${this.api}/duelos/${id}/visto`, {}, { headers: this.headers });
  }
}

/** "hoje", "amanhã" ou "quinta, 21 de nov." a partir de uma data ISO (yyyy-mm-dd). */
export function nomeDoDia(iso: string, curto = false): string {
  const [a, m, d] = iso.split('-').map(Number);
  const dia = new Date(a, m - 1, d), hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diff = Math.round((dia.getTime() - hoje.getTime()) / 86_400_000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  if (diff === -1) return 'ontem';
  const semana = dia.toLocaleDateString('pt-BR', { weekday: curto ? 'short' : 'long' }).replace('.', '').replace('-feira', '');
  const data = dia.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
  return `${semana}, ${data}`;
}

export function isoDe(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
