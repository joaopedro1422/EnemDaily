import { ChangeDetectionStrategy, Component, Input, OnChanges, ViewEncapsulation, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DadosCapa, svgCapa } from './capas';
import { ESTILO_CAPAS } from './capas.estilo';


let id = 0;

@Component({
  selector: 'ed-capa',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="ed-capa-arte" [class.ed-capa-parada]="!animar" [innerHTML]="arte" [style.height]="'100%'"></div>`,
  styles: [ESTILO_CAPAS + ` ed-capa .ed-capa-arte { width: 100%; height: 100%; }`]
})
export class CapaComponent implements OnChanges {
  private sanitizer = inject(DomSanitizer);
  @Input() codigo: string | null | undefined = null;
  @Input() dados: DadosCapa = {};
  @Input() animar = true;
  arte: SafeHtml = '';
  readonly instancia = ++id;

  ngOnChanges() {
    this.arte = this.sanitizer.bypassSecurityTrustHtml(svgCapa(this.codigo || 'caderno', this.dados));
  }
}
