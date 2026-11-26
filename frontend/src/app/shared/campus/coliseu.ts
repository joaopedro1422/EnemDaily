import { Paleta, P3, iso, f1, shade, poly, linha3, U } from './motor';

// Coliseu em elipse: 40 vãos de 9°; a metade da frente (−45°…135°) mostra a fachada externa,
// a de trás mostra a face interna. Cada nível é uma fatia de construção, desenhada de trás para a frente.

export interface Coliseu { cx: number; cy: number; ax: number; ay: number; aax: number; aay: number; }

interface Nivel { z0: number; z1: number; c: number; arco: boolean; }

const N = 40, PASSO = 9, T0 = -45, METADE = 20;
const UW = .875, UP = .05, ZB = .12, ZPOD = .5, ZCAV = 2.16, TOPO = 2.76;
const NIVEIS: Nivel[] = [
  { z0: ZB, z1: .8, c: .86, arco: true },
  { z0: .86, z1: 1.5, c: 1.56, arco: true },
  { z0: 1.56, z1: 2.16, c: 2.22, arco: true },
  { z0: 2.22, z1: 2.7, c: TOPO, arco: false },
];

// Altura de cada vão da frente: o lado direito desaba em degraus até o 1º andar e volta a subir à esquerda.
const ALTURA: number[] = (() => {
  const a = new Array(N).fill(TOPO);
  [[7, 2.3], [8, 1.56], [9, .86], [10, .86], [11, .86], [12, 1.15], [13, 1.56], [14, 1.95], [15, 2.3]].forEach(([j, h]) => (a[j] = h));
  return a;
})();
const ruina = (j: number) => ALTURA[(j + N) % N] < TOPO - .001;
const anelInterno = (j: number) => (ruina(j) ? Math.min(ZCAV, ALTURA[j] + .5) : ZCAV);

const FRENTE = Array.from({ length: METADE }, (_, j) => j);
const TRAS = Array.from({ length: METADE }, (_, j) => j + METADE);

const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const rad = (d: number) => (d * Math.PI) / 180;
const thA = (j: number) => T0 + j * PASSO;

function perfil(j: number): number[] {
  const h = ALTURA[j];
  if (!ruina(j)) return [h, h, h, h, h];
  return [0, 1, 2, 3, 4].map(i => (i === 0 || i === 4 ? h : h + (rnd(j * 5 + i) - .6) * (h <= .87 ? .05 : .1)));
}
function topoEm(pf: number[], t: number): number {
  const s = Math.max(0, Math.min(1, t)) * 4, i = Math.min(3, Math.floor(s));
  return pf[i] + (pf[i + 1] - pf[i]) * (s - i);
}

function pos(C: Coliseu, th: number, u: number, z: number): P3 {
  const a = rad(th);
  return [C.cx + (C.aax + u * (C.ax - C.aax)) * Math.cos(a), C.cy + (C.aay + u * (C.ay - C.aay)) * Math.sin(a), z];
}
const prof = (C: Coliseu, j: number, u = 1) => { const p = pos(C, thA(j) + PASSO / 2, u, 0); return p[0] + p[1]; };
const ordenar = (C: Coliseu, js: number[], u = 1) => [...js].sort((a, b) => prof(C, a, u) - prof(C, b, u));

// Luz vinda da esquerda: faces viradas para +y claras, para +x mais escuras.
function luz(C: Coliseu, th: number, fora: boolean): number {
  const a = rad(th);
  let nx = Math.cos(a) / C.ax, ny = Math.sin(a) / C.ay;
  const m = Math.hypot(nx, ny);
  nx /= m; ny /= m;
  if (!fora) { nx = -nx; ny = -ny; }
  return Math.max(.8, Math.min(1.03, .91 + .09 * (ny - nx)));
}

