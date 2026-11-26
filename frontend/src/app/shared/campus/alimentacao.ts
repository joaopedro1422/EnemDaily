import { Paleta, iso, f1, shade, mix, box, topo, faceY, faceX, poly, linha3, cilindro, arvore, pessoa, caminho, ponteDePedra, U } from './motor';


export const ACERTOS_ABRE_PRACA = 15;
export const ACERTOS_POR_NEGOCIO = 30;
export const LOJA_DO_DEQUE = 6;

type Icone = 'pizza' | 'suco' | 'pastel' | 'bebida' | 'bolo' | 'sorvete' | 'cafe' | 'acai' | 'burger' | 'tapioca';
interface Negocio { nome: string; tipo: 'restaurante' | 'quiosque'; icone: Icone; cor: string; parede: string; }

export const NEGOCIOS: Negocio[] = [
  { nome: 'Pizzaria', tipo: 'restaurante', icone: 'pizza', cor: '#E5484D', parede: '#FFF1E6' },
  { nome: 'Quiosque de sucos', tipo: 'quiosque', icone: 'suco', cor: '#F2994A', parede: '#FFF6E0' },
  { nome: 'Pastelaria', tipo: 'restaurante', icone: 'pastel', cor: '#E8B931', parede: '#FFFAE6' },
  { nome: 'Quiosque de bebidas', tipo: 'quiosque', icone: 'bebida', cor: '#2F80ED', parede: '#EAF3FF' },
  { nome: 'Doceria', tipo: 'restaurante', icone: 'bolo', cor: '#F0508C', parede: '#FFEFF5' },
  { nome: 'Sorveteria', tipo: 'quiosque', icone: 'sorvete', cor: '#8C7BFF', parede: '#F3F0FF' },
  { nome: 'Café', tipo: 'restaurante', icone: 'cafe', cor: '#8B5A3C', parede: '#F6EEE7' },
  { nome: 'Quiosque de açaí', tipo: 'quiosque', icone: 'acai', cor: '#6B2F8A', parede: '#F5EEFA' },
  { nome: 'Hamburgueria', tipo: 'restaurante', icone: 'burger', cor: '#D9534F', parede: '#FFF3EC' },
  { nome: 'Tapiocaria', tipo: 'quiosque', icone: 'tapioca', cor: '#27AE60', parede: '#EEFAF2' }
];

export const negociosAbertos = (acertos: number) =>
  acertos < ACERTOS_ABRE_PRACA ? -1 : Math.min(NEGOCIOS.length, 1 + Math.floor((acertos - ACERTOS_ABRE_PRACA) / ACERTOS_POR_NEGOCIO));

export function proximoNegocio(acertos: number): { nome: string; faltam: number } | null {
  const n = negociosAbertos(acertos);
  if (n < 0) return { nome: 'Praça de alimentação', faltam: ACERTOS_ABRE_PRACA - acertos };
  if (n >= NEGOCIOS.length) return null;
  return { nome: NEGOCIOS[n].nome, faltam: ACERTOS_ABRE_PRACA + n * ACERTOS_POR_NEGOCIO - acertos };
}

