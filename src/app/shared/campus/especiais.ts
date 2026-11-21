import {
  Paleta, Predio, P3, iso, f1, shade, mix, box, topo, faceY, poly, linha3, cilindro, elipseChao, cupula, sombraChao,
  andar, fundacao, fachadaVidro, telhado, entrada, entradaLateral, faceX, arvore, banco, poste, canteiro, caminho, U, textoNoPlano
} from './motor';
import { Peca, TRILHAS } from './pecas';
import { miniaturaPraca } from './alimentacao';

/** Dados de fora das trilhas que liberam marcos: total de acertos, simulados e redações registrados. */
export interface ExtrasCampus { acertos?: number; simulados?: number; redacoes?: number; maiorSequencia?: number; diasAtivos?: number; xp?: number; }

export type ChaveMarco = 'praca' | 'reitoria' | 'fonte' | 'portal' | 'campo' | 'quadras' | 'piscina' | 'hospital' | 'alimentacao';
export type Metrica = 'acertos' | 'simulados' | 'redacoes' | 'estudos' | 'sequencia' | 'dias' | 'xp';

export interface Marco {
  chave: ChaveMarco;
  grupo: 'campus' | 'distrito';
  nome: string;
  descricao: string;
  metrica: Metrica;
  meta: number;
  icone: string;
}

export const MARCOS: Marco[] = [
  { chave: 'praca', grupo: 'campus', nome: 'Praça das 4 cores', descricao: 'O piso da praça central vira um mosaico com as cores das quatro áreas.', metrica: 'acertos', meta: 20, icone: 'target' },
  { chave: 'reitoria', grupo: 'campus', nome: 'Reitoria Dourada', descricao: 'Pilastras, frisos e cúpula dourados no prédio principal.', metrica: 'acertos', meta: 100, icone: 'crown' },
  { chave: 'fonte', grupo: 'campus', nome: 'Fonte de Mármore', descricao: 'Borda de mármore, aro de ouro e luzes nas cores das áreas.', metrica: 'acertos', meta: 200, icone: 'sparkles' },
  { chave: 'portal', grupo: 'campus', nome: 'Portal Monumental', descricao: 'A entrada da universidade vira um portal de mármore com letreiro iluminado, lâmpadas e lanternas.', metrica: 'xp', meta: 4000, icone: 'crown' },
  { chave: 'campo', grupo: 'distrito', nome: 'Campo de futebol', descricao: 'Abre a área de lazer do outro lado do rio: ponte, campo, arquibancada e árvores.', metrica: 'dias', meta: 30, icone: 'calendar-check' },
  { chave: 'quadras', grupo: 'distrito', nome: 'Quadras esportivas', descricao: 'Uma quadra de basquete e uma de vôlei, ao lado do campo.', metrica: 'dias', meta: 50, icone: 'calendar-check' },
  { chave: 'piscina', grupo: 'distrito', nome: 'Piscina do clube', descricao: 'Piscina com raias, deck, espreguiçadeiras e guarda-sóis.', metrica: 'dias', meta: 70, icone: 'calendar-check' },
  { chave: 'hospital', grupo: 'distrito', nome: 'Hospital Universitário', descricao: 'O desafio final: um hospital de 4 andares com heliponto, em um terreno novo do outro lado do campus.', metrica: 'dias', meta: 100, icone: 'shield' },
  { chave: 'alimentacao', grupo: 'distrito', nome: 'Praça de alimentação', descricao: 'Nos fundos do campus: abre com 30 acertos já com a pizzaria e ganha um negócio novo a cada 30 acertos, até 300.', metrica: 'acertos', meta: 30, icone: 'sparkles' },
];

export const ROTULO_METRICA: Record<Metrica, string> = { acertos: 'acertos', simulados: 'simulados', redacoes: 'redações', estudos: 'simulados ou redações', sequencia: 'dias seguidos', dias: 'dias ativos', xp: 'XP' };

export function valorMetrica(e: ExtrasCampus | null | undefined, m: Metrica): number {
  if (!e) return 0;
  if (m === 'estudos') return (e.simulados ?? 0) + (e.redacoes ?? 0);
  if (m === 'sequencia') return e.maiorSequencia ?? 0;
  if (m === 'dias') return e.diasAtivos ?? 0;
  return e[m] ?? 0;
}

export function marcosAtingidos(e: ExtrasCampus | null | undefined): Set<ChaveMarco> {
  return new Set(MARCOS.filter(m => valorMetrica(e, m.metrica) >= m.meta).map(m => m.chave));
}

const OURO = '#E8B931';
const OURO_ESC = '#B5871A';
const MARMORE = '#F3F0E8';
const AREAS = (P: Paleta) => [P.lc, P.ch, P.cn, P.mt];

// ---------------------------------------------------------------- upgrades de visual

const RC: Predio = { x: 10.7, y: 6.3, w: 4.6, d: 3, z0: .25, h: 1.3 };

function frisoDourado(b: Predio, i: number, P: Paleta): string {
  const z = b.z0 + i * b.h, X = b.x + b.w, Y = b.y + b.d;
  let o = box(b.x - .04, b.y - .04, z + b.h - .08, b.w + .08, b.d + .08, .08, OURO);
  for (const [x, y] of [[b.x - .05, Y - .07], [X - .07, Y - .07], [X - .07, b.y - .05]] as [number, number][]) o += box(x, y, z, .12, .12, b.h, i === 0 ? MARMORE : shade(MARMORE, .98));
  for (let k = 1; k < 4; k++) o += box(b.x + (b.w * k) / 4 - .04, Y - .02, z, .08, .06, b.h, OURO);
  return o + (P.noite ? '' : '');
}