// Uma face de corte é visível quando aponta para o observador (+x +y).
function corteVisivel(C: Coliseu, th: number, sentido: 1 | -1): boolean {
  const a = rad(th), dx = -(C.ax * Math.sin(a)) * sentido, dy = C.ay * Math.cos(a) * sentido;
  return dx + dy > 0;
}

function faixaV(C: Coliseu, th0: number, th1: number, u: number, zb: (t: number) => number, zt: (t: number) => number, n: number): P3[] {
  const a: P3[] = [], b: P3[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, th = th0 + (th1 - th0) * t; a.push(pos(C, th, u, zb(t))); b.push(pos(C, th, u, zt(t))); }
  return [...a, ...b.reverse()];
}
function faixaH(C: Coliseu, th0: number, th1: number, u0: number, u1: number, z: (t: number) => number, n: number): P3[] {
  const a: P3[] = [], b: P3[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, th = th0 + (th1 - th0) * t; a.push(pos(C, th, u0, z(t))); b.push(pos(C, th, u1, z(t))); }
  return [...a, ...b.reverse()];
}
const anel = (C: Coliseu, u: number, z: number, n = 80): P3[] => Array.from({ length: n }, (_, i) => pos(C, (i * 360) / n, u, z));
const fechar = (p: P3[]) => [...p, p[0]];

interface Cores {
  face: string; anel: string; topo: string; ruina: string; corte: string; arco: string; arcoLuz: string;
  degrau: string; espelho: string; podio: string; fosso: string; hipoTopo: string; hipoLado: string; areia: string;
  madeira: string; base: string; linha: string; mastro: string;
}
function cores(P: Paleta): Cores {
  return P.noite
    ? { face: '#A9A3C3', anel: '#8E89AE', topo: '#BEB9D6', ruina: '#A096B3', corte: '#8C7A92', arco: '#E9A94E', arcoLuz: '#FFE2A0', degrau: '#A29EBF', espelho: '#7F7BA0', podio: '#B5B1CD', fosso: '#3B3147', hipoTopo: '#A08899', hipoLado: '#6B5A70', areia: '#AE9F7E', madeira: '#6E553F', base: '#A39EBE', linha: '#8C87AA', mastro: '#5B4A44' }
    : { face: '#ECD9B2', anel: '#DAC29A', topo: '#F6EBD2', ruina: '#DFC9A1', corte: '#C99266', arco: '#5B4331', arcoLuz: '#94735A', degrau: '#ECDFC1', espelho: '#CDB58C', podio: '#F4ECDA', fosso: '#7C5C42', hipoTopo: '#D3A074', hipoLado: '#9C6A47', areia: '#E9D19C', madeira: '#B07A4A', base: '#E6D6B4', linha: '#CDB78F', mastro: '#8A6B55' };
}

// ───────────── fundação ─────────────

export function coliseuFundacao(C: Coliseu, P: Paleta): string {
  const cs = cores(P);
  let o = poly(anel(C, 1.13, 0).map(p => [p[0] + .28, p[1] + .12, 0] as P3), P.sombra);
  o += poly(anel(C, 1.075, .06), shade(cs.base, .95));
  o += poly(faixaV(C, -45, 135, 1.075, () => 0, () => .06, 40), shade(cs.base, .78));
  o += poly(anel(C, 1.035, ZB), cs.base);
  o += poly(faixaV(C, -45, 135, 1.035, () => .06, () => ZB, 40), shade(cs.base, .85));
  // a planta gravada na laje: anéis e paredes radiais
  for (const u of [0, UP, .32, .6, UW, 1]) o += linha3(fechar(anel(C, u, ZB + .002, 72)), cs.linha, u === 0 || u === 1 ? .9 : .6);
  for (let j = 0; j < N; j++) o += linha3([pos(C, thA(j), UP, ZB + .002), pos(C, thA(j), 1, ZB + .002)], cs.linha, .5);
  return o;
}

// ───────────── arena e hipogeu ─────────────

