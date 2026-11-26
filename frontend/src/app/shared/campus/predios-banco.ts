import { Paleta, Predio, P3, iso, f1, shade, box, topo, faceX, faceY, poly, linha3, sombraChao, cilindro, cupula, textoNoPlano } from './motor';

// Banco do campus (área de Matemática): começa como um pequeno templo bancário de granito
// e, no fim da trilha, vira a sede premium com 2º andar, cúpula dourada e o porquinho de ouro.

const OURO = '#E8B931';
const granito = (P: Paleta) => (P.noite ? '#8C93B4' : '#E4E1DA');
const granitoEsc = (P: Paleta) => shade(granito(P), .84);
const verdeBanco = (P: Paleta) => (P.noite ? '#1F5C4C' : '#1F6B57');

function textoX(x: number, y: number, z: number, texto: string, cor: string, tam: number, espaco = 0): string {
  const c = iso(x, y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" letter-spacing="${espaco}" fill="${cor}">${texto}</text>`;
}

const ZP = .32;

export function bancoFundacao(B: Predio, P: Paleta): string {
  const g = granito(P);
  return topo(B.x - .25, B.y - .25, B.x + B.w + .6, B.y + B.d + 1.0, .004, P.sombra) +
    box(B.x - .12, B.y - .12, 0, B.w + .24, B.d + .24, ZP, g, { r: granitoEsc(P), t: shade(g, 1.04) });
}

// Escadaria larga na frente, virada para o caminho.
function escadaria(B: Predio, P: Paleta): string {
  const g = granito(P), Y = B.y + B.d;
  let o = '';
  for (let k = 0; k < 3; k++) o += box(B.x + .1 + k * .12, Y + .12, 0, B.w - .2 - k * .24, .42 - k * .14, ZP * (k + 1) / 3, shade(g, .95), { t: g, r: granitoEsc(P) });
  return o;
}

// Corpo do térreo: paredes de granito com janelões gradeados e porta de bronze recuada.
function corpo(B: Predio, P: Paleta, h: number): string {
  const X = B.x + B.w, Y = B.y + B.d, g = granito(P), vidro = P.noite ? '#FFE3A0' : '#41566E';
  const x0 = B.x + .1, y0 = B.y + .1, x1 = X - .1, y1 = Y - .45;
  let o = box(x0, y0, ZP, x1 - x0, y1 - y0, h, g, { r: granitoEsc(P), t: shade(g, .96) });
  for (let z = ZP + .25; z < ZP + h - .05; z += .25) o += linha3([[x0, y1 + .002, z], [x1, y1 + .002, z], [x1 + .002, y0, z]], shade(g, .9), .5);
  // porta de bronze no meio da frente
  const xm = (x0 + x1) / 2;
  o += faceY(y1 + .003, xm - .32, xm + .32, ZP, ZP + h * .72, P.noite ? '#FFD27A' : '#7A5A2B', ` stroke="${OURO}" stroke-width="1.2"`);
  o += linha3([[xm, y1 + .004, ZP], [xm, y1 + .004, ZP + h * .72]], OURO, .8);
  for (const dx of [-.16, .16]) { const c = iso(xm + dx, y1 + .004, ZP + h * .36); o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="1" fill="${OURO}"/>`; }
  // janelões altos com arco na lateral, protegidos por grade dourada
  for (let k = 0; k < 3; k++) {
    const yc = y0 + .45 + k * ((y1 - y0 - .9) / 2), zb = ZP + .2, zt = ZP + h - .3, r = .2;
    const arco: P3[] = [[x1 + .003, yc - r, zb], [x1 + .003, yc + r, zb], [x1 + .003, yc + r, zt - r]];
    for (let j = 0; j <= 8; j++) { const a = (j / 8) * Math.PI; arco.push([x1 + .003, yc + Math.cos(a) * r, zt - r + Math.sin(a) * r]); }
    o += poly(arco, shade(vidro, .9), ` stroke="${granitoEsc(P)}" stroke-width="1"`);
    for (const dy of [-.1, 0, .1]) o += linha3([[x1 + .004, yc + dy, zb], [x1 + .004, yc + dy, zt - r * .6]], OURO, .6);
  }
  return o;
}

// Colunata coríntia simplificada na frente + entablamento com o letreiro.
function colunata(B: Predio, P: Paleta, h: number, n: number): string {
  const X = B.x + B.w, Y = B.y + B.d, g = granito(P), zt = ZP + h;
  let o = '';
  for (let k = 0; k < n; k++) {
    const x = B.x + .3 + (k * (B.w - .6)) / (n - 1), y = Y - .18;
    o += box(x - .13, y - .13, ZP, .26, .26, .06, granitoEsc(P)) + cilindro(x, y, ZP + .06, h - .2, .1, g) + box(x - .15, y - .15, zt - .14, .3, .3, .14, g, { r: granitoEsc(P) });
  }
  o += box(B.x - .04, B.y + .05, zt, B.w + .08, B.d - .05, .32, g, { r: granitoEsc(P), t: shade(g, .97) });
  o += faceY(Y + .004, B.x + .1, X - .1, zt + .04, zt + .28, verdeBanco(P));
  o += textoNoPlano(B.x + B.w / 2, Y + .005, zt + .16, 'BANCO', OURO, 9.2);
  o += faceX(X + .044, B.y + .1, Y - .1, zt + .1, zt + .14, OURO);
  return o;
}

function frontao(B: Predio, P: Paleta, z: number, medalhao: boolean): string {
  const g = granito(P), x0 = B.x - .08, X = B.x + B.w + .08, y0 = B.y, Y = B.y + B.d + .02, xm = (x0 + X) / 2, alt = .62;
  let o = box(x0, y0, z, X - x0, Y - y0, .1, g, { r: granitoEsc(P) });
  const telha = P.noite ? '#3A6E61' : '#2E7D66';
  o += poly([[x0, y0, z + .1], [xm, y0, z + .1 + alt], [xm, Y, z + .1 + alt], [x0, Y, z + .1]], shade(telha, .78));
  o += poly([[xm, y0, z + .1 + alt], [X, y0, z + .1], [X, Y, z + .1], [xm, Y, z + .1 + alt]], telha);
  o += poly([[x0 - .03, Y, z + .08], [X + .03, Y, z + .08], [xm, Y, z + .14 + alt]], g) + poly([[x0 + .22, Y + .002, z + .16], [X - .22, Y + .002, z + .16], [xm, Y + .002, z + alt - .05]], shade(g, .9));
  const c = iso(xm, Y + .004, z + .3);
  if (medalhao) {
    o += `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)"><circle r="6.6" fill="${OURO}" stroke="#FFF4C8" stroke-width="1"/><text y="3.6" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="10" font-weight="800" fill="${verdeBanco(P)}">$</text></g>`;
    if (P.noite) o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="13" fill="#FFE9A8" opacity=".3"/>`;
  } else {
    o += `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)"><circle r="4.4" fill="none" stroke="${OURO}" stroke-width="1.3"/></g>`;
  }
  const t = iso(xm, Y, z + .18 + alt);
  return o + `<circle cx="${f1(t[0])}" cy="${f1(t[1] - 1)}" r="1.8" fill="${OURO}"/>`;
}

