import { Paleta, Predio, P3, iso, f1, shade, box, topo, faceX, faceY, poly, linha3, sombraChao, cilindro, elipseChao, U } from './motor';

const OURO = '#E8B931';
const marmore = (P: Paleta) => (P.noite ? '#A9AECF' : '#F7F3EA');
const marmoreSombra = (P: Paleta) => (P.noite ? '#8C92B8' : '#E4DDCD');
const azulTelha = (P: Paleta) => (P.noite ? '#0B7AAB' : '#1592CF');

function textoX(x: number, y: number, z: number, texto: string, cor: string, tam: number, espaco = 0): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" letter-spacing="${espaco}" fill="${cor}">${texto}</text>`;
}

function textoY(x: number, y: number, z: number, texto: string, cor: string, tam: number, espaco = 0): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" letter-spacing="${espaco}" fill="${cor}">${texto}</text>`;
}

export interface Templo { x: number; y: number; w: number; d: number; }
const zEst = .36, zCap = 2.21;

export function temploBase(t: Templo, P: Paleta): string {
  let o = topo(t.x - .2, t.y - .2, t.x + t.w + .7, t.y + t.d + .7, .004, P.sombra);
  for (let i = 0; i < 3; i++) {
    const m = i * .1;
    o += box(t.x + m, t.y + m, i * .12, t.w - 2 * m, t.d - 2 * m, .12, i === 2 ? marmore(P) : marmoreSombra(P), { t: shade(marmore(P), .97), r: shade(marmoreSombra(P), .86) });
  }
  return o;
}

export function temploCela(t: Templo, P: Paleta): string {
  const x0 = t.x + .55, x1 = t.x + t.w - .65, y0 = t.y + .5, y1 = t.y + t.d - .62, h = zCap - zEst, par = shade(marmore(P), .97);
  let o = box(x0, y0, zEst, x1 - x0, y1 - y0, h, par, { r: shade(par, .84), l: shade(par, .93) });
  o += faceY(y1 + .002, x0, x1, zEst, zEst + h, 'rgba(30,40,80,.08)');
  const yc = (y0 + y1) / 2, porta = P.noite ? '#FFD66B' : '#8A5A2B';
  o += faceX(x1 + .003, yc - .42, yc + .42, zEst, zEst + 1.42, OURO) + faceX(x1 + .004, yc - .36, yc + .36, zEst, zEst + 1.36, porta);
  if (!P.noite) for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) {
    const ya = yc - .33 + k * .36, za = zEst + .1 + j * .42;
    o += faceX(x1 + .005, ya, ya + .3, za, za + .34, 'none', ` stroke="${shade(porta, .7)}" stroke-width=".6"`);
  }
  o += linha3([[x1 + .005, yc, zEst], [x1 + .005, yc, zEst + 1.36]], shade(porta, .6), .8);
  const n = 3;
  for (let i = 0; i < n; i++) {
    const xc = x0 + ((i + .5) * (x1 - x0)) / n;
    o += faceY(y1 + .003, xc - .34, xc + .34, zEst + .55, zEst + 1.45, azulTelha(P)) + faceY(y1 + .004, xc - .3, xc + .3, zEst + .59, zEst + 1.41, shade(azulTelha(P), 1.12));
    const c = iso(xc, y1 + .005, zEst + 1.0);
    o += `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" fill="${marmore(P)}"><circle cy="-6" r="2.2"/><path d="M-2.6,-3.6 q2.6,-1.2 5.2,0 l1,8.6 l-7.2,0 z"/><path d="M-2.2,-2 l-3,3.4" stroke="${marmore(P)}" stroke-width="1.2"/></g>`;
  }
  return o;
}

