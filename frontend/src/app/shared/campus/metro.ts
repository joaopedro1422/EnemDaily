import { Paleta, iso, f1, shade, box, topo, faceX, faceY, poly, linha3, textoNoPlano, cilindro, cupula, banco, U } from './motor';

// Linha de metrô do outro lado da avenida: trilho moderno de ponta a ponta, estação de vidro no meio
// (alinhada com o portal) e um trem que entra, para na estação e some no fim da linha.

export const FUNDO_METRO = 2.05;
const ESTACAO_X = 13;
const VAGAO = 1.45, ENGATE = .08, VAGOES = 3;

export interface Metro { svg: string; fundo: number; }

function trem(x0: number, yt: number, P: Paleta): string {
  const branco = P.noite ? '#D9DEEE' : '#F7F8FB', faixa = P.caneta, vidro = P.noite ? '#FFE3A0' : '#2B3A6E', y = yt - .3, d = .6, h = .66, z = .14;
  let o = '';
  for (let k = 0; k < VAGOES; k++) {
    const x = x0 + k * (VAGAO + ENGATE), Y = y + d, lider = k === VAGOES - 1;
    o += box(x, y, z, VAGAO, d, h, branco, { r: shade(branco, .84), t: shade(branco, .94) });
    o += faceY(Y + .003, x + .06, x + VAGAO - .06, z + .3, z + .52, vidro) + faceY(Y + .004, x + .02, x + VAGAO - .02, z + .1, z + .18, faixa);
    for (const dx of [.36, 1.0]) o += faceY(Y + .005, x + dx, x + dx + .16, z + .04, z + .54, P.noite ? '#F2C55A' : '#C9CFDC', ` stroke="${shade(branco, .7)}" stroke-width=".5"`);
    if (k > 0) o += box(x - ENGATE, y + .18, z + .12, ENGATE, d - .36, .38, P.ferro);
    if (lider) {
      const X = x + VAGAO;
      o += poly([[X, y, z], [X, y + d, z], [X + .28, y + d, z], [X + .28, y, z]], shade(branco, .8)) +
        poly([[X, y, z + h], [X, y + d, z + h], [X + .28, y + d, z + .3], [X + .28, y, z + .3]], shade(branco, .9)) +
        poly([[X + .28, y, z], [X + .28, y + d, z], [X + .28, y + d, z + .3], [X + .28, y, z + .3]], shade(branco, .78)) +
        poly([[X + .02, y + .08, z + h - .05], [X + .02, y + d - .08, z + h - .05], [X + .25, y + d - .08, z + .35], [X + .25, y + .08, z + .35]], vidro);
      const f = iso(X + .29, y + d - .12, z + .16);
      o += `<circle cx="${f1(f[0])}" cy="${f1(f[1])}" r="1.6" fill="#FFF6C8"/>` + (P.noite ? `<ellipse cx="${f1(f[0] + 22)}" cy="${f1(f[1] + 12)}" rx="26" ry="9" fill="#FFF1B8" opacity=".22"/>` : '');
    }
  }
  return o;
}

