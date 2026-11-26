import { Paleta, Predio, P3, iso, f1, shade, mix, box, topo, faceX, faceY, poly, linha3, cilindro, sombraChao, aleatorio, degraus } from './motor';

export const OURO = '#E8B931';
const cortina = (P: Paleta) => (P.noite ? '#7A1A2C' : '#8E1F33');
const creme = (P: Paleta) => (P.noite ? '#9CA2C8' : '#FBF4E8');
const cremeSombra = (P: Paleta) => (P.noite ? '#8287AE' : '#EADFCB');
const vermelhoTeatro = (P: Paleta) => (P.noite ? '#A8344A' : '#C7455A');
const brilho = (P: Paleta) => (P.noite ? '#FFD66B' : '#FFE9A8');

function faixa(x: number, y: number, w: number, d: number, z: number, h: number, cor: string, corLado?: string): string {
  return faceY(y + d, x, x + w, z, z + h, cor) + faceX(x + w, y, y + d, z, z + h, corLado ?? shade(cor, .82));
}

export interface Teatro { x: number; y: number; w: number; d: number; z0: number; h: number; }

export function arcoY(Y: number, xc: number, w: number, z0: number, z1: number, fill: string, extra = ''): string {
  const r = w / 2, zs = z1 - r, p: P3[] = [[xc - r, Y, z0], [xc - r, Y, zs]];
  for (let k = 1; k < 12; k++) { const t = Math.PI - (k / 12) * Math.PI; p.push([xc + Math.cos(t) * r, Y, zs + Math.sin(t) * r]); }
  p.push([xc + r, Y, zs], [xc + r, Y, z0]);
  return poly(p, fill, extra);
}

export function arcoX(X: number, yc: number, w: number, z0: number, z1: number, fill: string, extra = ''): string {
  const r = w / 2, zs = z1 - r, p: P3[] = [[X, yc - r, z0], [X, yc - r, zs]];
  for (let k = 1; k < 12; k++) { const t = Math.PI - (k / 12) * Math.PI; p.push([X, yc + Math.cos(t) * r, zs + Math.sin(t) * r]); }
  p.push([X, yc + r, zs], [X, yc + r, z0]);
  return poly(p, fill, extra);
}

function textoY(x: number, y: number, z: number, texto: string, cor: string, tam: number, espaco = 0, extra = ''): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" letter-spacing="${espaco}" fill="${cor}"${extra}>${texto}</text>`;
}

export function mascaras(x: number, y: number, z: number, P: Paleta, s = 1): string {
  const c = iso(x, y, z), traco = P.noite ? '#2A1B2E' : '#5A2430';
  const rosto = 'M-5,-6 C-5,-9.6 5,-9.6 5,-6 C6,.5 4,6.4 0,8.4 C-4,6.4 -6,.5 -5,-6 Z';
  const comedia = `<g transform="rotate(-16) translate(-3.6 .4)"><path d="${rosto}" fill="${OURO}" stroke="${shade(OURO, .7)}" stroke-width=".7"/>` +
    `<path d="M-3.4,-2.4 q1.2,-1.6 2.4,0 M1,-2.4 q1.2,-1.6 2.4,0 M-2.8,1.8 q2.8,3.6 5.6,0" stroke="${traco}" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`;
  const tragedia = `<g transform="rotate(15) translate(4 1.2)"><path d="${rosto}" fill="${creme(P)}" stroke="${shade(creme(P), .7)}" stroke-width=".7"/>` +
    `<path d="M-3.4,-3 q1.2,1.4 2.4,0 M1,-3 q1.2,1.4 2.4,0 M-2.4,4.6 q2.4,-2.8 4.8,0" stroke="${traco}" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`;
  const fita = `<path d="M-9,5 q4,4 9,1 q5,3 9,-1" stroke="${P.lc}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  return `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30) scale(${s})">${fita}${tragedia}${comedia}</g>`;
}

export function teatroFundacao(t: Teatro, P: Paleta, pX0: number, pX1: number): string {
  const Y = t.y + t.d, pedra = P.noite ? '#4A5280' : '#D9D2C3';
  return topo(t.x - .25, t.y - .25, t.x + t.w + .7, Y + 1.5, .004, P.sombra) +
    box(t.x - .12, t.y - .12, 0, t.w + .24, t.d + .24, t.z0, pedra) +
    box(pX0, Y, 0, pX1 - pX0, .95, .66, pedra, { t: shade(pedra, 1.04) }) +
    degraus(pX0 + .05, Y + .95, pX1 - pX0 - .1, .66, 3, P, 'y', shade(pedra, 1.05));
}

