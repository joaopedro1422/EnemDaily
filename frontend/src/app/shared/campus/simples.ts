import { Paleta, Predio, P3, iso, f1, shade, box, faceX, faceY, poly, linha3, andar, telhado, entrada, entradaLateral, textoNoPlano, cilindro, cupula, OpcoesJanela } from './motor';

// Versões simples dos prédios principais: o que o aluno vê antes da reforma que leva cada
// prédio à versão definitiva. Usam o mesmo terreno e a mesma altura de andar da versão final.

export const andares = (b: Predio, n: number, P: Paleta, o: OpcoesJanela & { parede?: string } = {}, terreo?: OpcoesJanela) =>
  Array.from({ length: n }, (_, i) => andar(b, i, P, i === 0 && terreo ? { ...o, ...terreo } : o)).join('');

function textoX(x: number, y: number, z: number, texto: string, cor: string, tam: number): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" fill="${cor}">${texto}</text>`;
}

// Placa simples em cima do telhado, virada para a frente (+y) ou para o lado (+x).
export function letreiroTeto(b: Predio, n: number, P: Paleta, texto: string, cor: string, face: 'y' | 'x' = 'y'): string {
  const z = b.z0 + n * b.h + .22, meia = Math.min((face === 'y' ? b.w : b.d) / 2 - .25, texto.length * .085 + .22);
  if (face === 'y') {
    const Y = b.y + b.d - .18, xm = b.x + b.w / 2;
    return box(xm - meia + .15, Y - .03, z, .05, .05, .12, P.ferro) + box(xm + meia - .2, Y - .03, z, .05, .05, .12, P.ferro) +
      faceY(Y, xm - meia, xm + meia, z + .1, z + .42, cor, ` stroke="${shade(cor, .78)}" stroke-width=".7"`) + textoNoPlano(xm, Y + .001, z + .26, texto, '#FFFFFF', 6.4);
  }
  const X = b.x + b.w - .18, ym = b.y + b.d / 2;
  return box(X - .03, ym - meia + .15, z, .05, .05, .12, P.ferro) + box(X - .03, ym + meia - .2, z, .05, .05, .12, P.ferro) +
    faceX(X, ym - meia, ym + meia, z + .1, z + .42, shade(cor, .9), ` stroke="${shade(cor, .7)}" stroke-width=".7"`) + textoX(X + .001, ym, z + .26, texto, '#FFFFFF', 6.4);
}

// ───── Biblioteca ─────
const janBib: OpcoesJanela = { base: .18, topo: .86, passo: .75, larg: .34 };
export const bibliotecaTerreoSimples = (b: Predio, P: Paleta) => andar(b, 0, P, { ...janBib, pular: (i, n) => i === Math.floor(n / 2) });
export const bibliotecaAndarSimples = (b: Predio, P: Paleta) => andar(b, 1, P, janBib);
export const bibliotecaTelhadoSimples = (b: Predio, P: Paleta, placa: boolean) => telhado(b, 2, P, P.lc) + (placa ? letreiroTeto(b, 2, P, 'BIBLIOTECA', P.lc) : '');
export const bibliotecaEntradaSimples = (b: Predio, P: Paleta, xc: number) => entrada(b, P, xc, P.lc);

// ───── Teatro e cinema ─────
export function teatroSimples(TE: { x: number; y: number; w: number; d: number; z0: number }, P: Paleta, etapa: number, xc: number): string {
  const b: Predio = { x: TE.x + .3, y: TE.y + .25, w: TE.w - .6, d: TE.d - .5, z0: TE.z0, h: 1.4 };
  if (etapa === 1) return andar(b, 0, P, { passo: .8 });
  return andares(b, 2, P, { passo: .8 }) + telhado(b, 2, P, P.lc) + entrada(b, P, xc, P.lc) + (etapa >= 3 ? letreiroTeto(b, 2, P, 'TEATRO', P.lc) : '');
}

export function cinemaSimples(CI: Predio, P: Paleta, etapa: number): string {
  const b: Predio = { ...CI, h: 1.35 };
  if (etapa === 1) return andar(b, 0, P, { passo: .75 });
  return andares(b, 2, P, { passo: .75 }) + telhado(b, 2, P, P.lc) + entradaLateral(b, P, b.y + b.d / 2, P.lc) + (etapa >= 3 ? letreiroTeto(b, 2, P, 'CINEMA', P.lc, 'x') : '');
}

// ───── Templo de Humanas ─────
interface Templo { x: number; y: number; w: number; d: number; }
const ZEST = .36, ZCAP = 2.21;
export function temploLajeSimples(t: Templo, P: Paleta, letreiro: boolean): string {
  const x0 = t.x + .22, y0 = t.y + .22, w = t.w - .44, d = t.d - .44, laje = P.noite ? '#A9AECF' : '#ECE8DE';
  let o = box(x0, y0, ZCAP, w, d, .2, laje, { r: shade(laje, .86) }) + box(x0, y0, ZCAP + .2, w, d, .07, P.ch, { t: shade(P.telhado, .95) });
  if (letreiro) {
    const X = x0 + w + .004, ym = y0 + d / 2;
    o += faceX(X, ym - .95, ym + .95, ZCAP + .02, ZCAP + .18, P.ch) + textoX(X + .001, ym, ZCAP + .1, 'HUMANAS', '#FFFFFF', 6.2);
  }
  return o;
}
export function temploPilaresSimples(t: Templo, P: Paleta): string {
  const xf = t.x + t.w - .45, ys = t.y + t.d - .45, pts: [number, number][] = [], cor = P.noite ? '#A9AECF' : '#F1EEE7';
  for (let i = 0; i < 4; i++) pts.push([xf, t.y + .45 + (i * (t.d - .9)) / 3]);
  for (let i = 0; i < 4; i++) pts.push([t.x + .45 + (i * (t.w - .9)) / 4, ys]);
  pts.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  return pts.map(([x, y]) => box(x - .13, y - .13, ZEST, .26, .26, ZCAP - ZEST, cor, { r: shade(cor, .84) })).join('');
}