function coluna(x: number, y: number, P: Paleta): string {
  const m = marmore(P), ms = marmoreSombra(P), z0 = zEst, h = zCap - zEst;
  let o = box(x - .17, y - .17, z0, .34, .34, .07, ms);
  o += cilindro(x, y, z0 + .07, h - .2, .13, m);
  for (const dx of [-.06, .05]) o += linha3([[x + dx, y + .115, z0 + .12], [x + dx, y + .115, z0 + h - .16]], ms, .7);
  o += cilindro(x, y, z0 + h - .13, .06, .16, ms) + box(x - .19, y - .19, z0 + h - .07, .38, .38, .07, m, { r: ms });
  return o;
}

export function temploColunata(t: Templo, P: Paleta): string {
  const xf = t.x + t.w - .45, ys = t.y + t.d - .45, pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) pts.push([xf, t.y + .45 + (i * (t.d - .9)) / 5]);
  for (let i = 0; i < 7; i++) pts.push([t.x + .45 + (i * (t.w - .9)) / 7, ys]);
  pts.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  let o = '';
  if (P.noite) for (const [x, y] of pts) { const g = iso(x, y, zEst); o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1] - 18)}" rx="7" ry="22" fill="#FFE9A8" opacity=".09"/>`; }
  return o + pts.map(([x, y]) => coluna(x, y, P)).join('');
}

export function temploEntablamento(t: Templo, P: Paleta): string {
  const m = marmore(P), ms = marmoreSombra(P), x0 = t.x + .22, y0 = t.y + .22, w = t.w - .44, d = t.d - .44, X = x0 + w, Y = y0 + d, azul = azulTelha(P);
  let o = box(x0, y0, zCap, w, d, .2, m, { r: ms });
  o += box(x0, y0, zCap + .2, w, d, .26, azul, { r: shade(azul, .82), t: shade(m, .95) });
  const nY = 9;
  for (let i = 0; i <= nY; i++) {
    const x = x0 + .1 + (i * (w - .2)) / nY;
    for (const dx of [-.05, 0, .05]) o += linha3([[x + dx, Y + .004, zCap + .23], [x + dx, Y + .004, zCap + .43]], m, .9);
    if (i < nY) { const c = iso(x + (w - .2) / nY / 2, Y + .005, zCap + .33); o += `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)"><circle r="2" fill="${m}"/></g>`; }
  }
  o += textoX(X + .006, (y0 + Y) / 2, zCap + .33, 'HUMANAS', P.noite ? '#FFE9A8' : '#FFFFFF', 7.4, 1.6);
  o += box(x0 - .1, y0 - .1, zCap + .46, w + .2, d + .2, .09, m, { r: ms });
  return o;
}