function icone(tipo: Icone, cx: number, cy: number, s: number): string {
  const t = (x: number, y: number) => `${f1(cx + x * s)},${f1(cy + y * s)}`;
  switch (tipo) {
    case 'pizza': return `<path d="M${t(-1, -.8)} L${t(1, -.8)} L${t(0, 1)} Z" fill="#F2C94C" stroke="#C9971A" stroke-width=".8"/><path d="M${t(-1, -.8)} L${t(1, -.8)}" stroke="#C9741A" stroke-width="${f1(s * .35)}" stroke-linecap="round"/>` + [[-.3, -.3], [.3, -.25], [0, .25]].map(([x, y]) => `<circle cx="${f1(cx + x * s)}" cy="${f1(cy + y * s)}" r="${f1(s * .17)}" fill="#E5484D"/>`).join('');
    case 'suco': return `<path d="M${t(-.6, -.6)} L${t(.6, -.6)} L${t(.45, 1)} L${t(-.45, 1)} Z" fill="#F2994A" stroke="#FFFFFF" stroke-width=".8"/><path d="M${t(.15, -.6)} L${t(.5, -1.2)}" stroke="#E5484D" stroke-width="1.2"/><circle cx="${f1(cx + .55 * s)}" cy="${f1(cy - .55 * s)}" r="${f1(s * .28)}" fill="#F2C94C"/>`;
    case 'pastel': return `<path d="M${t(-1, .4)} A${f1(s)},${f1(s * .9)} 0 0 1 ${t(1, .4)} Z" fill="#F2C94C" stroke="#C9971A" stroke-width=".8"/>` + [-.6, -.2, .2, .6].map(x => `<line x1="${f1(cx + x * s)}" y1="${f1(cy + .4 * s)}" x2="${f1(cx + x * s)}" y2="${f1(cy + .2 * s)}" stroke="#C9971A" stroke-width=".7"/>`).join('');
    case 'bebida': return `<rect x="${f1(cx - .45 * s)}" y="${f1(cy - .8 * s)}" width="${f1(.9 * s)}" height="${f1(1.8 * s)}" rx="${f1(.25 * s)}" fill="#2F80ED" stroke="#FFFFFF" stroke-width=".8"/><rect x="${f1(cx - .45 * s)}" y="${f1(cy - .1 * s)}" width="${f1(.9 * s)}" height="${f1(.4 * s)}" fill="#FFFFFF"/>`;
    case 'bolo': return `<rect x="${f1(cx - s)}" y="${f1(cy - .1 * s)}" width="${f1(2 * s)}" height="${f1(.9 * s)}" rx="2" fill="#F7B6CC" stroke="#FFFFFF" stroke-width=".8"/><rect x="${f1(cx - .7 * s)}" y="${f1(cy - .75 * s)}" width="${f1(1.4 * s)}" height="${f1(.7 * s)}" rx="2" fill="#FFFFFF"/><circle cx="${f1(cx)}" cy="${f1(cy - 1 * s)}" r="${f1(s * .22)}" fill="#E5484D"/>`;
    case 'sorvete': return `<path d="M${t(-.55, 0)} L${t(.55, 0)} L${t(0, 1.2)} Z" fill="#E0B26A"/><circle cx="${f1(cx)}" cy="${f1(cy - .3 * s)}" r="${f1(s * .6)}" fill="#C7B8FF"/><circle cx="${f1(cx + .2 * s)}" cy="${f1(cy - .75 * s)}" r="${f1(s * .38)}" fill="#F7B6CC"/>`;
    case 'cafe': return `<path d="M${t(-.75, -.3)} L${t(.6, -.3)} L${t(.45, .9)} L${t(-.6, .9)} Z" fill="#FFFFFF" stroke="#8B5A3C" stroke-width=".9"/><path d="M${t(.6, -.05)} q${f1(.45 * s)},0 ${f1(.3 * s)},${f1(.55 * s)}" fill="none" stroke="#8B5A3C" stroke-width=".9"/><path d="M${t(-.2, -.6)} q${f1(.2 * s)},${f1(-.3 * s)} 0,${f1(-.6 * s)} M${t(.2, -.6)} q${f1(.2 * s)},${f1(-.3 * s)} 0,${f1(-.6 * s)}" fill="none" stroke="#B9BDC8" stroke-width=".8"/>`;
    case 'acai': return `<path d="M${t(-1, -.1)} A${f1(s)},${f1(s)} 0 0 0 ${t(1, -.1)} Z" fill="#6B2F8A" stroke="#FFFFFF" stroke-width=".8"/><circle cx="${f1(cx - .3 * s)}" cy="${f1(cy - .3 * s)}" r="${f1(s * .25)}" fill="#F2C94C"/><circle cx="${f1(cx + .3 * s)}" cy="${f1(cy - .35 * s)}" r="${f1(s * .22)}" fill="#E5484D"/>`;
    case 'burger': return `<path d="M${t(-1, -.1)} A${f1(s)},${f1(s * .8)} 0 0 1 ${t(1, -.1)} Z" fill="#E0A25A"/><rect x="${f1(cx - s)}" y="${f1(cy - .05 * s)}" width="${f1(2 * s)}" height="${f1(.3 * s)}" fill="#27AE60"/><rect x="${f1(cx - s)}" y="${f1(cy + .25 * s)}" width="${f1(2 * s)}" height="${f1(.35 * s)}" fill="#6B3A2A"/><rect x="${f1(cx - s)}" y="${f1(cy + .6 * s)}" width="${f1(2 * s)}" height="${f1(.3 * s)}" rx="2" fill="#E0A25A"/>`;
    case 'tapioca': return `<path d="M${t(-1, .5)} A${f1(s)},${f1(s)} 0 0 1 ${t(1, .5)} Z" fill="#FFF7E6" stroke="#E0C08A" stroke-width=".9"/><path d="M${t(-.6, .5)} A${f1(.6 * s)},${f1(.6 * s)} 0 0 1 ${t(.6, .5)}" fill="#F2C94C" opacity=".7"/>`;
  }
}