export function teatroSalao(t: Teatro, P: Paleta, pX0: number, pX1: number): string {
  const X = t.x + t.w, Y = t.y + t.d, z = t.z0, zt = z + t.h, cor = vermelhoTeatro(P);
  const vidro = P.noite ? P.janela : '#3B4A86';
  let o = box(t.x, t.y, z, t.w, t.d, t.h, cor, { l: shade(cor, .96), r: shade(cor, .8), t: P.telhado });
  o += faixa(t.x - .02, t.y - .02, t.w + .04, t.d + .04, z, .2, creme(P), cremeSombra(P));
  for (const yc of [t.y + .62, t.y + t.d / 2, Y - .62]) {
    o += arcoX(X + .003, yc, .52, z + .6, z + 2.5, creme(P)) + arcoX(X + .005, yc, .4, z + .68, z + 2.42, vidro);
    o += linha3([[X + .007, yc, z + .64], [X + .007, yc, z + 2.2]], creme(P), .9) + linha3([[X + .007, yc - .23, z + 1.5], [X + .007, yc + .23, z + 1.5]], creme(P), .9);
    if (P.noite) o += arcoX(X + .008, yc, .3, z + .9, z + 2.0, '#FFE9A8', ' opacity=".35"');
  }
  o += faceY(Y + .002, pX0, pX1, .66, z + 2.1, 'rgba(20,8,16,.16)');
  const porta = (xc: number, w: number, alto: number) => {
    let s = arcoY(Y + .003, xc, w + .14, .66, .66 + alto + .07, creme(P)) + arcoY(Y + .004, xc, w, .66, .66 + alto, cortina(P));
    const n = Math.max(3, Math.round(w / .1));
    for (let i = 1; i < n; i++) { const x = xc - w / 2 + (i * w) / n; s += linha3([[x, Y + .005, .7], [x, Y + .005, .66 + alto - w * .45]], shade(cortina(P), .7), .7); }
    s += arcoY(Y + .006, xc, w * .22, .66, .66 + alto * .82, P.noite ? '#FFD66B' : '#F6B04A', ' opacity=".85"');
    const a = iso(xc - w / 2, Y + .006, .66 + alto * .55), b = iso(xc + w / 2, Y + .006, .66 + alto * .55);
    return s + `<circle cx="${f1(a[0] + 2)}" cy="${f1(a[1])}" r="1.3" fill="${OURO}"/><circle cx="${f1(b[0] - 2)}" cy="${f1(b[1])}" r="1.3" fill="${OURO}"/>`;
  };
  const meio = (pX0 + pX1) / 2;
  o += porta(meio, .78, 1.55) + porta(meio - .95, .44, 1.1) + porta(meio + .95, .44, 1.1);
  return o;
}

export function teatroCornija(t: Teatro, P: Paleta): string {
  const z = t.z0 + t.h, zt = z + .32, vidro = P.noite ? '#FFD66B' : '#9FC3E8';
  const claraboia = box(t.x + .9, t.y + 2.0, zt, t.w - 1.8, 1.0, .16, creme(P), { r: cremeSombra(P), t: shade(P.telhado, .85) }) +
    poly([[t.x + 1.0, t.y + 2.1, zt + .16], [t.x + t.w - 1.0, t.y + 2.1, zt + .16], [t.x + t.w - 1.0, t.y + 2.5, zt + .42], [t.x + 1.0, t.y + 2.5, zt + .42]], shade(vidro, .9), ' fill-opacity=".9"') +
    poly([[t.x + 1.0, t.y + 2.5, zt + .42], [t.x + t.w - 1.0, t.y + 2.5, zt + .42], [t.x + t.w - 1.0, t.y + 2.9, zt + .16], [t.x + 1.0, t.y + 2.9, zt + .16]], vidro, ' fill-opacity=".9"') +
    box(t.x + .55, t.y + 2.2, zt, .4, .4, .3, P.concreto) + box(t.x + t.w - .95, t.y + 2.25, zt, .35, .35, .24, P.concreto);
  return box(t.x - .1, t.y - .1, z, t.w + .2, t.d + .2, .14, creme(P), { r: cremeSombra(P) }) +
    box(t.x - .1, t.y - .1, z + .14, t.w + .2, t.d + .2, .06, OURO) +
    box(t.x - .04, t.y - .04, z + .2, t.w + .08, t.d + .08, .12, creme(P), { r: cremeSombra(P), t: shade(P.telhado, .92) }) + claraboia;
}

