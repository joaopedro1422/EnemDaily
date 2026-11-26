import { Paleta, Predio, P3, iso, f1, shade, mix, box, topo, faceX, faceY, poly, linha3, sombraChao, aleatorio, elipseChao, placa, U } from './motor';

const OURO = '#E8B931';
const brilho = (P: Paleta) => (P.noite ? '#FFD66B' : '#FFE9A8');
const marinho = (P: Paleta) => (P.noite ? '#141B3D' : '#1E2A5A');
const branco = (P: Paleta) => (P.noite ? '#8E97C4' : '#F5F6FA');
const pedra = (P: Paleta) => (P.noite ? '#4A5280' : '#D9D2C3');

function faixa(x: number, y: number, w: number, d: number, z: number, h: number, cor: string, corLado?: string): string {
  return faceY(y + d, x, x + w, z, z + h, cor) + faceX(x + w, y, y + d, z, z + h, corLado ?? shade(cor, .82));
}

function textoY(x: number, y: number, z: number, texto: string, cor: string, tam: number, espaco = 0): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" letter-spacing="${espaco}" fill="${cor}">${texto}</text>`;
}

function ladoCilindro(cx: number, cy: number, z: number, h: number, r: number, cor: string): string {
  const b = iso(cx, cy, z), t = iso(cx, cy, z + h), rx = r * U * 1.2247, ry = r * U * .7071;
  const L = f1(b[0] - rx), R = f1(b[0] + rx), C = f1(b[0]);
  return `<path d="M${L},${f1(t[1])} L${L},${f1(b[1])} A${f1(rx)},${f1(ry)} 0 0 0 ${R},${f1(b[1])} L${R},${f1(t[1])} A${f1(rx)},${f1(ry)} 0 0 1 ${L},${f1(t[1])} Z" fill="${shade(cor, .94)}"/>` +
    `<path d="M${C},${f1(t[1] + ry)} L${C},${f1(b[1] + ry)} A${f1(rx)},${f1(ry)} 0 0 0 ${R},${f1(b[1])} L${R},${f1(t[1])} A${f1(rx)},${f1(ry)} 0 0 1 ${C},${f1(t[1] + ry)} Z" fill="${shade(cor, .8)}"/>`;
}

function tampaCilindro(cx: number, cy: number, z: number, r: number, cor: string, extra = ''): string {
  const t = iso(cx, cy, z);
  return `<ellipse cx="${f1(t[0])}" cy="${f1(t[1])}" rx="${f1(r * U * 1.2247)}" ry="${f1(r * U * .7071)}" fill="${cor}"${extra}/>`;
}

function janelaCurva(cx: number, cy: number, r: number, ang: number, w: number, z0: number, z1: number, fill: string, extra = ''): string {
  const a = (ang * Math.PI) / 180, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r, tx = -Math.sin(a), ty = Math.cos(a), m = w / 2, zs = z1 - m;
  const p: P3[] = [[px - tx * m, py - ty * m, z0], [px - tx * m, py - ty * m, zs]];
  for (let k = 1; k < 8; k++) { const f = Math.PI - (k / 8) * Math.PI; p.push([px + tx * Math.cos(f) * m, py + ty * Math.cos(f) * m, zs + Math.sin(f) * m]); }
  p.push([px + tx * m, py + ty * m, zs], [px + tx * m, py + ty * m, z0]);
  return poly(p, fill, extra);
}

export interface Obs { cx: number; cy: number; }

export function observatorioBase(o: Obs, P: Paleta): string {
  const { cx, cy } = o, s = 1.5;
  return topo(cx - s - .2, cy - s - .2, cx + s + .6, cy + s + .9, .004, P.sombra) +
    box(cx - s, cy - s, 0, 2 * s, 2 * s, .3, pedra(P), { t: shade(pedra(P), 1.05) }) +
    faixa(cx - s, cy - s, 2 * s, 2 * s, .26, .04, OURO) +
    box(cx - .45, cy + s, 0, .9, .2, .2, pedra(P)) + box(cx - .45, cy + s + .2, 0, .9, .2, .1, pedra(P));
}

