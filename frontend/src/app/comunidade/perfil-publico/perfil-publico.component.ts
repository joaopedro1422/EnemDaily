import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthServiceService } from '../../services/auth-service.service';
import { ComunidadeService, nomeDoDia } from '../../services/comunidade.service';
import { PerfilPublico, UsuarioMini } from '../../models/comunidade';
import { EMBLEMAS_MOCK } from '../../models/usuario';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { EspadasComponent } from '../../shared/duelo/espadas.component';
import { CampusComponent } from '../../shared/campus/campus.component';
import { DueloConviteComponent } from '../../modal/duelo-convite/duelo-convite.component';
import { Progresso, TOTAL_PECAS, progressoDeColega, totalDePecas } from '../../shared/campus/campus';
import { AREAS, formatarNumero } from '../../shared/dia';
import { CapaComponent } from '../../shared/capas/capa.component';
import { lerAvatar } from '../../shared/avatar/avatar';

@Component({
  selector: 'app-perfil-publico',
  standalone: true,
  imports: [RouterLink, AvatarComponent, IconeComponent, CarregandoComponent, EspadasComponent, CampusComponent, DueloConviteComponent, CapaComponent],
  templateUrl: './perfil-publico.component.html',
  styleUrl: './perfil-publico.component.css'
})
export class PerfilPublicoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthServiceService);
  private comunidade = inject(ComunidadeService);
  private subs: Subscription[] = [];

  readonly formatarNumero = formatarNumero;
  readonly nomeDoDia = nomeDoDia;
  readonly totalCampus = TOTAL_PECAS;
  readonly totalEmblemas = EMBLEMAS_MOCK.length;

  arroba = '';
  perfil: PerfilPublico | null = null;
  erro = '';
  carregando = true;
  ocupado = false;
  menu = false;
  confirmarBloqueio = false;
  desafiando: UsuarioMini | null = null;
  progresso: Progresso | null = null;
  pecas = 0;
  emblemas = 0;
  logado = false;

  get areas() {
    const p = this.perfil;
    if (!p) return [];
    const v: Record<string, number> = { linguagens: p.acertosLinguagens, humanas: p.acertosHumanas, naturezas: p.acertosNaturezas, exatas: p.acertosExatas };
    return AREAS.map(a => ({ ...a, acertos: v[a.chave] ?? 0 }));
  }
  get capa(): string { return lerAvatar(this.perfil?.avatar).capa || 'caderno'; }
  get mini(): UsuarioMini | null { const p = this.perfil; return p ? { id: p.id, nome: p.nome, usuario: p.usuario, avatar: p.avatar } : null; }
  get temPlacar() { const p = this.perfil?.placar; return !!p && p.vitorias + p.derrotas + p.empates > 0; }

  ngOnInit() {
    this.subs.push(this.auth.usuario$.subscribe(u => {
      const antes = this.logado;
      this.logado = !!u && !u.demo;
      if (this.logado && !antes && this.arroba) this.carregar();
    }));
    this.subs.push(this.route.paramMap.subscribe(p => {
      this.arroba = (p.get('usuario') ?? '').replace(/^@/, '');
      this.carregar();
    }));
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  carregar() {
    if (!this.logado) { this.carregando = false; return; }
    this.carregando = true; this.erro = '';
    this.comunidade.perfil(this.arroba).subscribe({
      next: p => {
        this.perfil = p;
        this.carregando = false;
        this.progresso = p.podeVerCampus ? progressoDeColega(p) : null;
        this.pecas = this.progresso ? totalDePecas(this.progresso) : 0;
        this.emblemas = (p.emblemas ?? '').split('|').filter(Boolean).length;
      },
      error: e => { this.carregando = false; this.perfil = null; this.erro = this.comunidade.erro(e, 'Não foi possível abrir esse perfil.'); }
    });
  }

  entrar() { this.auth.open(); }

  private executar(obs: import('rxjs').Observable<unknown>) {
    if (this.ocupado) return;
    this.ocupado = true; this.erro = ''; this.menu = false;
    obs.subscribe({
      next: () => { this.ocupado = false; this.carregar(); },
      error: e => { this.ocupado = false; this.erro = this.comunidade.erro(e); }
    });
  }

  adicionar() { if (this.perfil) this.executar(this.comunidade.solicitarAmizade(this.perfil.usuario)); }
  aceitar() { if (this.perfil?.amizadeId) this.executar(this.comunidade.aceitarAmizade(this.perfil.amizadeId)); }
  removerAmizade() { if (this.perfil?.amizadeId) this.executar(this.comunidade.removerAmizade(this.perfil.amizadeId)); }
  bloquear() { if (this.perfil) { this.confirmarBloqueio = false; this.executar(this.comunidade.bloquear(this.perfil.usuario)); } }
  desbloquear() { if (this.perfil) this.executar(this.comunidade.desbloquear(this.perfil.usuario)); }
  aceitarDuelo() { const d = this.perfil?.dueloAtivo; if (d) this.executar(this.comunidade.aceitarDuelo(d.id)); }
  recusarDuelo() { const d = this.perfil?.dueloAtivo; if (d) this.executar(this.comunidade.recusarDuelo(d.id)); }
  cancelarDuelo() { const d = this.perfil?.dueloAtivo; if (d) this.executar(this.comunidade.cancelarDuelo(d.id)); }

  desafiar() { if (this.mini && this.perfil?.podeDesafiar) this.desafiando = this.mini; }
  aoEnviar() { this.carregar(); }

  voltar() { history.length > 1 ? history.back() : this.router.navigate(['/amigos']); }

  porcentagem(a: number, b: number) { const t = a + b; return t ? Math.round((a / t) * 100) : 50; }

  @HostListener('document:click', ['$event'])
  fora(e: MouseEvent) { if (this.menu && !(e.target as HTMLElement).closest('.pp-menu')) this.menu = false; }
}
