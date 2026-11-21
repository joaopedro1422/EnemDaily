import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { APIURL } from '../models/Environment';
import { PaginaConteudo, ResumoConteudo, chaveConteudoDaQuestao } from '../models/conteudo';

@Injectable({ providedIn: 'root' })
export class ConteudoService {
  private http = inject(HttpClient);
  private lista$?: Observable<ResumoConteudo[]>;

  publicados(): Observable<ResumoConteudo[]> {
    this.lista$ ??= this.http.get<ResumoConteudo[]>(`${APIURL}/conteudos`).pipe(
      catchError(() => of([] as ResumoConteudo[])),
      shareReplay(1)
    );
    return this.lista$;
  }

  pagina(area: string, slug: string): Observable<PaginaConteudo> {
    return this.http.get<PaginaConteudo>(`${APIURL}/conteudos/${area}/${slug}`);
  }

  doAssunto(areaQuestao: string, assunto: string): Observable<ResumoConteudo | null> {
    const area = chaveConteudoDaQuestao(areaQuestao);
    return this.publicados().pipe(map(l => l.find(c => c.area === area && c.assunto.toLowerCase() === (assunto ?? '').toLowerCase()) ?? null));
  }
}
