import { Paleta, Predio, P3, iso, f1, shade, box, topo, faceX, faceY, poly, linha3, sombraChao, cupula, cilindro, banco, U } from './motor';

const OURO = '#E8B931';
const vidroEstufa = (P: Paleta) => (P.noite ? '#7FD6AE' : '#A9E3C8');
const quadro = (P: Paleta) => (P.noite ? '#CFE8DC' : '#2F7D55');
const base = (P: Paleta) => (P.noite ? '#6B7398' : '#EFEAE0');

function textoY(x: number, y: number, z: number, texto: string, cor: string, tam: number, espaco = 0): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" letter-spacing="${espaco}" fill="${cor}">${texto}</text>`;
}

function faixa(x: number, y: number, w: number, d: number, z: number, h: number, cor: string, corLado?: string): string {
  return faceY(y + d, x, x + w, z, z + h, cor) + faceX(x + w, y, y + d, z, z + h, corLado ?? shade(cor, .82));
}

export interface Estufa { x: number; y: number; w: number; d: number; }
const ZB = .22;
const centro = (e: Estufa) => ({ x0: e.x + e.w / 2 - .9, x1: e.x + e.w / 2 + .9, y0: e.y + e.d / 2 - .9, y1: e.y + e.d / 2 + .9 });
const ala = (e: Estufa, lado: 0 | 1) => { const c = centro(e); return { x0: lado ? c.x1 : e.x, x1: lado ? e.x + e.w : c.x0, y0: e.y + e.d / 2 - .7, y1: e.y + e.d / 2 + .7 }; };

export function estufaBase(e: Estufa, P: Paleta): string {
  const c = centro(e);
  let o = topo(e.x - .2, e.y - .2, e.x + e.w + .6, e.y + e.d + .6, .004, P.sombra);
  o += box(e.x - .08, e.y + e.d / 2 - .82, 0, e.w + .16, 1.64, ZB, base(P), { r: shade(base(P), .84) });
  o += box(c.x0 - .08, c.y0 - .08, 0, c.x1 - c.x0 + .16, c.y1 - c.y0 + .16, ZB, base(P), { r: shade(base(P), .84) });
  o += box(e.x + e.w / 2 - .45, c.y1 + .08, 0, .9, .3, .12, base(P));
  return o;
}

function palmeira(x: number, y: number, z: number, P: Paleta, s = 1): string {
  const b = iso(x, y, z), t = iso(x, y, z + 1.3 * s);
  let o = `<path d="M${f1(b[0])},${f1(b[1])} Q${f1(b[0] + 3 * s)},${f1((b[1] + t[1]) / 2)} ${f1(t[0])},${f1(t[1])}" stroke="${P.tronco}" stroke-width="${f1(2.4 * s)}" fill="none" stroke-linecap="round"/>`;
  const cor = shade(P.arvore, .95), cor2 = P.arvoreLuz;
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2, dx = Math.cos(a) * 12 * s, dy = Math.sin(a) * 5 * s + 4 * s;
    o += `<path d="M${f1(t[0])},${f1(t[1])} q${f1(dx * .5)},${f1(-6 * s)} ${f1(dx)},${f1(dy)}" stroke="${k % 2 ? cor : cor2}" stroke-width="${f1(2.6 * s)}" fill="none" stroke-linecap="round"/>`;
  }
  return o;
}

function moita(x: number, y: number, z: number, P: Paleta, r = 5, flor?: string): string {
  const c = iso(x, y, z);
  let o = `<circle cx="${f1(c[0] - r * .5)}" cy="${f1(c[1])}" r="${r}" fill="${shade(P.arvore, .9)}"/><circle cx="${f1(c[0] + r * .5)}" cy="${f1(c[1] - 1)}" r="${f1(r * .9)}" fill="${P.arvoreLuz}"/>`;
  if (flor) o += `<circle cx="${f1(c[0])}" cy="${f1(c[1] - r * .6)}" r="1.4" fill="${flor}"/><circle cx="${f1(c[0] + r * .7)}" cy="${f1(c[1] - r * .1)}" r="1.2" fill="${flor}"/>`;
  return o;
}

