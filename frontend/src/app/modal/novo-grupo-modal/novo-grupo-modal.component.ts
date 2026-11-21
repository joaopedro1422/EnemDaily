import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseServiceService } from '../../services/firebase-service.service';
import { GrupoService } from '../../services/grupo.service';
import { AuthServiceService } from '../../services/auth-service.service';
import { Alert } from '../../alerts';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { AREAS, ChaveArea } from '../../shared/dia';

const IMAGEM_PADRAO = 'https://firebasestorage.googleapis.com/v0/b/enemdaily.firebasestorage.app/o/perfil-grupo%2Fteste4?alt=media&token=9308f01d-afba-4e19-84a0-182536f70b4f';

@Component({
  selector: 'app-novo-grupo-modal',
  imports: [FormsModule, IconeComponent, CarregandoComponent],
  templateUrl: './novo-grupo-modal.component.html',
  styleUrl: './novo-grupo-modal.component.css'
})
export class NovoGrupoModalComponent implements OnInit, OnDestroy {
  @Input() usuarioDemo?: boolean;
  @Output() close = new EventEmitter<void>();

  readonly areas = AREAS;
  readonly limiteNome = 30;
  nome = '';
  privacidade: 'privado' | 'publico' = 'privado';
  selecionadas: Record<ChaveArea, boolean> = { linguagens: true, humanas: true, naturezas: true, exatas: true };
  img?: File;
  previa = '';
  enviando = false;
  criado = false;
  erro = '';
  fechando = false;
  private musica = new Audio('som-grupo.mp3');

  constructor(private firebaseService: FirebaseServiceService, private grupoService: GrupoService, private authService: AuthServiceService, private router: Router) {}

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    if (this.previa) URL.revokeObjectURL(this.previa);
  }

  @HostListener('document:keydown.escape')
  fechar() {
    if (this.fechando || this.enviando) return;
    this.fechando = true;
    setTimeout(() => this.close.emit(), 240);
  }

  get qtdAreas(): number {
    return AREAS.filter(a => this.selecionadas[a.chave]).length;
  }

  get valido(): boolean {
    return this.nome.trim().length >= 4 && this.qtdAreas > 0;
  }

  alternar(chave: ChaveArea) {
    this.selecionadas[chave] = !this.selecionadas[chave];
  }

  escolherImagem(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (this.previa) URL.revokeObjectURL(this.previa);
    this.img = file;
    this.previa = URL.createObjectURL(file);
  }

  async criar() {
    if (!this.valido || this.enviando) return;
    if (this.usuarioDemo) {
      this.close.emit();
      setTimeout(() => this.authService.open(), 400);
      return;
    }
    this.enviando = true;
    this.erro = '';
    try {
      this.musica.volume = 0;
      await this.musica.play();
    } catch {}
    let url = IMAGEM_PADRAO;
    if (this.img) {
      try {
        url = await this.firebaseService.salvaImagem(this.img, `${this.nome.trim()}-${Date.now()}`);
      } catch {
        this.enviando = false;
        this.erro = 'Não foi possível enviar a foto. Tente outra imagem ou crie sem foto.';
        return;
      }
    }
    this.grupoService.criarGrupo({
      nome: this.nome.trim(),
      publico: this.privacidade === 'publico',
      img: url,
      linguagens: this.selecionadas.linguagens,
      humanas: this.selecionadas.humanas,
      naturezas: this.selecionadas.naturezas,
      exatas: this.selecionadas.exatas
    }).subscribe({
      next: res => {
        this.criado = true;
        this.musica.currentTime = 0;
        this.musica.volume = 1;
        this.musica.play().catch(() => {});
        this.authService.atualizarUsuario(res.usuarioRet);
        setTimeout(() => {
          this.close.emit();
          this.router.navigate(['/grupo', res.idGrupo]);
          Alert.toast('Grupo criado! Agora convide seus amigos.');
        }, 1600);
      },
      error: () => {
        this.enviando = false;
        this.erro = 'Não foi possível criar o grupo agora. Tente de novo.';
      }
    });
  }
}
