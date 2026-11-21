import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GrupoRequest, NovoGrupoResponse } from '../models/dtos';
import { Observable, tap } from 'rxjs';
import { GrupoResumido, Usuario } from '../models/usuario';
import { Grupo, GrupoAtualizado, PodioResponse, UsuarioGrupo } from '../models/grupo';
import { AuthServiceService } from './auth-service.service';
import { APIURL } from '../models/Environment';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {

   private apiUrl =  APIURL+'/grupos';
  constructor(private http: HttpClient, private authService: AuthServiceService) { }

  criarGrupo(grupo: GrupoRequest) : Observable<NovoGrupoResponse>{
    const token = localStorage.getItem('tokenUser');
    const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
    });
    return this.http.post<NovoGrupoResponse>(`${this.apiUrl}/criar`, grupo, {headers}).pipe(tap(res => console.log('grupo criado com sucesso!')));
  }

  getGrupo(idGrupo: string) : Observable<Grupo> {
   
    return this.http.get<Grupo>(`${this.apiUrl}/${idGrupo}`).pipe(tap(res => console.log(res)));
  }

  getGruposPublicos():  Observable<GrupoResumido[]> {
     const token = localStorage.getItem('tokenUser');
    const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
    });
    return this.http.get<GrupoResumido[]>(`${this.apiUrl}/publicos`,{headers}).pipe(tap( res => console.log(res)));
  }
  getPodioMensal(idGrupo: string): Observable<PodioResponse>{
     const token = localStorage.getItem('tokenUser');
    const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
    });
    return this.http.get<PodioResponse>(`${this.apiUrl}/podioMensal/${idGrupo}`, {headers}).pipe(tap( res => console.log(res)));
  }
  addUsuarioGrupo(idGrupo: string) : Observable<Grupo>{
    const token = localStorage.getItem('tokenUser');
      const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<Grupo>(`${this.apiUrl}/add-user`, {idGrupo: idGrupo},{headers}).pipe(tap(res => console.log('usuario adicionado com sucesso')));
  }
  atualizaGrupo(grupo: GrupoAtualizado): Observable<boolean>{
    const token = localStorage.getItem('tokenUser');
      const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.put<boolean>(`${this.apiUrl}`, grupo, {headers}).pipe(tap(res => console.log('grupo atualizado com sucesso')));
  }
  removeUsuarioGrupo(idGrupo: string, idUsuario: string): Observable<GrupoResumido[]>{
    const token = localStorage.getItem('tokenUser');
      const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.delete<GrupoResumido[]>(`${this.apiUrl}`,{headers: headers, body:{idGrupo: idGrupo, idUsuario: idUsuario}}).pipe(tap(res => console.log('usuario adicionado com sucesso')));
  }

}