export function coliseuArena(C: Coliseu, P: Paleta): string {
  const cs = cores(P), zM = ZB + .2, zA = .36, yP = C.cy - C.aay * .45;
  let o = poly(faixaV(C, 135, 315, 0, () => ZB, () => ZPOD, 36), shade(cs.podio, .8));
  o += poly(anel(C, 0, ZB, 72), cs.fosso);
  // piso de areia reconstruído no fundo da arena
  const a0 = 180 + 26.74, a1 = 360 - 26.74, borda: P3[] = [];
  for (let i = 0; i <= 24; i++) borda.push(pos(C, a0 + ((a1 - a0) * i) / 24, 0, zA));
  const xa = borda[0][0], xb = borda[24][0];
  o += poly(borda, cs.areia);
  for (const f of [.25, .5, .75]) {
    const y = C.cy - C.aay * (.45 + .5 * f), w = C.aax * Math.sqrt(Math.max(0, 1 - ((y - C.cy) / C.aay) ** 2)) - .06;
    o += linha3([[C.cx - w, y, zA + .002], [C.cx + w, y, zA + .002]], shade(cs.areia, 1.06), .7);
  }
  o += poly([[xa, yP, ZB], [xb, yP, ZB], [xb, yP, zA], [xa, yP, zA]], cs.madeira);
  for (let i = 1; i < 6; i++) { const x = xa + ((xb - xa) * i) / 6; o += linha3([[x, yP + .002, ZB + .02], [x, yP + .002, zA - .02]], shade(cs.madeira, .78), .6); }
  // paredes do hipogeu
  const muros: P3[][] = [];
  const el = (s: number, th: number): [number, number] => [C.cx + C.aax * s * Math.cos(rad(th)), C.cy + C.aay * s * Math.sin(rad(th))];
  for (const s of [.82, .56]) {
    let cur: P3[] = [];
    for (let k = 0; k <= 72; k++) {
      const [x, y] = el(s, k * 5);
      if (Math.abs(x - C.cx) > .11 && y > yP + .04) cur.push([x, y, ZB]);
      else { if (cur.length > 1) muros.push(cur); cur = []; }
    }
    if (cur.length > 1) muros.push(cur);
  }
  for (const dx of [-.11, .11]) muros.push([[C.cx + dx, yP + .04, ZB], [C.cx + dx, C.cy + C.aay * .9, ZB]]);
  for (const f of [-.22, .1, .4, .68]) {
    const y = C.cy + C.aay * f, w = C.aax * .82 * Math.sqrt(Math.max(0, 1 - (f / .82) ** 2));
    if (w < .2) continue;
    muros.push([[C.cx + .11, y, ZB], [C.cx + w, y, ZB]], [[C.cx - w, y, ZB], [C.cx - .11, y, ZB]]);
  }
  muros.sort((a, b) => a.reduce((s, p) => s + p[0] + p[1], 0) / a.length - b.reduce((s, p) => s + p[0] + p[1], 0) / b.length);
  for (const m of muros) {
    const topo = m.map(p => [p[0], p[1], zM] as P3);
    o += poly([...m, ...[...topo].reverse()], cs.hipoLado, ` stroke="${cs.hipoLado}" stroke-width="1.4" stroke-linejoin="round"`) + linha3(topo, cs.hipoTopo, 1.6);
  }
  // muro do pódio
  o += poly(faixaH(C, 135, 315, 0, UP, () => ZPOD, 36), cs.podio);
  o += poly(faixaV(C, -45, 135, UP, () => ZB, () => ZPOD, 36), shade(cs.podio, .88));
  o += poly(faixaH(C, -45, 135, 0, UP, () => ZPOD, 36), cs.podio);
  return o;
}

// ───────────── andares da fachada ─────────────