function telhadoReal(P: Paleta): string {
  const b = RC, z = b.z0 + 4 * b.h, Y = b.y + b.d, xc = b.x + b.w / 2;
  let o = telhado(b, 4, P, OURO, false);
  o += poly([[b.x + .6, Y + .06, z + .22], [b.x + b.w - .6, Y + .06, z + .22], [xc, Y + .06, z + .95]], MARMORE, ` stroke="${OURO}" stroke-width="1.4"`);
  o += cilindro(xc, b.y + b.d / 2, z + .22, .35, .62, MARMORE) + cupula(xc, b.y + b.d / 2, z + .57, .62, OURO);
  const m = iso(xc, b.y + b.d / 2, z + 1.25), t = iso(xc, b.y + b.d / 2, z + 1.95);
  o += `<line x1="${f1(m[0])}" y1="${f1(m[1])}" x2="${f1(t[0])}" y2="${f1(t[1])}" stroke="${P.ferro}" stroke-width="1.4"/><path class="cv-bandeira" d="M${f1(t[0])},${f1(t[1])} l14,2 l0,9 l-14,-2 Z" fill="${P.caneta}"/>`;
  if (P.noite) o += `<ellipse cx="${f1(m[0])}" cy="${f1(m[1] + 6)}" rx="26" ry="11" fill="${OURO}" opacity=".22"/>`;
  return o;
}

function mosaicoPraca(P: Paleta): string {
  const x0 = 10.7, y0 = 10.7, n = 4, s = 4.6 / n, cores = AREAS(P);
  let o = topo(x0, y0, 15.3, 15.3, .01, P.praca);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const c = mix(P.praca, cores[(i + j) % 4], P.noite ? .38 : .3);
    o += topo(x0 + i * s + .04, y0 + j * s + .04, x0 + (i + 1) * s - .04, y0 + (j + 1) * s - .04, .011, c);
  }
  return o + topo(12.55, 12.55, 13.45, 13.45, .012, shade(OURO, P.noite ? .8 : 1.05));
}

function baseMarmore(): (P: Paleta) => string {
  return P => cilindro(13, 13, 0, .14, 1.45, MARMORE) + elipseChao(13, 13, .141, 1.32, shade(MARMORE, .94));
}

function aroOuro(P: Paleta): string {
  const c = iso(13, 13, .34);
  let o = `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(1.1 * U * 1.2247)}" ry="${f1(1.1 * U * .7071)}" fill="none" stroke="${OURO}" stroke-width="2"/>`;
  AREAS(P).forEach((cor, i) => {
    const a = (i / 4) * Math.PI * 2 + .78, g = iso(13 + Math.cos(a) * 1.35, 13 + Math.sin(a) * 1.35, .2);
    o += `<circle class="cv-pisca" style="animation-delay:-${i * .6}s" cx="${f1(g[0])}" cy="${f1(g[1])}" r="${P.noite ? 4.5 : 3}" fill="${cor}" opacity="${P.noite ? .9 : .75}"/>`;
  });
  return o;
}

/** Portal Monumental (4.000 XP): pilares de mármore com anéis de ouro, faixas nas cores das áreas, lanternas,
 *  viga azul com letreiro e lâmpadas e uma pequena praça de pedra na frente. */