export function estufaPlantas(e: Estufa, P: Paleta): string {
  const c = centro(e), xm = e.x + e.w / 2, ym = e.y + e.d / 2;
  let o = palmeira(xm - .2, ym - .2, ZB, P, 1.15) + palmeira(xm + .35, ym + .15, ZB, P, .85);
  for (const lado of [0, 1] as const) {
    const a = ala(e, lado);
    for (let i = 0; i < 3; i++) {
      const x = a.x0 + .3 + (i * (a.x1 - a.x0 - .6)) / 2;
      o += moita(x, ym - .15, ZB + .3, P, 5, i % 2 ? '#F4A6C0' : '#F2C14E') + (i === 1 ? palmeira(x, ym, ZB, P, .65) : '');
    }
  }
  return o + moita(c.x0 + .3, c.y1 - .3, ZB + .25, P, 4, '#F4A6C0') + moita(c.x1 - .3, c.y1 - .35, ZB + .25, P, 4.4, '#FFFFFF');
}

function alaVidro(a: { x0: number; x1: number; y0: number; y1: number }, P: Paleta, ponta: boolean): string {
  const hw = .95, r = (a.y1 - a.y0) / 2, yc = (a.y0 + a.y1) / 2, zt = ZB + hw, v = vidroEstufa(P), q = quadro(P);
  let o = faceY(a.y1, a.x0, a.x1, ZB, zt, v, ` fill-opacity="${P.noite ? .55 : .5}"`);
  const n = 12, perfil: [number, number][] = [];
  for (let k = 0; k <= n; k++) { const t = Math.PI - (k / n) * Math.PI; perfil.push([yc + Math.cos(t) * r, zt + Math.sin(t) * r]); }
  for (let k = 0; k < n; k++) {
    const [ya, za] = perfil[k], [yb, zb] = perfil[k + 1], luz = .9 + (k / n) * .18;
    o += poly([[a.x0, ya, za], [a.x1, ya, za], [a.x1, yb, zb], [a.x0, yb, zb]], shade(v, luz), ` fill-opacity="${P.noite ? .6 : .62}"`);
  }
  if (ponta) {
    const cap: P3[] = [[a.x1, a.y0, ZB], ...perfil.map(([y, z]) => [a.x1, y, z] as P3), [a.x1, a.y1, ZB]];
    o += poly(cap, shade(v, .86), ` fill-opacity="${P.noite ? .6 : .55}"`);
    for (let k = 1; k < 4; k++) { const y = a.y0 + (k * (a.y1 - a.y0)) / 4; o += linha3([[a.x1 + .003, y, ZB], [a.x1 + .003, y, zt + Math.sqrt(Math.max(0, r * r - (y - yc) ** 2))]], q, 1); }
    o += linha3(perfil.map(([y, z]) => [a.x1 + .004, y, z] as P3), q, 1.4);
  }
  const passos = Math.max(3, Math.round((a.x1 - a.x0) / .32));
  for (let i = 0; i <= passos; i++) {
    const x = a.x0 + (i * (a.x1 - a.x0)) / passos;
    o += linha3([[x, a.y1 + .002, ZB], [x, a.y1 + .002, zt]], q, 1) + linha3(perfil.filter((_, k) => k >= n / 2).map(([y, z]) => [x, y + .002, z] as P3), q, .9);
  }
  o += linha3([[a.x0, a.y1 + .003, zt], [a.x1, a.y1 + .003, zt]], q, 1.4) + linha3([[a.x0, yc, zt + r], [a.x1, yc, zt + r]], q, 1.4);
  return o;
}

export function estufaAlas(e: Estufa, P: Paleta): string {
  return alaVidro(ala(e, 0), P, false) + alaVidro(ala(e, 1), P, true);
}

