import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AnexoRedacao } from '../../models/redacao';
import { IconeComponent } from '../../shared/icone/icone.component';
import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { tamanhoLegivel } from '../../shared/anexos/anexos';

/** Lista os arquivos de uma redação para abrir ou baixar. */
@Component({
  selector: 'app-anexos-redacao',
  imports: [IconeComponent, CarregandoComponent],
  templateUrl: './anexos-redacao.component.html',
  styleUrl: './anexos-redacao.component.css'
})
export class AnexosRedacaoComponent implements OnInit, OnDestroy {
  @Input({ required: true }) anexos: AnexoRedacao[] = [];
  @Input() titulo = '';
  @Input() tema = '';
  @Output() close = new EventEmitter<void>();

  readonly tamanho = tamanhoLegivel;
  fechando = false;
  baixando: string | null = null;

  ngOnInit() { document.body.style.overflow = 'hidden'; }
  ngOnDestroy() { document.body.style.overflow = ''; }

  ehFoto(a: AnexoRedacao): boolean {
    return a.tipo.startsWith('image/');
  }

  /** Baixa como arquivo; se o navegador bloquear o download direto, abre numa aba nova (de onde dá para salvar). */
  async baixar(a: AnexoRedacao) {
    if (this.baixando) return;
    this.baixando = a.caminho;
    try {
      const resp = await fetch(a.url);
      if (!resp.ok) throw new Error(String(resp.status));
      const url = URL.createObjectURL(await resp.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = a.nome;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      window.open(a.url, '_blank', 'noopener');
    } finally {
      this.baixando = null;
    }
  }

  @HostListener('document:keydown.escape')
  fechar() {
    if (this.fechando) return;
    this.fechando = true;
    setTimeout(() => this.close.emit(), 240);
  }
}