export function observatorioTorre(o: Obs, P: Paleta): string {
  const { cx, cy } = o, r = 1.25, z0 = .3, z1 = 2.05, par = branco(P);
  let s = ladoCilindro(cx, cy, z0, z1 - z0, r, par) + tampaCilindro(cx, cy, z1, r, shade(par, .9));
  s += ladoCilindro(cx, cy, z0, .14, r + .02, shade(pedra(P), .95));
  const vidro = P.noite ? P.janela : '#3B4A86';
  for (const ang of [12, 48, 84]) {
    s += janelaCurva(cx, cy, r + .005, ang, .34, z0 + .45, z0 + 1.45, OURO) + janelaCurva(cx, cy, r + .01, ang, .24, z0 + .5, z0 + 1.38, vidro);
  }
  s += janelaCurva(cx, cy, r + .01, 66, .52, z0, z0 + .95, P.noite ? '#FFE1A0' : '#2B2338', ` stroke="${OURO}" stroke-width=".8"`);
  return s;
}

export function observatorioGaleria(o: Obs, P: Paleta): string {
  const { cx, cy } = o, z = 2.05, rg = 1.45, r = 1.05, par = branco(P);
  let s = tampaCilindro(cx, cy, z, rg, shade(pedra(P), .92)) + ladoCilindro(cx, cy, z - .08, .08, rg, shade(pedra(P), .85));
  s += ladoCilindro(cx, cy, z, .78, r, par) + ladoCilindro(cx, cy, z + .7, .1, r + .02, OURO);
  const c = iso(cx, cy, z + .38), rx = rg * U * 1.2247, ry = rg * U * .7071;
  s += `<path d="M${f1(c[0] - rx)},${f1(c[1])} A${f1(rx)},${f1(ry)} 0 0 0 ${f1(c[0] + rx)},${f1(c[1])}" fill="none" stroke="${P.ferro}" stroke-width="1.3"/>`;
  for (let k = 0; k <= 10; k++) {
    const a = (k / 10) * Math.PI, px = cx + Math.cos(a - Math.PI / 4) * rg * .999, py = cy + Math.sin(a - Math.PI / 4) * rg * .999;
    if (Math.cos(a - Math.PI / 4) + Math.sin(a - Math.PI / 4) < -.2) continue;
    s += linha3([[px, py, z], [px, py, z + .38]], P.ferro, .9);
  }
  return s;
}