function faceBaia(C: Coliseu, j: number, nv: Nivel, cs: Cores): string {
  const pf = perfil(j), top = (t: number) => Math.min(nv.c, topoEm(pf, t)), th0 = thA(j);
  const lz = luz(C, th0 + PASSO / 2, true) * (1 + (rnd(j + 91) - .5) * .05);
  return poly(faixaV(C, th0, th0 + PASSO, 1, () => nv.z0, top, 4), shade(cs.face, lz));
}

function detalhesBaia(C: Coliseu, j: number, n: number, cs: Cores, P: Paleta): string {
  const nv = NIVEIS[n], pf = perfil(j), th0 = thA(j);
  const top = (t: number) => Math.min(nv.c, topoEm(pf, t));
  const lz = luz(C, th0 + PASSO / 2, true), escuro = shade(cs.face, lz * .8), claro = shade(cs.face, Math.min(1.1, lz * 1.07));
  const em = (t: number, z: number, u = 1.004): P3 => pos(C, th0 + t * PASSO, u, Math.min(z, top(t)));
  const p0 = pos(C, th0, 1, 0), p1 = pos(C, th0 + PASSO, 1, 0), L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const zPe = n === 0 ? nv.z0 : nv.z0 + .07;
  let o = '';
  if (n > 0 && top(.5) > zPe) o += linha3([em(0, zPe), em(.5, zPe), em(1, zPe)], escuro, .6);
  if (nv.arco) {
    const aw = .31, r = aw * L, zs = nv.z0 + (nv.z1 - nv.z0) * .76 - r;
    if (top(.5) - zPe > .08) {
      const pts: [number, number][] = [[.5 - aw, zPe], [.5 + aw, zPe]];
      for (let k = 0; k <= 10; k++) { const a = (Math.PI * k) / 10; pts.push([.5 + aw * Math.cos(a), zs + r * Math.sin(a)]); }
      o += poly(pts.map(([t, z]) => em(t, z)), cs.arco);
      const q: [number, number][] = [[.5 + aw * .12, zPe], [.5 + aw * .8, zPe], [.5 + aw * .8, zs + r * .3], [.5 + aw * .12, zs + r * .75]];
      o += poly(q.map(([t, z]) => em(t, z, 1.003)), cs.arcoLuz, P.noite ? '' : ' opacity=".5"');
      o += linha3([em(.5 + aw, zPe), em(.5 + aw, zs)], claro, .8);
    }
  } else if (j % 2 === 0) {
    const zw0 = nv.z0 + .17, zw1 = nv.z0 + .31;
    if (top(.5) > zw1) o += poly([em(.38, zw0), em(.62, zw0), em(.62, zw1), em(.38, zw1)], cs.arco);
  }
  // meia-coluna no limite esquerdo do vão
  const zc1 = Math.min(nv.z1, top(0));
  if (zc1 > zPe + .05) o += poly([em(-.05, zPe, 1.014), em(.05, zPe, 1.014), em(.05, zc1, 1.014), em(-.05, zc1, 1.014)], claro) + linha3([em(.06, zPe, 1.014), em(.06, zc1, 1.014)], escuro, .5);
  // cornija
  const cb = (t: number) => Math.min(nv.z1, top(t)), ct = (t: number) => Math.min(nv.c, top(t));
  if (top(.5) > nv.z1 + .01) {
    o += poly(faixaV(C, th0, th0 + PASSO, 1.025, cb, ct, 4), claro);
    o += linha3([0, .5, 1].map(t => pos(C, th0 + t * PASSO, 1.02, cb(t))), escuro, .8);
  }
  return o;
}

function topoBaia(C: Coliseu, j: number, nv: Nivel, cs: Cores): string {
  const pf = perfil(j), top = (t: number) => Math.min(nv.c, topoEm(pf, t)), quebrado = ALTURA[j] < nv.c - .001;
  let o = poly(faixaH(C, thA(j), thA(j) + PASSO, UW, 1, top, 4), quebrado ? cs.ruina : cs.topo);
  if (quebrado) [.3, .55, .8].forEach((t, i) => {
    const p = iso(...(pos(C, thA(j) + t * PASSO, .94, top(t) + .004) as [number, number, number]));
    o += `<circle cx="${f1(p[0] + (rnd(j * 3 + i) - .5) * 2)}" cy="${f1(p[1])}" r=".7" fill="${shade(cs.ruina, .78)}"/>`;
  });
  return o;
}