// ───── Estufa ─────
interface Estufa { x: number; y: number; w: number; d: number; }
const ZB = .22;
const centroEstufa = (e: Estufa) => ({ x0: e.x + e.w / 2 - .9, x1: e.x + e.w / 2 + .9, y0: e.y + e.d / 2 - .9, y1: e.y + e.d / 2 + .9 });

export function estufaEstrutura(e: Estufa, P: Paleta): string {
  const c = centroEstufa(e), t = ZB + 1.3, ym = (c.y0 + c.y1) / 2, ferro = P.noite ? '#7FD6AE' : '#2F7D55';
  let o = '';
  for (const [x, y] of [[c.x0, c.y0], [c.x1, c.y0], [c.x0, c.y1], [c.x1, c.y1]] as [number, number][]) o += linha3([[x, y, ZB], [x, y, t]], ferro, 1.4);
  o += linha3([[c.x0, c.y1, t], [c.x1, c.y1, t], [c.x1, c.y0, t]], ferro, 1.3) + linha3([[c.x0, c.y1, t], [c.x0, ym, t + .6], [c.x1, ym, t + .6], [c.x1, c.y1, t]], ferro, 1.2);
  o += linha3([[c.x1, c.y0, t], [c.x1, ym, t + .6]], ferro, 1.2);
  return o;
}

export function estufaSimples(e: Estufa, P: Paleta, placa = false): string {
  const c = centroEstufa(e), t = ZB + 1.3, r = (c.y0 + c.y1) / 2, quadro = P.noite ? '#7FD6AE' : '#2F7D55', vidro = P.noite ? '#6FA88F' : '#BFE6D4';
  let o = poly([[c.x0, c.y1, ZB], [c.x1, c.y1, ZB], [c.x1, c.y1, t], [c.x0, c.y1, t]], vidro, ' fill-opacity=".55"') +
    poly([[c.x1, c.y0, ZB], [c.x1, c.y1, ZB], [c.x1, c.y1, t], [c.x1, c.y0, t]], shade(vidro, .85), ' fill-opacity=".6"') +
    poly([[c.x0, c.y1, t], [c.x1, c.y1, t], [c.x1, r, t + .6], [c.x0, r, t + .6]], shade(vidro, 1.06), ' fill-opacity=".75"') +
    poly([[c.x1, c.y0, t], [c.x1, c.y1, t], [c.x1, r, t + .6]], shade(vidro, .8), ' fill-opacity=".75"');
  for (let i = 0; i <= 4; i++) { const x = c.x0 + (i * (c.x1 - c.x0)) / 4; o += linha3([[x, c.y1, ZB], [x, c.y1, t], [x, r, t + .6]], quadro, 1.1); }
  for (let i = 0; i <= 3; i++) { const y = c.y0 + (i * (c.y1 - c.y0)) / 3; o += linha3([[c.x1, y, ZB], [c.x1, y, t]], quadro, 1.1); }
  o += faceY(c.y1 + .004, (c.x0 + c.x1) / 2 - .25, (c.x0 + c.x1) / 2 + .25, ZB, ZB + .8, P.noite ? '#FFE9A8' : '#3E7A5C');
  if (placa) { const xm = (c.x0 + c.x1) / 2; o += faceY(c.y1 + .006, xm - .5, xm + .5, t - .34, t - .06, P.cn) + textoNoPlano(xm, c.y1 + .007, t - .2, 'ESTUFA', '#FFFFFF', 5.8); }
  return o;
}

// ───── Observatório ─────
export function observatorioTorreSimples(o: { cx: number; cy: number }, P: Paleta): string {
  const par = P.noite ? '#8E97C4' : '#F5F6FA', g = iso(o.cx + 1.1, o.cy + .55, .3);
  return cilindro(o.cx, o.cy, .3, 1.75, 1.2, par) + `<path d="M${f1(g[0] - 3.5)},${f1(g[1])} l0,-15 q3.5,-4 7,0 l0,15 z" fill="${P.noite ? '#FFE1A0' : '#3B4A86'}"/>`;
}
export function observatorioCupulaSimples(o: { cx: number; cy: number }, P: Paleta): string {
  const t = iso(o.cx, o.cy, 2.05), cor = P.noite ? '#8A6A2E' : '#C9CFDC';
  return cupula(o.cx, o.cy, 2.05, 1.12, cor) + `<path d="M${f1(t[0] - 2)},${f1(t[1] - 26)} L${f1(t[0] + 2)},${f1(t[1] - 26)} L${f1(t[0] + 6)},${f1(t[1] + 6)} L${f1(t[0] + 2)},${f1(t[1] + 7)} Z" fill="${P.noite ? '#FFD66B' : '#3A4366'}"/>`;
}
