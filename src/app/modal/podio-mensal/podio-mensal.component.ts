import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import confetti from 'canvas-confetti';
import { GrupoService } from '../../services/grupo.service';
import { PodioResponse, UsuarioPodio } from '../../models/grupo';
import { IconeComponent } from '../../shared/icone/icone.component';
import { formatarNumero } from '../../shared/dia';

const REVELAR = [2100, 1350, 700];

@Component({
  selector: 'app-podio-mensal',
  imports: [AvatarComponent, IconeComponent, CarregandoComponent],
  templateUrl: './podio-mensal.component.html',
  styleUrl: './podio-mensal.component.css'
})
export class PodioMensalComponent implements OnInit, OnDestroy {
  @Input() idGrupo!: string;
  @Input() nomeGrupo = '';
  @Output() close = new EventEmitter<void>();

  podio: UsuarioPodio[] = [];
  posicaoUsuario = 0;
  carregando = true;
  fechando = false;
  xp: number[] = [0, 0, 0];
  readonly formatarNumero = formatarNumero;
  readonly mes = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleString('pt-BR', { month: 'long' });
  private timers: any[] = [];

  constructor(private grupoService: GrupoService) {}

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.grupoService.getPodioMensal(this.idGrupo).subscribe({
      next: res => this.mostrar(res),
      error: () => (this.carregando = false)
    });
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    this.timers.forEach(clearTimeout);
  }

  private mostrar(res: PodioResponse) {
    this.podio = (res.usuarios ?? []).slice(0, 3);
    this.posicaoUsuario = res.posicaoUsuarioLogado ?? 0;
    this.carregando = false;
    if (!this.podio.length) return;
    const audio = new Audio('podio.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
    this.podio.forEach((p, i) => this.timers.push(setTimeout(() => this.contar(i, p.xp ?? 0), REVELAR[i] + 350)));
    this.timers.push(setTimeout(() => this.festejar(), REVELAR[0] + 450));
  }

  @HostListener('document:keydown.escape')
  fechar() {
    if (this.fechando) return;
    this.fechando = true;
    this.timers.push(setTimeout(() => this.close.emit(), 320));
  }

  inicial(nome: string): string {
    return (nome ?? '?').trim().charAt(0).toUpperCase();
  }

  atraso(i: number): string {
    return `${REVELAR[i]}ms`;
  }

  get mensagemUsuario(): string {
    const p = this.posicaoUsuario;
    if (p === 1) return 'Você foi o campeão do mês!';
    if (p === 2 || p === 3) return `Você ficou em ${p}º lugar. Que mês!`;
    if (p > 3) return `Você terminou em ${p}º. Um novo mês começa agora.`;
    return '';
  }

  private contar(i: number, ate: number) {
    const inicio = performance.now();
    const dur = 1100;
    const passo = (t: number) => {
      const k = Math.min(1, (t - inicio) / dur);
      this.xp[i] = Math.round(ate * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  private festejar() {
    const cores = ['#F2C94C', '#FFFFFF', '#6E7BFF', '#E0A174'];
    const base = { colors: cores, disableForReducedMotion: true, zIndex: 1300, ticks: 220, scalar: .9 };
    confetti({ ...base, particleCount: 90, spread: 80, startVelocity: 42, origin: { x: .5, y: .42 } });
    this.timers.push(setTimeout(() => {
      confetti({ ...base, particleCount: 45, angle: 60, spread: 60, origin: { x: 0, y: .7 } });
      confetti({ ...base, particleCount: 45, angle: 120, spread: 60, origin: { x: 1, y: .7 } });
    }, 250));
  }
}