export function estufaPavilhao(e: Estufa, P: Paleta): string {
  const c = centro(e), v = vidroEstufa(P), q = quadro(P), h = 1.55, zt = ZB + h, xm = (c.x0 + c.x1) / 2;
  let o = faceY(c.y1, c.x0, c.x1, ZB, zt, v, ` fill-opacity="${P.noite ? .55 : .48}"`) + faceX(c.x1, c.y0, c.y1, ZB, zt, shade(v, .86), ` fill-opacity="${P.noite ? .55 : .5}"`);
  for (let i = 0; i <= 5; i++) {
    const x = c.x0 + (i * (c.x1 - c.x0)) / 5, y = c.y0 + (i * (c.y1 - c.y0)) / 5;
    o += linha3([[x, c.y1 + .002, ZB], [x, c.y1 + .002, zt]], q, 1) + linha3([[c.x1 + .002, y, ZB], [c.x1 + .002, y, zt]], q, 1);
  }
  o += linha3([[c.x0, c.y1 + .003, ZB + .8], [c.x1, c.y1 + .003, ZB + .8], [c.x1 + .003, c.y0, ZB + .8]], q, 1);
  o += box(c.x0 - .05, c.y0 - .05, zt, c.x1 - c.x0 + .1, c.y1 - c.y0 + .1, .1, q, { t: shade(q, .94), r: shade(q, .86) });
  o += faceY(c.y1 + .004, xm - .35, xm + .35, ZB, ZB + .85, P.noite ? '#FFE9A8' : '#3E7A5C', ` stroke="${q}" stroke-width="1"`);
  o += faceY(c.y1 + .005, c.x0 + .15, c.x1 - .15, zt - .3, zt - .04, P.cn) + textoY(xm, c.y1 + .006, zt - .17, 'ESTUFA', '#FFFFFF', 6.4, 1.6);
  return o;
}

export function estufaCupula(e: Estufa, P: Paleta): string {
  const c = centro(e), xm = (c.x0 + c.x1) / 2, ym = (c.y0 + c.y1) / 2, z = ZB + 1.55 + .1, r = .86, v = vidroEstufa(P), q = quadro(P);
  let o = cupula(xm, ym, z, r, shade(v, 1.02)).replace(/<path /g, `<path fill-opacity="${P.noite ? .75 : .7}" `);
  const t = iso(xm, ym, z), rx = r * U * 1.2247, ry = r * U * .7071, hg = rx * .92;
  for (const f of [-.75, -.4, 0, .4, .75]) {
    const xb = t[0] + f * rx, yb = t[1] + Math.sqrt(Math.max(0, 1 - f * f)) * ry;
    o += `<path d="M${f1(t[0])},${f1(t[1] - hg)} Q${f1(t[0] + f * rx * 1.05)},${f1(t[1] - hg * .55)} ${f1(xb)},${f1(yb)}" fill="none" stroke="${q}" stroke-width="1.1"/>`;
  }
  o += `<path d="M${f1(t[0] - rx * .92)},${f1(t[1] - hg * .38)} A${f1(rx * .92)},${f1(ry * .92)} 0 0 0 ${f1(t[0] + rx * .92)},${f1(t[1] - hg * .38)}" fill="none" stroke="${q}" stroke-width="1"/>`;
  o += `<path d="M${f1(t[0] - rx * .62)},${f1(t[1] - hg * .78)} Q${f1(t[0] - rx * .3)},${f1(t[1] - hg * 1.02)} ${f1(t[0] - rx * .02)},${f1(t[1] - hg * .98)}" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="${P.noite ? .25 : .7}" stroke-linecap="round"/>`;
  const lt = iso(xm, ym, z + r * 1.13);
  o += `<rect x="${f1(lt[0] - 3.4)}" y="${f1(lt[1] - 6)}" width="6.8" height="6" fill="${q}"/><path d="M${f1(lt[0] - 4.4)},${f1(lt[1] - 6)} L${f1(lt[0])},${f1(lt[1] - 11)} L${f1(lt[0] + 4.4)},${f1(lt[1] - 6)} Z" fill="${P.cn}"/><circle cx="${f1(lt[0])}" cy="${f1(lt[1] - 12.5)}" r="1.8" fill="${OURO}"/>`;
  return o;
}

export function estufaLuzes(e: Estufa, P: Paleta): string {
  if (!P.noite) return '';
  const c = iso(e.x + e.w / 2, e.y + e.d / 2, 1.2);
  return `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="70" ry="34" fill="#9BF0C4" opacity=".16"/><ellipse cx="${f1(c[0])}" cy="${f1(c[1] - 14)}" rx="22" ry="20" fill="#FFF3C4" opacity=".16"/>`;
}

const paredeQ = (P: Paleta) => (P.noite ? P.parede : '#EEF6F1');

