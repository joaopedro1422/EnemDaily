import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { ConfigAvatar, TINTAS, avatarPadrao, gravarAvatar } from '../../shared/avatar/avatar';
import { AuthServiceService } from '../../services/auth-service.service';
import { Alert } from '../../alerts';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { SimboloDiaComponent } from '../../shared/simbolo-dia/simbolo-dia.component';

type Modo = 'login' | 'cadastro' | 'avatar' | 'rec-email' | 'rec-codigo' | 'rec-novaSenha';

@Component({
  selector: 'app-auth-modal',
  imports: [FormsModule, IconeComponent, SimboloDiaComponent, CarregandoComponent, AvatarComponent],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.css'
})
export class AuthModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChildren('codigoInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly tintas = Object.entries(TINTAS).map(([chave, t]) => ({ chave, ...t }));
  tintaEscolhida = '';
  get configCadastro(): ConfigAvatar { const p = avatarPadrao(this.nome || this.usuario); return this.tintaEscolhida ? { ...p, tinta: this.tintaEscolhida } : p; }
  modo: Modo = 'login';
  fechando = false;
  carregando = false;
  verSenha = false;

  emailLogin = '';
  senhaLogin = '';
  erroLogin = '';
  aviso = '';

  nome = '';
  email = '';
  senhaCadastro = '';
  senhaConfirmacao = '';
  erroEmail = '';
  usuario = '';
  erroUsuario = '';

  emailRecuperacao = '';
  erroRecuperacao = '';
  codigo: string[] = ['', '', '', '', '', ''];
  erroCodigo = '';
  senhaNova = '';
  senhaNovaConfirmacao = '';
  private musica = new Audio('som-grupo.mp3');
  private audioLiberado = false;

  constructor(private authService: AuthServiceService) {}

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  fechar() {
    if (this.fechando) return;
    this.fechando = true;
    setTimeout(() => {
      this.authService.close();
      this.close.emit();
    }, 280);
  }

  irPara(modo: Modo) {
    this.modo = modo;
    this.erroLogin = this.erroRecuperacao = this.erroCodigo = '';
    this.verSenha = false;
  }

  get primeiroNome(): string {
    return this.nome.trim().split(/\s+/)[0] ?? '';
  }

  regras(senha: string) {
    return [
      { ok: senha.length >= 6, texto: '6 ou mais caracteres' },
      { ok: /\d/.test(senha), texto: 'Pelo menos 1 número' },
      { ok: senha.length > 0 && !/\s/.test(senha), texto: 'Sem espaços' }
    ];
  }

  senhaValida(senha: string): boolean {
    return /^(?=.*\d)[^\s]{6,}$/.test(senha);
  }

  get emailValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(this.email.trim());
  }

  get cadastroOk(): boolean {
    return this.nome.trim().length > 1 && this.emailValido && this.senhaValida(this.senhaCadastro) && this.senhaCadastro === this.senhaConfirmacao;
  }

  get usuarioOk(): boolean {
    return this.usuario.length >= 5;
  }

  get novaSenhaOk(): boolean {
    return this.senhaValida(this.senhaNova) && this.senhaNova === this.senhaNovaConfirmacao;
  }

  login() {
    if (this.carregando || !this.emailLogin || !this.senhaLogin) return;
    this.carregando = true;
    this.erroLogin = '';
    this.authService.login({ email: this.emailLogin.trim(), senha: this.senhaLogin }).subscribe({
      next: () => {
        this.carregando = false;
        this.fechar();
      },
      error: () => {
        this.carregando = false;
        this.erroLogin = 'E-mail ou senha incorretos.';
      }
    });
  }

  continuarCadastro() {
    if (!this.cadastroOk) return;
    this.erroEmail = '';
    this.irPara('avatar');
  }

  limparUsuario() {
    this.usuario = this.usuario.replace(/\s+/g, '');
    this.erroUsuario = '';
  }

  escolherTinta(t: string) {
    this.tintaEscolhida = t;
  }

  async registrar() {
    if (this.carregando || !this.usuarioOk) return;
    this.carregando = true;
    try {
      this.musica.volume = 0;
      await this.musica.play();
      this.audioLiberado = true;
    } catch {}
    this.authService.register({ nome: this.nome.trim(), usuario: this.usuario.trim(), email: this.email.trim(), senha: this.senhaCadastro, avatar: gravarAvatar(this.configCadastro), demo: false }).subscribe({
      next: () => {
        this.carregando = false;
        this.fechar();
        setTimeout(() => {
          if (this.audioLiberado) {
            this.musica.currentTime = 0;
            this.musica.volume = 1;
            this.musica.play().catch(() => {});
          }
          Alert.toast('Tudo pronto! Bem-vindo(a) ao enem.daily.');
        }, 400);
      },
      error: err => {
        this.carregando = false;
        if (err.error === 'email_ja_existe') {
          this.erroEmail = 'Este e-mail já tem uma conta.';
          this.irPara('cadastro');
        } else if (err.error === 'usuario_ja_existe') {
          this.erroUsuario = 'Esse nome de usuário já está em uso.';
        } else {
          this.erroUsuario = 'Não foi possível criar sua conta agora. Tente de novo.';
        }
      }
    });
  }

  enviarCodigo() {
    if (this.carregando || !this.emailRecuperacao) return;
    this.carregando = true;
    this.erroRecuperacao = '';
    this.authService.enviaCodigo(this.emailRecuperacao.trim()).subscribe({
      next: () => {
        this.carregando = false;
        this.codigo = ['', '', '', '', '', ''];
        this.irPara('rec-codigo');
        setTimeout(() => this.inputs?.first?.nativeElement.focus(), 50);
      },
      error: err => {
        this.carregando = false;
        const msg = typeof err.error === 'string' ? err.error : '';
        this.erroRecuperacao = msg.startsWith('Aguarde') ? 'Aguarde um minuto para pedir outro código.'
          : err.status === 400 ? 'Não encontramos uma conta com esse e-mail.' : 'Não foi possível enviar o código agora.';
      }
    });
  }

  get codigoCompleto(): boolean {
    return this.codigo.every(c => /^\d$/.test(c));
  }

  digitarCodigo(i: number, e: Event) {
    const el = e.target as HTMLInputElement;
    const digitos = el.value.replace(/\D/g, '');
    if (digitos.length > 1) {
      digitos.slice(0, 6 - i).split('').forEach((d, k) => (this.codigo[i + k] = d));
      const prox = Math.min(5, i + digitos.length);
      setTimeout(() => this.inputs.get(prox)?.nativeElement.focus());
    } else {
      this.codigo[i] = digitos;
      el.value = digitos;
      if (digitos && i < 5) this.inputs.get(i + 1)?.nativeElement.focus();
    }
    this.erroCodigo = '';
    if (this.codigoCompleto) this.verificarCodigo();
  }

  apagarCodigo(i: number, e: KeyboardEvent) {
    if (e.key === 'Backspace' && !this.codigo[i] && i > 0) {
      this.codigo[i - 1] = '';
      this.inputs.get(i - 1)?.nativeElement.focus();
    }
  }

  verificarCodigo() {
    if (!this.codigoCompleto || this.carregando) return;
    this.carregando = true;
    this.authService.verificaCodigo(this.emailRecuperacao.trim(), this.codigo.join('')).subscribe({
      next: () => {
        this.carregando = false;
        this.irPara('rec-novaSenha');
      },
      error: () => {
        this.carregando = false;
        this.erroCodigo = 'Código incorreto ou expirado. Confira o e-mail e tente de novo.';
      }
    });
  }

  salvarSenha() {
    if (!this.novaSenhaOk || this.carregando) return;
    this.carregando = true;
    this.authService.salvaSenha(this.senhaNova, this.emailRecuperacao.trim(), this.codigo.join('')).subscribe({
      next: () => {
        this.carregando = false;
        this.emailLogin = this.emailRecuperacao.trim();
        this.senhaLogin = this.senhaNova = this.senhaNovaConfirmacao = '';
        this.irPara('login');
        this.aviso = 'Senha alterada. Entre com a nova senha.';
      },
      error: () => {
        this.carregando = false;
        this.erroCodigo = 'Não foi possível salvar a nova senha.';
      }
    });
  }
}
