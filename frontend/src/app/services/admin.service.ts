import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APIURL } from '../models/Environment';
import { ItemConteudoAdmin, PaginaConteudo } from '../models/conteudo';

export interface ResumoAdmin {
  usuarios: number; novos7dias: number; ativosHoje: number; respostasTotal: number;
  usuariosComSimulados: number; simulados: number; usuariosComRedacoes: number; redacoes: number;
}

export interface UsuarioAdmin {
  id: string; nome: string; usuario: string; email: string; avatar: string | null; demo: boolean;
  xpTotal: number; respondidas: number; acertos: number; dataCadastro: string | null; ultimoAcesso: string | null;
  simulados: number; redacoes: number;
}

export interface PaginaUsuarios { total: number; pagina: number; tamanho: number; usuarios: UsuarioAdmin[]; }

export interface DiaAtividade { dia: string; respostas: number; ativos: number; }

export interface DetalheDia {
  dia: string; respostas: number; ativos: number; acertos: number; completaram4: number; novosCadastros: number;
  porArea: { area: string; respostas: number; acertos: number }[];
  questoes: { area: number; id: number; assunto: string; modelo: string }[];
}

export interface EstadoGeracao {
  area: string; dia: string; etapa: string; emAndamento: boolean; sucesso: boolean | null;
  custoUsd: number; inicio: string; atualizado: string; historico: string[];
}

export interface AssuntoAdmin { id: number; nome: string; area: string; ultimoUso: string | null; questoes: number; proximo: boolean; }

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = APIURL + '/admin';

  get chave(): string {
    try { return localStorage.getItem('edAdminChave') ?? ''; } catch { return ''; }
  }
  set chave(v: string) {
    try { v ? localStorage.setItem('edAdminChave', v) : localStorage.removeItem('edAdminChave'); } catch {}
  }

  private get headers(): HttpHeaders {
    return this.chave ? new HttpHeaders({ 'X-Admin-Chave': this.chave }) : new HttpHeaders();
  }

  resumo(): Observable<ResumoAdmin> {
    return this.http.get<ResumoAdmin>(`${this.base}/resumo`, { headers: this.headers });
  }

  usuarios(busca: string, pagina: number, tamanho = 30): Observable<PaginaUsuarios> {
    return this.http.get<PaginaUsuarios>(`${this.base}/usuarios`, { headers: this.headers, params: { busca, pagina, tamanho } });
  }

  excluir(id: string): Observable<Record<string, number>> {
    return this.http.delete<Record<string, number>>(`${this.base}/usuarios/${id}`, { headers: this.headers });
  }

  atividadeDoMes(mes: string): Observable<DiaAtividade[]> {
    return this.http.get<DiaAtividade[]>(`${this.base}/atividade`, { headers: this.headers, params: { mes } });
  }

  atividadeDoDia(data: string): Observable<DetalheDia> {
    return this.http.get<DetalheDia>(`${this.base}/atividade/dia`, { headers: this.headers, params: { data } });
  }

  gerarQuestoes(dia: string, substituir: boolean, area?: string): Observable<{ dia: string; iniciadas: string[] }> {
    const params: Record<string, string> = { dia, substituir: String(substituir) };
    if (area) params['area'] = area;
    return this.http.post<{ dia: string; iniciadas: string[] }>(`${APIURL}/api/questoes`, null, { headers: this.headers, params });
  }

  assuntos(): Observable<AssuntoAdmin[]> {
    return this.http.get<AssuntoAdmin[]>(`${this.base}/assuntos`, { headers: this.headers });
  }

  adicionarAssunto(nome: string, area: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.base}/assuntos`, { nome, area }, { headers: this.headers });
  }

  excluirAssunto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/assuntos/${id}`, { headers: this.headers });
  }

  conteudos(): Observable<ItemConteudoAdmin[]> {
    return this.http.get<ItemConteudoAdmin[]>(`${this.base}/conteudos`, { headers: this.headers });
  }

  conteudoDoAssunto(assuntoId: number): Observable<PaginaConteudo | null> {
    return this.http.get<PaginaConteudo | null>(`${this.base}/conteudos/${assuntoId}`, { headers: this.headers });
  }

  gerarConteudo(assuntoId: number): Observable<PaginaConteudo> {
    return this.http.post<PaginaConteudo>(`${this.base}/conteudos/${assuntoId}/gerar`, null, { headers: this.headers });
  }

  salvarConteudo(assuntoId: number, c: Partial<PaginaConteudo>): Observable<PaginaConteudo> {
    const corpo = { titulo: c.titulo, seoTitulo: c.seoTitulo, seoDescricao: c.seoDescricao, resumo: c.resumo, comoCai: c.comoCai, paraNaoErrar: c.paraNaoErrar };
    return this.http.put<PaginaConteudo>(`${this.base}/conteudos/${assuntoId}`, corpo, { headers: this.headers });
  }

  publicarConteudo(assuntoId: number, publicar: boolean): Observable<PaginaConteudo> {
    return this.http.post<PaginaConteudo>(`${this.base}/conteudos/${assuntoId}/publicacao`, null, { headers: this.headers, params: { publicar } });
  }

  excluirConteudo(assuntoId: number): Observable<unknown> {
    return this.http.delete(`${this.base}/conteudos/${assuntoId}`, { headers: this.headers });
  }

  statusGeracao(): Observable<Record<string, EstadoGeracao>> {
    return this.http.get<Record<string, EstadoGeracao>>(`${APIURL}/api/questoes/geracao`, { headers: this.headers });
  }
}
