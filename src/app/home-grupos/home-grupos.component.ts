import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NovoGrupoModalComponent } from '../modal/novo-grupo-modal/novo-grupo-modal.component';
import { GrupoResumido, Usuario } from '../models/usuario';
import { AuthServiceService } from '../services/auth-service.service';
import { GrupoService } from '../services/grupo.service';
import { IconeComponent } from '../shared/icone/icone.component';
import { AREAS, InfoArea } from '../shared/dia';

@Component({
  selector: 'app-home-grupos',
  imports: [NovoGrupoModalComponent, IconeComponent, CarregandoComponent],
  templateUrl: './home-grupos.component.html',
  styleUrl: './home-grupos.component.css'
})
export class HomeGruposComponent implements OnInit, OnDestroy {
  meus: GrupoResumido[] = [];
  publicos: GrupoResumido[] = [];
  carregandoPublicos = true;
  mostrarModal = false;
  usuario: Usuario | null = null;
  private sub?: Subscription;

  constructor(private router: Router, private authService: AuthServiceService, private grupoService: GrupoService) {}

  ngOnInit(): void {
    this.sub = this.authService.usuario$.subscribe(u => {
      this.usuario = u;
      if (!u) {
        this.router.navigate(['/Home']);
        return;
      }
      this.meus = (u.grupos ?? []).filter(g => !g.publico);
    });
    if (!this.usuario) return;
    this.grupoService.getGruposPublicos().subscribe({
      next: res => {
        this.publicos = res ?? [];
        this.carregandoPublicos = false;
      },
      error: () => (this.carregandoPublicos = false)
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  abrir(g: GrupoResumido) {
    this.router.navigate(['/grupo', g.id]);
  }

  membros(g: GrupoResumido): number {
    return Math.max(1, g.membros);
  }

  posicao(g: GrupoResumido): number {
    return g.membros === 0 ? 1 : g.posicao;
  }

  areas(g: GrupoResumido): InfoArea[] {
    return AREAS.filter(a => g[a.chave]);
  }

  medalha(p: number): string {
    return p === 1 ? 'ouro' : p === 2 ? 'prata' : p === 3 ? 'bronze' : '';
  }
}