function vidrarias(Y: number, x0: number, x1: number, z0: number, z1: number, P: Paleta): string {
  let o = faceY(Y + .001, x0, x1, z0, z1, P.noite ? '#2B4F48' : '#DCEFE6');
  const cores = ['#36E39B', '#4FB7E8', '#F2C14E', '#E86A8A', '#9B7BFF'];
  o += faceY(Y + .0015, x0, x1, z0 + (z1 - z0) * .42, z0 + (z1 - z0) * .42 + .035, P.noite ? '#7A6650' : '#B9A58A');
  let i = 0;
  for (let x = x0 + .12; x < x1 - .1; x += .26, i++) {
    const c = iso(x, Y + .002, z0 + (z1 - z0) * .42 + .035), cor = cores[i % cores.length];
    if (i % 3 === 0) o += `<path d="M${f1(c[0] - 1.2)},${f1(c[1] - 7)} l2.4,0 l0,2 l2.4,4.6 l-7.2,0 l2.4,-4.6 z" fill="${P.noite ? '#E8F6EE' : '#FFFFFF'}" opacity=".9"/><path d="M${f1(c[0] - 2.6)},${f1(c[1] - 2.4)} l5.2,0 l1,2.4 l-7.2,0 z" fill="${cor}"/>`;
    else if (i % 3 === 1) o += `<circle cx="${f1(c[0])}" cy="${f1(c[1] - 2.8)}" r="2.8" fill="${cor}" opacity=".9"/><rect x="${f1(c[0] - .8)}" y="${f1(c[1] - 8)}" width="1.6" height="3" fill="#FFFFFF" opacity=".8"/>`;
    else o += [0, 1, 2].map(k => `<rect x="${f1(c[0] - 2.4 + k * 1.8)}" y="${f1(c[1] - 6)}" width="1.2" height="6" rx=".5" fill="${cores[(i + k) % cores.length]}"/>`).join('');
  }
  return o;
}

export function quimicaAndar(b: Predio, i: number, P: Paleta): string {
  const z = b.z0 + i * b.h, X = b.x + b.w, Y = b.y + b.d, par = paredeQ(P);
  let o = box(b.x, b.y, z, b.w, b.d, b.h, par, { r: shade(par, .84) });
  o += faixa(b.x - .03, b.y - .03, b.w + .06, b.d + .06, z, .1, i === 0 ? shade(P.concreto, .9) : P.cn);
  const zv0 = z + .22, zv1 = z + b.h - .14, seg = i === 0 ? [[b.x + .15, b.x + b.w / 2 - .45], [b.x + b.w / 2 + .45, X - .15]] : [[b.x + .15, X - .15]];
  for (const [a, c] of seg) {
    o += vidrarias(Y, a, c, zv0, zv1, P) + faceY(Y + .004, a, c, zv0, zv1, P.noite ? '#FFF3C8' : '#BFD8F2', ` opacity="${P.noite ? .1 : .25}"`);
    const n = Math.max(2, Math.round((c - a) / .5));
    for (let k = 1; k < n; k++) { const x = a + (k * (c - a)) / n; o += linha3([[x, Y + .005, zv0], [x, Y + .005, zv1]], P.cn, 1); }
    o += faceY(Y + .005, a, c, zv0, zv0 + .04, P.cn) + faceY(Y + .005, a, c, zv1 - .04, zv1, P.cn);
  }
  for (let k = 0; k < 3; k++) {
    const yc = b.y + .45 + k * ((b.d - .9) / 2);
    o += faceX(X + .002, yc - .16, yc + .16, zv0 + .05, zv1 - .05, P.noite ? P.janela : '#6E9CC6', ` stroke="${P.moldura}" stroke-width=".7"`);
  }
  if (i === 0) {
    const xm = b.x + b.w / 2;
    o += box(xm - .55, Y, 0, 1.1, .45, z, P.concreto);
    o += faceY(Y + .003, xm - .35, xm + .35, z, z + 1.0, P.noite ? '#FFE1A0' : '#2E5E4E', ` stroke="${P.cn}" stroke-width="1.2"`) + linha3([[xm, Y + .004, z], [xm, Y + .004, z + 1.0]], P.cn, 1);
    o += box(xm - .5, Y, z + 1.04, 1.0, .5, .07, P.cn, { t: shade(P.cn, 1.1) });
  }
  return o;
}

export function quimicaCobertura(b: Predio, n: number, P: Paleta): string {
  const z = b.z0 + n * b.h, Y = b.y + b.d, xm = b.x + b.w / 2, par = paredeQ(P);
  let o = box(b.x - .08, b.y - .08, z, b.w + .16, b.d + .16, .12, par, { r: shade(par, .84), t: P.telhado });
  o += box(b.x - .08, b.y - .08, z + .12, b.w + .16, b.d + .16, .34, P.cn, { t: shade(P.telhado, .92) });
  o += topo(b.x + .06, b.y + .06, b.x + b.w - .06, Y - .06, z + .462, shade(P.telhado, .9));
  o += textoY(xm, Y + .085, z + .29, 'QUÍMICA', '#FFFFFF', 7, 1.4);
  return o;
}