export function desenharMetro(xa: number, xb: number, yRua: number, P: Paleta, novo = false, atraso = 0, antigo = false, evoluiu = false): Metro {
  const y0 = yRua + .05, y1 = y0 + FUNDO_METRO, yt = y0 + 1.42;
  const concreto = P.noite ? '#4A5070' : '#D7DBE4', leito = P.noite ? '#3A3F58' : '#9EA3B0', trilho = P.noite ? '#A9B0C8' : '#E3E7EF';
  let o = box(xa, y0, -.9, xb - xa, FUNDO_METRO, .9, shade(P.grama, .96), { l: P.placaL, r: P.placaR }) + topo(xa, y0, xb, y1, .005, P.noite ? '#3F4770' : '#E6E9F0');
  // faixa de pedestres ligando o portal à estação
  for (let x = ESTACAO_X - .55; x < ESTACAO_X + .6; x += .22) o += topo(x, yRua - 1.12, x + .12, yRua - .04, .011, P.noite ? '#C9CEE0' : '#FFFFFF');
  if (antigo) o += estacaoAntiga(xa, xb, y0, yt, P);
  else {
  // plataforma e estação
  const p0 = ESTACAO_X - 2.5, p1 = ESTACAO_X + 2.5, py0 = y0 + .12, py1 = y0 + .98;
  o += box(p0, py0, 0, p1 - p0, py1 - py0, .26, concreto, { t: shade(concreto, 1.04) }) + topo(p0 + .05, py1 - .12, p1 - .05, py1 - .05, .262, '#F2C94C');
  const e0 = ESTACAO_X - .95, e1 = ESTACAO_X + .95, ey0 = py0 + .1, ey1 = py0 + .58, zc = 1.5;
  const vidro = P.noite ? '#FFE3A0' : '#A9D6F5';
  o += box(e0, ey0, .26, e1 - e0, ey1 - ey0, 1.0, P.noite ? '#5D679A' : '#FFFFFF', { l: vidro, r: shade(vidro, .86) });
  for (let x = e0 + .32; x < e1; x += .32) o += linha3([[x, ey1 + .003, .27], [x, ey1 + .003, 1.25]], P.noite ? '#B79A5A' : '#FFFFFF', .8);
  o += faceY(ey1 + .004, ESTACAO_X - .22, ESTACAO_X + .22, .26, .95, P.noite ? '#FFF3C8' : '#3E4C86');
  if (P.noite) { const g = iso(ESTACAO_X, py1, .6); o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="60" ry="16" fill="#FFD66B" opacity=".14"/>`; }
  for (const x of [p0 + .2, ESTACAO_X - 1.3, ESTACAO_X + 1.3, p1 - .26]) o += box(x, py0 + .1, .26, .06, .06, zc - .26, P.ferro);
  o += box(p0 - .15, py0 - .02, zc, p1 - p0 + .3, py1 - py0 + .1, .07, P.noite ? '#C9CEE0' : '#FFFFFF', { r: '#DDE2EC' });
  o += box(p0 - .15, py1 + .07, zc - .02, p1 - p0 + .3, .04, .26, P.caneta) + textoNoPlano(ESTACAO_X, py1 + .112, zc + .11, 'METRÔ', '#FFFFFF', 8.6);
  // totem com o "M"
  const tx = p1 - .15, ty = py1 - .3, t = iso(tx, ty, 2.05);
  o += box(tx - .05, ty - .05, .26, .1, .1, 1.6, P.ferro) + `<rect x="${f1(t[0] - 6)}" y="${f1(t[1] - 6)}" width="12" height="12" rx="2.5" fill="${P.caneta}" stroke="#FFFFFF" stroke-width="1.2"/><text x="${f1(t[0])}" y="${f1(t[1] + 3.6)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF">M</text>`;
  // cerca de vidro do lado da avenida, fora da plataforma
  for (const [a, b] of [[xa + .1, p0 - .1], [p1 + .1, xb - .1]]) {
    if (b - a < .3) continue;
    o += topo(a, y0 + .62, b, y0 + .66, .3, P.noite ? 'rgba(160,190,230,.35)' : 'rgba(150,190,235,.45)');
    for (let x = a; x <= b; x += .9) o += linha3([[x, y0 + .64, 0], [x, y0 + .64, .34]], P.ferro, .7);
    o += linha3([[a, y0 + .64, .34], [b, y0 + .64, .34]], P.ferro, .8);
  }
  // via: leito de concreto, dormentes e trilhos
  o += topo(xa, yt - .44, xb, yt + .44, .012, leito);
  for (let x = xa + .1; x < xb; x += .32) o += linha3([[x, yt - .34, .014], [x, yt + .34, .014]], shade(leito, .8), 1.4);
  for (const dy of [-.2, .2]) o += linha3([[xa, yt + dy, .03], [xb, yt + dy, .03]], trilho, 1.3);
  }
  // trem: entra, para na estação, segue e some no fim da linha
  const L = antigo ? COMPRIMENTO_ANTIGO + .2 : VAGOES * VAGAO + (VAGOES - 1) * ENGATE + .28, xIni = xa + .15, xPara = ESTACAO_X - L / 2, xFim = xb - L - .15;
  const a = iso(0, 0, 0), b = iso(xPara - xIni, 0, 0), c = iso(xFim - xIni, 0, 0);
  o += `<g class="cv-metro" style="--ex:${f1(b[0] - a[0])}px;--ey:${f1(b[1] - a[1])}px;--fx:${f1(c[0] - a[0])}px;--fy:${f1(c[1] - a[1])}px">${antigo ? tremAntigo(xIni, yt, P) : trem(xIni, yt, P)}</g>`;
  o += topo(xa, y1 - .1, xb, y1, .02, P.concreto);
  const svg = novo ? `<g class="cv-peca cv-nova cv-nova-lote" style="animation-delay:${atraso}ms">${o}</g>` : evoluiu ? `<g class="cv-peca cv-nova cv-nova-surge" style="animation-delay:${atraso}ms">${o}</g>` : o;
  return { svg, fundo: FUNDO_METRO + .1 };
}

export function miniaturaMetro(P: Paleta, antigo = false): string {
  const m = desenharMetro(7, 19, 0, P, false, 0, antigo);
  const c = iso(13, 1.3, .8), w = 7.6 * 2 * .866 * U, h = w * .7;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(c[0] - w / 2)} ${f1(c[1] - h / 2)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img">${m.svg}</svg>`;
}

// ───── versão antiga: maria-fumaça, dormentes de madeira e estaçãozinha de tijolos ─────

const VAGAO_ANTIGO = 1.25, LOCO = 1.42;
export const COMPRIMENTO_ANTIGO = 2 * (VAGAO_ANTIGO + .08) + LOCO;

function roda(x: number, y: number, z: number, r: number, cor: string, aro: string): string {
  const c = iso(x, y, z);
  return `<g transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)"><circle r="${r}" fill="${cor}" stroke="${aro}" stroke-width="1"/><circle r="${f1(r * .28)}" fill="${aro}"/></g>`;
}

function tremAntigo(x0: number, yt: number, P: Paleta): string {
  const y = yt - .28, d = .56, Y = y + d, z = .16;
  const mad = P.noite ? '#6E3B2A' : '#9C4A2E', preto = P.noite ? '#23262F' : '#2E3140', janela = P.noite ? '#FFD27A' : '#F2E2B8', ouro = '#C9971A', verm = '#B5303A';
  let o = '';
  for (let k = 0; k < 2; k++) {
    const x = x0 + k * (VAGAO_ANTIGO + .08);
    o += box(x, y, z, VAGAO_ANTIGO, d, .55, mad, { r: shade(mad, .8), t: shade(mad, .9) });
    o += box(x - .05, y - .05, z + .55, VAGAO_ANTIGO + .1, d + .1, .07, preto, { t: shade(preto, 1.3) });
    for (let j = 0; j < 4; j++) o += faceY(Y + .003, x + .1 + j * .28, x + .28 + j * .28, z + .24, z + .44, janela);
    o += faceY(Y + .004, x, x + VAGAO_ANTIGO, z + .06, z + .1, ouro);
    for (const wx of [x + .25, x + VAGAO_ANTIGO - .25]) o += roda(wx, Y + .01, .13, 2.8, preto, '#6B6F80');
    if (k > 0) o += box(x - .08, y + .2, z + .1, .08, .16, .12, preto);
  }
  const xl = x0 + 2 * (VAGAO_ANTIGO + .08);
  o += box(xl - .08, y + .2, z + .1, .08, .16, .12, preto);
  // cabine
  o += box(xl, y, z, .46, d, .72, preto, { r: shade(preto, .8) }) + box(xl - .05, y - .05, z + .72, .56, d + .1, .07, verm);
  o += faceY(Y + .003, xl + .1, xl + .36, z + .36, z + .6, janela);
  // caldeira com cintas douradas, chaminé e domo
  const bx = xl + .46, bw = .96, zb = z + .14;
  o += box(bx, y + .07, zb, bw, d - .14, .42, preto, { r: shade(preto, .78), t: shade(preto, 1.25) });
  for (const cx of [bx + .2, bx + .55, bx + .85]) o += faceY(Y - .07 + .003, cx, cx + .04, zb, zb + .42, ouro);
  o += faceX(bx + bw + .003, y + .1, Y - .1, zb + .02, zb + .4, '#3A3D4C');
  const farol = iso(bx + bw + .004, y + d / 2, zb + .3);
  o += `<circle cx="${f1(farol[0])}" cy="${f1(farol[1])}" r="1.8" fill="#FFF1B8"/>` + (P.noite ? `<ellipse cx="${f1(farol[0] + 22)}" cy="${f1(farol[1] + 12)}" rx="24" ry="8" fill="#FFF1B8" opacity=".2"/>` : '');
  o += cilindro(bx + .78, y + d / 2, zb + .42, .32, .08, preto) + cilindro(bx + .78, y + d / 2, zb + .7, .06, .12, preto);
  o += cupula(bx + .4, y + d / 2, zb + .42, .11, ouro);
  // limpa-trilhos vermelho e rodas
  o += poly([[bx + bw, y + .06, .02], [bx + bw, Y - .06, .02], [bx + bw + .2, y + d / 2, .02], [bx + bw, y + d / 2, zb]], verm);
  for (const wx of [bx + .22, bx + .52, bx + .8]) o += roda(wx, Y + .01, .17, 3.8, verm, preto);
  o += linha3([[bx + .22, Y + .02, .17], [bx + .8, Y + .02, .17]], '#9AA0B0', 1);
  // fumaça
  const ch = iso(bx + .78, y + d / 2, zb + .82);
  [[0, 0, 3, 0], [4, -6, 3.8, .7], [9, -12, 4.6, 1.4]].forEach(([dx, dy, r, a]) => {
    o += `<circle class="cv-fumaca" style="animation-delay:-${a}s" cx="${f1(ch[0] - dx)}" cy="${f1(ch[1] + dy)}" r="${r}" fill="${P.noite ? '#8E97B8' : '#E3E7EF'}"/>`;
  });
  return o;
}

function estacaoAntiga(xa: number, xb: number, y0: number, yt: number, P: Paleta): string {
  const madeira = P.noite ? '#6E553F' : '#B98A5E', tabua = shade(madeira, .82), tijolo = P.noite ? '#7A4538' : '#B8623F', creme = P.noite ? '#CFC6B4' : '#F3E6CC', telha = P.noite ? '#2F5A46' : '#3E7A5C';
  // via antiga: brita, dormentes de madeira e trilhos de ferro
  let o = topo(xa, yt - .46, xb, yt + .46, .01, P.noite ? '#4A453F' : '#A79E90');
  for (let x = xa + .08; x < xb; x += .34) o += topo(x, yt - .38, x + .13, yt + .38, .022, x % 1 > .5 ? tabua : madeira);
  for (const dy of [-.2, .2]) o += linha3([[xa, yt + dy, .04], [xb, yt + dy, .04]], P.noite ? '#6A7090' : '#4A4F60', 1.4);
  // plataforma de tábuas
  const p0 = 13 - 2.3, p1 = 13 + 2.3, py0 = y0 + .12, py1 = y0 + .98;
  o += box(p0, py0, 0, p1 - p0, py1 - py0, .24, madeira, { r: tabua, l: tabua });
  for (let x = p0 + .2; x < p1; x += .2) o += linha3([[x, py0, .242], [x, py1, .242]], tabua, .5);
  o += topo(p0, py1 - .08, p1, py1, .243, creme);
  // estaçãozinha de tijolos com telhado de duas águas
  const e0 = 13 - 1.0, e1 = 13 + 1.0, ey0 = py0 + .08, ey1 = py0 + .62, h = .95, z0 = .24, ym = (ey0 + ey1) / 2, zt = z0 + h;
  o += box(e0, ey0, z0, e1 - e0, ey1 - ey0, h, tijolo, { r: shade(tijolo, .82) });
  for (let z = z0 + .15; z < zt; z += .15) o += linha3([[e0, ey1 + .002, z], [e1, ey1 + .002, z], [e1 + .002, ey0, z]], shade(tijolo, .86), .4);
  for (const wx of [e0 + .35, e1 - .35]) {
    const jan = P.noite ? '#FFD27A' : '#5A6B9A';
    o += faceY(ey1 + .004, wx - .16, wx + .16, z0 + .3, z0 + .72, jan, ` stroke="${creme}" stroke-width="1.4"`);
  }
  o += faceY(ey1 + .004, 13 - .2, 13 + .2, z0, z0 + .78, P.noite ? '#3A2A20' : '#6B4632', ` stroke="${creme}" stroke-width="1.4"`);
  o += poly([[e0 - .1, ey0 - .1, zt], [e1 + .1, ey0 - .1, zt], [e1 + .1, ym, zt + .42], [e0 - .1, ym, zt + .42]], shade(telha, .78));
  o += poly([[e0 - .1, ym, zt + .42], [e1 + .1, ym, zt + .42], [e1 + .1, ey1 + .1, zt], [e0 - .1, ey1 + .1, zt]], telha);
  o += poly([[e1, ey0, zt], [e1, ey1, zt], [e1, ym, zt + .42]], shade(tijolo, .78));
  o += box(e1 - .5, ym - .08, zt + .2, .16, .16, .45, tijolo);
  // cobertura de madeira da plataforma, placa e relógio
  const zc = 1.42;
  for (const x of [p0 + .15, p1 - .21]) o += box(x, py1 - .2, .24, .06, .06, zc - .24, tabua);
  o += box(p0, py1 - .55, zc, e0 - p0 - .1, .6, .06, tabua) + box(e1 + .1, py1 - .55, zc, p1 - e1 - .1, .6, .06, tabua);
  o += faceY(ey1 + .11, 13 - .75, 13 + .75, zt + .02, zt + .24, '#3A2A20', ` stroke="${creme}" stroke-width=".8"`) + textoNoPlano(13, ey1 + .112, zt + .13, 'ESTAÇÃO', creme, 6.4);
  const rel = iso(p1 - .4, py1 - .25, zc - .3);
  o += `<line x1="${f1(rel[0])}" y1="${f1(rel[1] - 7)}" x2="${f1(rel[0])}" y2="${f1(rel[1] - 4)}" stroke="${P.ferro}" stroke-width="1"/><circle cx="${f1(rel[0])}" cy="${f1(rel[1])}" r="4" fill="#FFFFFF" stroke="${P.ferro}" stroke-width="1.2"/><path d="M${f1(rel[0])},${f1(rel[1])} l0,-2.6 M${f1(rel[0])},${f1(rel[1])} l2,.8" stroke="${P.ferro}" stroke-width=".8"/>`;
  o += banco(p0 + .5, py1 - .55, P, 'x');
  // lampião antigo
  const lx = p0 + .3, ly = py0 + .25, l = iso(lx, ly, 1.75);
  o += box(lx - .03, ly - .03, .24, .06, .06, 1.45, P.ferro) + `<rect x="${f1(l[0] - 2.6)}" y="${f1(l[1] - 3)}" width="5.2" height="6" rx="1" fill="${P.noite ? '#FFD66B' : '#F2E2B8'}" stroke="${P.ferro}" stroke-width="1"/>` + (P.noite ? `<circle cx="${f1(l[0])}" cy="${f1(l[1])}" r="14" fill="#FFD66B" opacity=".25"/>` : '');
  // cerca de madeira do lado da avenida
  for (const [a, b] of [[xa + .1, p0 - .1], [p1 + .1, xb - .1]]) {
    if (b - a < .3) continue;
    for (let x = a; x <= b; x += .6) o += box(x - .025, y0 + .62, 0, .05, .05, .36, tabua);
    o += linha3([[a, y0 + .645, .3], [b, y0 + .645, .3]], madeira, 1) + linha3([[a, y0 + .645, .16], [b, y0 + .645, .16]], madeira, 1);
  }
  return o;
}