export function temploFrontao(t: Templo, P: Paleta): string {
  const x0 = t.x + .12, y0 = t.y + .12, X = t.x + t.w - .12, Y = t.y + t.d - .12, ze = zCap + .55, za = ze + .88, ym = (y0 + Y) / 2, azul = azulTelha(P);
  let o = poly([[x0, y0, ze], [X, y0, ze], [X, ym, za], [x0, ym, za]], shade(azul, .7));
  o += poly([[x0, ym, za], [X, ym, za], [X, Y, ze], [x0, Y, ze]], azul);
  const n = 14;
  for (let i = 1; i < n; i++) { const x = x0 + (i * (X - x0)) / n; o += linha3([[x, ym, za], [x, Y, ze]], shade(azul, .78), .8); }
  for (let j = 1; j < 4; j++) { const f = j / 4; o += linha3([[x0, ym + (Y - ym) * f, za - (za - ze) * f], [X, ym + (Y - ym) * f, za - (za - ze) * f]], shade(azul, 1.12), .6); }
  o += linha3([[x0, Y, ze], [X, Y, ze]], marmore(P), 1.6) + linha3([[x0, ym, za], [X, ym, za]], shade(azul, 1.25), 1.4);
  o += poly([[X, y0 - .04, ze - .02], [X, Y + .04, ze - .02], [X, ym, za + .07]], marmore(P));
  o += poly([[X + .002, y0 + .25, ze + .09], [X + .002, Y - .25, ze + .09], [X + .002, ym, za - .14]], shade(azul, 1.08));
  const c = iso(X + .004, ym, ze + .32), m = marmore(P), sombra = shade(azul, .55);
  o += `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)">` +
    `<path d="M-15,4 q5,-6 11,-5 M15,4 q-5,-6 -11,-5" fill="none" stroke="${m}" stroke-width="1.1"/>` +
    [-13, -10, -7].map((x, i) => `<ellipse cx="${x}" cy="${3 - i * 1.6}" rx="1.9" ry=".9" fill="${m}" transform="rotate(-30 ${x} ${3 - i * 1.6})"/><ellipse cx="${-x}" cy="${3 - i * 1.6}" rx="1.9" ry=".9" fill="${m}" transform="rotate(30 ${-x} ${3 - i * 1.6})"/>`).join('') +
    `<ellipse cx="0" cy="1.4" rx="3.8" ry="4.6" fill="${m}"/><circle cx="0" cy="-3.6" r="3.4" fill="${m}"/>` +
    `<path d="M-3,-6.2 l-.6,-2.4 l2,1.4 Z M3,-6.2 l.6,-2.4 l-2,1.4 Z" fill="${m}"/>` +
    `<circle cx="-1.35" cy="-3.7" r="1.25" fill="${sombra}"/><circle cx="1.35" cy="-3.7" r="1.25" fill="${sombra}"/><circle cx="-1.35" cy="-3.7" r=".45" fill="${OURO}"/><circle cx="1.35" cy="-3.7" r=".45" fill="${OURO}"/>` +
    `<path d="M-.6,-2.4 l.6,1.2 l.6,-1.2 z" fill="${OURO}"/><path d="M-2,1 q2,2 4,0 M-2,3 q2,2 4,0" fill="none" stroke="${sombra}" stroke-width=".6"/></g>`;
  for (const [y, z, s] of [[ym, za + .07, 1.2], [y0 - .04, ze - .02, .9], [Y + .04, ze - .02, .9]] as [number, number, number][]) {
    const a = iso(X + .006, y, z);
    o += `<path d="M${f1(a[0])},${f1(a[1] - 6 * s)} q${f1(-3 * s)},${f1(3 * s)} 0,${f1(6 * s)} q${f1(3 * s)},${f1(-3 * s)} 0,${f1(-6 * s)} z" fill="${OURO}"/>`;
  }
  return o;
}

export function temploLuzes(t: Templo, P: Paleta): string {
  if (!P.noite) {
    const g = iso(t.x + t.w, t.y + t.d / 2, .02);
    return `<ellipse cx="${f1(g[0] + 14)}" cy="${f1(g[1] + 6)}" rx="30" ry="9" fill="${P.sombra}"/>`;
  }
  const X = t.x + t.w - .12, ym = t.y + t.d / 2, c = iso(X, ym, zCap + .9);
  let o = `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="34" ry="26" fill="#FFE9A8" opacity=".14"/>`;
  for (let i = 0; i < 6; i++) {
    const y = t.y + .45 + (i * (t.d - .9)) / 5, g = iso(t.x + t.w + .05, y, .36);
    o += `<circle cx="${f1(g[0])}" cy="${f1(g[1])}" r="1.4" fill="#FFE9A8"/>`;
  }
  return o;
}

