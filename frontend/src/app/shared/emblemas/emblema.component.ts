import { ChangeDetectionStrategy, Component, Input, OnChanges, ViewEncapsulation, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ESTILO_EMBLEMAS, svgEmblema } from './emblemas';

@Component({
  selector: 'ed-emblema',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ed-emblema-arte" [innerHTML]="arte"></span>`,
  styles: [ESTILO_EMBLEMAS + ` ed-emblema .ed-emblema-arte { display: block; width: 100%; height: 100%; }`]
})
export class EmblemaComponent implements OnChanges {
  private sanitizer = inject(DomSanitizer);
  @Input({ required: true }) codigo!: string;
  @Input() animar = true;
  arte: SafeHtml = '';

  ngOnChanges() {
    this.arte = this.sanitizer.bypassSecurityTrustHtml(svgEmblema(this.codigo, this.animar));
  }
}
