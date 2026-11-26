import { Paleta, Predio, P3, iso, f1, shade, box, topo, faceX, faceY, poly, linha3, andar, telhado, entradaLateral, arvore, sombraChao, textoNoPlano, cilindro, U } from './motor';

// Hospital Universitário: ala de serviço baixa, estacionamento, torre de vidro com heliponto,
// ala clínica com janelas em fita e um pavilhão de entrada envidraçado virado para a avenida.

export const VERMELHO = '#E5484D';
const rnd = (n: number) => { const s = Math.sin(n * 91.7 + 13.3) * 43758.5453; return s - Math.floor(s); };

function textoX(x: number, y: number, z: number, texto: string, cor: string, tam: number): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" letter-spacing=".6" fill="${cor}">${texto}</text>`;
}

function cruz(face: 'x' | 'y', plano: number, c: number, zc: number, t: number): string {
  const f = face === 'x' ? faceX : faceY, a = t * .36;
  return f(plano, c - t, c + t, zc - t, zc + t, '#FFFFFF') + f(plano + .001, c - a, c + a, zc - t * .78, zc + t * .78, VERMELHO) + f(plano + .001, c - t * .78, c + t * .78, zc - a, zc + a, VERMELHO);
}

const paredeH = (P: Paleta) => (P.noite ? P.parede : '#F7F8FB');

function corVidro(P: Paleta, i: number, k: number, lado: boolean, semente: number): string {
  if (P.noite) return rnd(semente + i * 13 + k * 7) > .42 ? (lado ? shade(P.janela, .9) : P.janela) : '#2A3566';
  const base = (i + k) % 6 === 0 ? '#C8E6F8' : k % 2 ? '#8CC4EC' : '#9DCFF1';
  return lado ? shade(base, .86) : base;
}

// Torre com pele de vidro em todas as faces visíveis.
function torre(T: Predio, n: number, P: Paleta): string {
  const X = T.x + T.w, Y = T.y + T.d, topoZ = T.z0 + n * T.h, par = paredeH(P);
  let o = box(T.x - .14, T.y - .14, 0, T.w + .28, T.d + .28, T.z0, P.concreto) + box(T.x, T.y, T.z0, T.w, T.d, n * T.h, par);
  const cw = .46, nx = Math.round((T.w - .2) / cw), ny = Math.round((T.d - .2) / cw);
  for (let i = 0; i < n; i++) {
    const z = T.z0 + i * T.h;
    for (let k = 0; k < nx; k++) { const a = T.x + .1 + (k * (T.w - .2)) / nx; o += faceY(Y + .003, a, a + (T.w - .2) / nx - .04, z + .1, z + T.h - .07, corVidro(P, i, k, false, 1)); }
    for (let k = 0; k < ny; k++) { const a = T.y + .1 + (k * (T.d - .2)) / ny; o += faceX(X + .003, a, a + (T.d - .2) / ny - .04, z + .1, z + T.h - .07, corVidro(P, i, k, true, 2)); }
    o += linha3([[T.x, Y + .004, z], [X + .004, Y + .004, z], [X + .004, T.y, z]], shade(par, .93), 1.1);
  }
  // espinha vermelha com a cruz no alto
  o += faceY(Y + .006, T.x + .18, T.x + .72, T.z0, topoZ + .3, VERMELHO) + cruz('y', Y + .008, T.x + .45, topoZ - .55, .3);
  o += cruz('x', X + .006, T.y + T.d / 2, topoZ - .6, .42);
  o += box(T.x - .06, T.y - .06, topoZ, T.w + .12, T.d + .12, .14, P.telhado) + box(T.x - .06, T.y - .06, topoZ + .14, T.w + .12, T.d + .12, .08, VERMELHO);
  o += topo(T.x + .1, T.y + .1, X - .1, Y - .1, topoZ + .221, shade(P.telhado, .9));
  return o + heliponto(T.x + T.w / 2, T.y + T.d / 2, topoZ + .22, Math.min(T.w, T.d) * .36, P);
}

