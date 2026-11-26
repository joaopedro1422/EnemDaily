import { Paleta, Predio, iso, f1, shade, mix, box, faceX, faceY, linha3, arvore, poste, canteiro, sebe } from './motor';
import { Peca, Trilha } from './pecas';


type Area = Exclude<Trilha, 'geral'>;

type PredioAcab = Predio & { sem?: Efeito[] };

const PREDIOS: Record<Area, PredioAcab[]> = {
  linguagens: [
    { x: 5.7, y: 7.0, w: 3.6, d: 3.0, z0: .25, h: 1.5, sem: ['toldos', 'brasao', 'pintura', 'floreiras'] }, { x: 2.6, y: 3.9, w: 1.9, d: 1.4, z0: .2, h: 1.25 }, { x: 7.8, y: 2.8, w: 1.9, d: 2.2, z0: .25, h: 1.15 }
  ],
  humanas: [{ x: .55, y: 23.6, w: 2.7, d: 1.75, z0: .25, h: 1.25, sem: ['toldos', 'brasao', 'pintura'] }, { x: 3.9, y: 24.3, w: 3.9, d: 1.4, z0: .2, h: 1.3, sem: ['brasao', 'pintura', 'toldos'] }],
  naturezas: [{ x: 20.6, y: 23.6, w: 2.6, d: 2.0, z0: .25, h: 1.25, sem: ['toldos', 'brasao', 'pintura', 'floreiras'] }, { x: 16.6, y: 23.5, w: 3.0, d: 1.9, z0: .25, h: 1.4 }],
  exatas: [{ x: 21.3, y: 7.9, w: 2.8, d: 3.1, z0: .25, h: 1.2, sem: ['toldos', 'brasao', 'pintura', 'floreiras'] }, { x: 16.4, y: 2.85, w: 4.2, d: 2.0, z0: .25, h: 1.25, sem: ['toldos', 'brasao'] }]
};

const LOTE: Record<Area, [number, number, number, number]> = {
  linguagens: [0, 2.4, 10, 12.4], humanas: [0, 16, 10, 26], naturezas: [16, 16, 26, 26], exatas: [16, 2.4, 26, 12.4]
};

const LIVRE: Partial<Record<Area, [number, number]>> = { humanas: [0, 10], naturezas: [20.4, 23.4], linguagens: [8, 10] };
const livre = (t: Area, x: number) => { const l = LIVRE[t]; return !!l && x >= l[0] && x <= l[1]; };

export type Efeito = 'floreiras' | 'toldos' | 'friso' | 'luzes' | 'vasos' | 'brasao' | 'sebe' | 'postes' | 'arvores' | 'bandeiras' | 'pintura';

export const NIVEIS_ACABAMENTO: [Efeito, number][] = [
  ['floreiras', 1], ['sebe', 1], ['toldos', 1], ['friso', 1], ['arvores', 1], ['vasos', 1], ['luzes', 1], ['postes', 1], ['brasao', 1], ['bandeiras', 1], ['pintura', 1],
  ['floreiras', 2], ['friso', 2], ['toldos', 2], ['arvores', 2], ['luzes', 2], ['vasos', 2], ['sebe', 2], ['pintura', 2], ['bandeiras', 2], ['brasao', 2], ['postes', 2],
  ['floreiras', 3], ['friso', 3], ['luzes', 3], ['arvores', 3], ['pintura', 3], ['brasao', 3]
];

export const NOMES_EFEITO: Record<Efeito, string> = {
  floreiras: 'Floreiras nas fachadas', toldos: 'Toldos nas entradas', friso: 'Friso colorido nos prédios', luzes: 'Varais de luz', vasos: 'Vasos nos cantos',
  brasao: 'Brasão da área nas fachadas', sebe: 'Sebe em volta da região', postes: 'Postes na borda da região', arvores: 'Árvores na borda da região',
  bandeiras: 'Bandeiras da área', pintura: 'Pintura do térreo'
};

const OURO = '#E8B931';
const corDe = (P: Paleta, t: Area) => (t === 'linguagens' ? P.lc : t === 'humanas' ? P.ch : t === 'naturezas' ? P.cn : P.mt);
const chaveDe = (b: Predio) => b.x + b.w / 2 + b.y + b.d / 2;