function cortes(C: Coliseu, j: number, nv: Nivel, cs: Cores, alt: (j: number) => number, u0: number, u1: number): string {
  let o = '';
  for (const [nb, th, sentido] of [[j - 1, thA(j), -1], [j + 1, thA(j + 1), 1]] as [number, number, 1 | -1][]) {
    const hj = alt(j), hn = alt((nb + N) % N);
    if (hj <= hn + .001 || !corteVisivel(C, th, sentido)) continue;
    const z0 = Math.max(nv.z0, hn), z1 = Math.min(nv.c, hj);
    if (z1 - z0 < .01) continue;
    o += poly([pos(C, th, u0, z0), pos(C, th, u1, z0), pos(C, th, u1, z1), pos(C, th, u0, z1)], sentido > 0 ? cs.corte : shade(cs.corte, .86));
  }
  return o;
}

function trasNivel(C: Coliseu, n: number, cs: Cores): string {
  const faixa: [number, number] | null = n === 0 ? [ZB, .86] : n === 2 ? [ZCAV, 2.22] : n === 3 ? [2.22, TOPO] : null;
  if (!faixa) return '';
  const [z0, z1] = faixa, js = ordenar(C, TRAS, UW);
  let o = '';
  for (const j of js) {
    const th0 = thA(j), cor = shade(cs.anel, luz(C, th0 + PASSO / 2, false) * .9);
    o += poly(faixaV(C, th0, th0 + PASSO, UW, () => z0, () => z1, 2), cor);
    const em = (t: number, z: number): P3 => pos(C, th0 + t * PASSO, UW - .004, z);
    if (n === 0) {
      const pts: P3[] = [em(.3, ZB), em(.7, ZB)];
      for (let k = 0; k <= 6; k++) { const a = (Math.PI * k) / 6; pts.push(em(.5 + .2 * Math.cos(a), .5 + .1 * Math.sin(a))); }
      o += poly(pts, cs.arco, ' opacity=".8"');
    } else if (n === 3) {
      o += poly([em(.22, 2.32), em(.78, 2.32), em(.78, 2.6), em(.22, 2.6)], shade(cs.arco, 1.15), ' opacity=".85"');
      o += linha3([em(0, 2.29), em(1, 2.29)], shade(cor, .82), .6);
    }
  }
  for (const j of js) o += poly(faixaH(C, thA(j), thA(j) + PASSO, UW, 1, () => z1, 2), cs.topo);
  return o;
}

export function coliseuNivel(C: Coliseu, n: number, P: Paleta): string {
  const cs = cores(P), nv = NIVEIS[n];
  const js = ordenar(C, FRENTE).filter(j => ALTURA[j] > nv.z0 + .015);
  let o = trasNivel(C, n, cs);
  for (const j of js) o += faceBaia(C, j, nv, cs);
  for (const j of js) o += detalhesBaia(C, j, n, cs, P);
  for (const j of js) o += topoBaia(C, j, nv, cs) + cortes(C, j, nv, cs, i => ALTURA[i], UW, 1);
  return o;
}

// ───────────── arquibancadas ─────────────

