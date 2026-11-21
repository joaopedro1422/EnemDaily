import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Simulado, simuladoRequest } from '../models/simulado';
import { Observable, tap } from 'rxjs';
import { APIURL } from '../models/Environment';

@Injectable({
  providedIn: 'root'
})
export class SimuladoService {
  private apiUrl =  APIURL+'/simulados';
  constructor(private http: HttpClient) { }

  criarSimulado(novoSimulado: simuladoRequest): Observable<Simulado[]>{
    const token = localStorage.getItem('tokenUser');
    const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
    });
    return this.http.post<Simulado[]>(`${this.apiUrl}`, novoSimulado, {headers}).pipe(tap(res => console.log(res)));
  }

  getSimulados(): Observable<Simulado[]>{
      const token = localStorage.getItem('tokenUser');
      const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<Simulado[]>(`${this.apiUrl}`, {headers}).pipe(tap(res => console.log(res)));
  }

  salvaSimulado(simulado: simuladoRequest): Observable<Simulado[]>{
    const token = localStorage.getItem('tokenUser');
      const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<Simulado[]>(`${this.apiUrl}`, simulado, {headers}).pipe(tap(res => console.log(res)));
  }

  deletaSimulado(id: number): Observable<Simulado[]>{
    const token = localStorage.getItem('tokenUser');
      const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.delete<Simulado[]>(`${this.apiUrl}`,{headers: headers, body:{idSimulado: id}}).pipe(tap(res => console.log(res)));
  }

}