export function teatroCaixaCenica(t: Teatro, P: Paleta): string {
  const z = t.z0 + t.h + .32, x = t.x + .45, w = t.w - .9, d = 1.35, h = 1.3, cor = shade(vermelhoTeatro(P), .93);
  let o = box(x, t.y + .05, z, w, d, h, cor, { r: shade(cor, .8), t: P.telhado }) +
    box(x - .06, t.y - .01, z + h, w + .12, d + .12, .12, creme(P), { r: cremeSombra(P) });
  const Y = t.y + .05 + d, xc = x + w / 2;
  o += faceY(Y + .003, xc - .85, xc + .85, z + .28, z + 1.0, cortina(P), ` stroke="${OURO}" stroke-width="1.1"`);
  o += mascaras(xc, Y + .006, z + .64, P, .78);
  return o;
}

export function teatroPortico(t: Teatro, P: Paleta, pX0: number, pX1: number): string {
  const Y = t.y + t.d, n = 4, zb = .66, zc = t.z0 + 2.1;
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = pX0 + .3 + (i * (pX1 - pX0 - .6)) / (n - 1), y = Y + .72;
    o += box(x - .19, y - .19, zb, .38, .38, .1, cremeSombra(P)) + cilindro(x, y, zb + .1, zc - zb - .22, .13, creme(P)) +
      linha3([[x - .04, y + .12, zb + .15], [x - .04, y + .12, zc - .15]], cremeSombra(P), .8) +
      box(x - .2, y - .2, zc - .12, .4, .4, .12, creme(P), { r: cremeSombra(P) });
  }
  return o;
}

export function teatroFrontao(t: Teatro, P: Paleta, pX0: number, pX1: number): string {
  const Y = t.y + t.d, zE = t.z0 + 2.1, ex0 = pX0 - .06, ex1 = pX1 + .06, Yf = Y + .98, zt = zE + .34, zA = zt + .9, xm = (pX0 + pX1) / 2;
  const tel = P.noite ? '#7B2638' : '#9C3044';
  let o = box(ex0, Y, zE, ex1 - ex0, .98, .34, creme(P), { r: cremeSombra(P) });
  o += faceY(Yf + .002, ex0, ex1, zE + .26, zE + .3, OURO);
  o += textoY(xm, Yf + .004, zE + .13, 'TEATRO', P.noite ? '#7A1A2C' : '#9C2A3E', 8.4, 2.2);
  o += poly([[ex0, Yf, zt], [xm, Yf, zA], [xm, Y, zA], [ex0, Y, zt]], shade(tel, 1.08));
  o += poly([[xm, Yf, zA], [ex1, Yf, zt], [ex1, Y, zt], [xm, Y, zA]], shade(tel, .86));
  o += poly([[ex0 - .04, Yf + .003, zt - .02], [ex1 + .04, Yf + .003, zt - .02], [xm, Yf + .003, zA + .06]], creme(P));
  o += poly([[ex0 + .22, Yf + .005, zt + .09], [ex1 - .22, Yf + .005, zt + .09], [xm, Yf + .005, zA - .14]], vermelhoTeatro(P));
  o += linha3([[ex0 + .1, Yf + .006, zt + .04], [ex1 - .1, Yf + .006, zt + .04]], OURO, .9);
  o += mascaras(xm, Yf + .008, zt + .33, P, .74);
  const a = iso(xm, Yf + .008, zA + .08);
  o += `<path d="M${f1(a[0])},${f1(a[1] - 7)} l2,4 l-2,4 l-2,-4 z" fill="${OURO}"/>`;
  return o;
}