function efeitoNoPredio(e: Efeito, g: number, b: Predio, P: Paleta, cor: string): string {
  const X = b.x + b.w, Y = b.y + b.d, z = b.z0;
  switch (e) {
    case 'floreiras': {
      const flores = g === 1 ? [cor, P.branco] : g === 2 ? [cor, '#F2C94C', P.branco, '#F0506E'] : [cor, '#F2C94C', '#F0506E', '#8C7BFF', P.branco];
      return canteiro(b.x + .2, Y + .05, Math.max(.6, b.w - .4), .22, P, 7 + g, flores) + canteiro(X + .05, b.y + .2, .22, Math.max(.6, b.d - .4), P, 9 + g, flores);
    }
    case 'toldos': {
      const c1 = g === 1 ? cor : mix(cor, '#FFFFFF', .15), c2 = g === 1 ? shade(cor, .85) : P.branco;
      const w = Math.min(1.6, b.w * .5), xc = b.x + b.w / 2, zt = z + Math.min(1.1, b.h * .75);
      let o = '';
      const n = g === 1 ? 1 : 4;
      for (let i = 0; i < n; i++) o += box(xc - w / 2 + (i * w) / n, Y, zt, w / n, .45, .06, i % 2 ? c2 : c1);
      return o;
    }
    case 'friso': {
      const c = g === 1 ? cor : g === 2 ? mix(cor, OURO, .5) : OURO;
      const faixa = (z0: number, alt: number) => faceY(Y + .006, b.x, X, z0, z0 + alt, c) + faceX(X + .006, b.y, Y, z0, z0 + alt, shade(c, .85));
      return faixa(z + b.h - .16, .14) + (g === 3 ? faixa(z + .02, .08) : '');
    }
    case 'luzes': {
      if (!P.noite) return '';
      const zl = z + b.h * .92, cores = g === 3 ? [OURO] : g === 2 ? [cor, '#F2C94C', P.branco] : ['#FFE9A8'];
      let o = linha3([[b.x, Y + .02, zl], [X, Y + .02, zl], [X + .02, b.y, zl]], P.ferro, .5, ' opacity=".7"');
      const passos = Math.round((b.w + b.d) / .35);
      for (let k = 0; k <= passos; k++) {
        const f = k / passos, len = b.w + b.d, dist = f * len;
        const pt = dist <= b.w ? iso(b.x + dist, Y + .02, zl - .05) : iso(X + .02, Y - (dist - b.w), zl - .05);
        o += `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${(k * .3) % 2.4}s" cx="${f1(pt[0])}" cy="${f1(pt[1] + 1)}" r="${P.noite ? 1.6 : 1.1}" fill="${cores[k % cores.length]}"/>`;
      }
      return o;
    }
    case 'vasos': {
      const v = (x: number, y: number) => box(x - .12, y - .12, 0, .24, .24, .22, g === 3 ? OURO : shade(P.concreto, .9)) + arvore(x, y, P, g === 1 ? .42 : .55, g === 1 ? 'arbusto' : 'florida');
      return v(b.x - .25, Y + .3) + v(X + .3, Y + .3) + (g >= 2 ? v(X + .3, b.y - .2) : '');
    }
    case 'brasao': {
      const c = iso(b.x + b.w / 2, Y + .01, z + b.h * .55);
      const r = g === 1 ? 4.2 : g === 2 ? 5.2 : 6.2, borda = g === 1 ? P.branco : OURO;
      return `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="${cor}" stroke="${borda}" stroke-width="${g === 3 ? 2 : 1.4}"/>` +
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => `<circle cx="${f1(c[0] + dx * r * .38)}" cy="${f1(c[1] + dy * r * .38)}" r="${f1(r * .2)}" fill="${i < 3 ? P.branco : 'none'}" stroke="${P.branco}" stroke-width=".6"/>`).join('');
    }
    case 'pintura': {
      const c = g === 1 ? cor : g === 2 ? mix(cor, '#FFFFFF', .2) : mix(cor, OURO, .3), op = g === 1 ? .18 : g === 2 ? .24 : .3;
      return faceY(Y + .004, b.x, X, z, z + b.h - .16, c, ` fill-opacity="${op}"`) + faceX(X + .004, b.y, Y, z, z + b.h - .16, shade(c, .85), ` fill-opacity="${op}"`);
    }
    default:
      return '';
  }
}

