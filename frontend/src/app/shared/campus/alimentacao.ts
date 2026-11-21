import { Paleta, iso, f1, shade, mix, box, topo, faceY, faceX, linha3, arvore, pessoa, caminho, U } from './motor';


export const ACERTOS_ABRE_PRACA = 30;
export const ACERTOS_POR_NEGOCIO = 30;

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

function mesas(x: number, y: number, cor: string, P: Paleta): string {
  let o = '';
  for (const [dx, dy] of [[0, 0], [1.1, .15]] as [number, number][]) {
    const mx = x + dx, my = y + dy, t = iso(mx, my, 1.0);
    o += box(mx - .02, my - .02, 0, .04, .04, 1.0, P.ferro) + box(mx - .28, my - .28, .4, .56, .56, .05, P.branco) +
      box(mx - .5, my - .05, 0, .14, .14, .26, shade(cor, .85)) + box(mx + .36, my - .05, 0, .14, .14, .26, shade(cor, .85)) +
      `<path d="M${f1(t[0] - 15)},${f1(t[1] + 6)} Q${f1(t[0])},${f1(t[1] - 8)} ${f1(t[0] + 15)},${f1(t[1] + 6)} Z" fill="${cor}"/>` +
      `<path d="M${f1(t[0] - 5)},${f1(t[1] + 6)} Q${f1(t[0])},${f1(t[1] - 8)} ${f1(t[0] + 5)},${f1(t[1] + 6)} Z" fill="#FFFFFF" opacity=".85"/>`;
  }
  return o;
}

function letreiro(xc: number, Y: number, z: number, texto: string, cor: string, tam = 6.2): string {
  const c = iso(xc, Y, z);
  return `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="${f1(tam * .36)}" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="${tam}" font-weight="800" fill="${cor}" letter-spacing=".2">${texto}</text>`;
}

function placaNoTelhado(xc: number, yc: number, z: number, n: Negocio, P: Paleta, r: number): string {
  const b = iso(xc, yc, z), t = iso(xc, yc, z + .55);
  return `<line x1="${f1(b[0] - 5)}" y1="${f1(b[1])}" x2="${f1(t[0] - 5)}" y2="${f1(t[1])}" stroke="${P.ferro}" stroke-width="1.4"/><line x1="${f1(b[0] + 5)}" y1="${f1(b[1])}" x2="${f1(t[0] + 5)}" y2="${f1(t[1])}" stroke="${P.ferro}" stroke-width="1.4"/>` +
    selo(xc, yc, z + .55 + (r / U) * .9, n, P, r);
}

function restaurante(x: number, y: number, n: Negocio, P: Paleta): string {
  const w = 3.0, d = 2.1, h1 = 1.3, h2 = .95, z0 = .14, X = x + w, Y = y + d, xc = x + w / 2;
  const parede = P.noite ? shade(n.parede, .55) : n.parede, vidro = P.noite ? P.janela : '#A9D1F5';
  let o = topo(x - .2, y - .2, X + .25, Y + .25, .005, P.sombra) + box(x - .08, y - .08, 0, w + .16, d + .16, z0, P.concreto);
  o += box(x, y, z0, w, d, h1, parede, { l: parede, r: shade(parede, .86), t: shade(parede, .95) });
  o += faceY(Y + .003, x + .15, X - .15, z0 + .12, z0 + h1 - .32, vidro, ` stroke="${P.moldura}" stroke-width=".9"`);
  for (let k = 1; k < 5; k++) { const xk = x + .15 + (k * (w - .3)) / 5; o += linha3([[xk, Y + .004, z0 + .12], [xk, Y + .004, z0 + h1 - .32]], P.moldura, .8); }
  o += faceY(Y + .005, xc - .32, xc + .32, z0, z0 + .86, P.porta) + faceY(Y + .006, xc - .02, xc + .02, z0, z0 + .86, P.moldura);
  o += faceY(Y + .004, x, X, z0 + h1 - .3, z0 + h1, n.cor) + letreiro(xc, Y + .006, z0 + h1 - .15, n.nome, '#FFFFFF');
  for (let i = 0; i < 8; i++) o += box(x + (i * w) / 8, Y, z0 + h1 - .34, w / 8, .55, .06, i % 2 ? '#FFFFFF' : n.cor);
  o += faceX(X + .003, y + .3, Y - .3, z0 + .3, z0 + h1 - .35, vidro, ` stroke="${P.moldura}" stroke-width=".8"`);
  const z2 = z0 + h1;
  o += box(x + .1, y + .1, z2, w - .2, d - .2, h2, shade(parede, .97), { l: shade(parede, .97), r: shade(parede, .84), t: shade(parede, .93) });
  for (let k = 0; k < 3; k++) { const wx = x + .45 + k * ((w - .9) / 2); o += faceY(Y - .1 + .003, wx - .28, wx + .28, z2 + .25, z2 + .7, vidro) + box(wx - .32, Y - .1, z2 + .2, .64, .14, .05, n.cor); }
  o += faceX(X - .1 + .003, y + .5, Y - .5, z2 + .25, z2 + .7, vidro);
  const zt = z2 + h2;
  o += box(x + .05, y + .05, zt, w - .1, d - .1, .14, n.cor) + box(x + .45, y + .3, zt + .14, .5, .45, .3, P.concreto) + box(x + .55, y + .4, zt + .44, .3, .25, .06, shade(P.concreto, .85));
  return o + placaNoTelhado(xc + .4, y + d / 2, zt + .14, n, P, 12);
}