function heliponto(hx: number, hy: number, z: number, r: number, P: Paleta): string {
  let o = box(hx - r - .1, hy - r - .1, z, 2 * r + .2, 2 * r + .2, .06, '#3A3F4F');
  const zr = z + .065, anel: P3[] = [];
  for (let k = 0; k <= 36; k++) { const t = (k / 36) * Math.PI * 2; anel.push([hx + Math.cos(t) * r * .82, hy + Math.sin(t) * r * .82, zr]); }
  o += linha3(anel, '#F2C94C', 2);
  const h = r * .34;
  o += linha3([[hx - h * .6, hy - h, zr + .001], [hx - h * .6, hy + h, zr + .001]], '#FFFFFF', 2.6) + linha3([[hx + h * .6, hy - h, zr + .001], [hx + h * .6, hy + h, zr + .001]], '#FFFFFF', 2.6) + linha3([[hx - h * .6, hy, zr + .001], [hx + h * .6, hy, zr + .001]], '#FFFFFF', 2.6);
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const g = iso(hx + dx * r * .95, hy + dy * r * .95, zr + .02);
    o += `<circle class="cv-pisca" style="animation-duration:1.6s" cx="${f1(g[0])}" cy="${f1(g[1])}" r="1.8" fill="#4ADE80"/>`;
  }
  return o;
}

// Ala clínica: faixas contínuas de vidro e brises verticais.
function alaClinica(C: Predio, n: number, P: Paleta): string {
  const X = C.x + C.w, Y = C.y + C.d, topoZ = C.z0 + n * C.h, par = paredeH(P);
  let o = box(C.x - .14, C.y - .14, 0, C.w + .28, C.d + .28, C.z0, P.concreto) + box(C.x, C.y, C.z0, C.w, C.d, n * C.h, par);
  for (let i = 0; i < n; i++) {
    const z = C.z0 + i * C.h, za = z + .3, zb = z + .78;
    const vy = P.noite ? (i % 2 ? P.janela : shade(P.janela, .92)) : '#7DB4E6';
    o += faceY(Y + .003, C.x + .12, X - .12, za, zb, vy) + faceX(X + .003, C.y + .12, Y - .12, za, zb, shade(vy, .86));
    for (let x = C.x + .6; x < X - .2; x += .55) o += linha3([[x, Y + .004, za], [x, Y + .004, zb]], P.noite ? '#3A4378' : '#E9F2FB', .7);
    for (let y = C.y + .6; y < Y - .2; y += .55) o += linha3([[X + .004, y, za], [X + .004, y, zb]], P.noite ? '#3A4378' : '#E9F2FB', .7);
  }
  for (let y = C.y + .35; y < Y - .1; y += .7) o += box(X, y, C.z0 + .1, .1, .06, n * C.h - .1, P.noite ? '#C9CEE0' : '#FFFFFF', { r: P.noite ? '#AEB4CC' : '#E4E8F0' });
  return o + telhado(C, n, P, VERMELHO, true);
}