export function teatroLetreiro(t: Teatro, P: Paleta): string {
  const X = t.x + t.w, y = t.y + t.d - .32, z0 = t.z0 + .95, z1 = t.z0 + 3.35, x1 = X + .6;
  const fundo = P.noite ? '#5A1222' : '#8E1F33', letra = P.noite ? '#FFE27A' : '#FFFFFF';
  let o = box(X, y - .03, z1 - .2, .12, .06, .06, P.ferro) + box(X, y - .03, z0 + .25, .12, .06, .06, P.ferro);
  o += box(X + .1, y - .05, z0, x1 - X - .1, .1, z1 - z0, fundo, { l: fundo, r: shade(fundo, .75), t: OURO });
  o += faceY(y + .052, X + .14, x1 - .04, z0 + .05, z1 - .05, 'none', ` stroke="${OURO}" stroke-width="1"`);
  const letras = 'TEATRO'.split(''), passo = (z1 - z0 - .3) / letras.length;
  letras.forEach((l, i) => {
    const c = iso((X + .12 + x1) / 2, y + .055, z1 - .2 - (i + .5) * passo);
    o += `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="2.8" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="7.6" font-weight="800" fill="${letra}">${l}</text>`;
  });
  for (let i = 0; i <= 9; i++) {
    const z = z0 + .08 + (i * (z1 - z0 - .16)) / 9;
    for (const x of [X + .17, x1 - .07]) {
      const c = iso(x, y + .056, z);
      o += `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${((i * 3 + (x > X + .3 ? 1 : 0)) % 7) * .2}s" cx="${f1(c[0])}" cy="${f1(c[1])}" r="1.1" fill="${brilho(P)}"/>`;
    }
  }
  const topoS = iso((X + .12 + x1) / 2, y, z1 + .05);
  o += `<path d="M${f1(topoS[0] - 5)},${f1(topoS[1])} L${f1(topoS[0])},${f1(topoS[1] - 7)} L${f1(topoS[0] + 5)},${f1(topoS[1])} Z" fill="${OURO}"/>`;
  if (P.noite) {
    const m = iso(X + .35, y, (z0 + z1) / 2);
    o = `<ellipse cx="${f1(m[0])}" cy="${f1(m[1])}" rx="16" ry="38" fill="#FF6B7D" opacity=".16"/>` + o;
  }
  return o;
}

export function teatroCartazes(t: Teatro, P: Paleta, pX0: number, pX1: number): string {
  const Y = t.y + t.d, cores = [[P.ch, OURO], [P.mt, P.lc]];
  return [[t.x + .05, pX0 - .05], [pX1 + .05, t.x + t.w - .05]].map(([a, b], i) => {
    const xc = (a + b) / 2, w = Math.min(.36, b - a - .04), [c1, c2] = cores[i];
    let s = faceY(Y + .003, xc - w / 2 - .04, xc + w / 2 + .04, t.z0 + .7, t.z0 + 1.95, OURO) + faceY(Y + .004, xc - w / 2, xc + w / 2, t.z0 + .76, t.z0 + 1.89, c1);
    s += faceY(Y + .005, xc - w / 2 + .04, xc + w / 2 - .04, t.z0 + 1.2, t.z0 + 1.7, c2, ' opacity=".9"');
    const g = iso(xc, Y + .006, t.z0 + 1.46);
    s += `<circle cx="${f1(g[0])}" cy="${f1(g[1])}" r="2.4" fill="#FFFFFF" opacity=".85"/>`;
    s += faceY(Y + .005, xc - w / 2 + .05, xc + w / 2 - .05, t.z0 + .88, t.z0 + .95, '#FFFFFF', ' opacity=".8"') + faceY(Y + .005, xc - w / 2 + .05, xc + w / 2 - .12, t.z0 + 1.0, t.z0 + 1.06, '#FFFFFF', ' opacity=".6"');
    return s;
  }).join('');
}

export function teatroEstandartes(t: Teatro, P: Paleta): string {
  const X = t.x + t.w;
  return [t.y + 1.15, t.y + 2.2].map((yc, i) => {
    const z1 = t.z0 + t.h - .25, z0 = z1 - 1.3;
    let s = box(X, yc - .03, z1, .3, .06, .05, P.ferro);
    s += poly([[X + .26, yc - .2, z1], [X + .26, yc + .2, z1], [X + .26, yc + .2, z0 + .15], [X + .26, yc, z0], [X + .26, yc - .2, z0 + .15]], i ? OURO : P.lc);
    const c = iso(X + .26, yc, z0 + .75);
    return s + `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)"><circle r="3.4" fill="#FFFFFF" opacity=".9"/><circle r="1.6" fill="${i ? P.lc : OURO}"/></g>`;
  }).join('');
}

export function teatroLuzes(t: Teatro, P: Paleta, pX0: number, pX1: number): string {
  const Y = t.y + t.d + .98, zE = t.z0 + 2.1;
  let o = '';
  for (let i = 0; i <= 14; i++) {
    const x = pX0 + (i * (pX1 - pX0)) / 14, c = iso(x, Y + .01, zE - .02);
    o += `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${(i % 5) * .3}s" cx="${f1(c[0])}" cy="${f1(c[1])}" r="1.2" fill="${brilho(P)}"/>`;
  }
  if (P.noite) {
    for (const x of [pX0 + .3, pX1 - .3]) { const g = iso(x, Y + .2, 0); o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1] - 30)}" rx="13" ry="34" fill="#FFE9A8" opacity=".12"/>`; }
  }
  return o;
}