export function portalMonumental(Y: number): (P: Paleta) => string {
  return P => {
    const marmore = P.noite ? '#B9B4A6' : MARMORE, ouro = P.noite ? shade(OURO, .85) : OURO;
    const xa = 10.7, xb = 14.75, lp = .55, zb = .35, alt = 2.55, zt = zb + alt;
    const frente = Y + .7;
    let o = topo(10.1, Y - .35, 15.9, Y + 1.55, .012, P.noite ? '#4A5378' : '#E9E6DE');
    o += topo(10.1, Y + 1.05, 15.9, Y + 1.13, .013, ouro);
    if (P.noite) {
      const g = iso(13, frente, 3.2);
      o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="80" ry="28" fill="${P.luz}" opacity=".1"/>`;
    }
    for (const x of [xa, xb]) {
      o += box(x - .15, Y - .1, 0, lp + .3, lp + .3, zb, shade(marmore, .9));
      o += box(x, Y + .05, zb, lp, lp, alt, marmore);
      o += box(x - .02, Y + .03, zb + .9, lp + .04, lp + .04, .07, ouro) + box(x - .02, Y + .03, zt - .25, lp + .04, lp + .04, .07, ouro);
    }
    const faixas: [number, string, string][] = [[xa, P.lc, P.ch], [xb, P.cn, P.mt]];
    for (const [x, c1, c2] of faixas) {
      const fy = Y + .05 + lp + .003, meio = x + lp / 2;
      o += faceY(fy, x + .08, meio, zb + 1.05, zt - .35, c1) + faceY(fy, meio, x + lp - .08, zb + 1.05, zt - .35, c2);
    }
    for (const x of [xa, xb]) {
      const cx = x + lp / 2, lx = cx - .14;
      o += box(lx, Y + .19, zt + .62, .28, .28, .34, P.ferro);
      o += faceY(Y + .47 + .002, lx + .05, lx + .23, zt + .67, zt + .91, P.luz);
      o += box(lx - .04, Y + .15, zt + .96, .36, .36, .06, ouro);
      if (P.noite) { const l = iso(cx, Y + .47, zt + .8); o += `<circle cx="${f1(l[0])}" cy="${f1(l[1])}" r="16" fill="${P.luz}" opacity=".28"/>`; }
    }
    const vx = 10.45, vw = 5.1, vz = zt, vh = .62;
    o += box(vx - .04, Y - .02, vz - .04, vw + .08, .74, .06, ouro);
    o += box(vx, Y, vz, vw, .7, vh, P.caneta);
    o += box(vx - .04, Y - .02, vz + vh, vw + .08, .74, .06, ouro);
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const x = vx + .12 + (vw - .24) * i / n;
      for (const z of [vz + .09, vz + vh - .09]) {
        const c = iso(x, frente + .004, z);
        o += `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${((i * 7) % 10) * .15}s" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${P.noite ? 1.5 : 1.4}" fill="${P.noite ? P.luz : '#FFE7A3'}"/>`;
      }
    }
    o += textoNoPlano(13, frente + .005, vz + vh / 2, 'UNIVERSIDADE', P.noite ? '#FFF6D6' : '#FFFFFF', 11.5);
    o += poste(10.15, Y + 1.3, P, 1.9) + poste(15.85, Y + 1.3, P, 1.9);
    return o;
  };
}

interface Variante { marco: ChaveMarco; antes?: (P: Paleta) => string; troca?: (P: Paleta) => string; depois?: (P: Paleta) => string; }

const VARIANTES: Record<string, Variante> = {
  'Praça · piso': { marco: 'praca', troca: mosaicoPraca },
  'Reitoria · 1º andar': { marco: 'reitoria', depois: P => frisoDourado(RC, 0, P) },
  'Reitoria · 2º andar': { marco: 'reitoria', depois: P => frisoDourado(RC, 1, P) },
  'Reitoria · 3º andar': { marco: 'reitoria', depois: P => frisoDourado(RC, 2, P) },
  'Reitoria · 4º andar': { marco: 'reitoria', depois: P => frisoDourado(RC, 3, P) },
  'Reitoria · telhado': { marco: 'reitoria', troca: telhadoReal },
  'Reitoria · entrada': { marco: 'reitoria', depois: P => box(12.2, RC.y + RC.d + .1, RC.z0 + 1.05, 1.6, .5, .08, OURO) },
  'Fonte simples': { marco: 'fonte', antes: baseMarmore(), depois: aroOuro },
  'Fonte com três jatos': { marco: 'fonte', antes: baseMarmore(), depois: aroOuro },
  'Fonte monumental': { marco: 'fonte', antes: baseMarmore(), depois: aroOuro },
  'Portal de madeira': { marco: 'portal', troca: portalMonumental(19.6) },
  'Portal de concreto': { marco: 'portal', troca: portalMonumental(25.2) },
  'Portal com arco': { marco: 'portal', troca: portalMonumental(25.2) },
  'Monumento "Universidade"': { marco: 'portal', troca: () => '' },
  'Monumento iluminado': { marco: 'portal', troca: () => '' },
  'Bandeira da Universidade': { marco: 'portal', troca: () => '' }
};

/** Desenho da peça já com o visual premium, se o marco dela estiver atingido. */
export function desenhoComMarcos(p: Peca, marcos: Set<ChaveMarco>): ((P: Paleta) => string) | null {
  const v = p.trilha === 'geral' ? VARIANTES[p.nome] : undefined;
  if (!v || !marcos.has(v.marco)) return null;
  return P => (v.antes?.(P) ?? '') + (v.troca ? v.troca(P) : p.desenho(P)) + (v.depois?.(P) ?? '');
}

export function marcoDaPeca(p: Peca): ChaveMarco | null {
  return p.trilha === 'geral' ? VARIANTES[p.nome]?.marco ?? null : null;
}

// ---------------------------------------------------------------- área de lazer (terreno novo)

const RIO = 1.4;

interface Area { x0: number; x1: number; y0: number; y1: number; }

function dimensoes(xCampus: number, y0: number, y1: number): Area & { campo: Area; quadras: Area; piscina: Area; ponte: number } {
  const alto = y1 - y0, larg = Math.max(6, Math.min(8.5, Math.round(alto * .45)));
  const x0 = xCampus + RIO, x1 = x0 + larg;
  const cx0 = x0 + .55, cx1 = x1 - .55, cy0 = y0 + .6;
  const cy1 = cy0 + Math.min((cx1 - cx0) * .62, alto * .5 - .6);
  const qy0 = cy1 + 1.1, qy1 = qy0 + 1.9;
  return { x0, x1, y0, y1, campo: { x0: cx0, x1: cx1, y0: cy0, y1: cy1 }, quadras: { x0: x0 + .5, x1: x1 - .5, y0: qy0, y1: qy1 }, piscina: { x0: x0 + .5, x1: x1 - .7, y0: qy1 + .7, y1: y1 - .5 }, ponte: cy1 + .55 };
}

function campoFutebol(c: Area, P: Paleta): string {
  const verde = P.noite ? '#2F6B45' : '#4FB36B', verde2 = P.noite ? '#2A603E' : '#46A762', linha = P.noite ? '#DDE7F5' : '#FFFFFF';
  let o = topo(c.x0 - .25, c.y0 - .25, c.x1 + .25, c.y1 + .25, .012, P.concreto) + topo(c.x0, c.y0, c.x1, c.y1, .016, verde);
  const n = 10, w = (c.x1 - c.x0) / n;
  for (let i = 0; i < n; i += 2) o += topo(c.x0 + i * w, c.y0, c.x0 + (i + 1) * w, c.y1, .017, verde2);
  const z = .019, xm = (c.x0 + c.x1) / 2, ym = (c.y0 + c.y1) / 2, h = c.y1 - c.y0, L = c.x1 - c.x0;
  const contorno = (x0: number, y0: number, x1: number, y1: number) => linha3([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [x0, y0, z]], linha, 1.2);
  o += contorno(c.x0 + .12, c.y0 + .12, c.x1 - .12, c.y1 - .12) + linha3([[xm, c.y0 + .12, z], [xm, c.y1 - .12, z]], linha, 1.2);
  const circ: P3[] = [];
  for (let k = 0; k <= 32; k++) { const t = (k / 32) * Math.PI * 2; circ.push([xm + Math.cos(t) * h * .17, ym + Math.sin(t) * h * .17, z]); }
  o += linha3(circ, linha, 1.1);
  const ga = L * .14, gl = h * .44;
  o += contorno(c.x0 + .12, ym - gl / 2, c.x0 + .12 + ga, ym + gl / 2) + contorno(c.x1 - .12 - ga, ym - gl / 2, c.x1 - .12, ym + gl / 2);
  const gol = (x: number, dir: number) => {
    const a = ym - h * .12, b = ym + h * .12, t = .42;
    return box(x - .03, a - .03, 0, .06, .06, t, linha) + box(x - .03, b - .03, 0, .06, .06, t, linha) + linha3([[x, a, t], [x, b, t]], linha, 1.6) +
      linha3([[x, a, t], [x - dir * .3, a, .05], [x - dir * .3, b, .05], [x, b, t]], linha, .6, ' opacity=".7"');
  };
  o += gol(c.x0 + .12, 1) + gol(c.x1 - .12, -1);
  const bola = iso(xm + .6, ym - .2, .06);
  o += `<g class="cv-anda" style="--dx:18px;--dy:-6px;animation-duration:3.4s"><circle cx="${f1(bola[0])}" cy="${f1(bola[1])}" r="2.4" fill="#FFFFFF" stroke="#1B1B1B" stroke-width=".6"/></g>`;
  const jog: [number, number, string][] = [[.3, .35, P.caneta], [.42, .62, P.caneta], [.62, .4, '#F0506E'], [.7, .65, '#F0506E']];
  jog.forEach(([fx, fy, cor], i) => {
    const g = iso(c.x0 + L * fx, c.y0 + h * fy, 0);
    o += `<g class="cv-anda" style="--dx:${i % 2 ? -10 : 12}px;--dy:${i % 2 ? 5 : -4}px;animation-duration:${2.6 + i * .5}s"><ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="3" ry="1.4" fill="rgba(0,0,0,.18)"/><rect x="${f1(g[0] - 2)}" y="${f1(g[1] - 9)}" width="4" height="7" rx="1.6" fill="${cor}"/><circle cx="${f1(g[0])}" cy="${f1(g[1] - 11)}" r="2" fill="#F2C9A0"/></g>`;
  });
  return o;
}

type TipoQuadra = 'basquete' | 'volei' | 'tenis';
function quadra(x: number, y: number, w: number, d: number, tipo: TipoQuadra, P: Paleta): string {
  const piso = tipo === 'basquete' ? (P.noite ? '#8A4E2C' : '#D9834C') : tipo === 'volei' ? (P.noite ? '#2D4F92' : '#3E7BD6') : (P.noite ? '#2C6A4A' : '#3FA36B');
  const borda = tipo === 'basquete' ? (P.noite ? '#6E3D22' : '#B9693A') : tipo === 'volei' ? (P.noite ? '#24407A' : '#2F63B5') : (P.noite ? '#235A3E' : '#338A58');
  const linha = P.noite ? '#DDE7F5' : '#FFFFFF', z = .03, xm = x + w / 2, ym = y + d / 2;
  let o = topo(x - .15, y - .15, x + w + .15, y + d + .15, .02, borda) + topo(x, y, x + w, y + d, .025, piso);
  o += linha3([[x + .08, y + .08, z], [x + w - .08, y + .08, z], [x + w - .08, y + d - .08, z], [x + .08, y + d - .08, z], [x + .08, y + .08, z]], linha, 1) + linha3([[xm, y + .08, z], [xm, y + d - .08, z]], linha, 1);
  if (tipo === 'basquete') {
    const arco = (cx: number, dir: number) => {
      const pts: P3[] = [];
      for (let k = 0; k <= 16; k++) { const t = -Math.PI / 2 + (k / 16) * Math.PI; pts.push([cx + dir * Math.cos(t) * d * .32, ym + Math.sin(t) * d * .32, z]); }
      return linha3(pts, linha, .9);
    };
    o += arco(x + .08, 1) + arco(x + w - .08, -1);
    const tabela = (cx: number, dir: number) => {
      const t = iso(cx, ym, 1.05);
      return box(cx - dir * .12 - .03, ym - .03, 0, .06, .06, 1.1, P.ferro) + box(cx - .02, ym - .22, .9, .04, .44, .3, '#FFFFFF') + `<ellipse cx="${f1(t[0] + dir * 3)}" cy="${f1(t[1] + 3)}" rx="3.2" ry="1.4" fill="none" stroke="#F05A28" stroke-width="1.1"/>`;
    };
    o += tabela(x + .1, 1) + tabela(x + w - .1, -1);
  } else {
    const alt = tipo === 'volei' ? .7 : .32;
    o += box(xm - .02, y - .12, 0, .04, .04, alt, P.ferro) + box(xm - .02, y + d + .08, 0, .04, .04, alt, P.ferro) +
      poly([[xm, y - .1, alt], [xm, y + d + .1, alt], [xm, y + d + .1, alt - (tipo === 'volei' ? .22 : .2)], [xm, y - .1, alt - (tipo === 'volei' ? .22 : .2)]], '#FFFFFF', ' fill-opacity=".55"');
  }
  return o;
}

function quadras(a: Area, P: Paleta): string {
  const gx = .7, w = (a.x1 - a.x0 - gx) / 2, d = a.y1 - a.y0;
  return topo(a.x0 - .1, a.y0 - .1, a.x1 + .1, a.y1 + .1, .01, P.concreto) + quadra(a.x0, a.y0, w, d, 'basquete', P) + quadra(a.x0 + w + gx, a.y0, w, d, 'volei', P);
}

function piscina(a: Area, P: Paleta): string {
  const deck = P.noite ? '#4A4F66' : '#EDE6D6', borda = P.noite ? '#C9CFDC' : '#FFFFFF';
  const agua = P.noite ? '#2C6FA8' : '#4CC3F0', agua2 = P.noite ? '#3A86C4' : '#7AD6F6';
  let o = topo(a.x0, a.y0, a.x1, a.y1, .02, deck);
  const m = .55, px0 = a.x0 + m, px1 = a.x1 - m - .9, py0 = a.y0 + m, py1 = a.y1 - m;
  o += topo(px0 - .14, py0 - .14, px1 + .14, py1 + .14, .03, borda) + topo(px0, py0, px1, py1, .031, shade(agua, .85)) + topo(px0 + .06, py0 + .06, px1, py1, .032, agua);
  for (let i = 0; i < 4; i++) {
    const y = py0 + .3 + i * ((py1 - py0 - .6) / 3);
    o += topo(px0 + .4, y, px0 + 1.1, y + .18, .033, agua2, ' class="cv-agua"');
    o += topo(px1 - 1.5, y + .4, px1 - .8, y + .58, .033, agua2, ' class="cv-agua"');
  }
  const raias = 4;
  for (let r = 1; r < raias; r++) {
    const y = py0 + (r * (py1 - py0)) / raias;
    const pts: P3[] = [];
    for (let k = 0; k <= 18; k++) pts.push([px0 + .1 + (k / 18) * (px1 - px0 - .2), y, .036]);
    o += linha3(pts, r % 2 ? '#F0506E' : '#FFFFFF', 1.3, ' stroke-dasharray="3 3"');
  }
  const esc = (y: number) => linha3([[px1 + .02, y, .45], [px1 + .02, y, .04], [px1 - .2, y, .04]], P.ferro, 1.1);
  o += esc(py0 + .35) + esc(py0 + .6);
  const tx = px1 + .2;
  o += box(tx, py0 + .1, .03, .5, .25, .06, P.madeira);
  for (let i = 0; i < 3; i++) {
    const y = py0 + .6 + i * ((py1 - py0 - 1) / 2);
    o += box(tx + .1, y, .03, .55, .26, .1, '#FFFFFF') + box(tx + .1, y, .13, .14, .26, .14, '#FFFFFF');
    if (i !== 1) {
      const g = iso(tx + .4, y + .13, 0), t = iso(tx + .4, y + .13, 1.05), cor = i === 0 ? '#F0506E' : '#F2C14E';
      o += `<line x1="${f1(g[0])}" y1="${f1(g[1])}" x2="${f1(t[0])}" y2="${f1(t[1])}" stroke="${P.ferro}" stroke-width="1.2"/>` +
        `<path d="M${f1(t[0] - 15)},${f1(t[1] + 6)} Q${f1(t[0])},${f1(t[1] - 8)} ${f1(t[0] + 15)},${f1(t[1] + 6)} Z" fill="${cor}"/>` +
        `<path d="M${f1(t[0] - 5)},${f1(t[1] + 6)} Q${f1(t[0])},${f1(t[1] - 8)} ${f1(t[0] + 5)},${f1(t[1] + 6)} Z" fill="#FFFFFF" opacity=".85"/>`;
    }
  }
  const nada = iso(px0 + (px1 - px0) * .45, py0 + (py1 - py0) * .38, .05);
  o += `<g class="cv-anda" style="--dx:26px;--dy:13px;animation-duration:5s"><ellipse cx="${f1(nada[0])}" cy="${f1(nada[1])}" rx="4" ry="1.6" fill="#FFFFFF" opacity=".6"/><circle cx="${f1(nada[0])}" cy="${f1(nada[1] - 1.5)}" r="1.8" fill="#F2C9A0"/></g>`;
  if (P.noite) {
    const c = iso((px0 + px1) / 2, (py0 + py1) / 2, .04);
    o += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1((px1 - px0) * U * .6)}" ry="${f1((py1 - py0) * U * .35)}" fill="#7FD8FF" opacity=".14"/>`;
  }
  return o;
}

function lazerReservado(a: Area, P: Paleta): string {
  const pts = [iso(a.x0, a.y0, .02), iso(a.x1, a.y0, .02), iso(a.x1, a.y1, .02), iso(a.x0, a.y1, .02)];
  return `<polygon points="${pts.map(q => f1(q[0]) + ',' + f1(q[1])).join(' ')}" fill="${shade(P.grama, .95)}" stroke="${P.noite ? '#8EA0D8' : '#FFFFFF'}" stroke-width="1.6" stroke-dasharray="6 5" opacity=".9"/>`;
}

function arquibancadaEBosque(dm: ReturnType<typeof dimensoes>, P: Paleta, parte: 'fundo' | 'frente'): string {
  const c = dm.campo;
  if (parte === 'fundo') {
    let o = '';
    for (let k = 0; k < 3; k++) o += box(c.x0 + 1, c.y0 - .55 + k * .0, k * .18, c.x1 - c.x0 - 2, .45 - k * .12, .18, k % 2 ? '#C9CFDC' : '#E3E7F0');
    for (let x = dm.x0 + .35; x < dm.x1 - .2; x += 1.4) o += arvore(x, dm.y0 + .25, P, .65, 'alta');
    return o;
  }
  let o = '';
  for (let y = dm.y0 + 1.2; y < dm.y1 - .4; y += 1.6) o += arvore(dm.x1 - .25, y, P, .7);
  return o + poste(c.x0 - .2, c.y0 - .2, P, 2.2) + poste(c.x1 + .2, c.y1 + .2, P, 2.2);
}

export interface Distrito { svg: string; x0: number; x1: number; y0: number; y1: number; }

/** Área de lazer do outro lado do rio, com a mesma altura do terreno principal. Abre com o campo (2 simulados). */
export function desenharDistrito(xCampus: number, y0: number, y1: number, marcos: Set<ChaveMarco>, P: Paleta, novos: Set<ChaveMarco> = new Set(), atraso = 0, yPonte?: number): Distrito | null {
  if (!marcos.has('campo')) return null;
  const dm = dimensoes(xCampus, y0, y1);
  const loteNovo = novos.has('campo');
  const anim = (k: ChaveMarco, svg: string, tipo = 'cresce') => novos.has(k) ? `<g class="cv-peca cv-nova cv-nova-${tipo}" style="animation-delay:${atraso + (loteNovo ? 800 : 0)}ms">${svg}</g>` : svg;

  const agua = topo(xCampus + .1, y0 - .4, dm.x0 - .1, y1 + .4, -.25, P.agua) +
    [0, 1, 2, 3].map(i => topo(xCampus + .3 + (i % 2) * .4, y0 + .4 + i * ((y1 - y0) / 4), xCampus + .5 + (i % 2) * .4, y0 + 1.6 + i * ((y1 - y0) / 4), -.24, P.aguaLuz, ' class="cv-agua"')).join('');
  const yb = yPonte !== undefined && yPonte > y0 + .5 && yPonte < y1 - .5 ? yPonte : dm.ponte;
  const ponte = box(xCampus - .1, yb - .3, 0, RIO + .2, .6, .1, P.madeira) +
    linha3([[xCampus - .1, yb - .28, .45], [dm.x0 + .1, yb - .28, .45]], shade(P.madeira, .7), 1.6) + linha3([[xCampus - .1, yb + .28, .45], [dm.x0 + .1, yb + .28, .45]], shade(P.madeira, .7), 1.6) +
    [0, .5, 1].map(f => box(xCampus - .1 + f * (RIO + .1), yb - .32, 0, .08, .08, .48, shade(P.madeira, .8)) + box(xCampus - .1 + f * (RIO + .1), yb + .24, 0, .08, .08, .48, shade(P.madeira, .8))).join('');
  const terreno = box(dm.x0, y0, -.9, dm.x1 - dm.x0, y1 - y0, .9, P.grama, { l: P.placaL, r: P.placaR }) + caminho(dm.x0, dm.ponte - .25, dm.x1 - .3, dm.ponte + .25, P) +
    (yb !== dm.ponte ? caminho(dm.x0, Math.min(yb, dm.ponte) - .25, dm.x0 + .45, Math.max(yb, dm.ponte) + .25, P) : '');

  let svg = agua + terreno + ponte;
  svg += anim('campo', arquibancadaEBosque(dm, P, 'fundo'), 'brota');
  svg += anim('campo', campoFutebol(dm.campo, P), 'surge');
  svg += marcos.has('quadras') ? anim('quadras', quadras(dm.quadras, P), 'surge') : lazerReservado(dm.quadras, P);
  svg += marcos.has('piscina') ? anim('piscina', piscina(dm.piscina, P), 'surge') : lazerReservado(dm.piscina, P);
  svg += anim('campo', arquibancadaEBosque(dm, P, 'frente'), 'brota');
  if (loteNovo) svg = `<g class="cv-peca cv-nova cv-nova-lote" style="animation-delay:${atraso}ms">${svg}</g>`;
  return { svg, x0: xCampus, x1: dm.x1, y0: y0 - .4, y1: y1 + .4 };
}

// ---------------------------------------------------------------- hospital universitário (o desafio final)

const LARG_HOSP = 6.5;
const VERMELHO = '#E5484D';

function cruz(face: 'x' | 'y', plano: number, c: number, zc: number, t: number, cor: string): string {
  const f = face === 'x' ? faceX : faceY, a = t * .36, b = t;
  return f(plano, c - b, c + b, zc - b, zc + b, '#FFFFFF') + f(plano + .001, c - a, c + a, zc - b * .78, zc + b * .78, cor) + f(plano + .001, c - b * .78, c + b * .78, zc - a, zc + a, cor);
}

function predioHospital(b: Predio, P: Paleta): string {
  const X = b.x + b.w, Y = b.y + b.d, yc = b.y + b.d / 2, zTopo = b.z0 + 4 * b.h;
  let o = fundacao(b, P);
  for (let i = 0; i < 4; i++) {
    o += andar(b, i, P, { passo: .72, cor: P.noite ? P.janela : '#9CC7F2' });
    o += box(b.x - .03, b.y - .03, b.z0 + i * b.h + b.h - .1, b.w + .06, b.d + .06, .1, i === 0 ? VERMELHO : shade(P.parede, .96));
  }
  o += entradaLateral(b, P, yc, VERMELHO);
  o += box(X, yc - 1.1, b.z0 + 1.05, .9, 2.2, .1, VERMELHO) + box(X + .78, yc - 1.05, 0, .08, .08, b.z0 + 1.05, P.ferro) + box(X + .78, yc + .97, 0, .08, .08, b.z0 + 1.05, P.ferro);
  o += cruz('x', X + .005, yc, b.z0 + 3.5 * b.h - .05, .48, VERMELHO) + cruz('y', Y + .005, b.x + b.w / 2, b.z0 + 3.5 * b.h - .05, .42, VERMELHO);
  o += telhado(b, 4, P, VERMELHO, false);
  const hx = b.x + b.w / 2, hy = b.y + b.d * .32, zr = zTopo + .23, r = Math.min(b.w, b.d) * .3;
  o += box(hx - r - .1, hy - r - .1, zTopo + .22, 2 * r + .2, 2 * r + .2, .06, '#3A3F4F');
  const anel: P3[] = [];
  for (let k = 0; k <= 36; k++) { const t = (k / 36) * Math.PI * 2; anel.push([hx + Math.cos(t) * r * .82, hy + Math.sin(t) * r * .82, zr + .065]); }
  o += linha3(anel, '#F2C94C', 2);
  const h = r * .34;
  o += linha3([[hx - h * .6, hy - h, zr + .066], [hx - h * .6, hy + h, zr + .066]], '#FFFFFF', 2.6) + linha3([[hx + h * .6, hy - h, zr + .066], [hx + h * .6, hy + h, zr + .066]], '#FFFFFF', 2.6) + linha3([[hx - h * .6, hy, zr + .066], [hx + h * .6, hy, zr + .066]], '#FFFFFF', 2.6);
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const g = iso(hx + dx * r * .95, hy + dy * r * .95, zr + .08);
    o += `<circle class="cv-pisca" style="animation-duration:1.6s" cx="${f1(g[0])}" cy="${f1(g[1])}" r="1.8" fill="#4ADE80"/>`;
  }
  const ax = hx - .55, ay = hy + r + .85, aw = 1.1, ad = 1.3, ah = 1.0, za = zTopo + .22;
  o += box(ax, ay, za, aw, ad, ah, P.parede) + box(ax - .06, ay - .06, za + ah, aw + .12, ad + .12, .1, VERMELHO);
  o += faceX(ax + aw + .004, ay + .35, ay + .95, za, za + .72, P.noite ? P.janela : '#5A6BB0', ` stroke="${P.moldura}" stroke-width=".8"`);
  o += faceY(ay + ad + .004, ax + .25, ax + .85, za + .45, za + .75, P.noite ? P.janela : '#9CC7F2');
  o += linha3([[ax + aw, ay + .2, za + .02], [hx + r * .2, hy + r * .6, zr + .07]], '#F2C94C', 1, ' stroke-dasharray="2 2"');
  return o;
}

