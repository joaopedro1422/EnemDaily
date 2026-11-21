import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SimuladoService } from '../../services/simulado.service';
import { Simulado } from '../../models/simulado';
import { Alert } from '../../alerts';
import { AuthServiceService } from '../../services/auth-service.service';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { AREAS, ChaveArea, InfoArea } from '../../shared/dia';

type Dia = '1' | '2';
const DO_DIA: Record<Dia, ChaveArea[]> = { '1': ['linguagens', 'humanas'], '2': ['naturezas', 'exatas'] };

@Component({
  selector: 'app-novo-simulado-modal',
  imports: [FormsModule, IconeComponent, CarregandoComponent],
  templateUrl: './novo-simulado-modal.component.html',
  styleUrl: './novo-simulado-modal.component.css'
})
export class NovoSimuladoModalComponent implements OnInit, OnDestroy {
  @Input() usuarioDemo?: boolean;
  @Output() close = new EventEmitter<Simulado[] | undefined>();

  dia: Dia = '1';
  data = new Date().toLocaleDateString('sv-SE');
  nome = '';
  anotacoes = '';
  acertos: Record<ChaveArea, number | null> = { linguagens: null, humanas: null, naturezas: null, exatas: null };
  enviando = false;
  erro = '';
  fechando = false;

  constructor(private simuladoService: SimuladoService, private authService: AuthServiceService) {}

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  get areasDoDia(): InfoArea[] {
    return DO_DIA[this.dia].map(c => AREAS.find(a => a.chave === c)!);
  }

  get total(): number {
    return DO_DIA[this.dia].reduce((s, c) => s + (this.acertos[c] ?? 0), 0);
  }

  get valido(): boolean {
    return DO_DIA[this.dia].every(c => {
      const v = this.acertos[c];
      return v !== null && v >= 0 && v <= 45;
    }) && !!this.data;
  }

  ajustar(c: ChaveArea, passo: number) {
    const v = (this.acertos[c] ?? 0) + passo;
    this.acertos[c] = Math.max(0, Math.min(45, v));
    this.erro = '';
  }

  normalizar(c: ChaveArea) {
    const v = this.acertos[c];
    if (v === null || v === undefined || isNaN(v as number)) return;
    this.acertos[c] = Math.max(0, Math.min(45, Math.round(v)));
  }

  @HostListener('document:keydown.escape')
  fechar(lista?: Simulado[]) {
    if (this.fechando || (this.enviando && !lista)) return;
    this.fechando = true;
    setTimeout(() => this.close.emit(lista), 240);
  }

  salvar() {
    if (!this.valido || this.enviando) {
      if (!this.valido) this.erro = 'Informe os acertos das duas áreas (de 0 a 45).';
      return;
    }
    if (this.usuarioDemo) {
      this.close.emit();
      setTimeout(() => this.authService.open(), 400);
      return;
    }
    this.enviando = true;
    const v = (c: ChaveArea) => (DO_DIA[this.dia].includes(c) ? this.acertos[c] ?? 0 : 0);
    this.simuladoService.salvaSimulado({
      dia: this.dia,
      data: this.data,
      linguagens: v('linguagens'),
      humanas: v('humanas'),
      naturezas: v('naturezas'),
      exatas: v('exatas'),
      nome: this.nome.trim(),
      anotacoes: this.anotacoes.trim()
    }).subscribe({
      next: res => {
        this.enviando = false;
        Alert.toast('Simulado registrado!');
        this.fechar(res);
      },
      error: () => {
        this.enviando = false;
        this.erro = 'Não foi possível salvar agora. Tente de novo.';
      }
    });
  }
}
