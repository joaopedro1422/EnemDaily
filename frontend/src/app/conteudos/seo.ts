import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface DadosSeo { titulo: string; descricao: string; caminho: string; jsonLd?: object; }

const SITE = 'enem.daily';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  aplicar(d: DadosSeo) {
    const url = this.doc.location.origin + d.caminho;
    this.title.setTitle(`${d.titulo} | ${SITE}`);
    this.meta.updateTag({ name: 'description', content: d.descricao });
    this.meta.updateTag({ property: 'og:title', content: d.titulo });
    this.meta.updateTag({ property: 'og:description', content: d.descricao });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    let canonical = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.doc.createElement('link');
      canonical.rel = 'canonical';
      this.doc.head.appendChild(canonical);
    }
    canonical.href = url;
    this.doc.getElementById('ld-conteudo')?.remove();
    if (d.jsonLd) {
      const s = this.doc.createElement('script');
      s.type = 'application/ld+json';
      s.id = 'ld-conteudo';
      s.text = JSON.stringify(d.jsonLd);
      this.doc.head.appendChild(s);
    }
  }

  limpar() {
    this.title.setTitle(SITE);
    ['description', 'robots'].forEach(n => this.meta.removeTag(`name="${n}"`));
    ['og:title', 'og:description', 'og:type', 'og:url'].forEach(p => this.meta.removeTag(`property="${p}"`));
    this.doc.head.querySelector('link[rel="canonical"]')?.remove();
    this.doc.getElementById('ld-conteudo')?.remove();
  }
}