function selo(x: number, y: number, z: number, n: Negocio, P: Paleta, r = 9): string {
  const c = iso(x, y, z);
  return `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="#FFFFFF" stroke="${n.cor}" stroke-width="2"/>` + icone(n.icone, c[0], c[1], r * .55) +
    (P.noite ? `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r + 5}" fill="${n.cor}" opacity=".18"/>` : '');
}

function letreiro(xc: number, Y: number, z: number, texto: string, cor: string, tam = 6.2): string {
  const c = iso(xc, Y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" fill="${cor}" letter-spacing=".2">${texto}</text>`;
}

function letreiroX(X: number, yc: number, z: number, texto: string, cor: string, tam = 5): string {
  const c = iso(X, yc, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(-30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" fill="${cor}">${texto}</text>`;
}

function placaNoTelhado(xc: number, yc: number, z: number, n: Negocio, P: Paleta, r: number): string {
  const b = iso(xc, yc, z), t = iso(xc, yc, z + .55);
  return `<line x1="${f1(b[0] - 5)}" y1="${f1(b[1])}" x2="${f1(t[0] - 5)}" y2="${f1(t[1])}" stroke="${P.ferro}" stroke-width="1.4"/><line x1="${f1(b[0] + 5)}" y1="${f1(b[1])}" x2="${f1(t[0] + 5)}" y2="${f1(t[1])}" stroke="${P.ferro}" stroke-width="1.4"/>` +
    selo(xc, yc, z + .55 + (r / U) * .9, n, P, r);
}

// Toldo listrado inclinado com sanefa ondulada na ponta.
function toldo(x0: number, x1: number, Y: number, za: number, sai: number, queda: number, cor: string, branco: string, faixas: number): string {
  const sw = (x1 - x0) / faixas, zb = za - queda;
  let o = '';
  for (let k = 0; k < faixas; k++) { const a = x0 + k * sw; o += poly([[a, Y, za], [a + sw, Y, za], [a + sw, Y + sai, zb], [a, Y + sai, zb]], k % 2 ? branco : cor); }
  for (let k = 0; k < faixas; k++) {
    const a = iso(x0 + k * sw, Y + sai, zb), b = iso(x0 + (k + 1) * sw, Y + sai, zb), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 4.2];
    o += `<path d="M${f1(a[0])},${f1(a[1])} Q${f1(m[0])},${f1(m[1])} ${f1(b[0])},${f1(b[1])} Z" fill="${k % 2 ? branco : shade(cor, .9)}"/>`;
  }
  return o;
}

function lampadas(x0: number, x1: number, Y: number, z: number, P: Paleta, passo = .3): string {
  let o = linha3([[x0, Y, z], [x1, Y, z]], P.ferro, .5);
  for (let x = x0 + .1, k = 0; x < x1; x += passo, k++) {
    const c = iso(x, Y, z - .03);
    o += `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${((k * 3) % 7) * .2}s" cx="${f1(c[0])}" cy="${f1(c[1] + 1.4)}" r="${P.noite ? 1.5 : 1.1}" fill="#FFE9A8"/>`;
  }
  return o;
}

function restaurante(x: number, y: number, n: Negocio, P: Paleta): string {
  const w = 3.0, d = 2.2, h1 = 1.4, h2 = 1.0, z0 = .14, X = x + w, Y = y + d, xc = x + w / 2;
  const parede = P.noite ? shade(n.parede, .55) : n.parede, vidro = P.noite ? '#FFE3A0' : '#BFE0F7', cor = n.cor, escura = shade(cor, .74), branco = P.noite ? '#E6E9F5' : '#FFFFFF';
  let o = topo(x - .2, y - .2, X + .3, Y + .3, .005, P.sombra) + box(x - .08, y - .08, 0, w + .16, d + .16, z0, P.concreto);
  o += box(x, y, z0, w, d, h1, parede, { l: parede, r: shade(parede, .86), t: shade(parede, .95) });
  o += faceY(Y + .002, x, X, z0, z0 + .16, escura);
  const v0 = z0 + .16, v1 = z0 + h1 - .46;
  o += faceY(Y + .003, x + .12, X - .12, v0, v1, vidro);
  if (P.noite) { const g = iso(xc, Y, v0 + .3); o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="34" ry="10" fill="#FFD66B" opacity=".2"/>`; }
  for (let k = 0; k <= 6; k++) { const xk = x + .12 + (k * (w - .24)) / 6; o += linha3([[xk, Y + .004, v0], [xk, Y + .004, v1]], cor, k % 3 ? .7 : 1.4); }
  o += linha3([[x + .12, Y + .004, v1], [X - .12, Y + .004, v1]], cor, 1.4);
  o += faceY(Y + .005, xc - .28, xc + .28, v0, z0 + .95, P.noite ? '#FFD27A' : '#4E5F94', ` stroke="${cor}" stroke-width="1.3"`) + linha3([[xc, Y + .006, v0], [xc, Y + .006, z0 + .95]], cor, .9);
  o += faceY(Y + .004, x, X, v1, z0 + h1, cor) + letreiro(xc, Y + .006, (v1 + z0 + h1) / 2, n.nome.toUpperCase(), '#FFFFFF', n.nome.length > 9 ? 5.6 : 6.6);
  o += toldo(x + .06, X - .06, Y, v1 - .02, .62, .3, cor, branco, 8);
  // lateral: vitrine e lousa com o cardápio
  o += faceX(X + .003, y + .22, y + d * .52, v0 + .1, v1, vidro, ` stroke="${cor}" stroke-width="1"`);
  o += faceX(X + .004, y + d * .6, Y - .22, z0 + .25, z0 + 1.0, '#2C3247', ` stroke="${P.madeira}" stroke-width="1.2"`);
  for (const z of [.5, .65, .8]) o += linha3([[X + .005, y + d * .64, z0 + z], [X + .005, Y - .3, z0 + z]], '#FFFFFF', .6, ' opacity=".75"');
  // 2º andar com floreiras
  const z2 = z0 + h1, Y2 = Y - .1;
  o += box(x + .1, y + .1, z2, w - .2, d - .2, h2, shade(parede, .97), { l: shade(parede, .97), r: shade(parede, .84), t: shade(parede, .93) });
  for (let k = 0; k < 3; k++) {
    const wx = x + .5 + k * ((w - 1) / 2);
    o += faceY(Y2 + .003, wx - .26, wx + .26, z2 + .3, z2 + .78, vidro, ` stroke="${escura}" stroke-width=".8"`) + linha3([[wx, Y2 + .004, z2 + .3], [wx, Y2 + .004, z2 + .78]], escura, .6);
    o += box(wx - .3, Y2, z2 + .2, .6, .14, .1, P.madeira);
    [-.2, -.05, .1, .22].forEach((dx, i) => { const c = iso(wx + dx, Y2 + .08, z2 + .33); o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="1.6" fill="${i % 2 ? '#F4A6C0' : P.arvoreLuz}"/>`; });
  }
  o += faceX(X - .1 + .003, y + .55, Y - .55, z2 + .3, z2 + .78, vidro);
  // telhado com platibanda e equipamentos
  const zt = z2 + h2;
  o += box(x + .05, y + .05, zt, w - .1, d - .1, .16, cor, { t: shade(P.telhado, .95), r: escura });
  o += box(x + .4, y + .3, zt + .16, .5, .45, .3, P.concreto) + box(x + .5, y + .4, zt + .46, .3, .25, .06, shade(P.concreto, .85));
  o += lampadas(x + .05, X - .05, Y + .01, z0 + h1 + .02, P);
  return o + placaNoTelhado(xc + .4, y + d / 2, zt + .16, n, P, 12);
}

