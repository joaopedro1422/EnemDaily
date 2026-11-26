export const U = 22;
const CX = 0.866;
const CY = 0.5;

export type Pt = [number, number];
export type P3 = [number, number, number?];

export const f1 = (n: number) => Math.round(n * 10) / 10;
export const iso = (x: number, y: number, z = 0): Pt => [(x - y) * CX * U, (x + y) * CY * U - z * U];

export function shade(h: string, f: number): string {
  if (!h || h[0] !== '#') return h;
  const c = [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * f))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

export function mix(a: string, b: string, t: number): string {
  const ca = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export interface Paleta {
  noite: boolean;
  sombra: string;
  grama: string;
  gramaEscura: string;
  placaL: string;
  placaR: string;
  caminho: string;
  caminho2: string;
  praca: string;
  parede: string;
  moldura: string;
  concreto: string;
  telhado: string;
  caneta: string;
  janela: string;
  janelaD: string;
  porta: string;
  vidro: string;
  arvore: string;
  arvoreLuz: string;
  pinheiro: string;
  outono: string;
  tronco: string;
  madeira: string;
  ferro: string;
  agua: string;
  aguaLuz: string;
  terra: string;
  quadra: string;
  linha: string;
  painel: string;
  luz: string;
  calca: string;
  cabelo: string[];
  pele: string[];
  bronze: string;
  lc: string;
  ch: string;
  cn: string;
  mt: string;
  branco: string;
  decorado?: boolean;
  registro?: number[][];
  desloc?: number;
}

export const DIA: Paleta = {
  noite: false, sombra: 'rgba(24,34,86,.13)', grama: '#BEE3C6', gramaEscura: '#A9D7B4', placaL: '#2C3660', placaR: '#1F284A',
  caminho: '#F4F5F9', caminho2: '#DFE3EC', praca: '#ECEFF6', parede: '#FFFFFF', moldura: '#E3E8F2', concreto: '#C9CFDC', telhado: '#DDE2F0',
  caneta: '#2836C6', janela: '#3A4887', janelaD: '#2F3B73', porta: '#26305A', vidro: '#BFE6D4', arvore: '#56B47B', arvoreLuz: '#86D0A2',
  pinheiro: '#2F8A5C', outono: '#E2A33A', tronco: '#8A6B55', madeira: '#C0916A', ferro: '#3A4366', agua: '#7FCBF0', aguaLuz: '#B9E6FA',
  terra: '#8C6E5A', quadra: '#4F5FD6', linha: '#FFFFFF', painel: '#24307E', luz: '#FFF1B8', calca: '#2A3354',
  cabelo: ['#2B2018', '#5A3A22', '#1B1B22', '#A0612E'], pele: ['#F1C7A3', '#D9A07B', '#A86B4A', '#7A4A33'], bronze: '#B07A45',
  lc: '#C7455A', ch: '#12A5E1', cn: '#36B37D', mt: '#D08C21', branco: '#FFFFFF'
};

export const NOITE: Paleta = {
  noite: true, sombra: 'rgba(0,0,0,.18)', grama: '#2E4B4A', gramaEscura: '#284241', placaL: '#151B36', placaR: '#10152C',
  caminho: '#3C456A', caminho2: '#333B5D', praca: '#394268', parede: '#5D679A', moldura: '#4A5384', concreto: '#3F4772', telhado: '#4B5590',
  caneta: '#7D89FF', janela: '#FFD66B', janelaD: '#F2C55A', porta: '#1B2142', vidro: '#6FA88F', arvore: '#2F6F52', arvoreLuz: '#3E8564',
  pinheiro: '#245A41', outono: '#9A6A22', tronco: '#4D3D35', madeira: '#6E553F', ferro: '#2A3152', agua: '#3E7FB0', aguaLuz: '#5C9BCB',
  terra: '#4A3A30', quadra: '#3341A0', linha: '#C9CEF0', painel: '#151E55', luz: '#FFD66B', calca: '#1A2040',
  cabelo: ['#140F0B', '#2B1C11', '#0E0E13', '#5A361A'], pele: ['#B8957A', '#A57B5F', '#7F523A', '#5C3828'], bronze: '#7A5530',
  lc: '#B7384D', ch: '#0B8CBF', cn: '#249468', mt: '#B87B10', branco: '#E6E9F5'
};

const pts = (a: P3[]) => a.map(p => { const q = iso(p[0], p[1], p[2] ?? 0); return f1(q[0]) + ',' + f1(q[1]); }).join(' ');
export const poly = (a: P3[], fill: string, extra = '') => `<polygon points="${pts(a)}" fill="${fill}"${extra}/>`;
export const linha3 = (a: P3[], cor: string, larg = 1.3, extra = '') => `<polyline points="${pts(a)}" fill="none" stroke="${cor}" stroke-width="${larg}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;

export interface CorFaces { l?: string; r?: string; t?: string; }
export function box(x: number, y: number, z: number, w: number, d: number, h: number, c: string, o: CorFaces = {}): string {
  const t = z + h;
  return poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]], o.l || shade(c, .92)) +
    poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]], o.r || shade(c, .8)) +
    poly([[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]], o.t || c);
}
export const topo = (x0: number, y0: number, x1: number, y1: number, z: number, fill: string, extra = '') =>
  poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], fill, extra);
export const faceY = (Y: number, x0: number, x1: number, z0: number, z1: number, fill: string, extra = '') =>
  poly([[x0, Y, z0], [x1, Y, z0], [x1, Y, z1], [x0, Y, z1]], fill, extra);
export const faceX = (X: number, y0: number, y1: number, z0: number, z1: number, fill: string, extra = '') =>
  poly([[X, y0, z0], [X, y1, z0], [X, y1, z1], [X, y0, z1]], fill, extra);

export function cilindro(cx: number, cy: number, z: number, h: number, r: number, cor: string): string {
  const b = iso(cx, cy, z), t = iso(cx, cy, z + h), rx = r * U * 1.2247, ry = r * U * .7071;
  const L = f1(b[0] - rx), R = f1(b[0] + rx), C = f1(b[0]);
  return `<path d="M${L},${f1(t[1])} L${L},${f1(b[1])} A${f1(rx)},${f1(ry)} 0 0 0 ${R},${f1(b[1])} L${R},${f1(t[1])} A${f1(rx)},${f1(ry)} 0 0 1 ${L},${f1(t[1])} Z" fill="${shade(cor, .92)}"/>` +
    `<path d="M${C},${f1(t[1] + ry)} L${C},${f1(b[1] + ry)} A${f1(rx)},${f1(ry)} 0 0 0 ${R},${f1(b[1])} L${R},${f1(t[1])} A${f1(rx)},${f1(ry)} 0 0 1 ${C},${f1(t[1] + ry)} Z" fill="${shade(cor, .8)}"/>` +
    `<ellipse cx="${f1(t[0])}" cy="${f1(t[1])}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${cor}"/>`;
}

export function elipseChao(x: number, y: number, z: number, r: number, cor: string, extra = ''): string {
  const c = iso(x, y, z);
  return `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(r * U * 1.2247)}" ry="${f1(r * U * .7071)}" fill="${cor}"${extra}/>`;
}