export function observatorioCupula(o: Obs, P: Paleta): string {
  const { cx, cy } = o, z = 2.83, r = 1.12, cor = P.noite ? '#B87B10' : '#D99A2B';
  const t = iso(cx, cy, z), rx = r * U * 1.2247, ry = r * U * .7071, hg = rx * .92;
  const L = f1(t[0] - rx), R = f1(t[0] + rx), C = f1(t[0]), Y = f1(t[1]);
  let s = `<path d="M${L},${Y} A${f1(rx)},${f1(hg)} 0 0 1 ${R},${Y} A${f1(rx)},${f1(ry)} 0 0 1 ${L},${Y} Z" fill="${cor}"/>` +
    `<path d="M${C},${f1(t[1] - hg)} A${f1(rx)},${f1(hg)} 0 0 1 ${R},${Y} A${f1(rx)},${f1(ry)} 0 0 1 ${C},${f1(t[1] + ry)} Z" fill="${shade(cor, .82)}"/>`;
  for (const f of [-.62, -.3, .3, .62]) {
    const xb = t[0] + f * rx, yb = t[1] + Math.sqrt(Math.max(0, 1 - f * f)) * ry;
    s += `<path d="M${f1(t[0])},${f1(t[1] - hg)} Q${f1(t[0] + f * rx * 1.05)},${f1(t[1] - hg * .55)} ${f1(xb)},${f1(yb)}" fill="none" stroke="${shade(cor, f < 0 ? 1.15 : .7)}" stroke-width=".9" opacity=".8"/>`;
  }
  s += `<path d="M${f1(t[0] - rx * .55)},${f1(t[1] - hg * .78)} Q${f1(t[0] - rx * .2)},${f1(t[1] - hg * 1.02)} ${f1(t[0] + rx * .05)},${f1(t[1] - hg * .95)}" fill="none" stroke="#FFFFFF" stroke-width="2.2" opacity="${P.noite ? .15 : .45}" stroke-linecap="round"/>`;
  const fenda = P.noite ? '#FFD66B' : '#232A4F';
  s += `<path d="M${f1(t[0] - 3.2)},${f1(t[1] - hg + .5)} Q${f1(t[0] + rx * .32)},${f1(t[1] - hg * .45)} ${f1(t[0] + rx * .38)},${f1(t[1] + ry * .82)} L${f1(t[0] + rx * .08)},${f1(t[1] + ry * .98)} Q${f1(t[0] + rx * .05)},${f1(t[1] - hg * .4)} ${f1(t[0] + 3.2)},${f1(t[1] - hg + .5)} Z" fill="${fenda}"${P.noite ? ' opacity=".95"' : ''}/>`;
  s += `<path d="M${f1(t[0] - 3.2)},${f1(t[1] - hg + .5)} Q${f1(t[0] + rx * .32)},${f1(t[1] - hg * .45)} ${f1(t[0] + rx * .38)},${f1(t[1] + ry * .82)}" fill="none" stroke="${shade(cor, 1.18)}" stroke-width="1.2"/>`;
  s += `<circle cx="${f1(t[0])}" cy="${f1(t[1] - hg - 2)}" r="2.4" fill="${OURO}"/>`;
  return s;
}

export function observatorioTelescopio(o: Obs, P: Paleta): string {
  const { cx, cy } = o, t = iso(cx, cy, 2.83), r = 1.12, rx = r * U * 1.2247, hg = rx * .92;
  const bx = t[0] + rx * .2, by = t[1] - hg * .25;
  let s = `<g transform="rotate(-38 ${f1(bx)} ${f1(by)})"><rect x="${f1(bx - 3.6)}" y="${f1(by - 26)}" width="7.2" height="27" rx="2.4" fill="${branco(P)}" stroke="${P.ferro}" stroke-width=".8"/>` +
    `<rect x="${f1(bx - 4.2)}" y="${f1(by - 28)}" width="8.4" height="5" rx="1.6" fill="${P.ferro}"/><rect x="${f1(bx - 3.6)}" y="${f1(by - 12)}" width="7.2" height="2.6" fill="${P.mt}"/></g>`;
  if (P.noite) {
    const rnd = aleatorio(91);
    for (let k = 0; k < 9; k++) {
      const x = t[0] - 40 + rnd() * 90, y = t[1] - hg - 46 + rnd() * 36;
      s += `<path class="cv-pisca" style="animation-delay:-${(k * .37).toFixed(2)}s" d="M${f1(x)},${f1(y - 2.6)} L${f1(x + .7)},${f1(y - .7)} L${f1(x + 2.6)},${f1(y)} L${f1(x + .7)},${f1(y + .7)} L${f1(x)},${f1(y + 2.6)} L${f1(x - .7)},${f1(y + .7)} L${f1(x - 2.6)},${f1(y)} L${f1(x - .7)},${f1(y - .7)} Z" fill="#FFF3C4"/>`;
    }
  }
  return s;
}

export function observatorioLuzes(o: Obs, P: Paleta): string {
  const z = 2.05 + .4, rg = 1.47;
  let s = '';
  for (let k = 0; k <= 16; k++) {
    const a = -Math.PI / 4 + (k / 16) * Math.PI, c = iso(o.cx + Math.cos(a) * rg, o.cy + Math.sin(a) * rg, z);
    s += `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${((k * 3) % 7) * .2}s" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${P.noite ? 1.5 : 1.1}" fill="${[brilho(P), P.mt, brilho(P), '#FFFFFF'][k % 4]}"/>`;
  }
  return s;
}

