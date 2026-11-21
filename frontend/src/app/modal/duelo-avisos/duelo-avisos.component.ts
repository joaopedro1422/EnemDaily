import { SomService } from '../../shared/som/som.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthServiceService } from '../../services/auth-service.service';
import { ComunidadeService, nomeDoDia } from '../../services/comunidade.service';
import { Duelo, UsuarioMini } from '../../models/comunidade';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { EspadasComponent } from '../../shared/duelo/espadas.component';
import { DueloConviteComponent } from '../duelo-convite/duelo-convite.component';

type Aviso = { tipo: 'convite' | 'resultado'; duelo: Duelo };
const ADIADOS = 'ed-duelos-adiados';
const INTERVALO = 90_000;

@Component({
  selector: 'app-duelo-avisos',
  standalone: true,
  imports: [AvatarComponent, IconeComponent, CarregandoComponent, EspadasComponent, DueloConviteComponent],
  templateUrl: './duelo-avisos.component.html',
  styleUrls: ['../../shared/duelo/duelo-modal.css']
})
export class DueloAvisosComponent implements OnInit, OnDestroy {
  private som = inject(SomService);
  private auth = inject(AuthServiceService);
  private comunidade = inject(ComunidadeService);
  private router = inject(Router);
  private subs: Subscription[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private vistos = new Set<string>();

  eu: UsuarioMini | null = null;
  fila: Aviso[] = [];
  atual: Aviso | null = null;
  total = 0;
  posicao = 0;
  ocupado = false;
  erro = '';
  aceito: Duelo | null = null;
  fechando = false;
  revanche: UsuarioMini | null = null;
  readonly nomeDoDia = nomeDoDia;

  ngOnInit() {
    this.subs.push(this.auth.usuario$.subscribe(u => {
      const logado = !!u && !u.demo;
      this.eu = logado ? { id: u!.id, nome: u!.nome, usuario: u!.usuario, avatar: u!.avatar } : null;
      if (logado) this.iniciar(); else this.parar();
    }));
    this.subs.push(this.comunidade.notificacoes$.subscribe(n => {
      if (!n) return;
      const adiados = this.adiados();
      const novos: Aviso[] = [
        ...n.resultados.filter(d => !this.vistos.has(d.id)).map(d => ({ tipo: 'resultado' as const, duelo: d })),
        ...n.convites.filter(d => !adiados.includes(d.id) && !this.vistos.has(d.id)).map(d => ({ tipo: 'convite' as const, duelo: d }))
      ];
      if (!novos.length || this.atual) return;
      this.fila = novos;
      this.total = novos.length;
      this.posicao = 0;
      this.mostrarProximo();
    }));
    this.subs.push(this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => { if (this.eu) this.comunidade.atualizarNotificacoes(); }));
    document.addEventListener('visibilitychange', this.aoVoltar);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.parar();
    document.removeEventListener('visibilitychange', this.aoVoltar);
  }

  private aoVoltar = () => { if (document.visibilityState === 'visible' && this.eu) this.comunidade.atualizarNotificacoes(); };

  private iniciar() {
    if (this.timer) return;
    this.comunidade.atualizarNotificacoes();
    this.timer = setInterval(() => { if (document.visibilityState === 'visible') this.comunidade.atualizarNotificacoes(); }, INTERVALO);
  }

  private parar() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.atual = null;
    this.fila = [];
    this.comunidade.limparNotificacoes();
  }

  private adiados(): string[] {
    try { return JSON.parse(sessionStorage.getItem(ADIADOS) || '[]'); } catch { return []; }
  }

  private mostrarProximo() {
    if (this.router.url.startsWith('/desafio/')) { this.atual = null; return; }
    this.erro = ''; this.aceito = null; this.fechando = false;
    this.atual = this.fila.shift() ?? null;
    if (this.atual) {
      this.posicao++;
      this.vistos.add(this.atual.duelo.id);
      document.body.style.overflow = 'hidden';
      if (this.atual.tipo === 'convite') setTimeout(() => this.som.espadas(), 180);
    }
    else document.body.style.overflow = '';
  }

  seguir() {
    this.fechando = true;
    setTimeout(() => this.mostrarProximo(), 240);
  }

  aceitar() {
    if (!this.atual || this.ocupado) return;
    this.ocupado = true; this.erro = '';
    this.comunidade.aceitarDuelo(this.atual.duelo.id).subscribe({
      next: d => { this.ocupado = false; this.aceito = d; },
      error: e => { this.ocupado = false; this.erro = this.comunidade.erro(e); }
    });
  }

  recusar() {
    if (!this.atual || this.ocupado) return;
    this.ocupado = true;
    this.comunidade.recusarDuelo(this.atual.duelo.id).subscribe({ next: () => { this.ocupado = false; this.seguir(); }, error: () => { this.ocupado = false; this.seguir(); } });
  }

  depois() {
    if (!this.atual) return;
    const lista = this.adiados();
    lista.push(this.atual.duelo.id);
    try { sessionStorage.setItem(ADIADOS, JSON.stringify(lista)); } catch { }
    this.seguir();
  }

  verPerfil() {
    if (!this.atual) return;
    const u = this.atual.duelo.oponente.usuario;
    this.depois();
    this.router.navigate(['/u', u]);
  }

  fecharResultado() {
    if (!this.atual) return;
    this.comunidade.marcarVisto(this.atual.duelo.id).subscribe({ error: () => {} });
    this.seguir();
  }

  pedirRevanche() {
    if (!this.atual) return;
    const op = this.atual.duelo.oponente;
    this.fecharResultado();
    setTimeout(() => (this.revanche = op), 260);
  }

  get pontos(): number[] { return Array.from({ length: this.total }, (_, i) => i); }

  get tituloResultado(): string {
    const r = this.atual?.duelo.resultado;
    return r === 'VITORIA' ? 'Você venceu o duelo!' : r === 'DERROTA' ? 'Não foi dessa vez' : 'Deu empate!';
  }
}