export function cupula(cx: number, cy: number, z: number, r: number, cor: string): string {
  const t = iso(cx, cy, z), rx = r * U * 1.2247, ry = r * U * .7071, hg = rx * .92;
  const L = f1(t[0] - rx), R = f1(t[0] + rx), C = f1(t[0]), Y = f1(t[1]);
  return `<path d="M${L},${Y} A${f1(rx)},${f1(hg)} 0 0 1 ${R},${Y} A${f1(rx)},${f1(ry)} 0 0 1 ${L},${Y} Z" fill="${cor}"/>` +
    `<path d="M${C},${f1(t[1] - hg)} A${f1(rx)},${f1(hg)} 0 0 1 ${R},${Y} A${f1(rx)},${f1(ry)} 0 0 1 ${C},${f1(t[1] + ry)} Z" fill="${shade(cor, .82)}"/>`;
}

export function sombraChao(x: number, y: number, rx: number, ry: number, P: Paleta): string {
  const g = iso(x, y, 0);
  return `<ellipse cx="${f1(g[0] + 2)}" cy="${f1(g[1] + 1)}" rx="${f1(rx * U)}" ry="${f1(ry * U)}" fill="${P.sombra}"/>`;
}

export interface Predio { x: number; y: number; w: number; d: number; z0: number; h: number; }
export interface OpcoesJanela { passo?: number; larg?: number; base?: number; topo?: number; pular?: (i: number, n: number) => boolean; cor?: string; semDireita?: boolean; }

export function janelas(b: Predio, z: number, h: number, P: Paleta, o: OpcoesJanela = {}): string {
  let s = '';
  const Y = b.y + b.d, X = b.x + b.w, passo = o.passo ?? .9;
  const nl = Math.max(1, Math.round(b.w / passo)), nr = Math.max(1, Math.round(b.d / passo));
  const ww = o.larg ?? .42, z0 = z + h * (o.base ?? .32), z1 = z + h * (o.topo ?? .8);
  const cor = o.cor ?? P.janela, corD = o.cor ? shade(o.cor, .86) : P.janelaD;
  const moldura = ` stroke="${P.moldura}" stroke-width=".7"`;
  for (let i = 0; i < nl; i++) {
    if (o.pular?.(i, nl)) continue;
    const xc = b.x + (i + .5) * b.w / nl;
    s += faceY(Y + .002, xc - ww / 2, xc + ww / 2, z0, z1, cor, moldura);
    s += faceY(Y + .003, xc - ww / 2 - .04, xc + ww / 2 + .04, z0 - .05, z0, P.concreto);
    if (!P.noite) s += faceY(Y + .004, xc - ww / 2 + .04, xc - ww / 2 + .11, z0 + .06, z1 - .06, 'rgba(255,255,255,.3)');
  }
  if (!o.semDireita) {
    for (let i = 0; i < nr; i++) {
      const yc = b.y + (i + .5) * b.d / nr;
      s += faceX(X + .002, yc - ww / 2, yc + ww / 2, z0, z1, corD, moldura);
    }
  }
  return s;
}

