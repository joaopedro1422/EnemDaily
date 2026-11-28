import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { APIURL } from '../models/Environment';
import { Usuario } from '../models/usuario';
import { AuthServiceService } from './auth-service.service';

export interface Disponibilidade { disponivel: boolean; motivo?: string; atual?: boolean; }
/** Uma escola da busca: da lista do INEP (codigo, local, rede) ou digitada por algum aluno (idLivre). */
export interface OpcaoEscola { tipo: 'inep' | 'livre'; codigo: number | null; idLivre: number | null; nome: string; local: string | null; rede: 'publica' | 'privada' | null; }

@Injectable({ providedIn: 'root' })
export class ContaService {
  private http = inject(HttpClient);
  private auth = inject(AuthServiceService);
  private base = APIURL + '/usuarios/conta';

  private get headers() {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser') ?? ''}` });
  }

  disponivel(usuario: string): Observable<Disponibilidade> {
    return this.http.get<Disponibilidade>(`${this.base}/disponivel`, { headers: this.headers, params: { usuario } });
  }

  alterarNome(nome: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/nome`, { nome }, { headers: this.headers }).pipe(tap(u => this.auth.atualizarUsuario(u)));
  }

  alterarUsuario(usuario: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/usuario`, { usuario }, { headers: this.headers }).pipe(tap(u => this.auth.atualizarUsuario(u)));
  }

  alterarEmail(email: string, senhaAtual: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/email`, { email, senhaAtual }, { headers: this.headers }).pipe(tap(u => this.auth.atualizarUsuario(u)));
  }

  escola(): Observable<{ escola: OpcaoEscola | null }> {
    return this.http.get<{ escola: OpcaoEscola | null }>(`${this.base}/escola`, { headers: this.headers });
  }

  buscarEscolas(q: string): Observable<OpcaoEscola[]> {
    return this.http.get<OpcaoEscola[]>(`${this.base}/escolas`, { headers: this.headers, params: { q } });
  }

  /** Escolhe uma opção (codigo ou idLivre), cria uma nova pelo nome digitado, ou limpa (tudo nulo). */
  definirEscola(escolha: { codigo?: number | null; idLivre?: number | null; nome?: string | null }): Observable<{ escola: OpcaoEscola | null }> {
    return this.http.put<{ escola: OpcaoEscola | null }>(`${this.base}/escola`, escolha, { headers: this.headers });
  }

  alterarSenha(senhaAtual: string, novaSenha: string): Observable<unknown> {
    return this.http.put(`${this.base}/senha`, { senhaAtual, novaSenha }, { headers: this.headers });
  }
}