function ambulancia(x: number, y: number, P: Paleta): string {
  const g = iso(x + .3, y + .55, .62);
  return sombraChao(x + .35, y + .3, .5, .25, P) + box(x, y, .08, .7, 1.1, .5, '#FFFFFF') + box(x, y + .78, .08, .7, .32, .36, '#F4F6FA') +
    box(x + .005, y, .3, .7, 1.1, .08, VERMELHO) + `<circle class="cv-pisca" style="animation-duration:.9s" cx="${f1(g[0])}" cy="${f1(g[1] - 2)}" r="2" fill="#4FA3FF"/>`;
}

export interface Hospital { svg: string; x0: number; }

/** Hospital à esquerda do campus, depois de um rio, com a mesma altura do terreno principal. */
export function desenharHospital(xCampus: number, y0: number, y1: number, P: Paleta, novo = false, atraso = 0): Hospital {
  const xh1 = xCampus - RIO, xh0 = xh1 - LARG_HOSP;
  const agua = topo(xh1 + .1, y0 - .4, xCampus - .1, y1 + .4, -.25, P.agua) +
    [0, 1, 2, 3].map(i => topo(xh1 + .3 + (i % 2) * .4, y0 + .4 + i * ((y1 - y0) / 4), xh1 + .5 + (i % 2) * .4, y0 + 1.6 + i * ((y1 - y0) / 4), -.24, P.aguaLuz, ' class="cv-agua"')).join('');
  const yb = (y0 + y1) / 2;
  const ponte = box(xh1 - .1, yb - .3, 0, RIO + .2, .6, .1, P.madeira) +
    linha3([[xh1 - .1, yb - .28, .45], [xCampus + .1, yb - .28, .45]], shade(P.madeira, .7), 1.6) + linha3([[xh1 - .1, yb + .28, .45], [xCampus + .1, yb + .28, .45]], shade(P.madeira, .7), 1.6);
  const terreno = box(xh0, y0, -.9, LARG_HOSP, y1 - y0, .9, P.grama, { l: P.placaL, r: P.placaR }) + topo(xh0 + .2, y0 + .2, xh1 - .2, y1 - .2, .01, P.concreto);
  const b: Predio = { x: xh0 + .45, y: y0 + .55, w: LARG_HOSP - 1.9, d: y1 - y0 - 1.1, z0: .25, h: 1.25 };
  let corpo = predioHospital(b, P) + ambulancia(xh1 - 1.05, yb + 1.3, P);
  if (novo) corpo = `<g class="cv-peca cv-nova cv-nova-cresce" style="animation-delay:${atraso + 800}ms">${corpo}</g>`;
  let svg = terreno + corpo + agua + ponte;
  if (novo) svg = `<g class="cv-peca cv-nova cv-nova-lote" style="animation-delay:${atraso}ms">${svg}</g>`;
  return { svg, x0: xh0 };
}