function quiosque(x: number, y: number, n: Negocio, P: Paleta): string {
  const w = 1.9, d = 1.6, h = 1.15, X = x + w, Y = y + d, xc = x + w / 2, yc = y + d / 2;
  const parede = P.noite ? shade(n.parede, .55) : n.parede, cor = n.cor, branco = P.noite ? '#E6E9F5' : '#FFFFFF';
  let o = topo(x - .15, y - .15, X + .25, Y + .25, .005, P.sombra) + box(x - .05, y - .05, 0, w + .1, d + .1, .08, P.concreto);
  o += box(x, y, .08, w, d, .52, cor, { r: shade(cor, .8) }) + box(x, y, .6, w, d, h - .52, parede, { r: shade(parede, .86) });
  const fundo = P.noite ? '#FFE3A0' : '#2C3247';
  o += faceY(Y + .003, x + .14, X - .14, .66, h - .04, fundo);
  const itens = ['#E5484D', '#F2C14E', '#4FB7E8', '#36B37D', '#F0508C', '#FFFFFF'];
  for (let k = 0; k < 6; k++) { const a = x + .26 + k * .25; o += faceY(Y + .004, a, a + .14, .66, .82, itens[(k + n.nome.length) % 6]); }
  o += box(x - .06, Y - .02, .58, w + .12, .34, .06, P.madeira);
  o += toldo(x + .04, X - .04, Y, h + .02, .45, .22, cor, branco, 6);
  o += faceX(X + .003, y + .25, Y - .3, .7, h - .08, '#2C3247', ` stroke="${P.madeira}" stroke-width="1"`) + [.85, .95, 1.05].map(z => linha3([[X + .004, y + .4, z - .05], [X + .004, Y - .45, z - .05]], '#FFFFFF', .6, ' opacity=".75"')).join('');
  for (const k of [.4, .95, 1.5]) o += box(x + k - .03, Y + .5, 0, .06, .06, .42, P.ferro) + cilindro(x + k, Y + .5, .42, .05, .13, cor);
  // telhado de quatro águas
  const zb = h + .08, za = zb + .62, m = .14;
  o += box(x - m, y - m, h, w + 2 * m, d + 2 * m, .08, branco, { r: shade(branco, .86) });
  const A: [number, number, number] = [xc, yc, za];
  o += poly([[x - m, y - m, zb], [X + m, y - m, zb], A], shade(cor, .7)) + poly([[x - m, y - m, zb], [x - m, Y + m, zb], A], shade(cor, .74));
  o += poly([[x - m, Y + m, zb], [X + m, Y + m, zb], A], cor) + poly([[X + m, y - m, zb], [X + m, Y + m, zb], A], shade(cor, .82));
  o += linha3([[x - m, Y + m, zb], A, [X + m, Y + m, zb]], shade(cor, 1.2), .8);
  o += letreiroX(X + .004, yc, .3, n.nome.replace('Quiosque de ', '').toUpperCase(), '#FFFFFF', 4.6);
  return o + placaNoTelhado(xc, yc, za - .05, n, P, 9.5);
}