export function quimicaHexagono(b: Predio, n: number, P: Paleta): string {
  const X = b.x + b.w + .004, yc = b.y + b.d / 2, zc = b.z0 + (n * b.h) / 2 + .05, r = .48, cor = P.noite ? '#4BE3A0' : P.cn;
  const pts: P3[] = [], dentro: P3[] = [];
  for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; pts.push([X, yc + Math.cos(a) * r, zc + Math.sin(a) * r]); }
  for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; dentro.push([X + .001, yc + Math.cos(a) * r * .55, zc + Math.sin(a) * r * .55]); }
  let o = poly(pts, P.noite ? '#173A33' : '#FFFFFF', ` stroke="${cor}" stroke-width="2.4" stroke-linejoin="round"`);
  o += poly(dentro, 'none', ` stroke="${cor}" stroke-width="1.6"`);
  pts.forEach(p => { const c = iso(p[0] + .002, p[1], p[2]); o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="1.7" fill="${cor}"/>`; });
  return o;
}

export function frascoGigante(b: Predio, n: number, P: Paleta): string {
  const z = b.z0 + n * b.h + .46, x = b.x + b.w / 2 + .25, y = b.y + b.d / 2 + .1, g = iso(x, y, z + .25);
  const liquido = P.noite ? '#4BE3A0' : '#36C98B', vidro = P.noite ? 'rgba(220,255,240,.45)' : 'rgba(255,255,255,.72)', borda = P.noite ? '#CFF5E4' : '#9FB8AE';
  let o = box(x - .38, y - .38, z, .76, .76, .25, P.concreto, { t: shade(P.concreto, 1.08) });
  if (P.noite) o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1] - 18)}" rx="30" ry="26" fill="#4BE3A0" opacity=".2"/>`;
  const corpo = `M${f1(g[0] - 3.6)},${f1(g[1] - 38)} L${f1(g[0] - 3.6)},${f1(g[1] - 26)} L${f1(g[0] - 15)},${f1(g[1] - 2)} Q${f1(g[0] - 16)},${f1(g[1] + 1)} ${f1(g[0] - 12)},${f1(g[1] + 1)} L${f1(g[0] + 12)},${f1(g[1] + 1)} Q${f1(g[0] + 16)},${f1(g[1] + 1)} ${f1(g[0] + 15)},${f1(g[1] - 2)} L${f1(g[0] + 3.6)},${f1(g[1] - 26)} L${f1(g[0] + 3.6)},${f1(g[1] - 38)} Z`;
  o += `<path d="${corpo}" fill="${vidro}" stroke="${borda}" stroke-width="1.2"/>`;
  o += `<path d="M${f1(g[0] - 9.6)},${f1(g[1] - 13)} L${f1(g[0] - 15)},${f1(g[1] - 2)} Q${f1(g[0] - 16)},${f1(g[1] + 1)} ${f1(g[0] - 12)},${f1(g[1] + 1)} L${f1(g[0] + 12)},${f1(g[1] + 1)} Q${f1(g[0] + 16)},${f1(g[1] + 1)} ${f1(g[0] + 15)},${f1(g[1] - 2)} L${f1(g[0] + 9.6)},${f1(g[1] - 13)} Z" fill="${liquido}"/>`;
  o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1] - 13)}" rx="9.6" ry="1.8" fill="${shade(liquido, 1.18)}"/>`;
  o += `<rect x="${f1(g[0] - 5)}" y="${f1(g[1] - 41)}" width="10" height="3.4" rx="1.2" fill="${borda}"/>`;
  o += `<path d="M${f1(g[0] - 11)},${f1(g[1] - 4)} L${f1(g[0] - 7)},${f1(g[1] - 12)}" stroke="#FFFFFF" stroke-width="1.6" opacity=".6" stroke-linecap="round"/>`;
  [[-4, -6, 1.8, 0], [3, -9, 1.4, .5], [0, -3, 1.2, 1], [5, -5, 1.1, 1.4]].forEach(([dx, dy, r, d]) => {
    o += `<circle class="cv-pisca" style="animation-delay:-${d}s" cx="${f1(g[0] + dx)}" cy="${f1(g[1] + dy)}" r="${r}" fill="#FFFFFF" opacity=".8"/>`;
  });
  [[-1, -44, 2.2, 0], [2, -50, 1.7, .8], [-2, -55, 1.3, 1.6]].forEach(([dx, dy, r, d]) => {
    o += `<circle class="cv-fumaca" style="animation-delay:-${d}s" cx="${f1(g[0] + dx)}" cy="${f1(g[1] + dy)}" r="${r}" fill="${liquido}" opacity=".7"/>`;
  });
  return o;
}