function quiosque(x: number, y: number, n: Negocio, P: Paleta): string {
  const w = 1.9, d = 1.5, h = 1.05, X = x + w, Y = y + d, xc = x + w / 2;
  const parede = P.noite ? shade(n.parede, .55) : n.parede;
  let o = topo(x - .15, y - .15, X + .2, Y + .2, .005, P.sombra) + box(x - .05, y - .05, 0, w + .1, d + .1, .08, P.concreto);
  o += box(x, y, .08, w, d, .5, n.cor) + box(x, y, .58, w, d, h - .5, parede);
  o += faceY(Y + .003, x + .14, X - .14, .64, h + .02, P.noite ? '#FFE9A8' : '#2C3247', ' fill-opacity=".9"');
  o += box(x - .06, Y - .02, .56, w + .12, .3, .06, P.madeira);
  for (const k of [.35, .95, 1.55]) o += box(x + k - .07, Y + .45, 0, .14, .14, .42, P.ferro) + box(x + k - .12, Y + .4, .42, .24, .24, .05, n.cor);
  o += faceX(X + .003, y + .25, Y - .25, .7, h, '#20263A') + [.84, .92, 1.0].map(zl => linha3([[X + .005, y + .4, zl], [X + .005, Y - .4, zl]], '#FFFFFF', .6, ' opacity=".7"')).join('');
  const zt = h + .08;
  for (let i = 0; i < 6; i++) o += box(x - .15 + (i * (w + .3)) / 6, y - .15, zt, (w + .3) / 6, d + .5, .1, i % 2 ? '#FFFFFF' : n.cor);
  o += faceY(Y + .36, x - .15, X + .15, zt - .12, zt, shade(n.cor, .8));
  o += letreiro(xc, Y + .37, zt - .06, n.nome.replace('Quiosque de ', ''), '#FFFFFF', 4.6);
  return o + placaNoTelhado(xc, y + d / 2, zt + .1, n, P, 9.5);
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
  const RIO = 1.4, PROF = 7.2, xc = 13;
  const ya1 = yCampus - RIO, ya0 = ya1 - PROF, ym = ya0 + 3.4;
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

  let o = box(xmin, ya0, -.9, xmax - xmin, PROF, .9, P.grama, { l: P.placaL, r: P.placaR });
  o += topo(xmin + .2, ym - .6, xmax - .2, ym + .6, .012, P.praca);
  for (let x = xmin + .6; x < xmax - .4; x += 1.2) o += topo(x, ym - .6, x + .6, ym + .6, .013, mix(P.praca, '#E5484D', P.noite ? .14 : .08));
  o += topo(xmin + .2, ym - .66, xmax - .2, ym - .6, .014, P.caminho2) + topo(xmin + .2, ym + .6, xmax - .2, ym + .66, .014, P.caminho2);
  o += caminho(xc - .5, ym + .66, xc + .5, ya1, P);

  let corpo = '';
  usados.forEach(i => {
    const n = NEGOCIOS[i], x = pos[i], w = largura(n), nova = acertosAntes !== null && i >= antes;
    const y = n.tipo === 'restaurante' ? ya0 + .6 : ya0 + 1.2, frente = n.tipo === 'restaurante' ? y + 2.1 : y + 1.5;
    const svg = caminho(x + w / 2 - .35, frente, x + w / 2 + .35, ym - .66, P) + (n.tipo === 'restaurante' ? restaurante(x, y, n, P) : quiosque(x, y, n, P));
    corpo += anim(svg, nova, 'cresce', i * 320);
  });
  corpo += varalDeLuzes(xmin, xmax, ym - .85, P);
  usados.forEach(i => {
    const n = NEGOCIOS[i], nova = acertosAntes !== null && i >= antes;
    corpo += anim(mesas(pos[i] + largura(n) / 2 - .55, ym + 1.35, n.cor, P), nova, 'brota', 260 + i * 320);
  });
  if (abertos > 0) corpo += pessoa(xc - 2.5, ym, P, P.lc, 1, [5, 0, 9, 0]) + pessoa(xc + 2.5, ym + .2, P, P.cn, 2, [-5, 0, 10, 3]) + (abertos > 3 ? pessoa(xc + 6, ym - .2, P, P.mt, 3, [-4, 0, 8, 1]) + pessoa(xc - 6, ym + .3, P, P.ch, 0, [4, 0, 9, 2]) : '');
  for (let x = xmin + .5; x < xmax; x += 5) corpo += arvore(x, ya1 - .45, P, .6, 'redonda');
  const agua = topo(xmin, ya1 + .1, xmax, yCampus - .1, -.25, P.agua) + [0, 1, 2].map(i => topo(xmin + 1 + i * 6, ya1 + .35, xmin + 2.6 + i * 6, ya1 + .55, -.24, P.aguaLuz, ' class="cv-agua"')).join('');
  const ponte = box(xc - .4, ya1 - .1, 0, .8, RIO + .2, .1, P.madeira) + linha3([[xc - .38, ya1 - .1, .45], [xc - .38, yCampus + .1, .45]], shade(P.madeira, .7), 1.6) + linha3([[xc + .38, ya1 - .1, .45], [xc + .38, yCampus + .1, .45]], shade(P.madeira, .7), 1.6);
  let svg = o + corpo + agua + ponte;
  if (abriuAgora) svg = `<g class="cv-peca cv-nova cv-nova-lote" style="animation-delay:${atraso}ms">${svg}</g>`;
  return { svg, y0: ya0 - 1.5, x0: xmin, x1: xmax };
}

export function miniaturaPraca(P: Paleta, acertos = 180): string {
  const pr = desenharPraca(6, 20, 8, acertos, P)!;
  const c = iso(13, 2.4, 1.4), w = 15 * 2 * .866 * U, h = w * .62;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(c[0] - w / 2)} ${f1(c[1] - h / 2)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img">${pr.svg}</svg>`;
}