// Mesa redonda com quatro cadeiras na cor da loja; guarda-sol só nas mesas do fundo.
function mesa(x: number, y: number, cor: string, P: Paleta, guardaSol: boolean): string {
  const cadeira = (cx: number, cy: number, lado: 'x' | 'y' | 'X' | 'Y') => {
    let s = box(cx - .1, cy - .1, 0, .2, .2, .24, cor, { r: shade(cor, .78), t: shade(cor, 1.08) });
    if (lado === 'Y') s += box(cx - .1, cy + .07, .24, .2, .04, .24, shade(cor, .9));
    if (lado === 'y') s += box(cx - .1, cy - .11, .24, .2, .04, .24, shade(cor, .9));
    if (lado === 'X') s += box(cx + .07, cy - .1, .24, .04, .2, .24, shade(cor, .82));
    if (lado === 'x') s += box(cx - .11, cy - .1, .24, .04, .2, .24, shade(cor, .82));
    return s;
  };
  const r = .44, branco = P.noite ? '#E6E9F5' : '#FFFFFF';
  let o = `<ellipse cx="${f1(iso(x, y, 0)[0] + 2)}" cy="${f1(iso(x, y, 0)[1] + 1)}" rx="15" ry="7" fill="${P.sombra}"/>`;
  o += cadeira(x, y - r, 'y') + cadeira(x - r, y, 'x');
  o += box(x - .03, y - .03, 0, .06, .06, .42, P.ferro) + cilindro(x, y, .42, .04, .3, branco);
  o += cadeira(x + r, y, 'X') + cadeira(x, y + r, 'Y');
  if (guardaSol) {
    const ap: [number, number, number] = [x, y, 1.52], R = .62, pts: [number, number, number][] = [];
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R, 1.28]); }
    o += box(x - .02, y - .02, .46, .04, .04, 1.06, P.ferro);
    const tri = pts.map((p, k) => ({ k, p, q: pts[(k + 1) % 8] })).sort((a, b) => (a.p[0] + a.p[1] + a.q[0] + a.q[1]) - (b.p[0] + b.p[1] + b.q[0] + b.q[1]));
    for (const t of tri) o += poly([ap, t.p, t.q], t.k % 2 ? branco : cor);
    const c = iso(x, y, 1.56);
    o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="1.4" fill="${shade(cor, .7)}"/>`;
  }
  return o;
}

function floreira(x: number, y: number, P: Paleta, w = .9): string {
  let o = box(x - w / 2, y - .16, 0, w, .32, .3, P.noite ? '#5E4A3A' : '#B98A5E', { t: P.terra });
  for (let k = 0; k < 4; k++) {
    const c = iso(x - w / 2 + .15 + (k * (w - .3)) / 3, y, .42);
    o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="4.2" fill="${k % 2 ? P.arvore : P.arvoreLuz}"/><circle cx="${f1(c[0] + 1.5)}" cy="${f1(c[1] - 2)}" r="1.3" fill="${['#F4A6C0', '#F2C14E', '#FFFFFF', '#C77DFF'][k]}"/>`;
  }
  return o;
}