export function deque(x: number, y: number, P: Paleta): string {
  const w = 1.4, d = 1.0, mad = P.noite ? shade(P.madeira, .65) : P.madeira;
  let o = sombraChao(x + w / 2, y + d / 2, .9, .45, P);
  for (const [a, b] of [[0, 0], [w, 0], [0, d], [w, d]]) o += box(x + a - .04, y + b - .04, 0, .08, .08, .3, shade(mad, .75));
  o += box(x, y, .3, w, d, .06, mad, { t: shade(mad, 1.08) });
  for (let k = 1; k < 5; k++) o += linha3([[x + (k * w) / 5, y, .365], [x + (k * w) / 5, y + d, .365]], shade(mad, .8), .6);
  o += linha3([[x, y + d, .7], [x + w, y + d, .7], [x + w, y, .7]], shade(mad, .6), 1.3);
  for (const [a, b] of [[0, d], [w / 2, d], [w, d], [w, d / 2], [w, 0]]) o += linha3([[x + a, y + b, .36], [x + a, y + b, .7]], shade(mad, .6), 1);
  return o;
}

// ───── estruturas do jardim experimental ─────

export function galpao(x: number, y: number, P: Paleta, telhadoVerde = false): string {
  const w = 1.0, d = .85, h = .62, ym = y + d / 2, zr = h + .34, mad = P.noite ? '#6E553F' : '#B98A5E';
  let o = sombraChao(x + w / 2, y + d / 2, .75, .36, P) + box(x, y, 0, w, d, h, mad, { r: shade(mad, .8), l: shade(mad, .95) });
  for (let k = 1; k < 6; k++) o += linha3([[x + (k * w) / 6, y + d + .002, .02], [x + (k * w) / 6, y + d + .002, h - .02]], shade(mad, .76), .6);
  o += faceY(y + d + .003, x + .36, x + .64, 0, .5, P.noite ? '#2A1F18' : '#5A3E2A') + faceX(x + w + .003, ym - .17, ym + .17, .3, .52, P.noite ? P.janela : '#BFE3F2', ` stroke="${shade(mad, .7)}" stroke-width=".6"`);
  const teto = telhadoVerde ? (P.noite ? '#2F5A46' : '#6CBF7F') : (P.noite ? '#7A3B30' : '#C8553D');
  o += poly([[x - .07, y - .07, h], [x + w + .07, y - .07, h], [x + w + .07, ym, zr], [x - .07, ym, zr]], shade(teto, .8));
  o += poly([[x - .07, ym, zr], [x + w + .07, ym, zr], [x + w + .07, y + d + .07, h], [x - .07, y + d + .07, h]], teto);
  o += poly([[x + w, y, h], [x + w, y + d, h], [x + w, ym, zr]], shade(mad, .86));
  if (telhadoVerde) [[.2, .55], [.45, .7], [.7, .5], [.85, .75], [.32, .82]].forEach(([fx, fy], i) => {
    const c = iso(x + w * fx, ym + (d / 2 + .07) * (fy - .5) * 2 * .5 + .1, zr - (zr - h) * fy * .8);
    o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${i % 2 ? 2 : 2.6}" fill="${i % 3 ? P.arvoreLuz : '#F4A6C0'}"/>`;
  });
  // ancinho e pá encostados na parede
  o += linha3([[x + w + .06, y + .12, 0], [x + w + .06, y + .2, .62]], P.tronco, 1.1) + linha3([[x + w + .06, y + .16, .62], [x + w + .06, y + .3, .62]], P.ferro, 1.4);
  o += linha3([[x + w + .06, y + d - .15, 0], [x + w + .06, y + d - .25, .55]], P.tronco, 1.1) + poly([[x + w + .06, y + d - .1, 0], [x + w + .06, y + d - .2, 0], [x + w + .06, y + d - .17, .16], [x + w + .06, y + d - .08, .14]], P.ferro);
  return o;
}

