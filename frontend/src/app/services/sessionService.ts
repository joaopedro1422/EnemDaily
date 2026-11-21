import { Injectable } from '@angular/core';

const USER_KEY = 'usuario_logado_id';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  setUsuario(id: number) {
    localStorage.setItem(USER_KEY, id.toString());
  }

  getUsuario(): number | null {
    const id = localStorage.getItem(USER_KEY);
    return id ? Number(id) : null;
  }

  clear() {
    localStorage.removeItem(USER_KEY);
  }

  isLogged(): boolean {
    return this.getUsuario() !== null;
  }
  
}