export function fundacao(b: Predio, P: Paleta): string {
  return topo(b.x - .2, b.y - .2, b.x + b.w + .6, b.y + b.d + .6, .004, P.sombra) +
    box(b.x - .14, b.y - .14, 0, b.w + .28, b.d + .28, b.z0, P.concreto);
}

export function andar(b: Predio, i: number, P: Paleta, o: OpcoesJanela & { parede?: string } = {}): string {
  const z = b.z0 + i * b.h;
  return box(b.x, b.y, z, b.w, b.d, b.h, o.parede ?? P.parede) +
    box(b.x - .03, b.y - .03, z, b.w + .06, b.d + .06, .07, P.concreto) + janelas(b, z, b.h, P, o);
}

export function fachadaVidro(b: Predio, i: number, P: Paleta, cor?: string): string {
  const z = b.z0 + i * b.h, Y = b.y + b.d, X = b.x + b.w;
  const v = cor ?? (P.noite ? P.janela : '#8FA6E8');
  let s = box(b.x, b.y, z, b.w, b.d, b.h, P.parede) + faceY(Y + .002, b.x + .1, X - .1, z + .1, z + b.h - .1, v, ' fill-opacity=".92"') +
    faceX(X + .002, b.y + .1, Y - .1, z + .1, z + b.h - .1, shade(v, .85), ' fill-opacity=".92"');
  const n = Math.round(b.w / .6);
  for (let k = 1; k < n; k++) { const x = b.x + .1 + k * (b.w - .2) / n; s += linha3([[x, Y + .003, z + .1], [x, Y + .003, z + b.h - .1]], P.moldura, .8); }
  return s + box(b.x - .03, b.y - .03, z, b.w + .06, b.d + .06, .07, P.concreto);
}

export function telhado(b: Predio, n: number, P: Paleta, cor?: string, equipamentos = false): string {
  const z = b.z0 + n * b.h;
  let s = box(b.x - .08, b.y - .08, z, b.w + .16, b.d + .16, .15, P.telhado) + box(b.x - .08, b.y - .08, z + .15, b.w + .16, b.d + .16, .07, cor ?? P.caneta) +
    topo(b.x + .12, b.y + .12, b.x + b.w - .12, b.y + b.d - .12, z + .221, shade(P.telhado, .9));
  if (equipamentos) s += box(b.x + .4, b.y + .35, z + .22, .55, .45, .32, P.concreto) + box(b.x + b.w - 1.0, b.y + .35, z + .22, .45, .45, .26, P.concreto);
  return s;
}

export function entrada(b: Predio, P: Paleta, xc: number, cor?: string): string {
  const Y = b.y + b.d, z = b.z0;
  return box(xc - .7, Y + .14, 0, 1.4, .42, z * .5, P.concreto) + box(xc - .7, Y, 0, 1.4, .3, z, P.concreto) +
    faceY(Y + .003, xc - .38, xc + .38, z, z + .98, P.noite ? P.janela : '#5A6BB0', ` stroke="${P.moldura}" stroke-width=".8"`) +
    faceY(Y + .004, xc - .02, xc + .02, z, z + .98, P.moldura) + box(xc - .62, Y, z + 1.04, 1.24, .5, .07, cor ?? P.caneta);
}

export function entradaLateral(b: Predio, P: Paleta, yc: number, cor?: string): string {
  const X = b.x + b.w, z = b.z0;
  return box(X, yc - .7, 0, .3, 1.4, z, P.concreto) +
    faceX(X + .003, yc - .38, yc + .38, z, z + .98, P.noite ? P.janela : '#4C5C9E', ` stroke="${P.moldura}" stroke-width=".8"`) +
    box(X, yc - .62, z + 1.04, .5, 1.24, .07, cor ?? P.caneta);
}

