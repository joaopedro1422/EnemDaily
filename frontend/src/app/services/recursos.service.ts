import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, shareReplay } from 'rxjs';
import { APIURL } from '../models/Environment';
import { AuthServiceService } from './auth-service.service';

/** Módulos em teste liberados para quem está logado. Enquanto não chega a resposta, tudo fica desligado. */
@Injectable({ providedIn: 'root' })
export class RecursosService {
  private http = inject(HttpClient);
  private auth = inject(AuthServiceService);
  private pedido$: Observable<boolean> | null = null;

  /** "Meu cronograma" liberado para o aluno. */
  readonly cronograma$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.auth.usuario$.subscribe(u => {
      this.pedido$ = null;
      if (u && !u.demo) this.cronograma().subscribe();
      else this.cronograma$.next(false);
    });
  }

  /** Consulta uma vez por sessão de login; usado também pela guarda da rota. */
  cronograma(): Observable<boolean> {
    this.pedido$ ??= this.http.get<{ mentor: boolean }>(`${APIURL}/recursos`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser') ?? ''}` })
    }).pipe(
      map(r => !!r?.mentor),
      catchError(() => of(false)),
      map(liberado => { this.cronograma$.next(liberado); return liberado; }),
      shareReplay(1)
    );
    return this.pedido$;
  }
}
