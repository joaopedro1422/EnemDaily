import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConfigAvatar, gravarAvatar, lerAvatar, svgDoAvatar } from './avatar';

@Component({
  selector: 'ed-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.encher]': 'encher' },
  template: `<span class="ed-av" [style.width]="encher ? '100%' : tamanho + 'px'" [style.height]="encher ? '100%' : tamanho + 'px'" [innerHTML]="svg"></span>`,
  styles: [`:host{display:inline-flex;flex:none;line-height:0}:host(.encher){width:100%;height:100%}.ed-av{display:block;border-radius:50%}.ed-av ::ng-deep svg{width:100%;height:100%;display:block}`]
})
export class AvatarComponent implements OnChanges {
  @Input() valor: string | null | undefined = '';
  @Input() config: ConfigAvatar | null = null;
  @Input() nome = '';
  @Input() tamanho = 40;
  @Input() seloDesde = 64;
  @Input() encher = false;

  svg: SafeHtml = '';
  private chave = '';
  private sanitizer = inject(DomSanitizer);

  ngOnChanges() {
    const c = this.config ?? lerAvatar(this.valor, this.nome), comSelo = this.tamanho >= this.seloDesde;
    const chave = gravarAvatar(c) + '#' + this.nome + '#' + comSelo;
    if (chave === this.chave) return;
    this.chave = chave;
    this.svg = this.sanitizer.bypassSecurityTrustHtml(svgDoAvatar(c, this.nome, comSelo));
  }
}
