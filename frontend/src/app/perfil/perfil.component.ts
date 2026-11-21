import { Component, EventEmitter, Output, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Usuario } from '../models/usuario';
import { AuthServiceService } from '../services/auth-service.service';
import { UsuarioService } from '../services/usuario.service';
import { FirebaseServiceService } from '../services/firebase-service.service';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { IconeComponent } from '../shared/icone/icone.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import {
  ConfigAvatar, MOLDURAS, MOTIVOS, Moldura, Motivo, SELOS, Selo, TINTAS,
  gravarAvatar, lerAvatar, molduraLiberada, motivoHerdado, motivoLiberado
} from '../shared/avatar/avatar';

type Aba = 'cor' | 'motivo' | 'moldura' | 'curso';
const LADO = 320;

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [AvatarComponent, IconeComponent, CarregandoComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  private authService = inject(AuthServiceService);
  private usuarioService = inject(UsuarioService);
  private firebase = inject(FirebaseServiceService);
  private sub?: Subscription;

  readonly tintas = Object.entries(TINTAS).map(([chave, t]) => ({ chave, ...t }));
  readonly motivos = MOTIVOS;
  readonly molduras = MOLDURAS;
  readonly selos = SELOS;

  usuario: Usuario | null = null;
  config!: ConfigAvatar;
  original = '';
  aba: Aba = 'cor';
  salvando = false;
  erro = '';
  fechando = false;
  private herdado: Motivo | null = null;

  recorte: { img: HTMLImageElement; url: string; zoom: number; x: number; y: number } | null = null;
  private arrasto: { px: number; py: number; x: number; y: number } | null = null;
  readonly janela = 240;

  get nome(): string { return this.usuario?.nome || this.usuario?.usuario || ''; }
  get xp(): number { return this.usuario?.xpTotal ?? 0; }
  get maiorSequencia(): number { return this.usuario?.maiorSequencia ?? this.usuario?.sequenciaAtual ?? 0; }
  get acertos(): number {
    const u = this.usuario;
    return (u?.linguagens?.acertos ?? 0) + (u?.humanas?.acertos ?? 0) + (u?.naturezas?.acertos ?? 0) + (u?.exatas?.acertos ?? 0);
  }
  get temFoto(): boolean { return !!this.config?.fotoCaminho; }
  get mudou(): boolean { return !!this.config && gravarAvatar(this.config) !== this.original; }

  ngOnInit() {
    this.sub = this.authService.usuario$.subscribe(u => {
      if (!u || this.usuario) return;
      this.usuario = u;
      this.config = lerAvatar(u.avatar, this.nome);
      this.herdado = motivoHerdado(u.avatar);
      this.original = u.avatar?.startsWith('ed1|') ? u.avatar : '';
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); if (this.recorte) URL.revokeObjectURL(this.recorte.url); }

  com(parcial: Partial<ConfigAvatar>): ConfigAvatar { return { ...this.config, ...parcial }; }

  livreMotivo(m: Motivo) { return motivoLiberado(m, this.xp, this.herdado); }
  livreMoldura(m: Moldura) { return molduraLiberada(m, this.maiorSequencia, this.acertos); }
  faltaMotivo(xp: number) { return Math.max(0, xp - this.xp); }

  escolherTinta(t: string) { this.config = this.com({ tinta: t }); }
  escolherMotivo(m: Motivo) { if (this.livreMotivo(m)) this.config = this.com({ motivo: m }); }
  escolherMoldura(m: Moldura) { if (this.livreMoldura(m)) this.config = this.com({ moldura: m }); }
  escolherSelo(s: Selo) { this.config = this.com({ selo: s }); }

  abrirArquivo(ev: Event) {
    const input = ev.target as HTMLInputElement, arquivo = input.files?.[0];
    input.value = '';
    this.erro = '';
    if (!arquivo) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(arquivo.type)) { this.erro = 'Use uma imagem JPG, PNG ou WebP.'; return; }
    if (arquivo.size > 12 * 1024 * 1024) { this.erro = 'A imagem passa de 12 MB. Escolha uma menor.'; return; }
    const url = URL.createObjectURL(arquivo), img = new Image();
    img.onload = () => {
      const capa = this.janela / Math.min(img.naturalWidth, img.naturalHeight);
      this.recorte = { img, url, zoom: 1, x: 0, y: 0 };
      this.escalaBase = capa;
    };
    img.onerror = () => { URL.revokeObjectURL(url); this.erro = 'Não foi possível abrir essa imagem.'; };
    img.src = url;
  }

  escalaBase = 1;
  get escala() { return this.escalaBase * (this.recorte?.zoom ?? 1); }
  get larguraImg() { return (this.recorte?.img.naturalWidth ?? 0) * this.escala; }
  get alturaImg() { return (this.recorte?.img.naturalHeight ?? 0) * this.escala; }

  private limitar() {
    const r = this.recorte; if (!r) return;
    const mx = Math.max(0, (this.larguraImg - this.janela) / 2), my = Math.max(0, (this.alturaImg - this.janela) / 2);
    r.x = Math.max(-mx, Math.min(mx, r.x)); r.y = Math.max(-my, Math.min(my, r.y));
  }

  mudarZoom(ev: Event) { if (!this.recorte) return; this.recorte.zoom = +(ev.target as HTMLInputElement).value; this.limitar(); }

  iniciarArrasto(ev: PointerEvent) {
    if (!this.recorte) return;
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    this.arrasto = { px: ev.clientX, py: ev.clientY, x: this.recorte.x, y: this.recorte.y };
  }
  arrastar(ev: PointerEvent) {
    if (!this.arrasto || !this.recorte) return;
    this.recorte.x = this.arrasto.x + ev.clientX - this.arrasto.px;
    this.recorte.y = this.arrasto.y + ev.clientY - this.arrasto.py;
    this.limitar();
  }
  soltar() { this.arrasto = null; }

  cancelarRecorte() { if (this.recorte) URL.revokeObjectURL(this.recorte.url); this.recorte = null; }

  async usarFoto() {
    const r = this.recorte; if (!r || !this.usuario) return;
    if (this.usuario.demo) { this.irParaCadastro(); return; }
    this.salvando = true; this.erro = '';
    try {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = LADO;
      const ctx = canvas.getContext('2d')!, k = LADO / this.janela;
      ctx.imageSmoothingQuality = 'high';
      const w = this.larguraImg * k, h = this.alturaImg * k;
      ctx.drawImage(r.img, LADO / 2 - w / 2 + r.x * k, LADO / 2 - h / 2 + r.y * k, w, h);
      const blob = await new Promise<Blob | null>(ok => canvas.toBlob(b => ok(b), 'image/webp', .86));
      const final = blob && blob.type === 'image/webp' ? blob : await new Promise<Blob | null>(ok => canvas.toBlob(b => ok(b), 'image/jpeg', .88));
      if (!final) throw new Error('sem imagem');
      const { caminho, token } = await this.firebase.salvaFotoPerfil(final, this.usuario.id, this.config.fotoCaminho);
      this.config = this.com({ fotoCaminho: caminho, fotoToken: token });
      this.cancelarRecorte();
      await this.persistir(false);
    } catch (e) {
      console.error(e);
      this.erro = 'Não conseguimos enviar a foto agora. Tente de novo.';
    } finally { this.salvando = false; }
  }

  removerFoto() {
    if (!this.config.fotoCaminho) return;
    const antigo = this.config.fotoCaminho;
    this.config = this.com({ fotoCaminho: '', fotoToken: '' });
    this.persistir(false).then(ok => { if (ok) this.firebase.apagaFotoPerfil(antigo); });
  }

  async salvar() {
    if (!this.usuario) return;
    if (this.usuario.demo) { this.irParaCadastro(); return; }
    if (!this.mudou) { this.fechar(); return; }
    this.salvando = true;
    const ok = await this.persistir(true);
    this.salvando = false;
    if (ok) this.fechar();
  }

  private persistir(avisarErro: boolean): Promise<boolean> {
    const valor = gravarAvatar(this.config);
    return new Promise(resolve => {
      this.usuarioService.alteraAvatar(valor).subscribe({
        next: () => {
          this.original = valor;
          if (this.usuario) { this.usuario = { ...this.usuario, avatar: valor }; this.authService.atualizarUsuario(this.usuario); }
          resolve(true);
        },
        error: err => { console.error(err); if (avisarErro) this.erro = 'Não deu para salvar agora. Tente de novo.'; resolve(false); }
      });
    });
  }

  private irParaCadastro() { this.fechar(); setTimeout(() => this.authService.open(), 300); }

  fechar() {
    if (this.fechando) return;
    this.fechando = true;
    setTimeout(() => this.close.emit(), 240);
  }
}