function estantes(Y: number, x0: number, x1: number, z0: number, z1: number, P: Paleta, semente: number): string {
  const fundo = P.noite ? '#FFE1A0' : '#EFE5D3';
  let o = faceY(Y, x0, x1, z0, z1, fundo);
  const rnd = aleatorio(semente);
  const cores = [P.lc, P.ch, P.cn, P.mt, P.caneta, '#F2C14E', '#7A5BD8', P.noite ? '#5A4636' : '#6B513E', '#E86A8A'];
  const niveis = 2, alt = (z1 - z0) / niveis;
  for (let r = 0; r < niveis; r++) {
    const zb = z0 + r * alt + .06;
    let x = x0 + .03;
    while (x < x1 - .06) {
      const w = .045 + rnd() * .045, h = alt * (.5 + rnd() * .3);
      if (rnd() < .07) { x += .1; continue; }
      const xb = Math.min(x + w, x1 - .03);
      if (rnd() < .1) o += poly([[x, Y + .001, zb], [xb, Y + .001, zb], [xb + h * .35, Y + .001, zb + h * .9], [x + h * .35, Y + .001, zb + h]], cores[Math.floor(rnd() * cores.length)]);
      else o += faceY(Y + .001, x, xb, zb, zb + h, cores[Math.floor(rnd() * cores.length)]);
      x = xb + .01;
    }
    o += faceY(Y + .0015, x0, x1, zb - .04, zb, shade(P.madeira, P.noite ? .9 : .78));
  }
  return o;
}

function vitrine(Y: number, x0: number, x1: number, z0: number, z1: number, P: Paleta, semente: number, quadro: string): string {
  let o = estantes(Y + .001, x0, x1, z0, z1, P, semente);
  o += faceY(Y + .003, x0, x1, z0, z1, P.noite ? '#FFF3C8' : '#BFD8F2', ` opacity="${P.noite ? .12 : .3}"`);
  if (!P.noite) {
    for (const f of [.12, .58]) {
      const a = x0 + (x1 - x0) * f;
      o += poly([[a, Y + .004, z0], [a + .28, Y + .004, z0], [a + .7, Y + .004, z1], [a + .42, Y + .004, z1]], '#FFFFFF', ' opacity=".2"');
    }
  }
  const n = Math.max(2, Math.round((x1 - x0) / .45));
  for (let i = 1; i < n; i++) { const x = x0 + (i * (x1 - x0)) / n; o += linha3([[x, Y + .005, z0], [x, Y + .005, z1]], quadro, 1.1); }
  return o + faceY(Y + .005, x0, x1, z0, z0 + .05, quadro) + faceY(Y + .005, x0, x1, z1 - .05, z1, quadro);
}

const paredeBiblioteca = (P: Paleta) => (P.noite ? P.parede : '#F7EFE2');
const quadroBiblioteca = (P: Paleta) => (P.noite ? '#2A3152' : '#3A4366');

export function bibliotecaAndar(b: Predio, i: number, P: Paleta, porta: { x0: number; x1: number } | null): string {
  const z = b.z0 + i * b.h, X = b.x + b.w, Y = b.y + b.d, par = paredeBiblioteca(P), q = quadroBiblioteca(P);
  let o = box(b.x, b.y, z, b.w, b.d, b.h, par, { r: shade(par, .82) });
  o += faixa(b.x - .03, b.y - .03, b.w + .06, b.d + .06, z, .12, i === 0 ? (P.noite ? '#6E3A48' : '#B8543F') : P.lc);
  const zv0 = z + .22, zv1 = z + b.h - .12;
  if (porta) {
    o += vitrine(Y + .002, b.x + .18, porta.x0 - .06, zv0, zv1, P, 17 + i * 5, q) + vitrine(Y + .002, porta.x1 + .06, X - .18, zv0, zv1, P, 29 + i * 5, q);
  } else {
    o += vitrine(Y + .002, b.x + .18, X - .18, zv0, zv1, P, 41 + i * 7, q);
  }
  const n = Math.round(b.d / .62);
  for (let k = 0; k < n; k++) {
    const yc = b.y + ((k + .5) * b.d) / n;
    o += faceX(X + .002, yc - .16, yc + .16, zv0 + .02, zv1 - .02, P.noite ? P.janela : '#6E86C6', ` stroke="${P.moldura}" stroke-width=".7"`);
    o += box(X, yc + .19, zv0 - .04, .13, .05, zv1 - zv0 + .08, P.madeira);
  }
  return o;
}

