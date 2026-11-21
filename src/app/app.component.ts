import { DueloAvisosComponent } from './modal/duelo-avisos/duelo-avisos.component';
import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs';
import { HeaderComponent } from './header/header.component';
import { RelatorioSemanalFabComponent } from './relatorio-semanal-fab/relatorio-semanal-fab.component';
import { AuthModalComponent } from './modal/auth-modal/auth-modal.component';
import { AuthServiceService } from './services/auth-service.service';
import { PwaService } from './services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, HeaderComponent, RelatorioSemanalFabComponent, AuthModalComponent, DueloAvisosComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'enemDaily';
  public modalService = inject(AuthServiceService);
  public pwa = inject(PwaService);

  constructor() {
    inject(Router).events.pipe(filter(e => e instanceof NavigationEnd), take(1)).subscribe(() => {
      const w = window as any, limite = Date.now() + 4000;
      const esperar = () => {
        const passou = Date.now() - (w.__edInicio ?? 0);
        const pronto = w.__edApp ? w.__edAnimou && passou >= 1700 : true;
        if (pronto || Date.now() > limite) setTimeout(() => this.fecharAbertura(), w.__edApp ? 250 : 0);
        else setTimeout(esperar, 80);
      };
      esperar();
    });
  }

  private fecharAbertura() {
    const s = document.getElementById('ed-splash') ?? document.getElementById('ed-carregando-inicial');
    if (!s) return;
    s.classList.add('sair');
    setTimeout(() => s.remove(), 450);
  }
}
