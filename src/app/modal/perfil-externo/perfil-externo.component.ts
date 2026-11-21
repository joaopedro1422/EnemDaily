import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { EstruturasPremiumService } from '../../services/estruturas-premium.service';
import { Emblema, EMBLEMAS_MOCK, Usuario } from '../../models/usuario';
import { UsuarioGrupo } from '../../models/grupo';
import { CampusComponent } from '../../shared/campus/campus.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { formatarNumero } from '../../shared/dia';
import { Progresso, TOTAL_PECAS, progressoDeColega, progressoDoUsuario, totalDePecas } from '../../shared/campus/campus';

interface Trofeu {
  emblema: Emblema;
  ganho: boolean;
  i: number;
}

@Component({
  selector: 'app-perfil-externo',
  imports: [AvatarComponent, CampusComponent, IconeComponent, AsyncPipe, RouterLink],
  templateUrl: './perfil-externo.component.html',
  styleUrl: './perfil-externo.component.css'
})
export class PerfilExternoComponent implements OnInit, OnDestroy {
  @Input() usuarioExterno!: UsuarioGrupo | null;
  @Input() usuarioExternoBoolean!: boolean;
  @Input() usuarioSessao!: Usuario | null;
  @Output() close = new EventEmitter<void>();
  @Output() trocarAvatar = new EventEmitter<void>();

  nome = '';
  avatar = '';
  xp = 0;
  dias = 0;
  proprio = false;
  progresso: Progresso = progressoDoUsuario(null);
  pecas = 0;
  trofeus: Trofeu[] = [];
  colunas = 4;
  conquistados = 0;
  selecionado: Trofeu | null = null;
  fechando = false;
  readonly totalEmblemas = EMBLEMAS_MOCK.length;
  readonly totalCampus = TOTAL_PECAS;
  readonly formatarNumero = formatarNumero;

  readonly extras$ = inject(EstruturasPremiumService).extras$;

  constructor(private router: Router) {}

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    let emblemas = '';
    if (this.usuarioExternoBoolean && this.usuarioExterno) {
      const u = this.usuarioExterno;
      this.nome = u.usuario;
      this.avatar = u.avatar;
      this.xp = u.xpTotal;
      this.dias = u.sequenciaAtual;
      this.progresso = progressoDeColega(u);
      emblemas = u.emblemas ?? '';
    } else if (this.usuarioSessao) {
      const u = this.usuarioSessao;
      this.proprio = true;
      this.nome = u.usuario;
      this.avatar = u.avatar;
      this.xp = u.xpTotal;
      this.dias = u.streakDiasAtivos;
      this.progresso = progressoDoUsuario(u);
      emblemas = u.emblemas ?? '';
    }
    this.pecas = totalDePecas(this.progresso);

    const codigos = emblemas.split('|').filter(Boolean);
    const ganhos = codigos.map(c => EMBLEMAS_MOCK.find(e => e.codigo === c)).filter((e): e is Emblema => !!e).reverse();
    const faltam = EMBLEMAS_MOCK.filter(e => !ganhos.includes(e));
    const todos: Trofeu[] = [...ganhos.map(e => ({ emblema: e, ganho: true })), ...faltam.map(e => ({ emblema: e, ganho: false }))].map((t, i) => ({ ...t, i }));
    this.conquistados = ganhos.length;
    this.trofeus = todos;
    this.colunas = Math.max(4, Math.ceil(todos.length / 3));
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  fecharModal() {
    if (this.fechando) return;
    this.fechando = true;
    setTimeout(() => this.close.emit(), 260);
  }

  escolher(t: Trofeu) {
    this.selecionado = this.selecionado === t ? null : t;
  }

  abrirAvatar() {
    this.trocarAvatar.emit();
  }

  verCampus() {
    this.close.emit();
    this.router.navigate(['/progresso']);
  }

  inicial(): string {
    return (this.nome ?? '?').trim().charAt(0).toUpperCase();
  }
}