export function bibliotecaPorta(b: Predio, P: Paleta, x0: number, x1: number): string {
  const Y = b.y + b.d, z = b.z0, q = quadroBiblioteca(P);
  let o = faceY(Y + .003, x0, x1, z, z + 1.22, P.noite ? '#FFE1A0' : '#33406F', ` stroke="${q}" stroke-width="1.2"`);
  o += linha3([[(x0 + x1) / 2, Y + .004, z], [(x0 + x1) / 2, Y + .004, z + 1.22]], q, 1);
  o += box(x0 - .25, Y, 0, x1 - x0 + .5, .5, z, P.noite ? '#4A5280' : '#D9D2C3');
  return o;
}

export function livroAberto(xc: number, y0: number, y1: number, z: number, P: Paleta, abre = .95, sobe = .26): string {
  const pagina = P.noite ? '#E6E1D3' : '#FFFDF7', capa = P.lc, esp = .09;
  const xe = xc - abre, xd = xc + abre;
  let o = '';
  for (const x of [xc - abre * .72, xc + abre * .72]) o += box(x - .05, y1 - .3, 0, .1, .1, z - .02, P.ferro);
  o += poly([[xe, y1, z + sobe - esp], [xc, y1, z - esp], [xc, y1, z], [xe, y1, z + sobe]], shade(capa, .9));
  o += poly([[xc, y1, z - esp], [xd, y1, z + sobe - esp], [xd, y1, z + sobe], [xc, y1, z]], capa);
  o += poly([[xd, y0, z + sobe - esp], [xd, y1, z + sobe - esp], [xd, y1, z + sobe], [xd, y0, z + sobe]], shade(capa, .78));
  o += poly([[xe, y0, z + sobe], [xc, y0, z], [xc, y1, z], [xe, y1, z + sobe]], shade(pagina, .97));
  o += poly([[xc, y0, z], [xd, y0, z + sobe], [xd, y1, z + sobe], [xc, y1, z]], pagina);
  const linhaCor = P.noite ? '#9A9BB0' : '#C9C3B5';
  for (let k = 1; k <= 4; k++) {
    for (const lado of [-1, 1]) {
      const f = .16 + k * .16, x = xc + lado * abre * f, zz = z + sobe * f;
      o += linha3([[x, y0 + .12, zz + .005], [x, y1 - .12, zz + .005]], linhaCor, .7);
    }
  }
  o += linha3([[xc, y0, z + .004], [xc, y1, z + .004]], shade(pagina, .82), .9);
  const f = iso(xc, y1, z);
  o += `<path d="M${f1(f[0] - 1.2)},${f1(f[1])} l0,9 l1.2,-1.6 l1.2,1.6 l0,-9 z" fill="${OURO}"/>`;
  return o;
}

export function bibliotecaCobertura(b: Predio, n: number, P: Paleta): string {
  const z = b.z0 + n * b.h, Y = b.y + b.d, xm = b.x + b.w / 2;
  let o = box(b.x - .08, b.y - .08, z, b.w + .16, b.d + .16, .12, paredeBiblioteca(P), { r: shade(paredeBiblioteca(P), .82), t: P.telhado });
  o += box(b.x - .08, b.y - .08, z + .12, b.w + .16, b.d + .16, .34, P.lc, { t: shade(P.telhado, .92) });
  o += topo(b.x + .06, b.y + .06, b.x + b.w - .06, b.y + b.d - .06, z + .462, shade(P.telhado, .9));
  o += textoY(xm, Y + .085, z + .29, 'BIBLIOTECA', '#FFFFFF', 8.2, 1.6);
  return o;
}

export function bibliotecaPaineis(b: Predio, n: number, P: Paleta): string {
  const z = b.z0 + n * b.h + .48;
  let o = '';
  for (let i = 0; i < 2; i++) {
    const y0 = b.y + .3 + i * .8;
    o += poly([[b.x + 2.1, y0, z + .02], [b.x + b.w - .25, y0, z + .02], [b.x + b.w - .25, y0 + .6, z + .24], [b.x + 2.1, y0 + .6, z + .24]], P.painel, ` stroke="${shade(P.painel, 1.6)}" stroke-width=".6"`);
  }
  return o;
}

