import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, of, switchMap, catchError } from 'rxjs';
import { AuthServiceService } from '../services/auth-service.service';
import { ComunidadeService, nomeDoDia } from '../services/comunidade.service';
import { Duelo, Duelos, Privacidade, Solicitacoes, UsuarioComunidade, UsuarioMini } from '../models/comunidade';
import { Usuario } from '../models/usuario';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { IconeComponent } from '../shared/icone/icone.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { EspadasComponent } from '../shared/duelo/espadas.component';
import { DueloConviteComponent } from '../modal/duelo-convite/duelo-convite.component';
import { formatarNumero } from '../shared/dia';

type Aba = 'amigos' | 'solicitacoes' | 'duelos';

@Component({
  selector: 'app-comunidade',
  standalone: true,
  imports: [FormsModule, RouterLink, AvatarComponent, IconeComponent, CarregandoComponent, EspadasComponent, DueloConviteComponent],
  templateUrl: './comunidade.component.html',
  styleUrl: './comunidade.component.css'
})
export class ComunidadeComponent implements OnInit, OnDestroy {
  private comunidade = inject(ComunidadeService);
  private auth = inject(AuthServiceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subs: Subscription[] = [];
  private termo$ = new Subject<string>();

  readonly formatarNumero = formatarNumero;
  readonly nomeDoDia = nomeDoDia;

  usuario: Usuario | null = null;
  aba: Aba = 'amigos';
  termo = '';
  buscando = false;
  resultados: UsuarioComunidade[] | null = null;

  amigos: UsuarioComunidade[] | null = null;
  solicitacoes: Solicitacoes | null = null;
  duelos: Duelos | null = null;
  ocupado = new Set<string>();
  erro = '';

  desafiando: UsuarioMini | null = null;
  privacidade: Privacidade | null = null;
  mostrarPrivacidade = false;
  salvandoPrivacidade = false;

  get logado() { return !!this.usuario && !this.usuario.demo; }
  get qtdSolicitacoes() { const s = this.solicitacoes; return s ? s.amizadesRecebidas.length + s.duelosRecebidos.length : (this.comunidade.notificacoes ? this.comunidade.notificacoes.amizades + this.comunidade.notificacoes.duelos : 0); }
  get aoVivo(): Duelo[] { return this.duelos?.agendados.filter(d => d.status === 'AO_VIVO') ?? []; }
  get futuros(): Duelo[] { return this.duelos?.agendados.filter(d => d.status !== 'AO_VIVO') ?? []; }

  ngOnInit() {
    this.subs.push(this.auth.usuario$.subscribe(u => {
      const antes = this.logado;
      this.usuario = u;
      if (this.logado && !antes) this.carregarAba();
    }));
    this.subs.push(this.route.queryParamMap.subscribe(q => {
      const a = q.get('aba') as Aba | null;
      if (a && ['amigos', 'solicitacoes', 'duelos'].includes(a) && a !== this.aba) { this.aba = a; this.carregarAba(); }
    }));
    this.subs.push(this.termo$.pipe(
      debounceTime(260),
      distinctUntilChanged(),
      switchMap(t => {
        const q = t.trim().replace(/^@/, '');
        if (q.length < 2) { this.buscando = false; return of(null); }
        this.buscando = true;
        return this.comunidade.buscar(q).pipe(catchError(() => of([] as UsuarioComunidade[])));
      })
    ).subscribe(r => { this.buscando = false; this.resultados = r; }));
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  entrar() { this.auth.open(); }

  digitar(v: string) { this.termo = v; this.termo$.next(v); if (v.trim().replace(/^@/, '').length < 2) this.resultados = null; }
  limparBusca() { this.digitar(''); }

  trocarAba(a: Aba) {
    this.aba = a;
    this.router.navigate([], { queryParams: { aba: a }, replaceUrl: true });
    this.carregarAba();
  }

  carregarAba() {
    if (!this.logado) return;
    this.erro = '';
    if (this.aba === 'amigos') this.comunidade.amigos().subscribe({ next: a => (this.amigos = a), error: e => (this.erro = this.comunidade.erro(e)) });
    if (this.aba === 'solicitacoes') this.comunidade.solicitacoes().subscribe({ next: s => (this.solicitacoes = s), error: e => (this.erro = this.comunidade.erro(e)) });
    if (this.aba === 'duelos') this.comunidade.duelos().subscribe({ next: d => (this.duelos = d), error: e => (this.erro = this.comunidade.erro(e)) });
    if (this.aba !== 'solicitacoes' && !this.solicitacoes) this.comunidade.solicitacoes().subscribe({ next: s => (this.solicitacoes = s), error: () => {} });
  }

  abrir(u: { usuario: string }) { this.router.navigate(['/u', u.usuario]); }

  private acao(chave: string, obs: import('rxjs').Observable<unknown>, depois?: () => void) {
    if (this.ocupado.has(chave)) return;
    this.ocupado.add(chave); this.erro = '';
    obs.subscribe({
      next: () => { this.ocupado.delete(chave); depois?.(); this.carregarAba(); },
      error: e => { this.ocupado.delete(chave); this.erro = this.comunidade.erro(e); }
    });
  }

  adicionar(u: UsuarioComunidade) {
    this.acao('add' + u.id, this.comunidade.solicitarAmizade(u.usuario), () => (u.relacao = u.relacao === 'RECEBIDA' ? 'AMIGOS' : 'ENVIADA'));
  }
  aceitarAmizade(id: string) { this.acao('am' + id, this.comunidade.aceitarAmizade(id)); }
  removerAmizade(id: string) { this.acao('am' + id, this.comunidade.removerAmizade(id)); }
  aceitarDuelo(d: Duelo) { this.acao('du' + d.id, this.comunidade.aceitarDuelo(d.id)); }
  recusarDuelo(d: Duelo) { this.acao('du' + d.id, this.comunidade.recusarDuelo(d.id)); }
  cancelarDuelo(d: Duelo) { this.acao('du' + d.id, this.comunidade.cancelarDuelo(d.id)); }

  desafiar(u: UsuarioMini) { this.desafiando = { id: u.id, nome: u.nome, usuario: u.usuario, avatar: u.avatar }; }
  aoEnviarDuelo() { if (this.aba === 'duelos' || this.aba === 'solicitacoes') this.carregarAba(); }

  abrirPrivacidade() {
    this.mostrarPrivacidade = true;
    if (!this.privacidade) this.comunidade.privacidade().subscribe({ next: p => (this.privacidade = p), error: () => (this.privacidade = { perfilPrivado: false, duelosSoAmigos: false }) });
  }
  salvarPrivacidade(campo: keyof Privacidade, valor: boolean) {
    if (!this.privacidade) return;
    const novo = { ...this.privacidade, [campo]: valor };
    this.privacidade = novo; this.salvandoPrivacidade = true;
    this.comunidade.salvarPrivacidade(novo).subscribe({ next: p => { this.privacidade = p; this.salvandoPrivacidade = false; }, error: () => (this.salvandoPrivacidade = false) });
  }

  rotuloRelacao(r: string) {
    return r === 'AMIGOS' ? 'Amigos' : r === 'ENVIADA' ? 'Pedido enviado' : r === 'RECEBIDA' ? 'Quer ser seu amigo' : r === 'EU' ? 'Você' : '';
  }

  porcentagem(a: number, b: number) { const t = a + b; return t ? Math.round((a / t) * 100) : 50; }
  ocupando(chave: string) { return this.ocupado.has(chave); }
}