export function bancoObra(B: Predio, P: Paleta): string {
  return escadaria(B, P) + corpo(B, P, .7);
}

export function bancoSimples(B: Predio, P: Paleta): string {
  const h = 1.45;
  return escadaria(B, P) + corpo(B, P, h) + colunata(B, P, h, 4) + frontao(B, P, ZP + h + .32, false) + caixaEletronico(B, P);
}

function caixaEletronico(B: Predio, P: Paleta): string {
  const x = B.x + B.w + .25, y = B.y + B.d - .2, tela = P.noite ? '#7FE0F0' : '#2C3247';
  return box(x - .15, y - .12, 0, .3, .24, .62, verdeBanco(P), { r: shade(verdeBanco(P), .8) }) + faceY(y + .12 + .003, x - .1, x + .1, .38, .54, tela) + faceY(y + .12 + .003, x - .08, x + .08, .24, .28, OURO);
}

function porquinho(x: number, y: number, P: Paleta): string {
  const g = iso(x, y, .55), ouro = P.noite ? '#C9971A' : OURO, esc = shade(ouro, .78);
  let o = sombraChao(x, y, .45, .22, P) + box(x - .32, y - .32, 0, .64, .64, .28, granito(P), { r: granitoEsc(P) });
  o += `<g transform="translate(${f1(g[0])} ${f1(g[1])})">` +
    `<rect x="-7" y="1" width="2.6" height="5" rx="1" fill="${esc}"/><rect x="3.4" y="1" width="2.6" height="5" rx="1" fill="${esc}"/>` +
    `<ellipse cx="0" cy="-3" rx="11" ry="8" fill="${ouro}"/><ellipse cx="-3" cy="-6" rx="5" ry="2.4" fill="#FFF4C8" opacity=".55"/>` +
    `<ellipse cx="10.5" cy="-2" rx="3.4" ry="3" fill="${esc}"/><circle cx="10" cy="-3" r=".7" fill="#5A3E10"/><circle cx="11.6" cy="-1.6" r=".7" fill="#5A3E10"/>` +
    `<path d="M5,-10 L7,-14 L8.5,-9 Z" fill="${esc}"/><circle cx="6.5" cy="-5.5" r="1" fill="#3A2A10"/>` +
    `<rect x="-3" y="-11.6" width="6" height="1.4" rx=".6" fill="#3A2A10"/><path d="M-11,-4 q-4,-1 -3,-5" stroke="${esc}" stroke-width="1.4" fill="none"/></g>`;
  const m = iso(x, y, 1.15);
  o += `<g transform="translate(${f1(m[0])} ${f1(m[1] - 8)})"><ellipse rx="4.2" ry="1.6" fill="${OURO}" stroke="#B5871A" stroke-width=".6"/></g>`;
  if (P.noite) o += `<circle cx="${f1(g[0])}" cy="${f1(g[1] - 3)}" r="16" fill="#FFE9A8" opacity=".22"/>`;
  return o;
}