export function palcoSarau(x: number, y: number, P: Paleta): string {
  const w = 1.15, d = .8;
  let o = sombraChao(x + w / 2, y + d / 2, .8, .4, P) + box(x, y, 0, w, d, .28, P.madeira, { t: shade(P.madeira, 1.08) });
  o += box(x + .05, y + .05, .28, .06, .06, 1.3, P.ferro) + box(x + w - .11, y + .05, .28, .06, .06, 1.3, P.ferro);
  o += linha3([[x + .08, y + .08, 1.58], [x + w - .08, y + .08, 1.58]], P.ferro, 1.6);
  o += poly([[x + .08, y + .08, 1.58], [x + w - .08, y + .08, 1.58], [x + w - .08, y + .08, 1.38], [x + .08, y + .08, 1.38]], P.lc);
  const m = iso(x + w / 2, y + .45, .28), t = iso(x + w / 2, y + .45, .95);
  o += `<line x1="${f1(m[0])}" y1="${f1(m[1])}" x2="${f1(t[0])}" y2="${f1(t[1])}" stroke="${P.ferro}" stroke-width="1"/><circle cx="${f1(t[0])}" cy="${f1(t[1])}" r="1.6" fill="${P.ferro}"/>`;
  return o;
}

export function livrosGigantes(x: number, y: number, P: Paleta): string {
  let o = sombraChao(x + .4, y + .35, .7, .35, P);
  ([[P.lc, 0, 0, .95], [P.ch, .27, .05, .85], [P.mt, .52, -.03, .9], [P.cn, .77, .08, .7]] as [string, number, number, number][]).forEach(([c, z, dx, w]) => {
    o += box(x + dx, y, z, w, .65, .25, c, { t: shade(c, 1.12) }) + faceY(y + .652, x + dx + .05, x + dx + w - .05, z + .05, z + .2, P.branco, ' opacity=".9"');
  });
  const a = iso(x + .5, y + .3, 1.02);
  return o + `<path d="M${f1(a[0] - 8)},${f1(a[1])} q8,-6 8,0 q0,-6 8,0 l0,3 q-8,-5 -8,1 q0,-6 -8,-1 z" fill="${P.branco}" stroke="${P.lc}" stroke-width=".8"/>`;
}

export function bilheteria(x: number, y: number, P: Paleta): string {
  const w = .9, d = .7, h = 1.1;
  let o = sombraChao(x + w / 2, y + d / 2, .7, .35, P) + box(x, y, 0, w, d, h, creme(P), { r: cremeSombra(P) });
  o += faceY(y + d + .003, x + .12, x + w - .12, .45, .95, P.noite ? '#FFE1A0' : '#9FC3E8', ` stroke="${OURO}" stroke-width=".8"`);
  o += box(x - .08, y - .08, h, w + .16, d + .16, .1, vermelhoTeatro(P), { t: shade(vermelhoTeatro(P), 1.08) }) + faceY(y + d + .081, x - .08, x + w + .08, h + .02, h + .05, OURO) + box(x + .05, y + d - .05, .4, w - .1, .25, .05, cremeSombra(P));
  return o;
}

const paredeCinema = (P: Paleta) => (P.noite ? '#4A2A44' : '#6E2E4C');

function textoX(x: number, y: number, z: number, texto: string, cor: string, tam: number, espaco = 0): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" letter-spacing="${espaco}" fill="${cor}">${texto}</text>`;
}

export function cinemaCorpo(b: Predio, P: Paleta): string {
  const X = b.x + b.w, Y = b.y + b.d, z = b.z0, cor = paredeCinema(P), yc = b.y + b.d / 2;
  const vidro = P.noite ? '#FFE1A0' : '#2B2338';
  let o = box(b.x, b.y, z, b.w, b.d, b.h, cor, { r: shade(cor, .82), t: P.telhado });
  o += faixa(b.x - .02, b.y - .02, b.w + .04, b.d + .04, z, .16, OURO, shade(OURO, .85));
  o += faixa(b.x - .02, b.y - .02, b.w + .04, b.d + .04, z + b.h - .14, .14, OURO, shade(OURO, .85));
  for (let k = 0; k < 3; k++) {
    const xc = b.x + .55 + k * .85;
    o += faceY(Y + .003, xc - .17, xc + .17, z + 1.9, z + 2.9, P.noite ? P.janela : '#3B4A86', ` stroke="${OURO}" stroke-width=".7"`);
  }
  o += faceX(X + .003, yc - .55, yc + .55, z, z + 1.15, vidro, ` stroke="${OURO}" stroke-width="1.1"`);
  o += linha3([[X + .004, yc, z], [X + .004, yc, z + 1.15]], OURO, .9);
  for (const [i, y] of [b.y + .45, Y - .45].entries()) {
    o += faceX(X + .003, y - .27, y + .27, z + .25, z + 1.35, OURO) + faceX(X + .004, y - .23, y + .23, z + .29, z + 1.31, i ? P.ch : P.lc);
    o += faceX(X + .005, y - .18, y + .18, z + .85, z + 1.2, '#FFFFFF', ' opacity=".18"');
    const c = iso(X + .006, y, z + .72);
    o += `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)"><circle r="3.6" fill="#FFFFFF" opacity=".92"/><path d="M-1.3,-2 L2.2,0 L-1.3,2 Z" fill="${i ? P.ch : P.lc}"/></g>`;
  }
  return o;
}