// Pavilhão de entrada: lobby todo de vidro, marquise, letreiro e emergência na lateral.
function pavilhao(E: Predio, P: Paleta): string {
  const X = E.x + E.w, Y = E.y + E.d, zt = E.z0 + E.h, xm = E.x + E.w / 2, par = paredeH(P);
  const vidro = P.noite ? '#FFE3A0' : '#A9D6F5';
  let o = box(E.x - .14, E.y - .14, 0, E.w + .28, E.d + .28, E.z0, P.concreto) + box(E.x, E.y, E.z0, E.w, E.d, E.h, par);
  o += faceY(Y + .003, E.x + .08, X - .08, E.z0 + .05, zt - .12, vidro) + faceX(X + .003, E.y + .08, Y - .08, E.z0 + .05, zt - .12, shade(vidro, .86));
  for (let x = E.x + .5; x < X - .1; x += .5) o += linha3([[x, Y + .004, E.z0 + .05], [x, Y + .004, zt - .12]], P.noite ? '#B79A5A' : '#FFFFFF', .8);
  for (let y = E.y + .5; y < Y - .1; y += .5) o += linha3([[X + .004, y, E.z0 + .05], [X + .004, y, zt - .12]], P.noite ? '#B79A5A' : '#FFFFFF', .8);
  if (P.noite) { const g = iso(xm, Y, E.z0 + .5); o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="48" ry="14" fill="#FFD66B" opacity=".18"/>`; }
  // laje, teto verde e letreiro
  o += box(E.x - .12, E.y - .12, zt, E.w + .24, E.d + .24, .14, par, { r: shade(par, .86) });
  o += box(E.x - .12, E.y - .12, zt + .14, E.w + .24, E.d + .24, .46, par, { t: P.noite ? '#2F5A46' : '#7CC68F', r: shade(par, .86) });
  let teto = '';
  for (let k = 0; k < 4; k++) teto += arvore(E.x + .6 + k * ((E.w - 1.2) / 3), E.y + .5 + (k % 2) * .5, P, .4, 'arbusto').replace(/<ellipse[^>]*>/, '');
  o += `<g transform="translate(0 ${f1(-(zt + .6) * U)})">${teto}</g>`;
  o += textoNoPlano(xm, Y + .125, zt + .37, 'HOSPITAL', VERMELHO, 8.6);
  // marquise da entrada principal
  o += box(xm - 1.3, Y, zt - .32, 2.6, .95, .09, '#FFFFFF', { l: '#E9ECF2', r: '#DCE0E8' }) + box(xm - 1.3, Y + .86, zt - .34, 2.6, .09, .06, VERMELHO);
  for (const dx of [-1.2, 1.15]) o += box(xm + dx, Y + .8, 0, .06, .06, zt - .32, P.ferro);
  return o;
}

function emergencia(E: Predio, P: Paleta): string {
  const X = E.x + E.w, zt = E.z0 + E.h;
  let o = '';
  const ye = E.y + .25, de = Math.min(1.8, E.d - .4), xe = X + 1.15;
  o += box(X, ye, zt - .45, 1.15, de, .08, '#FFFFFF', { r: '#DCE0E8' }) + box(X, ye, zt - .37, 1.15, de, .2, VERMELHO, { t: '#FFFFFF' });
  o += textoX(xe + .003, ye + de / 2, zt - .27, 'EMERGÊNCIA', '#FFFFFF', 5.6);
  for (const dy of [.08, de - .14]) o += box(xe - .1, ye + dy, 0, .06, .06, zt - .45, P.ferro);
  return o;
}

function carro(x: number, y: number, cor: string, P: Paleta): string {
  return sombraChao(x + .19, y + .35, .3, .14, P) + box(x, y, .03, .38, .72, .2, cor) + box(x + .04, y + .16, .23, .3, .4, .14, P.noite ? '#3B4677' : '#D7EBF8', { t: cor });
}

export function ambulancia(x: number, y: number, P: Paleta): string {
  const g = iso(x + .3, y + .55, .62);
  return sombraChao(x + .35, y + .3, .5, .25, P) + box(x, y, .08, .7, 1.1, .5, '#FFFFFF') + box(x, y + .78, .08, .7, .32, .36, '#F4F6FA') +
    box(x + .005, y, .3, .7, 1.1, .08, VERMELHO) + `<circle class="cv-pisca" style="animation-duration:.9s" cx="${f1(g[0])}" cy="${f1(g[1] - 2)}" r="2" fill="#4FA3FF"/>`;
}

// ───── Clínica de Odontologia (no lugar da antiga ala de serviço) ─────

function denteIcone(cx: number, cy: number, s: number, P: Paleta, brilho = true): string {
  const t = (x: number, y: number) => `${f1(cx + x * s)},${f1(cy + y * s)}`;
  const corpo = `M${t(-10, -5)} C${t(-10, -14)} ${t(-3.5, -15)} ${t(0, -11.5)} C${t(3.5, -15)} ${t(10, -14)} ${t(10, -5)} C${t(10, 1)} ${t(7.4, 3.5)} ${t(6.4, 8.5)} C${t(5.4, 14)} ${t(2.8, 15.5)} ${t(1.8, 10)} C${t(1.1, 6.2)} ${t(-1.1, 6.2)} ${t(-1.8, 10)} C${t(-2.8, 15.5)} ${t(-5.4, 14)} ${t(-6.4, 8.5)} C${t(-7.4, 3.5)} ${t(-10, 1)} ${t(-10, -5)} Z`;
  let o = `<path d="${corpo}" fill="${P.noite ? '#E6F4F7' : '#FFFFFF'}" stroke="${P.noite ? '#9FC9D4' : '#BFD9E2'}" stroke-width="${f1(.9 * s / 1.6)}"/>`;
  o += `<path d="M${t(4, -3)} C${t(6.5, 0)} ${t(5.6, 4)} ${t(4.4, 7)}" fill="none" stroke="${P.noite ? '#B9D8E2' : '#DCEBF1'}" stroke-width="${f1(2.6 * s / 1.6)}" stroke-linecap="round"/>`;
  o += `<path d="M${t(-6.5, -8)} C${t(-5.5, -11)} ${t(-3, -11.5)} ${t(-1.6, -10)}" fill="none" stroke="#FFFFFF" stroke-width="${f1(1.6 * s / 1.6)}" stroke-linecap="round" opacity=".9"/>`;
  if (brilho) {
    const e = (x: number, y: number, r: number, d: number) => `<path class="cv-pisca" style="animation-delay:-${d}s" d="M${f1(cx + x * s)},${f1(cy + (y - r) * s)} L${f1(cx + (x + r * .28) * s)},${f1(cy + (y - r * .28) * s)} L${f1(cx + (x + r) * s)},${f1(cy + y * s)} L${f1(cx + (x + r * .28) * s)},${f1(cy + (y + r * .28) * s)} L${f1(cx + x * s)},${f1(cy + (y + r) * s)} L${f1(cx + (x - r * .28) * s)},${f1(cy + (y + r * .28) * s)} L${f1(cx + (x - r) * s)},${f1(cy + y * s)} L${f1(cx + (x - r * .28) * s)},${f1(cy + (y - r * .28) * s)} Z" fill="#7FE0F0"/>`;
    o += e(12.5, -12, 3.4, 0) + e(-13, -2, 2.2, .7);
  }
  return o;
}

function escovaGigante(x: number, y: number, P: Paleta, menta: string): string {
  const cabo = 1.75, g = iso(x, y, 0), topo1 = iso(x, y, cabo);
  let o = sombraChao(x, y, .3, .15, P) + box(x - .18, y - .18, 0, .36, .36, .12, P.concreto);
  o += box(x - .06, y - .06, .12, .12, .12, cabo - .12, menta, { r: shade(menta, .8), t: shade(menta, 1.1) });
  o += box(x - .07, y - .07, cabo - .5, .14, .14, .14, '#FFFFFF', { r: '#E3E8EF' });
  // cabeça com cerdas brancas e azuis, virada para a frente
  o += box(x - .08, y - .08, cabo, .16, .16, .5, menta, { r: shade(menta, .8) });
  for (let k = 0; k < 6; k++) {
    const z = cabo + .05 + k * .075, c = iso(x + .08, y + .02, z);
    o += `<rect x="${f1(c[0])}" y="${f1(c[1] - 1.4)}" width="5" height="2.2" rx=".8" fill="${k % 2 ? '#7FD3F2' : '#FFFFFF'}" stroke="#D0E6EF" stroke-width=".4"/>`;
  }
  void g; void topo1;
  return o;
}

function clinicaOdonto(S: Predio, P: Paleta): string {
  const X = S.x + S.w, Y = S.y + S.d, par = paredeH(P), menta = P.noite ? '#1F8C82' : '#2BB5A8', mentaC = shade(menta, 1.18), vidro = P.noite ? '#FFE3A0' : '#BFE7F2';
  const z0 = S.z0, z1 = S.z0 + S.h, z2 = z1 + S.h, xm = S.x + S.w / 2, ym = S.y + S.d / 2;
  let o = box(S.x - .14, S.y - .14, 0, S.w + .28, S.d + .28, z0, P.concreto);
  // térreo
  o += box(S.x, S.y, z0, S.w, S.d, S.h, par, { r: shade(par, .86) });
  o += faceY(Y + .002, S.x, X, z0, z0 + .12, menta) + faceX(X + .002, S.y, Y, z0, z0 + .12, shade(menta, .85));
  for (let y = S.y + .3; y < Y - .6; y += .95) {
    if (Math.abs(y + .3 - ym) < .7) continue;
    o += faceX(X + .003, y, y + .62, z0 + .26, z0 + .82, shade(vidro, .9), ` stroke="${menta}" stroke-width="1.3"`) + linha3([[X + .004, y + .31, z0 + .26], [X + .004, y + .31, z0 + .82]], menta, .8);
  }
  // mural redondo com o dente na lateral
  const mc = iso(X + .004, ym, z0 + .55);
  o += `<g transform="translate(${f1(mc[0])} ${f1(mc[1])}) skewY(-30)"><circle r="12" fill="${menta}"/><circle r="12" fill="none" stroke="#FFFFFF" stroke-width="1.2" opacity=".7"/></g>` + denteIcone(mc[0], mc[1] - 1, .62, P, false);
  // entrada envidraçada na frente, com marquise arredondada
  o += faceY(Y + .003, xm - .7, xm + .7, z0 + .05, z0 + .86, vidro, ` stroke="${menta}" stroke-width="1.4"`) + linha3([[xm, Y + .004, z0 + .05], [xm, Y + .004, z0 + .86]], menta, 1.1);
  for (const x of [S.x + .25, X - .85]) o += faceY(Y + .003, x, x + .6, z0 + .26, z0 + .82, vidro, ` stroke="${menta}" stroke-width="1.3"`);
  o += box(xm - .95, Y, z0 + .9, 1.9, .55, .07, '#FFFFFF', { r: '#E3E8EF' }) + box(xm - .95, Y + .5, z0 + .86, 1.9, .05, .11, menta);
  for (const dx of [-.85, .8]) o += box(xm + dx, Y + .46, 0, .05, .05, z0 + .86, P.ferro);
  // faixa menta com os letreiros
  o += faceY(Y + .004, S.x, X, z1 - .22, z1, menta) + faceX(X + .004, S.y, Y, z1 - .22, z1, shade(menta, .86));
  o += textoNoPlano(xm, Y + .005, z1 - .11, 'ODONTOLOGIA', '#FFFFFF', 7.2) + textoX(X + .005, ym, z1 - .11, 'CLÍNICA ODONTOLÓGICA', '#FFFFFF', 6.4);
  // 2º andar recuado com janela em fita e brises brancos
  const b2: Predio = { x: S.x + .08, y: S.y + .08, w: S.w - .16, d: S.d - .16, z0: z1, h: S.h };
  const X2 = b2.x + b2.w, Y2 = b2.y + b2.d;
  o += box(b2.x, b2.y, z1, b2.w, b2.d, S.h, par, { r: shade(par, .86) });
  o += faceY(Y2 + .003, b2.x + .12, X2 - .12, z1 + .25, z1 + .8, vidro) + faceX(X2 + .003, b2.y + .12, Y2 - .12, z1 + .25, z1 + .8, shade(vidro, .88));
  for (let x = b2.x + .45; x < X2 - .2; x += .45) o += box(x - .03, Y2, z1 + .2, .06, .1, .66, '#FFFFFF', { r: '#E3E8EF' });
  for (let y = b2.y + .45; y < Y2 - .2; y += .45) o += box(X2, y - .03, z1 + .2, .1, .06, .66, '#FFFFFF', { r: '#E3E8EF' });
  // cobertura com platibanda menta e o dente gigante
  o += box(b2.x - .05, b2.y - .05, z2, b2.w + .1, b2.d + .1, .14, par, { r: shade(par, .86), t: P.telhado }) + box(b2.x - .05, b2.y - .05, z2 + .14, b2.w + .1, b2.d + .1, .07, menta, { t: shade(P.telhado, .92) });
  const bx = xm, by = ym + .3;
  o += cilindro(bx, by, z2 + .21, .22, .55, mentaC) + cilindro(bx, by, z2 + .43, .06, .58, menta);
  const dc = iso(bx, by, z2 + .49);
  if (P.noite) o += `<circle cx="${f1(dc[0])}" cy="${f1(dc[1] - 22)}" r="30" fill="#7FE0F0" opacity=".2"/>`;
  o += denteIcone(dc[0], dc[1] - 21, 1.55, P);
  return o;
}

// Versão simples do hospital (70 dias): um posto de saúde de 3 andares no lugar da futura torre.
export function postoDeSaude(xh0: number, xh1: number, y0: number, y1: number, yPonte: number, P: Paleta): string {
  const L = y1 - y0, bx = xh0 + .55;
  const B: Predio = { x: bx + .3, y: Math.min(y0 + L * .42, yPonte - 1.6), w: 3.6, d: 3.4, z0: .22, h: 1.05 };
  const X = B.x + B.w, Y = B.y + B.d, topoZ = B.z0 + 3 * B.h;
  let o = topo(B.x - .5, B.y - .5, xh1 - .9, Y + .8, .008, P.noite ? '#3F4770' : '#E6E9F0');
  o += topo(X + .3, yPonte - .4, xh1 + .05, yPonte + .4, .013, P.caminho);
  o += box(B.x - .14, B.y - .14, 0, B.w + .28, B.d + .28, B.z0, P.concreto);
  for (let i = 0; i < 3; i++) {
    o += andar(B, i, P, { passo: .7, parede: paredeH(P) });
    if (i === 0) o += faceY(B.y + B.d + .004, B.x, B.x + B.w, B.z0 + B.h - .12, B.z0 + B.h - .02, VERMELHO) + faceX(B.x + B.w + .004, B.y, B.y + B.d, B.z0 + B.h - .12, B.z0 + B.h - .02, shade(VERMELHO, .85));
  }
  o += telhado(B, 3, P, VERMELHO, true);
  o += cruz('x', X + .006, B.y + B.d / 2, topoZ - .55, .36) + cruz('y', Y + .006, B.x + .6, topoZ - .55, .3);
  o += entradaLateral(B, P, yPonte, VERMELHO);
  const z = topoZ + .22, ym = B.y + B.d / 2, meia = 1.5;
  o += box(X - .25, ym - meia + .15, z, .05, .05, .12, P.ferro) + box(X - .25, ym + meia - .2, z, .05, .05, .12, P.ferro);
  o += faceX(X - .22, ym - meia, ym + meia, z + .1, z + .42, VERMELHO, ` stroke="${shade(VERMELHO, .7)}" stroke-width=".7"`) + textoX(X - .219, ym, z + .26, 'POSTO DE SAÚDE', '#FFFFFF', 5.2);
  o += ambulancia(X + .45, yPonte + .9, P);
  o += arvore(xh1 - .45, B.y - .3, P, .62) + arvore(xh1 - .45, Y + .9, P, .62) + arvore(bx + .2, Y + 1.0, P, .7, 'florida');
  return o;
}

export function complexoHospital(xh0: number, xh1: number, y0: number, y1: number, yPonte: number, P: Paleta, odonto = true, odontoNovo = false, atraso = 0): string {
  const L = y1 - y0, bx = xh0 + .55;
  const S: Predio = { x: bx, y: y0 + .7, w: 4.3, d: Math.max(3, L * .2), z0: .2, h: 1.05 };
  const T: Predio = { x: bx + .1, y: y0 + L * .42, w: 4.0, d: 3.6, z0: .25, h: .95 };
  const C: Predio = { x: bx, y: T.y + T.d + .9, w: 4.5, d: Math.max(3, L * .19), z0: .25, h: 1.0 };
  const E: Predio = { x: bx, y: C.y + C.d + .55, w: 4.7, d: Math.max(2.2, Math.min(3, y1 - (C.y + C.d + .55) - 1.5)), z0: .2, h: 1.25 };
  let o = topo(xh0 + .25, y0 + .3, xh1 - 1.0, y1 - .3, .008, P.noite ? '#3F4770' : '#E6E9F0');
  // estacionamento e clínica de odontologia: liberados juntos com 300 acertos
  let fundo = '';
  const p0 = S.y + S.d + .5, p1 = T.y - .5, asf = P.noite ? '#2B3048' : '#5A6176';
  if (odonto && p1 - p0 > 1.2) {
    fundo += topo(bx - .1, p0, xh1 - 1.1, p1, .012, asf);
    const cores = ['#1E2230', '#2836C6', '#2F9E5B', '#F4F6FA', '#9AA3B5', '#E5484D', '#1F7A8C', '#F2C14E'];
    const xa = bx + .05, xb = xh1 - 1.25, passo = .52, linhaP = P.noite ? '#C9CEE0' : '#E7EBF3';
    let n = 0;
    for (const y of [p0 + .15, p0 + 2.05]) {
      if (y + .8 > p1) continue;
      for (let x = xa; x + .42 <= xb; x += passo, n++) {
        fundo += linha3([[x - .07, y - .05, .014], [x - .07, y + .82, .014]], linhaP, .7);
        if (rnd(n * 3.7 + y) > .12) fundo += carro(x, y + .05, cores[Math.floor(rnd(n * 5.3 + 1) * cores.length)], P);
      }
    }
  }
  o += topo(T.x + T.w + .3, yPonte - .4, xh1 + .05, yPonte + .4, .013, P.caminho);
  o += topo(bx - .1, E.y + E.d + .2, xh1 - 1.0, y1 - .35, .011, P.noite ? '#4A5378' : '#F1F3F8');
  // clínica de odontologia no fundo, com a escova gigante na esquina
  if (odonto) {
    fundo += clinicaOdonto(S, P) + escovaGigante(S.x + S.w + .42, S.y + S.d + .22, P, P.noite ? '#1F8C82' : '#2BB5A8');
    o += odontoNovo ? `<g class="cv-peca cv-nova cv-nova-cresce" style="animation-delay:${atraso}ms">${fundo}</g>` : fundo;
  } else {
    const pts = [iso(bx - .1, S.y - .1, .02), iso(xh1 - 1.1, S.y - .1, .02), iso(xh1 - 1.1, p1, .02), iso(bx - .1, p1, .02)];
    o += `<polygon points="${pts.map(q => f1(q[0]) + ',' + f1(q[1])).join(' ')}" fill="${shade(P.grama, .95)}" stroke="${P.noite ? '#8EA0D8' : '#FFFFFF'}" stroke-width="1.6" stroke-dasharray="6 5" opacity=".9"/>`;
  }
  // torre, passarela e ala clínica
  o += torre(T, 7, P) + entradaLateral(T, P, yPonte, VERMELHO);
  o += box(T.x + 1.2, T.y + T.d, C.z0 + 1.0, 1.4, .9, .7, P.noite ? '#FFE3A0' : '#A9D6F5', { r: P.noite ? '#E8C98A' : '#8EBFE3', t: paredeH(P) });
  o += alaClinica(C, 4, P);
  o += pavilhao(E, P);
  o += ambulancia(E.x + E.w + .25, E.y + .35, P) + (E.d > 2.4 ? ambulancia(E.x + E.w + .25, E.y + 1.55, P) : '') + emergencia(E, P);
  // árvores na beira do rio e na praça da frente
  for (let y = y0 + 1.2; y < E.y - .6; y += 1.7) if (Math.abs(y - yPonte) > .9) o += arvore(xh1 - .45, y, P, .62);
  o += arvore(bx + .4, y1 - .75, P, .7, 'florida') + arvore(bx + 3.2, y1 - .75, P, .7, 'florida');
  return o;
}
