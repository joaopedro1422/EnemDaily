import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { ChaveArea, ConfigCronograma, ConfigEntrada, dataLocal } from '../../models/cronograma';
import { infoAreaConteudo } from '../../models/conteudo';
import { IconeComponent } from '../../shared/icone/icone.component';

type Inicio = 'manter' | 'hoje' | 'segunda' | 'outra';

/** Os 4 passos para montar (ou ajustar) o cronograma: tempo por dia, foco, língua e começo. */
@Component({
  selector: 'app-montagem',
  standalone: true,
  imports: [IconeComponent],
  templateUrl: './montagem.component.html',
  styleUrl: './montagem.component.css'
})
export class MontagemComponent implements OnInit {
  @Input() config: ConfigCronograma | null = null;
  @Input({ required: true }) hoje!: string;
  @Input() estudadosAntes = 0;
  @Output() concluir = new EventEmitter<ConfigEntrada>();
  @Output() cancelar = new EventEmitter<void>();

  readonly DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  readonly PASSOS_MIN = [0, 15, 30, 45, 60, 90, 120, 150, 180, 240, 300];
  readonly ATALHOS = [30, 60, 90, 120];
  readonly AREAS: ChaveArea[] = ['natureza', 'humanas', 'matematica', 'linguagens'];
  readonly info = infoAreaConteudo;

  passo = 0;
  readonly totalPassos = 4;
  minutos = [60, 60, 60, 60, 60, 120, 0];
  foco: ChaveArea[] = [];
  lingua: 'ingles' | 'espanhol' | null = null;
  inicio: Inicio = 'hoje';
  outraData = '';
  direcao: 'frente' | 'tras' = 'frente';

  get editando(): boolean { return !!this.config; }

  ngOnInit() {
    if (this.config) {
      this.minutos = [...this.config.disponibilidade];
      this.foco = [...this.config.foco];
      this.lingua = this.config.lingua;
      this.inicio = 'manter';
    }
    this.outraData = this.hoje;
  }

  @HostListener('document:keydown.escape')
  aoEsc() { this.cancelar.emit(); }

  // ---------------------------------------------------------------- passo 1: tempo

  get totalSemana(): number { return this.minutos.reduce((a, b) => a + b, 0); }

  formatar(min: number): string {
    if (min === 0) return 'Folga';
    const h = Math.floor(min / 60), m = min % 60;
    if (!h) return `${m} min`;
    return m ? `${h} h ${m}` : `${h} h`;
  }

  mudar(dia: number, sentido: 1 | -1) {
    const atual = this.PASSOS_MIN.indexOf(this.minutos[dia]);
    const i = atual < 0 ? this.PASSOS_MIN.findIndex(p => p >= this.minutos[dia]) : atual;
    const novo = Math.min(this.PASSOS_MIN.length - 1, Math.max(0, i + sentido));
    this.minutos = this.minutos.map((m, j) => (j === dia ? this.PASSOS_MIN[novo] : m));
  }

  diasUteis(min: number) {
    this.minutos = this.minutos.map((m, j) => (j < 5 ? min : m));
  }

  atalhoAtivo(min: number): boolean {
    return this.minutos.slice(0, 5).every(m => m === min);
  }

  // ---------------------------------------------------------------- passo 2: foco

  alternarFoco(a: ChaveArea) {
    if (this.foco.includes(a)) this.foco = this.foco.filter(x => x !== a);
    else if (this.foco.length < 2) this.foco = [...this.foco, a];
    else this.foco = [this.foco[1], a];
  }

  // ---------------------------------------------------------------- passo 4: começo

  get proximaSegunda(): string {
    const d = dataLocal(this.hoje);
    const falta = ((8 - d.getDay()) % 7) || 7;
    d.setDate(d.getDate() + falta);
    return this.iso(d);
  }

  get maxData(): string {
    const d = dataLocal(this.hoje);
    d.setDate(d.getDate() + 90);
    return this.iso(d);
  }

  dataCurta(iso: string): string {
    return dataLocal(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
  }

  get dataInicio(): string {
    switch (this.inicio) {
      case 'manter': return this.config!.inicio;
      case 'segunda': return this.proximaSegunda;
      case 'outra': return this.outraData || this.hoje;
      default: return this.hoje;
    }
  }

  // ---------------------------------------------------------------- navegação

  get podeAvancar(): boolean {
    if (this.passo === 0) return this.totalSemana >= 60;
    if (this.passo === 2) return !!this.lingua;
    if (this.passo === 3) return this.inicio !== 'outra' || (!!this.outraData && this.outraData >= this.hoje && this.outraData <= this.maxData);
    return true;
  }

  voltar() {
    if (this.passo === 0) { this.cancelar.emit(); return; }
    this.direcao = 'tras';
    this.passo--;
  }

  avancar() {
    if (!this.podeAvancar) return;
    if (this.passo < this.totalPassos - 1) {
      this.direcao = 'frente';
      this.passo++;
      return;
    }
    this.concluir.emit({
      inicio: this.dataInicio,
      disponibilidade: [...this.minutos],
      foco: [...this.foco],
      lingua: this.lingua!,
      aceite: this.editando ? undefined : true
    });
  }

  private iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
