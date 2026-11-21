import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RespostaRequest } from '../models/dtos';
import { Observable, tap } from 'rxjs';
import { Usuario } from '../models/usuario';
import { AuthServiceService } from './auth-service.service';
import { Correcao, Questao, Revisao } from '../models/questao';
import { APIURL } from '../models/Environment';

@Injectable({
  providedIn: 'root'
})
export class QuestaoServiceService {
 private apiUrl = APIURL+'/usuarios';
 private apiUrlQuestoes =  APIURL+'/api/questoes'

  constructor(private http: HttpClient,private authService:AuthServiceService) { }
  enviarResposta(dados: RespostaRequest): Observable<Correcao> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser')}` });
    return this.http.post<Correcao>(`${this.apiUrl}/resposta`, dados, { headers }).pipe(
      tap(res => this.authService.atualizarUsuario(res.usuario))
    );
  }
  getRevisao(area: string): Observable<Revisao> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser')}` });
    return this.http.get<Revisao>(`${this.apiUrlQuestoes}/${area}/revisao`, { headers });
  }

  /** Questão de exemplo para visitantes (de um dia anterior). Pública e sem registro de resposta. */
  getQuestaoExemplo(area: string): Observable<Questao | null> {
    return this.http.get<Questao | null>(`${this.apiUrlQuestoes}/exemplo/${area}`);
  }

  getQuestaoDoDia(area: string): Observable<Questao>{
    
    const token = localStorage.getItem('tokenUser');
    console.log("chega na funçao, token: " + token)
    const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
    });
    return this.http.get<Questao>(`${this.apiUrlQuestoes}/${area}`, {headers}).pipe(tap(res => 
      console.log(res)
    ));
  }
}