// Versão premium: 2º andar com janelas em arco, cornija dourada, frontão com medalhão "$", cúpula e porquinho de ouro.
export function bancoPremium(B: Predio, P: Paleta): string {
  const h = 1.45, h2 = 1.0, g = granito(P), X = B.x + B.w, Y = B.y + B.d, z1 = ZP + h + .32;
  let o = escadaria(B, P) + corpo(B, P, h) + colunata(B, P, h, 6);
  // 2º andar recuado
  const b2 = { x: B.x + .12, y: B.y + .12, w: B.w - .24, d: B.d - .5 };
  const vidro = P.noite ? '#FFE3A0' : '#5A7590';
  o += box(b2.x, b2.y, z1, b2.w, b2.d, h2, g, { r: granitoEsc(P), t: shade(g, .96) });
  for (let k = 0; k < 4; k++) {
    const xc = b2.x + .35 + k * ((b2.w - .7) / 3), Yb = b2.y + b2.d + .003, zb = z1 + .2, zt = z1 + h2 - .2, r = .14;
    const arco: P3[] = [[xc - r, Yb, zb], [xc + r, Yb, zb], [xc + r, Yb, zt - r]];
    for (let j = 0; j <= 8; j++) { const a = (j / 8) * Math.PI; arco.push([xc + Math.cos(a) * r, Yb, zt - r + Math.sin(a) * r]); }
    o += poly(arco, vidro, ` stroke="${OURO}" stroke-width=".8"`);
  }
  for (let k = 0; k < 3; k++) { const yc = b2.y + .4 + k * ((b2.d - .8) / 2); o += faceX(b2.x + b2.w + .003, yc - .14, yc + .14, z1 + .22, z1 + h2 - .2, shade(vidro, .88), ` stroke="${OURO}" stroke-width=".8"`); }
  o += box(b2.x - .06, b2.y - .06, z1 + h2 - .1, b2.w + .12, b2.d + .12, .1, OURO, { r: shade(OURO, .8) });
  o += frontao({ ...B, x: b2.x, y: b2.y, w: b2.w, d: b2.d }, P, z1 + h2, true);
  // cúpula dourada nos fundos e bandeiras nas pontas
  const cx = B.x + B.w / 2, cy = B.y + .55, zc = z1 + h2 + .1;
  o += cilindro(cx, cy, zc, .32, .42, g) + cupula(cx, cy, zc + .32, .44, OURO);
  const tp = iso(cx, cy, zc + .32 + .44 * 1.13);
  o += `<line x1="${f1(tp[0])}" y1="${f1(tp[1])}" x2="${f1(tp[0])}" y2="${f1(tp[1] - 9)}" stroke="${P.ferro}" stroke-width="1"/><path class="cv-bandeira" d="M${f1(tp[0])},${f1(tp[1] - 9)} l9,1.2 l0,6 l-9,-1.2 Z" fill="${verdeBanco(P)}"/>`;
  // leões de granito nos cantos da escadaria
  for (const x of [B.x + .05, X - .25]) {
    const c = iso(x + .1, Y + .3, ZP + .18);
    o += box(x, Y + .2, 0, .2, .2, ZP + .05, granitoEsc(P)) + `<path d="M${f1(c[0] - 4)},${f1(c[1] + 1)} q0,-5 4,-6 q4,1 4,6 Z" fill="${shade(g, .9)}"/><circle cx="${f1(c[0] + 1)}" cy="${f1(c[1] - 6)}" r="2.4" fill="${shade(g, .88)}"/>`;
  }
  o += caixaEletronico(B, P) + porquinho(X + .2, Y + .5, P);
  return o;
}
