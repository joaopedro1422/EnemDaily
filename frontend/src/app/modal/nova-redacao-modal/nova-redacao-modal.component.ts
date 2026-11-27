import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Redacao } from '../../models/redacao';
import { RedacaoService } from '../../services/redacao.service';
import { Alert } from '../../alerts';
import { AuthServiceService } from '../../services/auth-service.service';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { IconeComponent } from '../../shared/icone/icone.component';
import { COMPETENCIAS, ChaveC } from '../../home-redacoes/competencias';
import { AnexoRedacao } from '../../models/redacao';
import { FirebaseServiceService } from '../../services/firebase-service.service';
import { ArquivoPreparado, MAX_FOTOS, ehPdf, prepararArquivo, tamanhoLegivel } from '../../shared/anexos/anexos';

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
  arquivos: ArquivoPreparado[] = [];
  preparando = false;
  erroArquivo = '';
  etapa = '';
  readonly tamanho = tamanhoLegivel;

  constructor(private redacaoService: RedacaoService, private authService: AuthServiceService, private firebase: FirebaseServiceService) {}

  ngOnInit() { document.body.style.overflow = 'hidden'; }
  ngOnDestroy() {
    document.body.style.overflow = '';
    this.arquivos.forEach(a => a.previa && URL.revokeObjectURL(a.previa));
  }

  get temPdf(): boolean {
    return this.arquivos.some(a => a.tipo === 'application/pdf');
  }

  get podeAdicionar(): boolean {
    return !this.temPdf && this.arquivos.length < MAX_FOTOS;
  }

  async escolherArquivos(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const lista = Array.from(input.files ?? []);
    input.value = '';
    if (!lista.length) return;
    this.erroArquivo = '';
    const pdfs = lista.filter(f => ehPdf(f));
    if (pdfs.length && (pdfs.length > 1 || lista.length > 1 || this.arquivos.length)) {
      this.erroArquivo = 'Envie 1 PDF ou até 3 fotos, sem misturar.';
      return;
    }
    const cabem = MAX_FOTOS - this.arquivos.length;
    if (!pdfs.length && lista.length > cabem) this.erroArquivo = `Cabem só mais ${cabem} ${cabem === 1 ? 'foto' : 'fotos'}: as primeiras foram anexadas.`;
    this.preparando = true;
    for (const f of pdfs.length ? pdfs : lista.slice(0, cabem)) {
      try { this.arquivos = [...this.arquivos, await prepararArquivo(f)]; }
      catch (e: any) { this.erroArquivo = e?.message ?? 'Não deu para anexar esse arquivo.'; }
    }
    this.preparando = false;
  }

  removerArquivo(i: number) {
    const a = this.arquivos[i];
    if (a?.previa) URL.revokeObjectURL(a.previa);
    this.arquivos = this.arquivos.filter((_, j) => j !== i);
    this.erroArquivo = '';
  }

  /** Sobe os arquivos para a pasta do aluno no Storage. Se algum falhar, apaga os que já subiram. */
  private async enviarArquivos(): Promise<AnexoRedacao[]> {
    const id = this.authService.getUsuario()?.id;
    if (!this.arquivos.length || !id) return [];
    const enviados: AnexoRedacao[] = [];
    try {
      for (const [i, a] of this.arquivos.entries()) {
        this.etapa = this.arquivos.length > 1 ? `Enviando ${i + 1} de ${this.arquivos.length}` : 'Enviando arquivo';
        const { caminho, url } = await this.firebase.salvaAnexoRedacao(a.blob, a.tipo, String(id));
        enviados.push({ caminho, url, nome: a.nome, tipo: a.tipo, tamanho: a.tamanho });
      }
      return enviados;
    } catch (e) {
      await this.firebase.apagaAnexosRedacao(enviados.map(a => a.caminho));
      throw e;
    }
  }

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

  async salvar() {
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
    if (this.preparando) return;
    this.enviando = true;
    this.erro = '';
    let anexos: AnexoRedacao[] = [];
    try {
      anexos = await this.enviarArquivos();
    } catch {
      this.enviando = false;
      this.etapa = '';
      this.erro = 'Não deu para enviar os arquivos. Confira a internet e tente de novo, ou salve sem eles.';
      return;
    }
    this.etapa = '';
    const v = (c: ChaveC) => (this.modo === 'comp' ? this.comp[c] ?? 0 : 0);
    this.redacaoService.salvaRedacao({ tema: this.tema.trim(), data: this.data, nota: this.total, c1: v('c1'), c2: v('c2'), c3: v('c3'), c4: v('c4'), c5: v('c5'), anexos }).subscribe({
      next: res => {
        this.enviando = false;
        Alert.toast('Redação registrada!');
        this.fechar(res);
      },
      error: err => {
        this.enviando = false;
        this.firebase.apagaAnexosRedacao(anexos.map(a => a.caminho));
        this.erro = err?.error?.erro ?? 'Não foi possível salvar agora. Tente de novo.';
      }
    });
  }
}
