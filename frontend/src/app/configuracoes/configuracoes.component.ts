import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { AuthServiceService } from '../services/auth-service.service';
import { ContaService, Disponibilidade, OpcaoEscola } from '../services/conta.service';
import { Usuario } from '../models/usuario';
import { IconeComponent } from '../shared/icone/icone.component';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { PerfilComponent } from '../perfil/perfil.component';
import { EstadoLembrete, PwaService } from '../services/pwa.service';

type Estado = { salvando: boolean; ok: string; erro: string };
const novo = (): Estado => ({ salvando: false, ok: '', erro: '' });
const semAcento = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [FormsModule, IconeComponent, AvatarComponent, PerfilComponent],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.css'
})
export class ConfiguracoesComponent implements OnInit, OnDestroy {
  private auth = inject(AuthServiceService);
  private conta = inject(ContaService);
  private router = inject(Router);
  private pwa = inject(PwaService);
  private subs = new Subscription();
  private usuario$ = new Subject<string>();
  private buscaEscola$ = new Subject<string>();

  usuario: Usuario | null = null;
  editandoAvatar = false;

  nome = '';
  nomeUsuario = '';
  disponibilidade: Disponibilidade | null = null;
  verificando = false;
  email = '';
  senhaEmail = '';
  senhaAtual = '';
  novaSenha = '';
  confirmacao = '';
  mostrarSenhas = false;

  eNome = novo();
  eUsuario = novo();
  eEmail = novo();
  eSenha = novo();
  eEscola = novo();

  escola: OpcaoEscola | null = null;
  trocandoEscola = false;
  buscaEscola = '';
  opcoesEscola: OpcaoEscola[] = [];
  buscandoEscola = false;
  lembrete: EstadoLembrete = 'carregando';

  get textoLembrete(): string {
    switch (this.lembrete) {
      case 'ativo': return 'Ativado neste aparelho. Avisamos às 10h, e às 20h se ainda faltar alguma questão.';
      case 'negado': return 'Bloqueado pelo navegador. Libere as notificações do site nas configurações dele.';
      case 'precisa-instalar': return 'No iPhone, instale o app na tela inicial para receber lembretes.';
      case 'carregando': return 'Um instante...';
      default: return 'Avisamos às 10h, e às 20h se ainda faltar alguma questão.';
    }
  }

  alternarLembrete(e: Event) {
    if ((e.target as HTMLInputElement).checked) this.pwa.ativarLembrete(); else this.pwa.desativarLembrete();
  }

