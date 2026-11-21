import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {  CodigoResponse, LoginRequest, RegisterRequest } from '../models/dtos';
import { AuthResponse } from '../models/usuario';
import { Usuario } from '../models/usuario';
import { APIURL } from '../models/Environment';
@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private apiUrl =  APIURL+'/auth';
  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.getUsuario());
  usuario$ = this.usuarioSubject.asObservable();
  isOpen = signal(false);
  constructor(private http: HttpClient) { }
  open() {
    this.isOpen.set(true);
  }
  close() {
    this.isOpen.set(false);
  }
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(tap(res => this.salvarAuth(res)));
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(res => this.salvarAuth(res))
      );
  }

  enviaCodigo(email: string): Observable<CodigoResponse> {
    return this.http.post<CodigoResponse>(`${this.apiUrl}/envia-codigo`, {email:email} ).pipe(tap(res => console.log(res)));
  }

  salvaSenha(senha: string, email : string): Observable<Object>{
    return this.http.post<any>(`${this.apiUrl}/salva-senha`, {senha: senha, email: email} ).pipe(tap(res => console.log(res)));
  
  }

  logout() {
    localStorage.removeItem('tokenUser');
    localStorage.removeItem('usuario');
    this.usuarioSubject.next(null);
  }
   getUsuario(): Usuario | null {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }
  getToken(): string | null {
    return localStorage.getItem('token');
  }
   isLogado(): boolean {
    return !!this.getToken();
  }
  private salvarAuth(res: AuthResponse) {
    localStorage.setItem('tokenUser', res.token);
    localStorage.setItem('usuario', JSON.stringify(res.usuario));
     this.usuarioSubject.next(res.usuario);
  }
  atualizarUsuario(usuario: Usuario){
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
  }
}