const paredeCC = (P: Paleta) => (P.noite ? P.parede : '#EEF1F6');

function vidroSobre(Y: number, x0: number, x1: number, z0: number, z1: number, P: Paleta, quadro: string, passo = .46): string {
  let o = faceY(Y + .004, x0, x1, z0, z1, P.noite ? '#FFF3C8' : '#BFD8F2', ` opacity="${P.noite ? .1 : .28}"`);
  if (!P.noite) for (const f of [.1, .55]) { const a = x0 + (x1 - x0) * f; o += poly([[a, Y + .005, z0], [a + .26, Y + .005, z0], [a + .66, Y + .005, z1], [a + .4, Y + .005, z1]], '#FFFFFF', ' opacity=".18"'); }
  const n = Math.max(2, Math.round((x1 - x0) / passo));
  for (let i = 1; i < n; i++) { const x = x0 + (i * (x1 - x0)) / n; o += linha3([[x, Y + .006, z0], [x, Y + .006, z1]], quadro, 1.1); }
  return o + faceY(Y + .006, x0, x1, z0, z0 + .05, quadro) + faceY(Y + .006, x0, x1, z1 - .05, z1, quadro);
}

function laboratorio(Y: number, x0: number, x1: number, z0: number, z1: number, P: Paleta): string {
  let o = faceY(Y + .001, x0, x1, z0, z1, P.noite ? '#2A3463' : '#DCE4F2');
  const tela = P.noite ? '#7DF0F4' : '#4FB7E8';
  for (let x = x0 + .12; x < x1 - .3; x += .44) {
    o += faceY(Y + .002, x, x + .32, z0 + .34, z0 + .4, P.noite ? '#4A3A30' : '#B9C2D3');
    o += faceY(Y + .0025, x + .06, x + .26, z0 + .43, z0 + .62, '#1E2235') + faceY(Y + .003, x + .08, x + .24, z0 + .45, z0 + .6, tela, ` opacity="${P.noite ? 1 : .9}"`);
    o += faceY(Y + .0035, x + .1, x + .2, z0 + .52, z0 + .54, '#FFFFFF', ' opacity=".7"');
  }
  return o;
}

function servidores(Y: number, x0: number, x1: number, z0: number, z1: number, P: Paleta, semente: number): string {
  let o = faceY(Y + .001, x0, x1, z0, z1, P.noite ? '#0E1330' : '#2A3152');
  const rnd = aleatorio(semente), leds = ['#36E39B', '#4FB7E8', '#F2C14E', '#36E39B'];
  for (let x = x0 + .07; x < x1 - .22; x += .3) {
    o += faceY(Y + .002, x, x + .22, z0 + .08, z1 - .08, '#151A2E', ` stroke="#3A4366" stroke-width=".5"`);
    for (let r = 0; r < 6; r++) {
      const z = z0 + .18 + r * ((z1 - z0 - .3) / 6);
      o += faceY(Y + .0025, x + .03, x + .19, z, z + .025, '#2C3456');
      const c = iso(x + .05 + rnd() * .12, Y + .003, z + .06);
      o += `<circle class="${rnd() < .4 ? 'cv-pisca' : ''}" style="animation-delay:-${(rnd() * 2).toFixed(2)}s" cx="${f1(c[0])}" cy="${f1(c[1])}" r=".9" fill="${leds[Math.floor(rnd() * leds.length)]}"/>`;
    }
  }
  return o;
}

function telasCodigo(Y: number, x0: number, x1: number, z0: number, z1: number, P: Paleta, semente: number): string {
  let o = faceY(Y + .001, x0, x1, z0, z1, P.noite ? '#1A2148' : '#E3E9F5');
  const rnd = aleatorio(semente), cores = [P.mt, '#4FB7E8', '#36B37D', '#C7455A', '#7A5BD8'];
  for (let x = x0 + .1; x < x1 - .45; x += .62) {
    o += faceY(Y + .002, x, x + .5, z0 + .25, z1 - .2, '#1B2033');
    for (let l = 0; l < 5; l++) {
      const z = z1 - .3 - l * ((z1 - z0 - .55) / 5), ind = (l % 3) * .05, w = .12 + rnd() * .22;
      o += faceY(Y + .003, x + .05 + ind, Math.min(x + .45, x + .05 + ind + w), z - .03, z, cores[Math.floor(rnd() * cores.length)]);
    }
  }
  return o;
}