export type TipoArvore = 'redonda' | 'pinheiro' | 'alta' | 'arbusto' | 'florida' | 'outono';
export function arvore(x: number, y: number, P: Paleta, s = 1, tipo: TipoArvore = 'redonda'): string {
  if (tipo === 'arbusto') {
    const a = iso(x, y, .32 * s), r = .4 * s * U;
    return sombraChao(x, y, .4 * s, .2 * s, P) + `<circle cx="${f1(a[0] - r * .45)}" cy="${f1(a[1] + 2)}" r="${f1(r * .75)}" fill="${shade(P.arvore, .9)}"/><circle cx="${f1(a[0] + r * .4)}" cy="${f1(a[1] + 1)}" r="${f1(r * .8)}" fill="${shade(P.arvore, .82)}"/><circle cx="${f1(a[0] - r * .1)}" cy="${f1(a[1] - r * .25)}" r="${f1(r * .62)}" fill="${P.arvoreLuz}"/>`;
  }
  let o = sombraChao(x, y, .55 * s, .28 * s, P) + box(x - .07, y - .07, 0, .14, .14, .55 * s, P.tronco);
  if (tipo === 'pinheiro') {
    const b = iso(x, y, .35 * s), t = iso(x, y, 2 * s), r = .55 * s * U;
    o += `<polygon points="${f1(b[0] - r)},${f1(b[1])} ${f1(t[0])},${f1(t[1])} ${f1(b[0] + r)},${f1(b[1])} ${f1(b[0])},${f1(b[1] + r * .28)}" fill="${P.pinheiro}"/>` +
      `<polygon points="${f1(t[0])},${f1(t[1])} ${f1(b[0] + r)},${f1(b[1])} ${f1(b[0])},${f1(b[1] + r * .28)}" fill="${shade(P.pinheiro, .8)}"/>`;
  } else if (tipo === 'alta') {
    const c = iso(x, y, 1.35 * s), rx = .34 * s * U, ry = .95 * s * U;
    o += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${P.pinheiro}"/><ellipse cx="${f1(c[0] + rx * .3)}" cy="${f1(c[1] + ry * .1)}" rx="${f1(rx * .65)}" ry="${f1(ry * .85)}" fill="${shade(P.pinheiro, .85)}"/>`;
  } else {
    const base = tipo === 'outono' ? P.outono : P.arvore;
    const c = iso(x, y, 1.1 * s), r = .62 * s * U;
    o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="${base}"/><circle cx="${f1(c[0] + r * .3)}" cy="${f1(c[1] + r * .26)}" r="${f1(r * .7)}" fill="${shade(base, .86)}"/><circle cx="${f1(c[0] - r * .3)}" cy="${f1(c[1] - r * .32)}" r="${f1(r * .42)}" fill="${tipo === 'outono' ? shade(P.outono, 1.18) : P.arvoreLuz}"/>`;
    if (tipo === 'florida') {
      for (let k = 0; k < 7; k++) {
        const a = k * 2.4, d = r * (.25 + (k % 3) * .22);
        o += `<circle cx="${f1(c[0] + Math.cos(a) * d)}" cy="${f1(c[1] + Math.sin(a) * d * .8)}" r="2" fill="${k % 2 ? '#F4A6C0' : '#FFFFFF'}"/>`;
      }
    }
  }
  return o;
}

export function pessoa(x: number, y: number, P: Paleta, cor: string, v = 0, anda?: [number, number, number, number?]): string {
  const g = iso(x, y, 0);
  const pele = P.pele[v % P.pele.length], cabelo = P.cabelo[(v + 1) % P.cabelo.length];
  const corpo = `<ellipse cx="0" cy="0" rx="3.6" ry="1.6" fill="${P.sombra}"/><rect x="-1.9" y="-4.4" width="3.8" height="4.6" rx="1.2" fill="${P.calca}"/><rect x="-2.7" y="-11.2" width="5.4" height="7.8" rx="2.5" fill="${cor}"/><circle cx="0" cy="-13.7" r="2.6" fill="${pele}"/><path d="M-2.7,-13.5 a2.7,2.7 0 0 1 5.4,0 l-.6,-.5 q-2.1,-.9 -4.2,0 z" fill="${cabelo}"/>`;
  if (anda) {
    const [dx, dy, dur, atraso = 0] = anda;
    const lado = (v % 2 ? -1 : 1) * Math.min(1.3, Math.max(.8, Math.hypot(dx, dy) * .5));
    const px = Math.abs(dx) >= Math.abs(dy) ? 0 : lado, py = Math.abs(dx) >= Math.abs(dy) ? lado : 0;
    const pt = (wx: number, wy: number) => { const q = iso(x + wx, y + wy, 0); return `${f1(q[0] - g[0])},${f1(q[1] - g[1])}`; };
    const caminho = `M0,0 L${pt(dx, dy)} L${pt(dx + px, dy + py)} L${pt(px, py)} Z`;
    const total = (dur * 1.5).toFixed(1);
    return `<g transform="translate(${f1(g[0])},${f1(g[1])})"><g><animateMotion dur="${total}s" begin="-${atraso}s" repeatCount="indefinite" path="${caminho}"/><g class="cv-passo" style="animation-delay:-${(atraso % 1).toFixed(2)}s">${corpo}</g></g></g>`;
  }
  return `<g transform="translate(${f1(g[0])},${f1(g[1])})">${corpo}</g>`;
}

export function banco(x: number, y: number, P: Paleta, eixo: 'x' | 'y' = 'x', cor?: string): string {
  const m = cor ?? P.madeira;
  if (eixo === 'x') return box(x + .05, y + .06, 0, .07, .16, .22, P.ferro) + box(x + .78, y + .06, 0, .07, .16, .22, P.ferro) + box(x, y, .22, .9, .28, .06, m) + box(x, y, .28, .9, .06, .26, m);
  return box(x + .06, y + .05, 0, .16, .07, .22, P.ferro) + box(x + .06, y + .78, 0, .16, .07, .22, P.ferro) + box(x, y, .22, .28, .9, .06, m) + box(x, y, .28, .06, .9, .26, m);
}

export function poste(x: number, y: number, P: Paleta, alt = 1.6): string {
  const g = iso(x, y, 0), t = iso(x, y, alt + .06);
  let o = '';
  if (P.noite) o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="${f1(1.1 * U)}" ry="${f1(.55 * U)}" fill="${P.luz}" opacity=".16"/>`;
  o += box(x - .04, y - .04, 0, .08, .08, alt, P.ferro) + box(x - .1, y - .1, alt, .2, .2, .06, P.ferro);
  if (P.noite) o += `<circle cx="${f1(t[0])}" cy="${f1(t[1])}" r="13" fill="${P.luz}" opacity=".22"/>`;
  return o + `<circle cx="${f1(t[0])}" cy="${f1(t[1] + 2)}" r="3.2" fill="${P.luz}"/>`;
}

let semente = 1;
export function aleatorio(s: number) {
  semente = s * 9301 + 7;
  return () => (semente = (semente * 9301 + 49297) % 233280) / 233280;
}

export function canteiro(x: number, y: number, w: number, d: number, P: Paleta, s = 1, cores?: string[]): string {
  let o = box(x - .04, y - .04, 0, w + .08, d + .08, .1, P.concreto) + box(x, y, .1, w, d, .08, P.terra);
  const paleta = cores ?? [P.lc, P.ch, P.cn, P.mt, P.branco];
  const rnd = aleatorio(s);
  const n = Math.max(3, Math.round(w * d * 14));
  for (let i = 0; i < n; i++) {
    const p = iso(x + .1 + rnd() * (w - .2), y + .1 + rnd() * (d - .2), .24);
    o += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="2.2" fill="${i % 3 === 0 ? P.arvore : paleta[Math.floor(rnd() * paleta.length)]}"/>`;
  }
  return o;
}

export function textoNoPlano(x: number, y: number, z: number, texto: string, cor: string, tam: number): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" fill="${cor}" letter-spacing="-.1">${texto}</text>`;
}

export function placa(x: number, y: number, z: number, P: Paleta, texto: string, cor: string, larg = 64, alt = 1.15, textoCor = '#FFFFFF'): string {
  const meio = larg / 2 / (CX * U), haste = meio * .6, z0 = z + alt, z1 = z0 + 18 / U;
  return box(x - haste - .03, y - .03, z, .06, .06, alt + .1, P.ferro) + box(x + haste - .03, y - .03, z, .06, .06, alt + .1, P.ferro) +
    faceY(y + .04, x - meio, x + meio, z0, z1, cor, ` stroke="${shade(cor, .78)}" stroke-width=".7"`) +
    textoNoPlano(x, y + .045, (z0 + z1) / 2, texto, textoCor, 8.2);
}

export function placaMadeira(x: number, y: number, P: Paleta, texto: string): string {
  const meio = 29 / (CX * U), z0 = .7, z1 = z0 + 14 / U;
  return box(x - .05, y - .05, 0, .1, .1, z1 - .05, P.tronco) +
    faceY(y + .06, x - meio, x + meio, z0, z1, P.madeira, ` stroke="${shade(P.madeira, .7)}" stroke-width=".8"`) +
    textoNoPlano(x, y + .065, (z0 + z1) / 2, texto, shade(P.madeira, .38), 8);
}

export function simboloFaceY(Y: number, xc: number, zc: number, s: number, P: Paleta, fundo?: string): string {
  const r = s * .24;
  let o = fundo ? faceY(Y + .002, xc - s * .62, xc + s * .62, zc - s * .62, zc + s * .62, fundo) : '';
  ([[-1, 1], [1, 1], [-1, -1], [1, -1]] as const).forEach(([a, b], i) => {
    const cx = xc + a * s * .3, cz = zc + b * s * .3, anel: P3[] = [], dent: P3[] = [];
    for (let k = 0; k < 18; k++) {
      const t = k / 18 * Math.PI * 2;
      anel.push([cx + Math.cos(t) * r, Y + .004, cz + Math.sin(t) * r]);
      dent.push([cx + Math.cos(t) * r * .5, Y + .005, cz + Math.sin(t) * r * .5]);
    }
    o += poly(anel, 'none', ` stroke="${P.caneta}" stroke-width="2.1"`);
    if (i < 3) o += poly(dent, P.caneta);
  });
  return o;
}

export function caminho(x0: number, y0: number, x1: number, y1: number, P: Paleta): string {
  if (P.registro) { const d = P.desloc ?? 0; P.registro.push([Math.min(x0, x1), Math.min(y0, y1) + d, Math.max(x0, x1), Math.max(y0, y1) + d]); }
  return topo(x0, y0, x1, y1, .012, P.caminho) + topo(x0, y0, x0 + .06, y1, .013, P.caminho2) + topo(x1 - .06, y0, x1, y1, .013, P.caminho2) +
    topo(x0, y0, x1, y0 + .06, .013, P.caminho2) + topo(x0, y1 - .06, x1, y1, .013, P.caminho2);
}

export function sebe(x: number, y: number, w: number, d: number, h: number, P: Paleta): string {
  return box(x, y, 0, w, d, h, shade(P.arvore, .9), { t: P.arvoreLuz });
}

export function cerca(a: [number, number], b: [number, number], P: Paleta, cor?: string): string {
  const c = cor ?? P.madeira, n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / .5));
  let o = '';
  for (let i = 0; i <= n; i++) {
    const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n;
    o += box(x - .03, y - .03, 0, .06, .06, .42, c);
  }
  return o + linha3([[a[0], a[1], .34], [b[0], b[1], .34]], shade(c, .8), 1.4) + linha3([[a[0], a[1], .18], [b[0], b[1], .18]], shade(c, .8), 1.4);
}

