import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONES } from './icones';

@Component({
  selector: 'ed-icone',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ed-icone" [style.width.px]="tamanho" [style.height.px]="tamanho" [innerHTML]="svg"></span>`,
  host: { 'aria-hidden': 'true' },
  styles: [`
    :host { display: inline-flex; line-height: 0; flex: none; }
    .ed-icone { display: inline-flex; }
    .ed-icone ::ng-deep svg { width: 100%; height: 100%; }
  `]
})
export class IconeComponent implements OnChanges {
  private sanitizer = inject(DomSanitizer);
  @Input({ required: true }) nome = '';
  @Input() tamanho = 20;
  @Input() traco = 2;
  svg: SafeHtml = '';

  ngOnChanges(): void {
    const corpo = ICONES[this.nome] ?? '';
    this.svg = this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${this.traco}" stroke-linecap="round" stroke-linejoin="round">${corpo}</svg>`
    );
  }
}
