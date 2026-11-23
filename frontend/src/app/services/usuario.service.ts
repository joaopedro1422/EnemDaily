import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Usuario , Area} from "../models/usuario";
import { Injectable } from '@angular/core';
import { AuthServiceService } from "./auth-service.service";
import { Observable, tap } from "rxjs";
import { APIURL } from "../models/Environment";
export type AreaKey = 'naturezas' | 'humanas' | 'linguagens' | 'exatas';
export interface LinhaResumoSemanal { dia: string; area: string; respondidas: number; acertos: number; xp: number; tempo: number; }
@Injectable({
  providedIn: 'root'
})

export class UsuarioService {
   
   private apiUrl =  APIURL+'/usuarios';
   constructor(private http: HttpClient, private authService: AuthServiceService) { }

   getRecomendacao(): Observable<Recomendacao> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser')}` });
    return this.http.get<Recomendacao>(`${this.apiUrl}/recomendacao`, { headers });
  }
   getResumoSemanal(): Observable<LinhaResumoSemanal[]> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser')}` });
    return this.http.get<LinhaResumoSemanal[]>(`${this.apiUrl}/resumo-semanal`, { headers });
  }
   marcarOnboardingVisto(): Observable<Usuario> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser')}` });
    return this.http.post<Usuario>(`${this.apiUrl}/onboarding-visto`, {}, { headers });
  }
   getUsuariosHoje(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/respostas-hoje`);
  }
   alteraAvatar(avatar: string): Observable<string>{
    const token = localStorage.getItem('tokenUser');
    const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
    });
    return this.http.post<string>(`${this.apiUrl}/altera-avatar`, avatar, {headers}).pipe(tap(res => console.log(res)));
   }
    setPaginaFavorita(pag: string): Observable<Usuario>{
    const token = localStorage.getItem('tokenUser');
    const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
    });
    return this.http.post<Usuario>(`${this.apiUrl}/pagina-favorita`, pag, {headers}).pipe(tap(res => console.log(res)));
   }
}
export interface AssuntoRecomendado { nome: string; area: string; erros: number; total: number; }
export interface Recomendacao { modo: 'simulados' | 'recente' | 'positivo' | 'vazio'; area: string | null; assuntos: AssuntoRecomendado[]; }
