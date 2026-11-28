import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { RecursosService } from '../services/recursos.service';

/** "Meu cronograma" só abre para quem tem o módulo liberado; os demais voltam para o início. */
export const cronogramaGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (!localStorage.getItem('tokenUser')) return router.parseUrl('/Home');
  return inject(RecursosService).cronograma().pipe(map(liberado => liberado || router.parseUrl('/Home')));
};