function varalDeLuzes(xa: number, xb: number, y: number, P: Paleta): string {
  let o = '';
  const postes: number[] = [];
  for (let x = xa + .5; x <= xb - .4; x += 4) postes.push(x);
  postes.forEach(x => (o += box(x - .03, y - .03, 0, .06, .06, 1.9, P.ferro)));
  for (let i = 0; i < postes.length - 1; i++) {
    const a = iso(postes[i], y, 1.85), b = iso(postes[i + 1], y, 1.85), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 7;
    o += `<path d="M${f1(a[0])},${f1(a[1])} Q${f1(mx)},${f1(my)} ${f1(b[0])},${f1(b[1])}" fill="none" stroke="${P.ferro}" stroke-width=".6"/>`;
    for (let k = 1; k < 6; k++) {
      const t = k / 6, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mx + t * t * b[0], yy = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * my + t * t * b[1];
      o += `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${(k * .4).toFixed(1)}s" cx="${f1(x)}" cy="${f1(yy + 1.5)}" r="${P.noite ? 1.7 : 1.2}" fill="${['#FFE9A8', '#F0506E', '#4FA3FF', '#F2C94C'][k % 4]}"/>`;
    }
  }
  return o;
}

export interface Praca { svg: string; y0: number; x0: number; x1: number; }

