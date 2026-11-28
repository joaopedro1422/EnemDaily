import { EstadoInstalacao, PwaService } from '../services/pwa.service';
import { ComunidadeService } from '../services/comunidade.service';
import { RecursosService } from '../services/recursos.service';
import { SomService } from '../shared/som/som.service';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Usuario } from '../models/usuario';
import { PerfilComponent } from '../perfil/perfil.component';
import { AuthServiceService } from '../services/auth-service.service';
import { RankingStoreServiceService } from '../services/ranking-store-service.service';
import { PerfilExternoComponent } from '../modal/perfil-externo/perfil-externo.component';
import { IconeComponent } from '../shared/icone/icone.component';
import { SimboloDiaComponent } from '../shared/simbolo-dia/simbolo-dia.component';
import { formatarNumero } from '../shared/dia';
import { progressoDoUsuario, totalDePecas } from '../shared/campus/campus';

@Component({
  selector: 'app-header',
  imports: [AvatarComponent, CommonModule, RouterModule, PerfilComponent, PerfilExternoComponent, IconeComponent, SimboloDiaComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuOpen = false;
  mostrarModalUniversidade = false;
  mostrarModalAvatar = false;
  confirmandoSaida = false;
  rolou = false;
  usuarioLogado: Usuario | null = null;
  pecasCampus = 0;
  ganhouXpUsuario = false;
  readonly formatarNumero = formatarNumero;
  private subs = new Subscription();

  pendentesComunidade = 0;
  instalacao: EstadoInstalacao = 'indisponivel';
  private pwa = inject(PwaService);
  private comunidade = inject(ComunidadeService);
  private som = inject(SomService);
  private recursos = inject(RecursosService);
  /** "Meu cronograma" liberado para o aluno (módulo em teste). */
  cronograma = false;
  sons = this.som.ligado;

  constructor(private authService: AuthServiceService, private router: Router, private rankingStore: RankingStoreServiceService) {
    this.comunidade.notificacoes$.subscribe(n => (this.pendentesComunidade = n ? n.amizades + n.duelos : 0));
    this.pwa.instalacao$.subscribe(e => (this.instalacao = e));
    this.recursos.cronograma$.subscribe(v => (this.cronograma = v));
  }

  ngOnInit() {
    this.subs.add(this.authService.usuario$.subscribe(usuario => {
      this.usuarioLogado = usuario;
      this.pecasCampus = totalDePecas(progressoDoUsuario(usuario));
    }));
    this.subs.add(this.rankingStore.rankingUpdate$.subscribe(() => this.marcarGanhoDeXp()));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  @HostListener('window:scroll')
  aoRolar() {
    this.rolou = window.scrollY > 4;
  }

  @HostListener('document:keydown.escape')
  aoEsc() {
    if (this.menuOpen) this.fecharMenu();
  }

  alternarMenu() {
    this.menuOpen = !this.menuOpen;
    this.confirmandoSaida = false;
  }

  fecharMenu() {
    this.menuOpen = false;
    this.confirmandoSaida = false;
  }

  async instalarApp() {
    await this.pwa.instalar();
  }

  dispensarInstalacao() {
    this.pwa.dispensar();
  }

  get mostrarInstalar(): boolean {
    return (this.instalacao === 'disponivel' || this.instalacao === 'ios') && !this.pwa.dispensado;
  }

  alternarSons(e: Event) {
    this.sons = (e.target as HTMLInputElement).checked;
    this.som.alternar(this.sons);
    if (this.sons) this.som.pop();
  }

  marcarGanhoDeXp() {
    this.ganhouXpUsuario = true;
    setTimeout(() => (this.ganhouXpUsuario = false), 1200);
  }

  logout() {
    this.pwa.desvincular();
    this.authService.logout();
    this.fecharMenu();
    this.router.navigate(['/Home']);
  }

  abrirLogin() {
    this.authService.open();
  }

  abrirPerfil() {
    this.fecharMenu();
    const u = this.usuarioLogado;
    if (u && !u.demo && u.usuario) this.router.navigate(['/u', u.usuario]);
    else this.mostrarModalUniversidade = true;
  }

  fecharUniversidade() {
    this.mostrarModalUniversidade = false;
  }

  abrirAvatares() {
    this.fecharMenu();
    this.mostrarModalAvatar = true;
  }

  fecharAvatares() {
    this.mostrarModalAvatar = false;
  }
}