export function miniaturaHospital(P: Paleta): string {
  const y0 = 0, y1 = 9, xh0 = 0;
  const b: Predio = { x: xh0 + .45, y: y0 + .55, w: LARG_HOSP - 1.9, d: y1 - y0 - 1.1, z0: .25, h: 1.25 };
  const chao = box(xh0, y0, -.5, LARG_HOSP, y1 - y0, .5, P.grama, { l: P.placaL, r: P.placaR }) + topo(xh0 + .2, y0 + .2, xh0 + LARG_HOSP - .2, y1 - .2, .01, P.concreto);
  const c = iso(xh0 + LARG_HOSP / 2, 4.5, 2.6), w = 11 * 2 * .866 * U, h = w * .8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(c[0] - w / 2)} ${f1(c[1] - h / 2)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img">${chao}${predioHospital(b, P)}</svg>`;
}

// ---------------------------------------------------------------- miniaturas para os cards

const PECAS_DO_MARCO: Record<'praca' | 'reitoria' | 'fonte' | 'portal', string[]> = {
  praca: ['Praça · piso', 'Primeiros caminhos', 'Canteiros da praça'],
  reitoria: ['Reitoria · 1º andar', 'Reitoria · entrada', 'Reitoria · 2º andar', 'Reitoria · 3º andar', 'Reitoria · 4º andar', 'Reitoria · telhado'],
  fonte: ['Fonte monumental'],
  portal: ['Portal com arco']
};