export function desenharPraca(x0: number, x1: number, yCampus: number, acertos: number, P: Paleta, acertosAntes: number | null = null, atraso = 0): Praca | null {
  const abertos = negociosAbertos(acertos);
  if (abertos < 0) return null;
  const antes = acertosAntes === null ? abertos : negociosAbertos(acertosAntes);
  const RIO = 1.4, PROF = 7.6, xc = 13;
  const ya1 = yCampus - RIO, ya0 = ya1 - PROF;
  const yp0 = ya0 + 3.35, yp1 = ya0 + 4.05, yd0 = ya0 + 4.15, yd1 = ya0 + 6.8, fila1 = yd0 + .75, fila2 = yd0 + 1.95;
  const largura = (n: Negocio) => (n.tipo === 'restaurante' ? 3.0 : 1.9);
  let dir = xc + 1.3, esq = xc - 1.3;
  const pos = NEGOCIOS.map((n, i) => {
    const w = largura(n);
    if (i % 2 === 0) { const x = dir; dir += w + .8; return x; }
    esq -= w; const x = esq; esq -= .8; return x;
  });
  const usados = Array.from({ length: abertos }, (_, i) => i);
  const xmin = Math.min(x0, xc - 4, ...usados.map(i => pos[i] - .6)), xmax = Math.max(x1, xc + 4, ...usados.map(i => pos[i] + largura(NEGOCIOS[i]) + .6));
  const abriuAgora = acertosAntes !== null && antes < 0;
  const anim = (svg: string, nova: boolean, tipo = 'cresce', extra = 0) => (nova ? `<g class="cv-peca cv-nova cv-nova-${tipo}" style="animation-delay:${atraso + (abriuAgora ? 750 + extra : 0)}ms">${svg}</g>` : svg);

  // chão: gramado, calçadão de ladrilhos, deque de madeira e o corredor que vem da ponte
  let o = box(xmin, ya0, -.9, xmax - xmin, PROF, .9, P.grama, { l: P.placaL, r: P.placaR });
  o += topo(xmin + .2, yp0, xmax - .2, yp1, .012, P.praca);
  for (let x = xmin + .4; x < xmax - .4; x += .7) o += topo(x, yp0 + .05, x + .35, yp1 - .05, .013, mix(P.praca, '#E5484D', P.noite ? .14 : .09));
  o += topo(xmin + .2, yp1, xmax - .2, yp1 + .05, .014, P.caminho2);
  // o deque de madeira só chega com a 5ª loja; antes disso as mesas ficam no gramado
  if (abertos >= LOJA_DO_DEQUE) {
    const madeira = P.noite ? '#6E553F' : '#D9B48A';
    let deque = topo(xmin + .3, yd0, xmax - .3, yd1, .012, madeira) + topo(xmin + .3, yd1 - .06, xmax - .3, yd1, .013, shade(madeira, .78));
    for (let y = yd0 + .22; y < yd1 - .1; y += .22) deque += linha3([[xmin + .3, y, .013], [xmax - .3, y, .013]], shade(madeira, .88), .5);
    if (P.noite) { const g = iso(xc, (yd0 + yd1) / 2, 0); deque += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="${f1((xmax - xmin) * U * .45)}" ry="40" fill="#FFD66B" opacity=".08"/>`; }
    o += anim(deque, acertosAntes !== null && antes < LOJA_DO_DEQUE, 'surge', 200);
  }
  o += topo(xc - .5, yd0, xc + .5, yd1, .015, P.noite ? '#4A5378' : '#E9E6DE') + caminho(xc - .5, yd1, xc + .5, ya1, P);

  // lojas, mesas e floreiras em ordem de profundidade
  const itens: { k: number; svg: string }[] = [];
  usados.forEach(i => {
    const n = NEGOCIOS[i], x = pos[i], w = largura(n), nova = acertosAntes !== null && i >= antes, cx = x + w / 2;
    const y = n.tipo === 'restaurante' ? ya0 + .45 : ya0 + .95;
    itens.push({ k: x + y, svg: anim(n.tipo === 'restaurante' ? restaurante(x, y, n, P) : quiosque(x, y, n, P), nova, 'cresce', i * 320) });
    const dx = n.tipo === 'restaurante' ? .62 : .45;
    itens.push({ k: cx - dx + fila1, svg: anim(mesa(cx - dx, fila1, n.cor, P, true), nova, 'brota', 260 + i * 320) });
    itens.push({ k: cx + dx + fila2, svg: anim(mesa(cx + dx, fila2, n.cor, P, false), nova, 'brota', 320 + i * 320) });
    itens.push({ k: x - .4 + yd1 - .5, svg: anim(floreira(x - .4, yd1 - .45, P, .6), nova, 'brota', 380 + i * 320) });
  });
  itens.push({ k: xc - .9 + yd0 + .4, svg: floreira(xc - .85, yd0 + .4, P, .5) }, { k: xc + .9 + yd0 + .4, svg: floreira(xc + .85, yd0 + .4, P, .5) });
  itens.sort((a, b) => a.k - b.k);
  let corpo = itens.map(i => i.svg).join('');
  corpo += varalDeLuzes(xmin, xmax, yd1 + .05, P);
  if (abertos > 0) corpo += pessoa(xc - 2.4, (yp0 + yp1) / 2, P, P.lc, 1) + (abertos > 3 ? pessoa(xc + 3.2, (yp0 + yp1) / 2 + .1, P, P.cn, 2) : '');
  for (let x = xmin + .5; x < xmax; x += 3.5) if (Math.abs(x - xc) > 1.2) corpo += arvore(x, ya1 - .35, P, .6, 'redonda');
  const agua = topo(xmin, ya1 + .1, xmax, yCampus - .1, -.25, P.agua) + [0, 1, 2].map(i => topo(xmin + 1 + i * 6, ya1 + .35, xmin + 2.6 + i * 6, ya1 + .55, -.24, P.aguaLuz, ' class="cv-agua"')).join('');
  const ponte = P.decorado ? ponteDePedra(ya1 - .15, yCampus + .15, xc, .95, 'y', P) : box(xc - .4, ya1 - .1, 0, .8, RIO + .2, .1, P.madeira) + linha3([[xc - .38, ya1 - .1, .45], [xc - .38, yCampus + .1, .45]], shade(P.madeira, .7), 1.6) + linha3([[xc + .38, ya1 - .1, .45], [xc + .38, yCampus + .1, .45]], shade(P.madeira, .7), 1.6);
  let svg = o + corpo + agua + ponte;
  if (abriuAgora) svg = `<g class="cv-peca cv-nova cv-nova-lote" style="animation-delay:${atraso}ms">${svg}</g>`;
  return { svg, y0: ya0 - 1.5, x0: xmin, x1: xmax };
}

export function miniaturaPraca(P: Paleta, acertos = 180): string {
  const pr = desenharPraca(6, 20, 8, acertos, P)!;
  const c = iso(13, 2.4, 1.4), w = 15 * 2 * .866 * U, h = w * .62;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(c[0] - w / 2)} ${f1(c[1] - h / 2)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img">${pr.svg}</svg>`;
}
