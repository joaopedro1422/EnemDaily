import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaginaConteudo, infoAreaConteudo } from '../../models/conteudo';
import { IconeComponent } from '../../shared/icone/icone.component';
import { QuestaoInterativaComponent } from '../../shared/questao/questao-interativa.component';

@Component({
  selector: 'app-conteudo-artigo',
  standalone: true,
  imports: [RouterLink, IconeComponent, QuestaoInterativaComponent],
  templateUrl: './conteudo-artigo.component.html',
  styleUrl: './conteudo-artigo.component.css'
})
export class ConteudoArtigoComponent {
  @Input({ required: true }) pagina!: PaginaConteudo;
  @Input() logado = false;
  @Input() previa = false;
  @Output() criarConta = new EventEmitter<void>();
  @Output() irAoDesafio = new EventEmitter<void>();

  respondeu = false;
  acertou = false;

  get area() { return infoAreaConteudo(this.pagina.area); }

  get minutosLeitura(): number {
    const texto = [this.pagina.resumo, this.pagina.comoCai, this.pagina.paraNaoErrar].join(' ').replace(/<[^>]+>/g, ' ');
    const palavras = texto.split(/\s+/).filter(Boolean).length;
    return Math.max(2, Math.round(palavras / 200));
  }

  get dataAtualizacao(): string {
    const d = this.pagina.atualizadoEm ? new Date(this.pagina.atualizadoEm) : null;
    return d ? d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  }

  aoResponder(acertou: boolean) {
    this.respondeu = true;
    this.acertou = acertou;
  }

  irPara(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