interface Degrau { u0: number; u1: number; z: number; zAnt: number; bloco: number; corredor: boolean; }
const DEGRAUS: Degrau[] = (() => {
  const out: Degrau[] = [];
  let u = UP, z = ZPOD;
  const fileiras = (n: number, du: number, dz: number, bloco: number) => { for (let i = 0; i < n; i++) { out.push({ u0: u, u1: u + du, z: z + dz, zAnt: z, bloco, corredor: false }); u += du; z += dz; } };
  const corredor = (du: number, dz: number, bloco: number) => { out.push({ u0: u, u1: u + du, z: z + dz, zAnt: z, bloco, corredor: true }); u += du; z += dz; };
  fileiras(4, .0675, .125, 0);
  corredor(.04, .12, 1);
  fileiras(4, .06, .13, 1);
  corredor(.04, .12, 2);
  fileiras(4, (UW - .64) / 4, .1, 2);
  return out;
})();

export function coliseuArquibancadas(C: Coliseu, P: Paleta): string {
  const cs = cores(P);
  const corDegrau = (d: Degrau) => shade(cs.degrau, d.corredor ? .94 : [1.03, 1, .97][d.bloco]);
  let o = '';
  // metade de trás: faixas inteiras, de fora para dentro
  for (const d of [...DEGRAUS].reverse()) {
    o += poly(faixaH(C, 135, 315, d.u0, d.u1, () => d.z, 40), corDegrau(d));
    o += poly(faixaV(C, 135, 315, d.u0, () => d.zAnt, () => d.z, 40), d.corredor ? shade(cs.espelho, .86) : cs.espelho);
  }
  for (let j = METADE; j < N; j++) {
    const th = thA(j);
    if (j % 2 === 0 && j > METADE) {
      const escada: P3[] = [];
      for (const d of DEGRAUS) escada.push(pos(C, th, d.u0, d.zAnt), pos(C, th, d.u0, d.z), pos(C, th, d.u1, d.z));
      o += linha3(escada, shade(cs.espelho, .82), .7);
    } else if (j % 2 === 1) {
      for (const d of DEGRAUS.filter(x => x.corredor)) o += poly(faixaV(C, th + 2.6, th + 6.4, d.u0 - .002, () => d.zAnt + .005, () => d.z - .02, 1), cs.arco);
    }
  }
  // metade da frente: de dentro para fora, cortada onde o anel interno desabou
  for (const d of DEGRAUS) {
    let ini = -1;
    for (let j = 0; j <= METADE; j++) {
      const ok = j < METADE && d.z <= anelInterno(j) + .001;
      if (ok && ini < 0) ini = j;
      if (!ok && ini >= 0) { o += poly(faixaH(C, thA(ini), thA(j), d.u0, d.u1, () => d.z, (j - ini) * 2), corDegrau(d)); ini = -1; }
    }
  }
  const terraco = (j: number) => { const zr = anelInterno(j); return DEGRAUS.find(d => d.z > zr + .001)?.u0 ?? UW; };
  for (const j of ordenar(C, FRENTE, .7)) {
    const zr = anelInterno(j);
    if (zr >= ZCAV) continue;
    const uc = terraco(j);
    o += poly(faixaH(C, thA(j), thA(j) + PASSO, uc, UW, () => zr, 2), shade(cs.ruina, .94));
    [.25, .6, .85].forEach((t, i) => {
      const p = iso(...(pos(C, thA(j) + t * PASSO, uc + (UW - uc) * (.3 + rnd(j * 7 + i) * .5), zr + .004) as [number, number, number]));
      o += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r=".8" fill="${shade(cs.ruina, .76)}"/>`;
    });
  }
  // anel interno: a parede que aparece onde a fachada caiu
  const nvAnel: Nivel = { z0: .86, z1: ZCAV, c: ZCAV, arco: true };
  for (const j of ordenar(C, FRENTE, UW)) {
    const zr = anelInterno(j), th0 = thA(j);
    if (zr <= .87) continue;
    const lz = luz(C, th0 + PASSO / 2, true) * .93, cor = shade(cs.anel, lz);
    o += poly(faixaV(C, th0, th0 + PASSO, UW, () => .86, () => zr, 2), cor);
    const em = (t: number, z: number): P3 => pos(C, th0 + t * PASSO, UW + .003, Math.min(z, zr));
    for (const [z0, z1] of [[.86, 1.5], [1.56, 2.16]]) {
      if (zr - z0 < .12) continue;
      const pts: P3[] = [em(.27, z0 + .05), em(.73, z0 + .05)];
      for (let k = 0; k <= 8; k++) { const a = (Math.PI * k) / 8; pts.push(em(.5 + .23 * Math.cos(a), z0 + (z1 - z0) * .55 + .07 * Math.sin(a))); }
      o += poly(pts, cs.arco, P.noite ? ' opacity=".75"' : '');
    }
    if (zr > 1.56) o += linha3([em(0, 1.53), em(.5, 1.53), em(1, 1.53)], shade(cor, .82), .6);
    o += cortes(C, j, nvAnel, cs, anelInterno, UW - .1, UW);
  }
  return o;
}

// ───────────── mastros do velário e luzes ─────────────

export function coliseuMastros(C: Coliseu, P: Paleta): string {
  const cs = cores(P);
  let o = '';
  const js = ordenar(C, Array.from({ length: N }, (_, j) => j), .94).filter(j => j % 4 === 0 && !ruina(j));
  js.forEach((j, i) => {
    const th = thA(j) + PASSO / 2, b = iso(...(pos(C, th, .94, TOPO) as [number, number, number])), t = iso(...(pos(C, th, .94, TOPO + .38) as [number, number, number]));
    o += `<line x1="${f1(b[0])}" y1="${f1(b[1])}" x2="${f1(t[0])}" y2="${f1(t[1])}" stroke="${cs.mastro}" stroke-width="1.1" stroke-linecap="round"/>`;
    o += `<path class="cv-bandeira" style="animation-delay:-${((i * .37) % 2).toFixed(2)}s" d="M${f1(t[0])},${f1(t[1])} l7,1.8 l-7,2 Z" fill="${P.ch}"/>`;
  });
  return o;
}

export function coliseuLuzes(C: Coliseu, P: Paleta): string {
  if (!P.noite) return '';
  const c = iso(C.cx, C.cy, 1.3);
  let o = `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(C.ay * U * 1.35)}" ry="${f1(C.ay * U * .95)}" fill="#FFC566" opacity=".1"/>`;
  for (const j of FRENTE) {
    if (j % 2 || ALTURA[j] < 1.5) continue;
    const g = iso(...(pos(C, thA(j) + PASSO / 2, 1.1, 0) as [number, number, number]));
    o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1] - 14)}" rx="6" ry="20" fill="#FFD27A" opacity=".13"/>`;
  }
  return o;
}

export function pinheiroManso(x: number, y: number, P: Paleta, s = 1): string {
  const g = iso(x, y, 0), t = iso(x + .18 * s, y - .12 * s, 1.75 * s), copa = P.noite ? '#21503A' : '#2E7F55', luzCopa = P.noite ? '#2C6448' : '#46A06E';
  return `<ellipse cx="${f1(t[0] + 4)}" cy="${f1(g[1] + 2)}" rx="${f1(15 * s)}" ry="${f1(5 * s)}" fill="${P.sombra}"/>` +
    `<path d="M${f1(g[0])},${f1(g[1])} Q${f1(g[0] - 2 * s)},${f1((g[1] + t[1]) / 2)} ${f1(t[0])},${f1(t[1] + 3 * s)}" stroke="${P.tronco}" stroke-width="${f1(2.6 * s)}" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="${f1(t[0])}" cy="${f1(t[1])}" rx="${f1(17 * s)}" ry="${f1(6.5 * s)}" fill="${copa}"/>` +
    `<ellipse cx="${f1(t[0] - 3 * s)}" cy="${f1(t[1] - 2.5 * s)}" rx="${f1(12 * s)}" ry="${f1(4.2 * s)}" fill="${luzCopa}"/>`;
}
