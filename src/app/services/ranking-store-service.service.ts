import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
export interface RankingUpdateEvent {
  grupoId: string;
  usuario: string;   
  xpGanho: number;
  tab?: 'geral' | 'mensal' | 'streaks'; // opcional
}
@Injectable({
  providedIn: 'root'
})
export class RankingStoreServiceService {

  private rankingUpdateSubject = new Subject<RankingUpdateEvent>();
  rankingUpdate$ = this.rankingUpdateSubject.asObservable();

  emitRankingUpdate(evt: RankingUpdateEvent) {
    console.log('evento de rank');
    this.rankingUpdateSubject.next(evt);
  }
}