export function bandeirinhas(a: [number, number, number], b: [number, number, number], P: Paleta, n = 10): string {
  const cores = [P.lc, P.ch, P.cn, P.mt, P.caneta];
  const A = iso(a[0], a[1], a[2]), B = iso(b[0], b[1], b[2]);
  let o = `<path d="M${f1(A[0])},${f1(A[1])} Q${f1((A[0] + B[0]) / 2)},${f1((A[1] + B[1]) / 2 + 10)} ${f1(B[0])},${f1(B[1])}" fill="none" stroke="${P.ferro}" stroke-width=".7"/>`;
  for (let i = 1; i < n; i++) {
    const t = i / n, x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t + Math.sin(t * Math.PI) * 5;
    o += `<path d="M${f1(x - 2.6)},${f1(y)} l5.2,0 l-2.6,5.4 z" fill="${cores[i % cores.length]}"/>`;
  }
  return o;
}

export function quiosque(x: number, y: number, P: Paleta, cor: string, texto?: string): string {
  let o = sombraChao(x + .5, y + .5, .8, .4, P) + box(x, y, 0, 1.1, 1.0, .95, P.parede) + faceY(y + 1.002, x + .15, x + .95, .4, .85, P.noite ? P.janela : '#5A6BB0') +
    box(x - .12, y - .12, .95, 1.34, 1.24, .1, cor) + box(x - .12, y + .9, .7, 1.34, .34, .06, cor);
  if (texto) o += placa(x + .55, y + .5, 1.05, P, texto, cor, 46, .45);
  return o;
}