export function cisterna(x: number, y: number, P: Paleta, destino: P3): string {
  const cor = P.noite ? '#3E6E8E' : '#6FB3DA';
  let o = sombraChao(x, y, .42, .21, P) + box(x - .32, y - .32, 0, .64, .64, .1, P.concreto) + cilindro(x, y, .1, .85, .28, cor);
  for (const z of [.36, .66]) o += cilindro(x, y, z, .035, .29, shade(cor, .78));
  o += cilindro(x, y, .95, .05, .31, shade(cor, .86));
  o += linha3([[x - .1, y - .05, 1.0], [x - .1, y - .05, 1.22], destino], P.ferro, 1.5);
  o += box(x + .22, y + .05, .2, .1, .08, .06, P.ferro);
  const g = iso(x + .3, y + .09, .2);
  return o + `<circle class="cv-gota" cx="${f1(g[0])}" cy="${f1(g[1] + 3)}" r="1.1" fill="#4FA3FF"/>`;
}

export function pergola(x0: number, y0: number, w: number, d: number, P: Paleta): string {
  const mad = P.noite ? '#6E553F' : '#C0916A', z = 1.15;
  let o = sombraChao(x0 + w / 2, y0 + d / 2, w * .55, d * .45, P) + banco(x0 + w / 2 - .45, y0 + d / 2 - .14, P, 'x');
  for (const [x, y] of [[x0, y0], [x0 + w, y0], [x0, y0 + d], [x0 + w, y0 + d]] as [number, number][]) o += box(x - .04, y - .04, 0, .08, .08, z, mad, { r: shade(mad, .78) });
  o += box(x0 - .1, y0 - .04, z, w + .2, .08, .07, mad) + box(x0 - .1, y0 + d - .04, z, w + .2, .08, .07, mad);
  for (let k = 0; k <= 5; k++) { const x = x0 + (k * w) / 5; o += box(x - .025, y0 - .15, z + .07, .05, d + .3, .05, shade(mad, 1.08)); }
  const flores = ['#F4A6C0', '#C77DFF', '#FFFFFF', '#F4A6C0'];
  for (let k = 0; k < 9; k++) {
    const t = k / 8, c = iso(x0 + w * t, (k % 2 ? y0 + d : y0) + (k % 3 - 1) * .06, z + .05);
    o += `<circle cx="${f1(c[0])}" cy="${f1(c[1] + 1)}" r="3.4" fill="${shade(P.arvore, .9)}"/><circle cx="${f1(c[0] + 1.6)}" cy="${f1(c[1] - .6)}" r="1.4" fill="${flores[k % 4]}"/>`;
  }
  for (const [x, y] of [[x0, y0 + d], [x0 + w, y0 + d]] as [number, number][]) {
    const a = iso(x, y, .1), b = iso(x, y, z);
    o += `<path d="M${f1(a[0])},${f1(a[1])} Q${f1(a[0] + 3)},${f1((a[1] + b[1]) / 2)} ${f1(b[0])},${f1(b[1])}" stroke="${shade(P.arvore, .85)}" stroke-width="2" fill="none"/>`;
  }
  return o;
}

export function hortaIrrigacao(P: Paleta): string {
  const cano = P.noite ? '#6A7090' : '#3A4366';
  let o = box(16.32, 19.42, 0, .12, .12, .4, cano);
  for (let i = 0; i < 3; i++) {
    const y = 19.61 + i * .5;
    o += linha3([[16.38, y - .2, .17], [16.5, y, .17], [19.3, y, .17]], cano, .8);
    for (const x of [17.3, 18.6]) {
      const c = iso(x, y, .32);
      o += linha3([[x, y, .17], [x, y, .3]], cano, .9) +
        `<path class="cv-pisca" style="animation-delay:-${(i * .4 + x * .1).toFixed(2)}s" d="M${f1(c[0] - 6)},${f1(c[1] + 3)} Q${f1(c[0])},${f1(c[1] - 7)} ${f1(c[0] + 6)},${f1(c[1] + 3)}" stroke="${P.aguaLuz}" stroke-width="1.1" fill="none" stroke-dasharray="1.6 1.6"/>`;
    }
  }
  return o;
}
