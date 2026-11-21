import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Redacao } from '../../models/redacao';
import { RedacaoService } from '../../services/redacao.service';
import { Alert } from '../../alerts';
import { AuthServiceService } from '../../services/auth-service.service';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { COMPETENCIAS, ChaveC } from '../../home-redacoes/competencias';

@Component({
  selector: 'app-nova-redacao-modal',
  imports: [FormsModule, IconeComponent, CarregandoComponent],
  templateUrl: './nova-redacao-modal.component.html',
  styleUrl: './nova-redacao-modal.component.css'
})
export class NovaRedacaoModalComponent implements OnInit, OnDestroy {
  @Input() usuarioDemo?: boolean;
  @Output() close = new EventEmitter<Redacao[] | undefined>();

  readonly competencias = COMPETENCIAS;
  readonly niveis = [0, 40, 80, 120, 160, 200];
  modo: 'comp' | 'nota' = 'comp';
  data = new Date().toLocaleDateString('sv-SE');
  tema = '';
  comp: Record<ChaveC, number | null> = { c1: null, c2: null, c3: null, c4: null, c5: null };
  notaManual: number | null = null;
  enviando = false;
  erro = '';
  fechando = false;

  constructor(private redacaoService: RedacaoService, private authService: AuthServiceService) {}

  ngOnInit() { document.body.style.overflow = 'hidden'; }
  ngOnDestroy() { document.body.style.overflow = ''; }

  get total(): number {
    if (this.modo === 'nota') return this.notaManual ?? 0;
    return COMPETENCIAS.reduce((s, c) => s + (this.comp[c.chave] ?? 0), 0);
  }

  get preenchidas(): number {
    return COMPETENCIAS.filter(c => this.comp[c.chave] !== null).length;
  }

  get valido(): boolean {
    if (!this.data) return false;
    if (this.modo === 'nota') return this.notaManual !== null && this.notaManual >= 0 && this.notaManual <= 1000;
    return this.preenchidas === 5;
  }

  escolher(c: ChaveC, v: number) {
    this.comp[c] = v;
    this.erro = '';
  }

  ajustarNota(passo: number) {
    this.notaManual = Math.max(0, Math.min(1000, (this.notaManual ?? 0) + passo));
    this.erro = '';
  }

  normalizarNota() {
    if (this.notaManual === null || isNaN(this.notaManual)) return;
    this.notaManual = Math.max(0, Math.min(1000, Math.round(this.notaManual / 20) * 20));
  }

  @HostListener('document:keydown.escape')
  fechar(lista?: Redacao[]) {
    if (this.fechando || (this.enviando && !lista)) return;
    this.fechando = true;
    setTimeout(() => this.close.emit(lista), 240);
  }

  salvar() {
    if (this.enviando) return;
    if (!this.valido) {
      this.erro = this.modo === 'comp' ? 'Escolha a nota das 5 competências.' : 'Informe a nota final, de 0 a 1000.';
      return;
    }
    if (this.usuarioDemo) {
      this.close.emit();
      setTimeout(() => this.authService.open(), 400);
      return;
    }
    this.enviando = true;
    const v = (c: ChaveC) => (this.modo === 'comp' ? this.comp[c] ?? 0 : 0);
    this.redacaoService.salvaRedacao({ tema: this.tema.trim(), data: this.data, nota: this.total, c1: v('c1'), c2: v('c2'), c3: v('c3'), c4: v('c4'), c5: v('c5') }).subscribe({
      next: res => {
        this.enviando = false;
        Alert.toast('Redação registrada!');
        this.fechar(res);
      },
      error: () => {
        this.enviando = false;
        this.erro = 'Não foi possível salvar agora. Tente de novo.';
      }
    });
  }
}