export function computacaoAndar(b: Predio, i: number, P: Paleta, porta: { x0: number; x1: number } | null): string {
  const z = b.z0 + i * b.h, X = b.x + b.w, Y = b.y + b.d, par = paredeCC(P), q = P.noite ? '#2A3152' : '#3A4366';
  let o = box(b.x, b.y, z, b.w, b.d, b.h, par, { r: shade(par, .84) });
  o += faixa(b.x - .03, b.y - .03, b.w + .06, b.d + .06, z, .1, i === 0 ? shade(P.concreto, .9) : P.mt);
  const zv0 = z + .18, zv1 = z + b.h - .1, x0 = b.x + .15, x1 = X - .15;
  const sala = (a: number, c: number) => i === 0 ? laboratorio(Y, a, c, zv0, zv1, P) : i === 1 ? servidores(Y, a, c, zv0, zv1, P, 70 + Math.round(a * 10)) : telasCodigo(Y, a, c, zv0, zv1, P, 90 + Math.round(a * 10));
  if (porta) o += sala(x0, porta.x0 - .05) + vidroSobre(Y, x0, porta.x0 - .05, zv0, zv1, P, q) + sala(porta.x1 + .05, x1) + vidroSobre(Y, porta.x1 + .05, x1, zv0, zv1, P, q);
  else o += sala(x0, x1) + vidroSobre(Y, x0, x1, zv0, zv1, P, q, i === 1 ? .3 : .46);
  for (let k = 0; k < 4; k++) {
    const yc = b.y + .4 + k * ((b.d - .8) / 3);
    o += faceX(X + .002, yc - .17, yc + .17, zv0 + .05, zv1 - .05, P.noite ? P.janela : '#6E86C6', ` stroke="${P.moldura}" stroke-width=".7"`);
  }
  return o;
}

export function computacaoEntrada(b: Predio, P: Paleta, x0: number, x1: number): string {
  const Y = b.y + b.d, z = b.z0;
  let o = box(x0 - .25, Y, 0, x1 - x0 + .5, .5, z, P.concreto);
  o += faceY(Y + .003, x0, x1, z, z + 1.0, P.noite ? '#FFE1A0' : '#2B3460', ` stroke="${P.mt}" stroke-width="1.2"`) + linha3([[(x0 + x1) / 2, Y + .004, z], [(x0 + x1) / 2, Y + .004, z + 1.0]], P.mt, 1);
  o += box(x0 - .35, Y, z + 1.05, x1 - x0 + .7, .55, .08, P.mt, { t: shade(P.mt, 1.1) });
  const c = iso((x0 + x1) / 2, Y + .552, z + 1.09);
  return o + `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="1.6" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="4.6" font-weight="800" fill="#FFFFFF">{ }</text>`;
}

export function computacaoCobertura(b: Predio, n: number, P: Paleta): string {
  const z = b.z0 + n * b.h, Y = b.y + b.d, xm = b.x + b.w / 2;
  let o = box(b.x - .08, b.y - .08, z, b.w + .16, b.d + .16, .12, paredeCC(P), { r: shade(paredeCC(P), .84), t: P.telhado });
  o += box(b.x - .08, b.y - .08, z + .12, b.w + .16, b.d + .16, .34, marinho(P), { t: shade(P.telhado, .92) });
  o += faceY(Y + .081, b.x - .08, b.x + b.w + .08, z + .42, z + .46, P.mt) + faceX(b.x + b.w + .081, b.y - .08, Y + .08, z + .42, z + .46, shade(P.mt, .85));
  o += topo(b.x + .06, b.y + .06, b.x + b.w - .06, Y - .06, z + .462, shade(P.telhado, .9));
  o += textoY(xm, Y + .085, z + .29, 'COMPUTAÇÃO', '#FFFFFF', 7.4, 1.2);
  return o;
}