export function cinemaTorre(b: Predio, P: Paleta): string {
  const X = b.x + b.w, z = b.z0, yc = b.y + .6, w = .9, x0 = X - .45, x1 = X + .12, zt = z + b.h + 1.25, cor = shade(paredeCinema(P), 1.1);
  let o = box(x0, yc - w / 2, z + 1.6, x1 - x0, w, zt - z - 1.6, cor, { r: shade(cor, .84), t: OURO });
  for (const dy of [-.28, 0, .28]) o += faceX(x1 + .003, yc + dy - .03, yc + dy + .03, z + 1.75, zt - .75, OURO, ' opacity=".9"');
  o += box(x0 - .05, yc - w / 2 - .05, zt, x1 - x0 + .1, w + .1, .1, OURO);
  o += box(x0 + .08, yc - .25, zt + .1, x1 - x0 - .16, .5, .25, cor, { r: shade(cor, .84), t: OURO });
  const c = iso(x1 + .004, yc, zt - .4), r = 7.4;
  const furos = [0, 72, 144, 216, 288].map(a => { const t = (a * Math.PI) / 180; return `<circle cx="${f1(Math.cos(t) * r * .5)}" cy="${f1(Math.sin(t) * r * .5)}" r="1.5" fill="${cor}"/>`; }).join('');
  o += `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)"><circle r="${r + 1.4}" fill="${OURO}"/><circle r="${r}" fill="${P.noite ? '#2A1B2E' : '#3A2438'}"/><circle r="${r * .82}" fill="${P.noite ? '#E8E2D0' : '#F4F0E6'}"/>${furos}<circle r="1.4" fill="${OURO}"/></g>`;
  if (P.noite) o = `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="18" ry="18" fill="${OURO}" opacity=".18"/>` + o;
  return o;
}

export function cinemaMarquise(b: Predio, P: Paleta): string {
  const X = b.x + b.w, z = b.z0, zm = z + 2.05, alt = .66, prof = .8, y0 = b.y + 1.08, y1 = b.y + b.d;
  const fundo = P.noite ? '#3A0F1E' : '#9C2A3E', letra = P.noite ? '#FFE27A' : '#FFFFFF', xf = X + prof;
  let o = '';
  if (P.noite) { const m = iso(xf, (y0 + y1) / 2, zm); o += `<ellipse cx="${f1(m[0])}" cy="${f1(m[1] + 20)}" rx="46" ry="22" fill="#FF6B7D" opacity=".16"/>`; }
  o += box(X, y0, zm, prof, y1 - y0, alt, fundo, { l: shade(fundo, .9), r: fundo, t: shade(fundo, 1.25) }) + topo(X, y0, xf, y0 + .04, zm + alt + .002, OURO) + topo(X, y1 - .04, xf, y1, zm + alt + .002, OURO) + topo(xf - .04, y0, xf, y1, zm + alt + .002, OURO);
  o += faceX(xf + .002, y0 + .05, y1 - .05, zm + .05, zm + alt - .05, 'none', ` stroke="${OURO}" stroke-width="1"`);
  o += textoX(xf + .004, (y0 + y1) / 2, zm + alt / 2, 'CINEMA', letra, 9.4, .7);
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const y = y0 + .08 + (i * (y1 - y0 - .16)) / n;
    for (const zz of [zm + .08, zm + alt - .08]) {
      const c = iso(xf + .005, y, zz);
      o += `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${((i + (zz > zm + .3 ? 3 : 0)) % 6) * .25}s" cx="${f1(c[0])}" cy="${f1(c[1])}" r="1.1" fill="${brilho(P)}"/>`;
    }
  }
  return o;
}