export function antena(x: number, y: number, h: number, P: Paleta, cor = '#C7455A'): string {
  const b1 = iso(x - .45, y, 0), b2 = iso(x + .45, y, 0), b3 = iso(x, y + .45, 0), t = iso(x, y, h);
  let o = `<g stroke="${P.ferro}" stroke-width="1.2" fill="none"><path d="M${f1(b1[0])},${f1(b1[1])} L${f1(t[0])},${f1(t[1])} L${f1(b2[0])},${f1(b2[1])}"/><path d="M${f1(b3[0])},${f1(b3[1])} L${f1(t[0])},${f1(t[1])}"/>`;
  for (let k = 1; k < 6; k++) {
    const f = k / 6, p1 = [b1[0] + (t[0] - b1[0]) * f, b1[1] + (t[1] - b1[1]) * f], p2 = [b2[0] + (t[0] - b2[0]) * f, b2[1] + (t[1] - b2[1]) * f], p3 = [b3[0] + (t[0] - b3[0]) * f, b3[1] + (t[1] - b3[1]) * f];
    o += `<path d="M${f1(p1[0])},${f1(p1[1])} L${f1(p3[0])},${f1(p3[1])} L${f1(p2[0])},${f1(p2[1])}"/>`;
  }
  return o + `</g><circle class="cv-pisca" cx="${f1(t[0])}" cy="${f1(t[1])}" r="3" fill="${cor}"/>`;
}

export function estatua(x: number, y: number, P: Paleta, cor?: string): string {
  const c = cor ?? P.bronze, g = iso(x, y, .9);
  return sombraChao(x, y, .6, .3, P) + box(x - .4, y - .4, 0, .8, .8, .9, P.concreto) +
    `<g transform="translate(${f1(g[0])},${f1(g[1])}) scale(1.9)"><rect x="-1.9" y="-4.4" width="3.8" height="4.6" rx="1.2" fill="${shade(c, .8)}"/><rect x="-2.7" y="-11.2" width="5.4" height="7.8" rx="2.5" fill="${c}"/><circle cx="0" cy="-13.7" r="2.6" fill="${shade(c, 1.12)}"/><rect x="2" y="-11" width="1.6" height="5" rx=".8" fill="${c}" transform="rotate(-35 2.8 -11)"/></g>`;
}

export function lago(cx: number, cy: number, rx: number, ry: number, P: Paleta): string {
  const borda: P3[] = [], agua: P3[] = [];
  for (let k = 0; k < 28; k++) {
    const t = k / 28 * Math.PI * 2, w = 1 + Math.sin(t * 3) * .06;
    borda.push([cx + Math.cos(t) * (rx + .25) * w, cy + Math.sin(t) * (ry + .25) * w, .01]);
    agua.push([cx + Math.cos(t) * rx * w, cy + Math.sin(t) * ry * w, .02]);
  }
  const c = iso(cx, cy, .02);
  return poly(borda, P.caminho2) + poly(agua, P.agua) + `<g class="cv-agua"><path d="M${f1(c[0] - 18)},${f1(c[1] - 3)} q6,-3 12,0 M${f1(c[0] + 4)},${f1(c[1] + 6)} q6,-3 12,0" stroke="${P.aguaLuz}" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`;
}