export function computacaoCubo(b: Predio, n: number, P: Paleta): string {
  const zt = b.z0 + n * b.h + .46, w = 1.5, d = .9, x = b.x + b.w / 2 - w / 2, y = b.y + b.d - d - .25, z0 = zt + .35, h = 1.05;
  let o = box(x + .2, y + .3, zt, .08, .08, z0 - zt, P.ferro) + box(x + w - .28, y + .3, zt, .08, .08, z0 - zt, P.ferro);
  const c = iso(x + w / 2, y + d, z0 + h / 2);
  if (P.noite) o += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="34" ry="24" fill="${P.mt}" opacity=".2"/>`;
  o += box(x, y, z0, w, d, h, marinho(P), { l: marinho(P), r: shade(marinho(P), .8), t: shade(marinho(P), 1.4) });
  o += faceY(y + d + .003, x + .06, x + w - .06, z0 + .06, z0 + h - .06, 'none', ` stroke="${P.mt}" stroke-width="1.2"`);
  o += faceX(x + w + .003, y + .06, y + d - .06, z0 + .06, z0 + h - .06, 'none', ` stroke="${shade(P.mt, .85)}" stroke-width="1.1"`);
  const cor = P.noite ? '#FFC24D' : P.mt;
  o += `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="5.6" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="17" font-weight="800" letter-spacing="-.5" fill="${cor}"${P.noite ? ` stroke="#FFE9A8" stroke-width=".4"` : ''}>&lt;/&gt;</text>`;
  const cx = iso(x + w, y + d / 2, z0 + h / 2);
  o += `<text transform="translate(${f1(cx[0])} ${f1(cx[1])}) skewY(-30)" y="3.4" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="10" font-weight="800" fill="${shade(cor, .85)}">{ }</text>`;
  return o;
}

export function computacaoBits(b: Predio, n: number, P: Paleta): string {
  const X = b.x + b.w, yc = b.y + b.d - .25, zTop = b.z0 + n * b.h - .1;
  let o = faceX(X + .004, yc - .14, yc + .14, b.z0 + .2, zTop, '#151A2E');
  const rnd = aleatorio(57);
  for (let z = b.z0 + .3; z < zTop - .1; z += .17) {
    const bit = rnd() < .5;
    o += faceX(X + .005, yc - .08, yc + .08, z, z + .1, bit ? '#36E39B' : '#2A3456', bit ? ` class="cv-pisca" style="animation-delay:-${(rnd() * 2.4).toFixed(2)}s"` : '');
  }
  return o;
}

export function computacaoTelhadoExtras(b: Predio, n: number, P: Paleta): string {
  const z = b.z0 + n * b.h + .46;
  let o = '';
  for (let i = 0; i < 3; i++) {
    const x0 = b.x + .2 + i * .82;
    o += poly([[x0, b.y + .25, z + .02], [x0 + .7, b.y + .25, z + .02], [x0 + .7, b.y + .95, z + .26], [x0, b.y + .95, z + .26]], P.painel, ` stroke="${shade(P.painel, 1.6)}" stroke-width=".6"`);
  }
  const c = iso(b.x + b.w - .35, b.y + 1.4, z + .62);
  o += box(b.x + b.w - .4, b.y + 1.35, z, .1, .1, .5, P.ferro) + `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="8" ry="5" fill="${P.branco}" stroke="${P.ferro}" stroke-width=".8" transform="rotate(-25 ${f1(c[0])} ${f1(c[1])})"/>`;
  return o;
}

const paredeIM = (P: Paleta) => (P.noite ? P.parede : '#F6F1E8');

export function institutoCobertura(b: Predio, n: number, P: Paleta): string {
  const z = b.z0 + n * b.h, Y = b.y + b.d, xm = b.x + b.w / 2;
  let o = box(b.x - .08, b.y - .08, z, b.w + .16, b.d + .16, .12, paredeIM(P), { r: shade(paredeIM(P), .84), t: P.telhado });
  o += box(b.x - .08, b.y - .08, z + .12, b.w + .16, b.d + .16, .36, P.mt, { t: shade(P.telhado, .92) });
  o += topo(b.x + .06, b.y + .06, b.x + b.w - .06, Y - .06, z + .482, shade(P.telhado, .9));
  o += textoY(xm, Y + .085, z + .3, 'MATEMÁTICA', '#FFFFFF', 8.6, 1.8);
  return o;
}

export function institutoFormula(b: Predio, i: number, P: Paleta): string {
  const z = b.z0 + i * b.h - .2, Y = b.y + b.d, xm = b.x + b.w / 2;
  return faceY(Y + .006, b.x + .35, b.x + b.w - .35, z - .02, z + .34, marinho(P)) +
    textoY(xm, Y + .008, z + .16, 'a² + b² = c²', P.noite ? '#FFD66B' : '#FFFFFF', 7.6, .6);
}

export function institutoTorre(b: Predio, n: number, P: Paleta): string {
  const z = b.z0 + n * b.h + .48, x = b.x + b.w / 2 - .6, y = b.y + .4, w = 1.2, d = 1.2, h = 1.4, par = paredeIM(P);
  let o = box(x, y, z, w, d, h, par, { r: shade(par, .84) });
  o += faceY(y + d + .003, x + .14, x + w - .14, z + .2, z + h - .2, P.noite ? '#FFE1A0' : marinho(P), ` stroke="${OURO}" stroke-width="1"`);
  o += textoY(x + w / 2, y + d + .005, z + h / 2, 'Σ', P.noite ? '#7A4A0A' : P.mt, 16);
  o += faceX(x + w + .003, y + .2, y + d - .2, z + .3, z + h - .3, P.noite ? P.janela : '#6E86C6', ` stroke="${P.moldura}" stroke-width=".7"`);
  const xm = x + w / 2, ym = y + d / 2, zt = z + h;
  o += box(x - .06, y - .06, zt, w + .12, d + .12, .12, P.mt);
  o += poly([[x - .02, y + d + .02, zt + .12], [x + w + .02, y + d + .02, zt + .12], [xm, ym, zt + .85]], shade(P.mt, .95)) + poly([[x + w + .02, y - .02, zt + .12], [x + w + .02, y + d + .02, zt + .12], [xm, ym, zt + .85]], shade(P.mt, .76));
  const t = iso(xm, ym, zt + .85);
  return o + `<circle cx="${f1(t[0])}" cy="${f1(t[1] - 2)}" r="2.2" fill="${OURO}"/>`;
}

export function placaPi(x: number, y: number, P: Paleta): string {
  const meio = 1.05, z0 = .55, z1 = 1.55;
  let o = sombraChao(x, y + .2, .9, .35, P) + box(x - meio + .05, y - .03, 0, .07, .07, z1 + .05, P.ferro) + box(x + meio - .12, y - .03, 0, .07, .07, z1 + .05, P.ferro);
  o += faceY(y + .04, x - meio - .06, x + meio + .06, z0 - .06, z1 + .06, P.madeira) + faceY(y + .045, x - meio, x + meio, z0, z1, '#24443A');
  o += textoY(x, y + .05, z1 - .28, 'π ≈ 3,14159', '#F4F5F9', 8.4);
  o += textoY(x, y + .05, z0 + .25, 'e^(iπ) + 1 = 0', '#BFE3D2', 6);
  return o;
}

export function xadrez(x: number, y: number, P: Paleta): string {
  let o = topo(x - .05, y - .05, x + 1.45, y + 1.45, .012, P.madeira);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) o += topo(x + i * .35, y + j * .35, x + (i + 1) * .35, y + (j + 1) * .35, .014, (i + j) % 2 ? (P.noite ? '#C9CEE0' : '#FFFFFF') : P.ferro);
  return o;
}