  ngOnInit() {
    this.subs.add(this.pwa.lembrete$.subscribe(e => (this.lembrete = e)));
    this.subs.add(this.auth.usuario$.subscribe(u => {
      if (!u) { this.router.navigate(['/Home']); return; }
      const primeira = !this.usuario;
      this.usuario = u;
      if (primeira) {
        this.nome = u.nome ?? '';
        this.nomeUsuario = u.usuario ?? '';
        this.email = u.email ?? '';
      }
    }));
    this.subs.add(this.usuario$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(v => {
        this.verificando = true;
        return this.conta.disponivel(v).pipe(catchError(() => of(null)));
      })
    ).subscribe(d => { this.verificando = false; this.disponibilidade = d; }));
    this.subs.add(this.conta.escola().subscribe({ next: r => (this.escola = r.escola), error: () => {} }));
    this.subs.add(this.buscaEscola$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => q.length < 2 ? of([]) : this.conta.buscarEscolas(q).pipe(catchError(() => of([]))))
    ).subscribe(r => { this.buscandoEscola = false; this.opcoesEscola = r; }));
  }

  aoBuscarEscola(v: string) {
    const q = v.trim();
    this.eEscola = novo();
    this.buscandoEscola = q.length >= 2;
    if (q.length < 2) this.opcoesEscola = [];
    this.buscaEscola$.next(q);
  }

  /** "Adicionar" só aparece quando a busca terminou e nenhuma opção tem exatamente esse nome. */
  get podeAdicionarEscola(): boolean {
    const q = semAcento(this.buscaEscola);
    return q.length >= 3 && !this.buscandoEscola && !this.opcoesEscola.some(o => semAcento(o.nome) === q);
  }

  escolherEscola(o: OpcaoEscola) { this.salvarEscola({ codigo: o.codigo, idLivre: o.idLivre }); }
  adicionarEscola() { this.salvarEscola({ nome: this.buscaEscola.trim() }); }
  removerEscola() { this.salvarEscola({}, 'Escola removida.'); }

  trocarEscola() {
    this.trocandoEscola = true;
    this.buscaEscola = '';
    this.opcoesEscola = [];
    this.eEscola = novo();
  }

  private salvarEscola(escolha: { codigo?: number | null; idLivre?: number | null; nome?: string | null }, ok = 'Escola salva.') {
    const e = this.eEscola;
    e.salvando = true; e.ok = ''; e.erro = '';
    this.conta.definirEscola(escolha).subscribe({
      next: r => {
        e.salvando = false; e.ok = ok;
        this.escola = r.escola;
        this.trocandoEscola = false;
        this.buscaEscola = '';
        this.opcoesEscola = [];
      },
      error: (r: HttpErrorResponse) => {
        e.salvando = false;
        e.erro = r.status === 0 ? 'Sem conexão com o servidor.' : (r.error?.erro ?? 'Não foi possível salvar.');
      }
    });
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  aoDigitarUsuario(v: string) {
    const limpo = v.replace(/^@/, '').toLowerCase().replace(/\s+/g, '');
    if (limpo !== v) this.nomeUsuario = limpo;
    this.eUsuario = novo();
    this.disponibilidade = null;
    if (limpo && limpo !== this.usuario?.usuario) this.usuario$.next(limpo);
  }

  get nomeMudou() { return this.nome.trim() !== (this.usuario?.nome ?? '') && this.nome.trim().length >= 2; }
  get usuarioMudou() { return !!this.nomeUsuario && this.nomeUsuario !== this.usuario?.usuario; }
  get emailMudou() { return !!this.email.trim() && this.email.trim().toLowerCase() !== (this.usuario?.email ?? '').toLowerCase(); }
  get senhaValida() { return this.senhaAtual.length > 0 && this.novaSenha.length >= 8 && this.novaSenha === this.confirmacao; }

  salvarNome() {
    this.executar(this.eNome, this.conta.alterarNome(this.nome), 'Nome atualizado.');
  }

  salvarUsuario() {
    if (!this.disponibilidade?.disponivel) return;
    this.executar(this.eUsuario, this.conta.alterarUsuario(this.nomeUsuario), 'Nome de usuário atualizado.', () => (this.disponibilidade = null));
  }

  salvarEmail() {
    this.executar(this.eEmail, this.conta.alterarEmail(this.email, this.senhaEmail), 'E-mail atualizado.', () => (this.senhaEmail = ''));
  }

  salvarSenha() {
    this.executar(this.eSenha, this.conta.alterarSenha(this.senhaAtual, this.novaSenha), 'Senha alterada.', () => {
      this.senhaAtual = this.novaSenha = this.confirmacao = '';
    });
  }

  private executar(e: Estado, obs: import('rxjs').Observable<unknown>, ok: string, depois?: () => void) {
    e.salvando = true; e.ok = ''; e.erro = '';
    obs.subscribe({
      next: () => { e.salvando = false; e.ok = ok; depois?.(); },
      error: (r: HttpErrorResponse) => {
        e.salvando = false;
        e.erro = r.status === 0 ? 'Sem conexão com o servidor.' : r.status === 401 ? 'Sua sessão expirou. Entre de novo.' : (r.error?.erro ?? 'Não foi possível salvar.');
      }
    });
  }
}
