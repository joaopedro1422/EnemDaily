import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { AuthServiceService } from '../../services/auth-service.service';
import { ComunidadeService, isoDe } from '../../services/comunidade.service';
import { Duelo, UsuarioMini } from '../../models/comunidade';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { EspadasComponent } from '../../shared/duelo/espadas.component';

interface OpcaoDia { iso: string; topo: string; numero: string; titulo: string; ok: boolean; }

@Component({
  selector: 'app-duelo-convite',
  standalone: true,
  imports: [AvatarComponent, IconeComponent, CarregandoComponent, EspadasComponent],
  templateUrl: './duelo-convite.component.html',
  styleUrls: ['../../shared/duelo/duelo-modal.css']
})
export class DueloConviteComponent implements OnInit {
  @Input({ required: true }) alvo!: UsuarioMini;
  @Output() fechar = new EventEmitter<void>();
  @Output() enviado = new EventEmitter<Duelo>();

  private comunidade = inject(ComunidadeService);
  private auth = inject(AuthServiceService);

  eu: UsuarioMini | null = null;
  dias: OpcaoDia[] = [];
  escolhido: string | null = null;
  motivoHoje: string | null = null;
  motivoGeral: string | null = null;
  carregando = true;
  enviando = false;
  erro = '';
  pronto: Duelo | null = null;
  fechando = false;

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.auth.usuario$.subscribe(u => { if (u) this.eu = { id: u.id, nome: u.nome, usuario: u.usuario, avatar: u.avatar }; }).unsubscribe();
    this.comunidade.disponibilidade(this.alvo.usuario).subscribe({
      next: d => {
        this.carregando = false;
        if (!d.primeiroDia) { this.motivoGeral = d.motivo ?? 'Não é possível desafiar essa pessoa.'; return; }
        this.motivoHoje = d.hoje ? null : d.motivo;
        this.montarDias(d.hoje);
      },
      error: e => { this.carregando = false; this.motivoGeral = this.comunidade.erro(e); }
    });
  }

  private montarDias(hojeLivre: boolean) {
    const base = new Date(); base.setHours(0, 0, 0, 0);
    this.dias = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() + i);
      const topo = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const titulo = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      return { iso: isoDe(d), topo, numero: String(d.getDate()), titulo, ok: i > 0 || hojeLivre };
    });
    this.escolhido = this.dias.find(d => d.ok)?.iso ?? null;
  }

  get diaEscolhido(): OpcaoDia | undefined { return this.dias.find(d => d.iso === this.escolhido); }

  enviar() {
    if (!this.escolhido || this.enviando) return;
    this.enviando = true; this.erro = '';
    this.comunidade.desafiar(this.alvo.usuario, this.escolhido).subscribe({
      next: d => { this.enviando = false; this.pronto = d; this.enviado.emit(d); },
      error: e => { this.enviando = false; this.erro = this.comunidade.erro(e); }
    });
  }

  @HostListener('document:keydown.escape')
  sair() {
    if (this.fechando) return;
    this.fechando = true;
    document.body.style.overflow = '';
    setTimeout(() => this.fechar.emit(), 240);
  }
}