export function miniaturaMarco(chave: ChaveMarco, P: Paleta): string {
  if (chave === 'alimentacao') return miniaturaPraca(P);
  if (chave === 'hospital') return miniaturaHospital(P);
  const todos = new Set(MARCOS.map(m => m.chave));
  let corpo = '', cx = 13, cy = 13, larg = 6, zc = 1;
  if (chave === 'campo' || chave === 'quadras' || chave === 'piscina') {
    const dm = dimensoes(-RIO, 0, 12);
    const chao = box(dm.x0, 0, -.5, dm.x1 - dm.x0, 12, .5, P.grama, { l: P.placaL, r: P.placaR });
    if (chave === 'campo') { corpo = chao + arquibancadaEBosque(dm, P, 'fundo') + campoFutebol(dm.campo, P); cx = (dm.campo.x0 + dm.campo.x1) / 2; cy = (dm.campo.y0 + dm.campo.y1) / 2; larg = 6.2; zc = .3; }
    else if (chave === 'quadras') { corpo = chao + quadras(dm.quadras, P); cx = (dm.quadras.x0 + dm.quadras.x1) / 2; cy = (dm.quadras.y0 + dm.quadras.y1) / 2; larg = 4.4; zc = .4; }
    else { corpo = chao + piscina(dm.piscina, P); cx = (dm.piscina.x0 + dm.piscina.x1) / 2; cy = (dm.piscina.y0 + dm.piscina.y1) / 2; larg = 5.4; zc = .3; }
  } else {
    const nomes = PECAS_DO_MARCO[chave as 'praca' | 'reitoria' | 'fonte' | 'portal'] ?? [];
    const pecas = nomes.map(n => TRILHAS.geral.find(p => p.nome === n)).filter((p): p is Peca => !!p);
    const chaoX = chave === 'reitoria' ? [10.2, 5.8, 15.8, 10.2] : chave === 'portal' ? [9.9, 24.6, 16.1, 27.0] : [10.4, 10.4, 15.6, 15.6];
    corpo = box(chaoX[0], chaoX[1], -.5, chaoX[2] - chaoX[0], chaoX[3] - chaoX[1], .5, P.grama, { l: P.placaL, r: P.placaR }) +
      pecas.map(p => (desenhoComMarcos(p, todos) ?? p.desenho)(P)).join('');
    if (chave === 'reitoria') { cx = 13; cy = 7.8; larg = 7; zc = 3; }
    else if (chave === 'fonte') { cx = 13; cy = 13; larg = 4.2; zc = 1; }
    else if (chave === 'portal') { cx = 13; cy = 25.6; larg = 6.6; zc = 2; }
  }
  const c = iso(cx, cy, zc), w = larg * 2 * .866 * U, h = w * .9;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(c[0] - w / 2)} ${f1(c[1] - h / 2)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img">${corpo}</svg>`;
}