export function telhadoClassico(b: Predio, n: number, P: Paleta, frente: 'x' | 'y', texto?: string): string {
  const z = b.z0 + n * b.h, x0 = b.x - .1, y0 = b.y - .1, X = b.x + b.w + .1, Y = b.y + b.d + .1, azul = azulTelha(P), m = marmore(P);
  let o = box(x0, y0, z, X - x0, Y - y0, .14, m, { r: marmoreSombra(P) });
  const ze = z + .14, alt = frente === 'y' ? Math.min(.9, (X - x0) * .3) : Math.min(.9, (Y - y0) * .3), za = ze + alt;
  if (frente === 'y') {
    const xm = (x0 + X) / 2;
    o += poly([[x0, y0, ze], [xm, y0, za], [xm, Y, za], [x0, Y, ze]], shade(azul, .7));
    o += poly([[xm, y0, za], [X, y0, ze], [X, Y, ze], [xm, Y, za]], shade(azul, .85));
    for (let i = 1; i < 8; i++) { const y = y0 + (i * (Y - y0)) / 8; o += linha3([[xm, y, za], [X, y, ze]], shade(azul, .7), .7); }
    o += poly([[x0 - .03, Y, ze - .02], [X + .03, Y, ze - .02], [xm, Y, za + .06]], m);
    o += poly([[x0 + .25, Y + .002, ze + .08], [X - .25, Y + .002, ze + .08], [xm, Y + .002, za - .14]], azul);
    if (texto) o += faceY(Y + .003, x0 + .2, X - .2, z - .32, z - .02, azul) + textoY(xm, Y + .005, z - .17, texto, '#FFFFFF', 6.4, 1.2);
    const a = iso(xm, Y + .004, za + .06);
    o += `<circle cx="${f1(a[0])}" cy="${f1(a[1] - 2)}" r="2" fill="${OURO}"/>`;
  } else {
    const ym = (y0 + Y) / 2;
    o += poly([[x0, y0, ze], [X, y0, ze], [X, ym, za], [x0, ym, za]], shade(azul, .7));
    o += poly([[x0, ym, za], [X, ym, za], [X, Y, ze], [x0, Y, ze]], azul);
    for (let i = 1; i < 12; i++) { const x = x0 + (i * (X - x0)) / 12; o += linha3([[x, ym, za], [x, Y, ze]], shade(azul, .78), .7); }
    o += poly([[X, y0 - .03, ze - .02], [X, Y + .03, ze - .02], [X, ym, za + .06]], m);
    o += poly([[X + .002, y0 + .25, ze + .08], [X + .002, Y - .25, ze + .08], [X + .002, ym, za - .14]], shade(azul, 1.08));
    if (texto) o += faceY(Y + .003, x0 + .2, X - .2, z - .32, z - .02, azul) + textoY((x0 + X) / 2, Y + .005, z - .17, texto, '#FFFFFF', 6.4, 1.2);
  }
  return o;
}

export function pilastras(b: Predio, n: number, P: Paleta): string {
  const Y = b.y + b.d, z1 = b.z0 + n * b.h;
  let o = '';
  const k = Math.round(b.w / .75);
  for (let i = 0; i <= k; i++) { const x = b.x + .05 + (i * (b.w - .1)) / k; o += box(x - .06, Y, b.z0, .12, .05, z1 - b.z0, marmore(P), { t: marmoreSombra(P) }); }
  return o;
}

