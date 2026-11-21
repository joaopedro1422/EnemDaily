import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { APIURL } from '../models/Environment';
import { Usuario } from '../models/usuario';
import { AuthServiceService } from './auth-service.service';

export interface Disponibilidade { disponivel: boolean; motivo?: string; atual?: boolean; }

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

  alterarSenha(senhaAtual: string, novaSenha: string): Observable<unknown> {
    return this.http.put(`${this.base}/senha`, { senhaAtual, novaSenha }, { headers: this.headers });
  }
}
