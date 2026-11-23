import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Alert } from '../alerts';

let ultimoAviso = 0;

export const contaDemoInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 403 && err.error?.erro === 'conta_demo' && Date.now() - ultimoAviso > 3000) {
        ultimoAviso = Date.now();
        Alert.toast('Na conta demonstrativa essa ação fica desativada.', 'info');
      }
      return throwError(() => err);
    })
  );