export function fumaca(x: number, y: number, z: number, P: Paleta): string {
  const c = iso(x, y, z), cor = P.noite ? '#8E97B8' : '#FFFFFF';
  return [0, 1, 2].map(i => `<circle class="cv-fumaca" style="animation-delay:-${i * 1.1}s" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${4 + i}" fill="${cor}" opacity=".7"/>`).join('');
}

export function turbina(x: number, y: number, h: number, P: Paleta): string {
  const b = iso(x, y, 0), t = iso(x, y, h);
  const pas = [0, 120, 240].map(a => `<path d="M0,0 L-2.2,-2 L0,-30 L2.2,-2 Z" fill="${P.parede}" transform="rotate(${a})"/>`).join('');
  return sombraChao(x, y, .5, .25, P) + `<path d="M${f1(b[0] - 3)},${f1(b[1])} L${f1(t[0] - 1.2)},${f1(t[1])} L${f1(t[0] + 1.2)},${f1(t[1])} L${f1(b[0] + 3)},${f1(b[1])} Z" fill="${P.parede}"/><path d="M${f1(b[0])},${f1(b[1])} L${f1(t[0])},${f1(t[1])} L${f1(t[0] + 1.2)},${f1(t[1])} L${f1(b[0] + 3)},${f1(b[1])} Z" fill="${shade(P.parede, .82)}"/>` +
    `<g transform="translate(${f1(t[0])},${f1(t[1])})"><g class="cv-gira">${pas}</g><circle r="2.6" fill="${P.concreto}"/></g>`;
}

export function piramide(cx: number, cy: number, z: number, s: number, h: number, P: Paleta, cor?: string): string {
  const v = cor ?? (P.noite ? '#5E78C9' : '#A9C4F5'), a: P3 = [cx, cy, z + h];
  let o = poly([[cx - s, cy + s, z], [cx + s, cy + s, z], a], shade(v, .95), ' fill-opacity=".9"') + poly([[cx + s, cy - s, z], [cx + s, cy + s, z], a], shade(v, .8), ' fill-opacity=".9"');
  for (let k = 1; k < 4; k++) {
    const f = k / 4;
    o += linha3([[cx - s + s * f, cy + s - s * f, z + h * f], [cx + s - s * f, cy + s - s * f, z + h * f], [cx + s - s * f, cy - s + s * f, z + h * f]], P.moldura, .7);
  }
  return o + linha3([[cx - s, cy + s, z], a, [cx + s, cy - s, z]], P.moldura, .8) + linha3([[cx + s, cy + s, z], a], P.moldura, .8);
}

export function degraus(x: number, y: number, w: number, d: number, n: number, P: Paleta, eixo: 'x' | 'y', cor?: string): string {
  let o = '';
  for (let i = 0; i < n; i++) {
    const c = i === n - 1 && cor ? cor : P.concreto;
    if (eixo === 'y') o += box(x, y + i * d / n, 0, w, d / n, .22 * (n - i), c);
    else o += box(x + i * w / n, y, 0, w / n, d, .22 * (n - i), c);
  }
  return o;
}

export function grama(x0: number, y0: number, x1: number, y1: number, P: Paleta): string {
  const rnd = aleatorio(Math.round(x0 * 31 + y0 * 17 + x1 * 7 + y1));
  let o = '';
  const n = Math.round((x1 - x0) * (y1 - y0) * .55);
  for (let i = 0; i < n; i++) {
    const p = iso(x0 + .2 + rnd() * (x1 - x0 - .4), y0 + .2 + rnd() * (y1 - y0 - .4), 0);
    o += `<path d="M${f1(p[0] - 2)},${f1(p[1])} l1,-3 l1,3 l1,-2.4 l1,2.4" fill="none" stroke="${P.gramaEscura}" stroke-width=".9" stroke-linecap="round"/>`;
  }
  return o;
}

// ───── pacote de decoração: flores nos caminhos e pontes de pedra ─────

