import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Redacao, RedacaoRequest } from '../models/redacao';
import { Observable, tap } from 'rxjs';
import { APIURL } from '../models/Environment';

@Injectable({
  providedIn: 'root'
})
export class RedacaoService {
  private apiUrl =  APIURL+'/redacoes';
  constructor(private http: HttpClient) { }

  salvaRedacao(novaRedacao: RedacaoRequest): Observable<Redacao[]>{
    const token = localStorage.getItem('tokenUser');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<Redacao[]>(`${this.apiUrl}`, novaRedacao, {headers}).pipe(tap(res => console.log(res)));
  }
  getRedacoes(): Observable<Redacao[]>{
        const token = localStorage.getItem('tokenUser');
        const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });
      return this.http.get<Redacao[]>(`${this.apiUrl}`, {headers}).pipe(tap(res => console.log(res)));
    }
    deletaRedacao(id: number): Observable<any>{
        const token = localStorage.getItem('tokenUser');
          const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });
        return this.http.delete<Redacao[]>(`${this.apiUrl}/${id}`,{headers: headers}).pipe(tap(res => console.log(res)));
      }
}