export function globoMonumental(x: number, y: number, P: Paleta): string {
  const m = marmore(P), ms = marmoreSombra(P);
  let o = sombraChao(x, y, 1.0, .5, P) + box(x - .62, y - .62, 0, 1.24, 1.24, .16, ms, { t: m }) + box(x - .46, y - .46, .16, .92, .92, .16, m, { r: ms });
  o += cilindro(x, y, .32, .95, .2, m) + cilindro(x, y, 1.22, .08, .3, OURO);
  const c = iso(x, y, 2.35), r = 23, oceano = P.noite ? '#0B6E9C' : '#1E9FDB', terra = P.noite ? '#249468' : '#3DBB7E';
  if (P.noite) o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r + 10}" fill="#7FCBF0" opacity=".14"/>`;
  o += `<path d="M${f1(c[0] - r - 5)},${f1(c[1] + 8)} A${r + 6},${r + 6} 0 1 1 ${f1(c[0] + r + 5)},${f1(c[1] + 8)}" fill="none" stroke="${P.bronze}" stroke-width="2.4" transform="rotate(-23 ${f1(c[0])} ${f1(c[1])})"/>`;
  o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="${oceano}"/>`;
  o += `<g transform="rotate(-23 ${f1(c[0])} ${f1(c[1])})" fill="${terra}"><path d="M${f1(c[0] - 15)},${f1(c[1] - 12)} q6,-7 13,-2 q3,5 -2,8 q-4,6 -2,11 q-6,1 -9,-6 q-3,-6 0,-11 z"/>` +
    `<path d="M${f1(c[0] + 2)},${f1(c[1] - 14)} q7,-3 12,2 q3,6 -3,8 q2,7 -4,12 q-4,-4 -3,-10 q-5,-4 -2,-12 z"/><path d="M${f1(c[0] + 10)},${f1(c[1] + 8)} q5,-1 6,3 q-2,4 -6,2 z"/><path d="M${f1(c[0] - 6)},${f1(c[1] + 9)} q4,0 4,4 q-3,4 -6,1 z"/></g>`;
  o += `<g fill="none" stroke="#FFFFFF" stroke-width=".7" opacity=".55" transform="rotate(-23 ${f1(c[0])} ${f1(c[1])})"><ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${r}" ry="${f1(r * .34)}"/><ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(r * .42)}" ry="${r}"/><line x1="${f1(c[0])}" y1="${f1(c[1] - r - 4)}" x2="${f1(c[0])}" y2="${f1(c[1] + r + 4)}" stroke="${P.bronze}" stroke-width="1.6" opacity="1"/></g>`;
  o += `<circle cx="${f1(c[0] - 8)}" cy="${f1(c[1] - 9)}" r="7" fill="#FFFFFF" opacity=".22"/><circle cx="${f1(c[0] + 9)}" cy="${f1(c[1] + 10)}" r="${r}" fill="none"/>`;
  o += `<path d="M${f1(c[0] + r * .95)},${f1(c[1] - r * .3)} A${r},${r} 0 0 1 ${f1(c[0] - r * .3)},${f1(c[1] + r * .95)}" fill="none" stroke="#0A2A55" stroke-width="3" opacity=".18"/>`;
  return o;
}

export function rosaDosVentos(x: number, y: number, P: Paleta): string {
  const c = iso(x, y, .02);
  let o = '';
  const pts: P3[] = [];
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; pts.push([x + Math.cos(a) * .85, y + Math.sin(a) * .85, .012]); }
  o += poly(pts, P.praca) + poly(pts.map(p => [p[0], p[1], .013] as P3), 'none', ` stroke="${P.caminho2}" stroke-width="1.2"`);
  const raio = .78, pts2: P3[] = [];
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 - Math.PI / 4, rr = k % 2 ? raio * .3 : k % 4 ? raio * .55 : raio; pts2.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr, .014]); }
  o += poly(pts2, azulTelha(P));
  return o + `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="2.2" fill="${OURO}"/>`;
}

export function anfora(x: number, y: number, P: Paleta): string {
  const barro = P.noite ? '#A2502A' : '#C8693A', g = iso(x, y, .3);
  let o = sombraChao(x, y, .35, .17, P) + box(x - .2, y - .2, 0, .4, .4, .3, marmore(P), { r: marmoreSombra(P) });
  o += `<g transform="translate(${f1(g[0])} ${f1(g[1])})"><path d="M-3,0 q-5,-7 -1,-14 l0,-3 l8,0 l0,3 q4,7 -1,14 z" fill="${barro}"/>` +
    `<path d="M-4.6,-8 l9.2,0" stroke="#2A1B14" stroke-width="1.6"/><path d="M-4.2,-10.6 q4.2,1.4 8.4,0" stroke="#2A1B14" stroke-width=".8" fill="none"/>` +
    `<path d="M-4,-16 q-3,2 -1,6 M4,-16 q3,2 1,6" stroke="${barro}" stroke-width="1.2" fill="none"/><rect x="-4.6" y="-18" width="9.2" height="1.6" rx=".6" fill="${shade(barro, .85)}"/></g>`;
  return o;
}

export function emEscala(x: number, y: number, s: number, svg: string): string {
  const g = iso(x, y, 0);
  return `<g transform="translate(${f1(g[0])} ${f1(g[1])}) scale(${s}) translate(${f1(-g[0])} ${f1(-g[1])})">${svg}</g>`;
}