function efeitoNaRegiao(e: Efeito, g: number, t: Area, P: Paleta, cor: string): Peca[] {
  const [x0, y0, x1, y1] = LOTE[t];
  const p = (nome: string, ax: number, ay: number, desenho: (P: Paleta) => string, chave = ax + ay): Peca =>
    ({ trilha: t, ordem: 9999, nome, ax, ay, chave, camada: 1, anim: 'brota', desenho });
  switch (e) {
    case 'sebe': {
      const h = g === 1 ? .28 : .4;
      return [p('sebe-tras', (x0 + x1) / 2, y0, P2 => sebe(x0 + .2, y0 + .1, x1 - x0 - .4, .2, h, P2), x0 + y0), p('sebe-lado', x0, (y0 + y1) / 2, P2 => sebe(x0 + .1, y0 + .4, .2, y1 - y0 - .8, h, P2), x0 + y0 + .5)];
    }
    case 'postes': {
      const n = g === 1 ? 3 : 5, lista: Peca[] = [];
      for (let k = 0; k < n; k++) { const x = x0 + .4 + (k * (x1 - x0 - .8)) / (n - 1); if (livre(t, x) || t === 'humanas' || (t === 'exatas' && k < n - 1) || t === 'linguagens') continue; lista.push(p('poste', x, y1 - .25, P2 => poste(x, y1 - .25, P2, g === 1 ? 1.5 : 1.9))); }
      return lista;
    }
    case 'arvores': {
      const n = g === 1 ? 4 : g === 2 ? 6 : 8, lista: Peca[] = [];
      for (let k = 0; k < n; k++) {
        const x = x0 + .4 + (k * (x1 - x0 - .8)) / (n - 1), tipo = g === 3 ? (k % 2 ? 'florida' : 'alta') : g === 2 && k % 2 ? 'outono' : 'redonda';
        lista.push(p('arvore', x, y0 + .35, P2 => arvore(x, y0 + .35, P2, .7, tipo as any)));
      }
      return lista;
    }
    case 'bandeiras': {
      const lista: Peca[] = [];
      const n = g === 1 ? 2 : 4;
      for (let k = 0; k < n; k++) {
        const x = x0 + 1 + (k * (x1 - x0 - 2)) / Math.max(1, n - 1), y = y1 - .5;
        if (livre(t, x)) continue;
        lista.push(p('bandeira', x, y, P2 => {
          const t2 = iso(x, y, 2.2);
          return box(x - .03, y - .03, 0, .06, .06, 2.2, P2.ferro) + `<path class="cv-bandeira" style="animation-delay:-${k * .4}s" d="M${f1(t2[0])},${f1(t2[1])} l13,1.5 l0,9 l-13,-1.5 Z" fill="${k % 2 && g === 2 ? OURO : cor}"/>`;
        }));
      }
      return lista;
    }
    default:
      return [];
  }
}

export function pecasDeAcabamento(t: Trilha, nivel: number, nivelAntes: number | null, P: Paleta): { pecas: Peca[]; novas: Set<Peca> } {
  const novas = new Set<Peca>();
  if (t === 'geral' || nivel <= 0) return { pecas: [], novas };
  const area = t as Area;
  const cor = corDe(P, area);
  const grau = new Map<Efeito, { g: number; nivel: number }>();
  NIVEIS_ACABAMENTO.slice(0, nivel).forEach(([e, g], i) => grau.set(e, { g, nivel: i + 1 }));
  const pecas: Peca[] = [];
  for (const [e, { g, nivel: n }] of grau) {
    const nova = nivelAntes !== null && n > nivelAntes;
    const lote = ['sebe', 'postes', 'arvores', 'bandeiras'].includes(e);
    const lista = lote ? efeitoNaRegiao(e, g, area, P, cor) : PREDIOS[area].filter(b => !b.sem?.includes(e)).map(b => ({
      trilha: t, ordem: 9999, nome: e, ax: b.x + b.w / 2, ay: b.y + b.d / 2, chave: chaveDe(b) + (e === 'vasos' ? .4 : .06), camada: 1, anim: 'brota' as const,
      desenho: (P2: Paleta) => efeitoNoPredio(e, g, b, P2, corDe(P2, area))
    }));
    lista.forEach(p => { pecas.push(p); if (nova) novas.add(p); });
  }
  return { pecas, novas };
}

export function nomeDoNivel(nivel: number): string | null {
  const n = NIVEIS_ACABAMENTO[nivel - 1];
  return n ? `${NOMES_EFEITO[n[0]]}${n[1] > 1 ? ' · nível ' + n[1] : ''}` : null;
}