// Ponte de pedra em arco: o tabuleiro sobe no meio, tem guarda-corpo dos dois lados
// e um vão em arco aparecendo na face voltada para quem olha.
export function ponteDePedra(a: number, b: number, c: number, w: number, eixo: 'x' | 'y', P: Paleta): string {
  const pedra = P.noite ? '#70748C' : '#D2CABA', escura = shade(pedra, .78), clara = shade(pedra, 1.07), agua = shade(P.agua, .62);
  const N = 16, zAgua = -.25, z0 = .1, sobe = Math.max(.25, Math.min(.45, Math.abs(b - a) * .16)), muro = .2;
  const pt = (t: number, lado: number, z: number): P3 => (eixo === 'x' ? [a + (b - a) * t, c + (lado * w) / 2, z] : [c + (lado * w) / 2, a + (b - a) * t, z]);
  const zt = (t: number) => z0 + sobe * Math.sin(Math.PI * t);
  const ts = Array.from({ length: N + 1 }, (_, i) => i / N);
  const face = eixo === 'x' ? pedra : shade(pedra, .84);
  let o = '';
  // guarda-corpo do fundo
  o += poly([...ts.map(t => pt(t, -1, zt(t))), ...ts.slice().reverse().map(t => pt(t, -1, zt(t) + muro))], shade(face, .92));
  o += poly([...ts.map(t => pt(t, -1, zt(t) + muro)), ...ts.slice().reverse().map(t => pt(t, -.8, zt(t) + muro))], clara);
  // tabuleiro de pedra
  o += poly([...ts.map(t => pt(t, -.8, zt(t))), ...ts.slice().reverse().map(t => pt(t, .8, zt(t)))], P.noite ? '#8A8EA6' : '#E6DFD0');
  for (let i = 1; i < N; i++) o += linha3([pt(i / N, -.8, zt(i / N) + .002), pt(i / N, .8, zt(i / N) + .002)], shade(pedra, .9), .5);
  // face da frente, da água até o topo do guarda-corpo, com o vão em arco
  o += poly([...ts.map(t => pt(t, 1, zAgua)), ...ts.slice().reverse().map(t => pt(t, 1, zt(t) + muro))], face);
  const vao: P3[] = [];
  for (let k = 0; k <= 14; k++) { const t = .2 + (.6 * k) / 14; vao.push(pt(t, 1.001, zAgua + (zt(.5) - .16 - zAgua) * Math.sin(Math.PI * (k / 14)))); }
  o += poly(vao, agua);
  for (let k = 1; k < 8; k++) {
    const u = k / 8, t = .2 + .6 * u, ang = Math.PI * u, z = zAgua + (zt(.5) - .16 - zAgua) * Math.sin(ang);
    const dt = -Math.cos(ang) * .04, dz = Math.sin(ang) * .1;
    o += linha3([pt(t, 1.002, z), pt(t + dt, 1.002, z + dz)], escura, .8);
  }
  for (const f of [.35, .65]) o += linha3(ts.map(t => pt(t, 1.002, zAgua + (zt(t) - zAgua) * f)), shade(face, .9), .5, ' stroke-dasharray="3 2"');
  o += linha3(ts.map(t => pt(t, 1.003, zt(t))), escura, .9);
  o += poly([...ts.map(t => pt(t, 1, zt(t) + muro)), ...ts.slice().reverse().map(t => pt(t, .8, zt(t) + muro))], clara);
  // pilaretes nas cabeceiras
  for (const t of [0, 1]) for (const lado of [-1, 1]) { const p = pt(t, lado, 0); o += box(p[0] - .07, p[1] - .07, 0, .14, .14, z0 + muro + .12, pedra, { t: clara, r: escura }); }
  return o;
}

// Friso de flores dos dois lados de cada caminho, cortado onde encontra outro caminho.
export function floresDosCaminhos(reg: number[][], P: Paleta, excluir: number[][] = []): string {
  const verde = P.noite ? '#2F6F52' : '#58B87A', [c1, c2] = P.noite ? ['#C77D9C', '#C9A24A'] : ['#F28AB2', '#F5C84C'];
  const off = .1, passo = .06, margem = .06;
  const cobre = (x: number, y: number, ignora: number) =>
    reg.some((r, i) => i !== ignora && x > r[0] - margem && x < r[2] + margem && y > r[1] - margem && y < r[3] + margem) ||
    excluir.some(r => x > r[0] && x < r[2] && y > r[1] && y < r[3]);
  const trechos: P3[][] = [];
  reg.forEach((r, i) => {
    const [x0, y0, x1, y1] = r;
    if (x1 - x0 < .2 || y1 - y0 < .2) return;
    const lados: [number, number, number, number][] = [[x0 - off, y0 - off, x1 + off, y0 - off], [x0 - off, y1 + off, x1 + off, y1 + off], [x0 - off, y0 - off, x0 - off, y1 + off], [x1 + off, y0 - off, x1 + off, y1 + off]];
    for (const [ax, ay, bx, by] of lados) {
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / passo));
      let atual: P3[] = [];
      for (let k = 0; k <= n; k++) {
        const t = k / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
        if (!cobre(x, y, i)) atual.push([x, y, .02]);
        else { if (atual.length > 2) trechos.push(atual); atual = []; }
      }
      if (atual.length > 2) trechos.push(atual);
    }
  });
  const d = (pts: P3[]) => { const a = iso(pts[0][0], pts[0][1], .02), b = iso(pts[pts.length - 1][0], pts[pts.length - 1][1], .02); return `M${f1(a[0])},${f1(a[1])} L${f1(b[0])},${f1(b[1])}`; };
  const caminhos = trechos.map(d).join(' ');
  if (!caminhos) return '';
  return `<path d="${caminhos}" stroke="${verde}" stroke-width="3" stroke-linecap="round" fill="none"/>` +
    `<path d="${caminhos}" stroke="${c1}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="0 6" fill="none"/>` +
    `<path d="${caminhos}" stroke="${c2}" stroke-width="2" stroke-linecap="round" stroke-dasharray="0 6" stroke-dashoffset="3" fill="none"/>`;
}
