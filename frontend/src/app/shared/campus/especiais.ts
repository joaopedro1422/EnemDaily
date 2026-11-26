import {
  Paleta, Predio, P3, iso, f1, shade, mix, box, topo, faceY, poly, linha3, cilindro, elipseChao, cupula, sombraChao,
  andar, fundacao, fachadaVidro, telhado, entrada, entradaLateral, faceX, arvore, banco, poste, canteiro, caminho, U, textoNoPlano, ponteDePedra, floresDosCaminhos
} from './motor';
import { Peca, TRILHAS } from './pecas';
import { miniaturaPraca } from './alimentacao';
import { complexoHospital, postoDeSaude } from './hospital';
import { miniaturaMetro } from './metro';

export interface ExtrasCampus { acertos?: number; simulados?: number; redacoes?: number; maiorSequencia?: number; diasAtivos?: number; xp?: number; }

export type ChaveMarco = 'decoracao' | 'praca' | 'reitoria' | 'fonte' | 'portal' | 'campo' | 'quadras' | 'terra' | 'piscina' | 'trilha' | 'pista' | 'posto' | 'hospital' | 'odonto' | 'trem' | 'metro' | 'alimentacao';
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
  { chave: 'decoracao', grupo: 'campus', nome: 'Caminhos floridos', descricao: 'Um friso de flores acompanha todos os caminhos do campus e as pontes de madeira viram pontes de pedra em arco.', metrica: 'acertos', meta: 200, icone: 'sparkles' },
  { chave: 'reitoria', grupo: 'campus', nome: 'Reitoria Dourada', descricao: 'Pilastras, frisos e cúpula dourados no prédio principal.', metrica: 'acertos', meta: 100, icone: 'crown' },
  { chave: 'fonte', grupo: 'campus', nome: 'Fonte de Mármore', descricao: 'Borda de mármore, aro de ouro e luzes nas cores das áreas.', metrica: 'acertos', meta: 200, icone: 'sparkles' },
  { chave: 'portal', grupo: 'campus', nome: 'Portal Monumental', descricao: 'A entrada da universidade vira um portal de mármore com letreiro iluminado, lâmpadas e lanternas.', metrica: 'xp', meta: 4000, icone: 'crown' },
  { chave: 'terra', grupo: 'distrito', nome: 'Campo de terra', descricao: 'Abre a área de lazer do outro lado do rio: uma ponte e um campinho de terra batida com traves de madeira.', metrica: 'dias', meta: 5, icone: 'calendar-check' },
  { chave: 'campo', grupo: 'distrito', nome: 'Campo de futebol', descricao: 'O campinho de terra vira um campo gramado de verdade, com rede, arquibancada, árvores e refletores.', metrica: 'dias', meta: 25, icone: 'calendar-check' },
  { chave: 'quadras', grupo: 'distrito', nome: 'Quadras esportivas', descricao: 'Uma quadra de basquete e uma de vôlei, ao lado do campo.', metrica: 'dias', meta: 50, icone: 'calendar-check' },
  { chave: 'piscina', grupo: 'distrito', nome: 'Piscina do clube', descricao: 'Piscina com raias, deck, espreguiçadeiras e guarda-sóis.', metrica: 'dias', meta: 70, icone: 'calendar-check' },
  { chave: 'trilha', grupo: 'distrito', nome: 'Trilha de corrida', descricao: 'Uma trilha de terra batida em volta de um gramado na área de lazer, com cones e um corredor treinando.', metrica: 'acertos', meta: 40, icone: 'target' },
  { chave: 'pista', grupo: 'distrito', nome: 'Pista olímpica', descricao: 'A trilha de terra vira uma pista de atletismo de 6 raias, com caixa de areia para o salto e círculo de arremesso.', metrica: 'acertos', meta: 150, icone: 'target' },
  { chave: 'posto', grupo: 'distrito', nome: 'Posto de saúde', descricao: 'Abre um terreno novo do outro lado do campus: um posto de saúde de 3 andares, com cruz vermelha e ambulância.', metrica: 'dias', meta: 70, icone: 'shield' },
  { chave: 'hospital', grupo: 'distrito', nome: 'Hospital Universitário', descricao: 'O posto de saúde vira o Hospital Universitário: torre de vidro com heliponto, ala clínica e pavilhão de entrada.', metrica: 'dias', meta: 100, icone: 'shield' },
  { chave: 'odonto', grupo: 'distrito', nome: 'Clínica de Odontologia', descricao: 'No fundo do hospital: uma clínica com dente gigante no telhado, escova de dente na esquina e o estacionamento com as duas fileiras de carros.', metrica: 'acertos', meta: 300, icone: 'sparkles' },
  { chave: 'trem', grupo: 'distrito', nome: 'Estação de trem', descricao: 'Do outro lado da avenida: trilhos sobre dormentes de madeira, uma estaçãozinha de tijolos e uma maria-fumaça que para a cada volta.', metrica: 'dias', meta: 50, icone: 'calendar-check' },
  { chave: 'metro', grupo: 'distrito', nome: 'Estação de metrô', descricao: 'A estação de trem vira metrô: trilho moderno, estação de vidro na frente do portal e um trem elétrico.', metrica: 'dias', meta: 120, icone: 'calendar-check' },
  { chave: 'alimentacao', grupo: 'distrito', nome: 'Praça de alimentação', descricao: 'Nos fundos do campus: abre com 15 acertos já com a pizzaria e ganha um negócio novo a cada 25 acertos, até 240. Na 5ª loja chega o deque de madeira para as mesas.', metrica: 'acertos', meta: 15, icone: 'sparkles' },
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

export function desenhoComMarcos(p: Peca, marcos: Set<ChaveMarco>): ((P: Paleta) => string) | null {
  const v = p.trilha === 'geral' ? VARIANTES[p.nome] : undefined;
  if (!v || !marcos.has(v.marco)) return null;
  return P => (v.antes?.(P) ?? '') + (v.troca ? v.troca(P) : p.desenho(P)) + (v.depois?.(P) ?? '');
}

export function marcoDaPeca(p: Peca): ChaveMarco | null {
  return p.trilha === 'geral' ? VARIANTES[p.nome]?.marco ?? null : null;
}


const RIO = 1.4;

interface Area { x0: number; x1: number; y0: number; y1: number; }

function dimensoes(xCampus: number, y0: number, y1: number): Area & { campo: Area; quadras: Area; pista: Area; piscina: Area; ponte: number } {
  const alto = y1 - y0, larg = Math.max(6, Math.min(8.5, Math.round(alto * .45)));
  const x0 = xCampus + RIO, x1 = x0 + larg;
  const cx0 = x0 + .55, cx1 = x1 - .55, cy0 = y0 + .6;
  const cy1 = cy0 + Math.min((cx1 - cx0) * .62, alto * .5 - .6);
  const qy0 = cy1 + 1.1, qy1 = qy0 + 1.9;
  const resto = y1 - .5 - (qy1 + .7), fundo = Math.max(3.2, Math.min(5, resto * .32));
  return {
    x0, x1, y0, y1, campo: { x0: cx0, x1: cx1, y0: cy0, y1: cy1 }, quadras: { x0: x0 + .5, x1: x1 - .5, y0: qy0, y1: qy1 },
    pista: { x0: x0 + .45, x1: x1 - .45, y0: qy1 + .7, y1: y1 - fundo - 1 }, piscina: { x0: x0 + .5, x1: x1 - .7, y0: y1 - .5 - fundo, y1: y1 - .5 }, ponte: cy1 + .55
  };
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
function campoTerra(c: Area, P: Paleta): string {
  const terra = P.noite ? '#5E4B3A' : '#CDAA7D', terra2 = P.noite ? '#544233' : '#B9966A', cal = P.noite ? '#CFC6B4' : '#F6EFE1', madeira = P.noite ? '#6E553F' : '#9C7450';
  const L = c.x1 - c.x0, h = c.y1 - c.y0, xm = (c.x0 + c.x1) / 2, ym = (c.y0 + c.y1) / 2, z = .018;
  let o = topo(c.x0, c.y0, c.x1, c.y1, .016, terra);
  [[.2, .3, .9, .5], [.7, .7, 1.2, .6], [.45, .55, 1.6, .9], [.85, .25, .7, .4], [.15, .8, .8, .4]].forEach(([fx, fy, rx, ry]) => {
    const g = iso(c.x0 + L * fx, c.y0 + h * fy, .017);
    o += `<ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="${f1(rx * U)}" ry="${f1(ry * U * .5)}" fill="${terra2}" opacity=".55"/>`;
  });
  for (const [fx, fy] of [[.05, .1], [.95, .15], [.08, .9], [.92, .88], [.5, .04], [.5, .97], [.3, .95], [.7, .06]]) {
    const g = iso(c.x0 + L * fx, c.y0 + h * fy, .02);
    o += `<path d="M${f1(g[0] - 3)},${f1(g[1])} l1.5,-3 l1.5,3 l1.5,-3.5 l1.5,3.5" stroke="${P.arvore}" stroke-width="1" fill="none"/>`;
  }
  o += linha3([[xm, c.y0 + .15, z], [xm, c.y1 - .15, z]], cal, 1, ' stroke-dasharray="5 3" opacity=".85"');
  const circ: P3[] = [];
  for (let k = 0; k <= 28; k++) { const t = (k / 28) * Math.PI * 2; circ.push([xm + Math.cos(t) * h * .14, ym + Math.sin(t) * h * .14, z]); }
  o += linha3(circ, cal, .9, ' stroke-dasharray="4 3" opacity=".85"');
  const trave = (x: number) => {
    const a = ym - h * .1, b = ym + h * .1, t = .4;
    return box(x - .035, a - .035, 0, .07, .07, t, madeira) + box(x - .035, b - .035, 0, .07, .07, t, madeira) + linha3([[x, a, t], [x, b, t]], madeira, 2);
  };
  o += trave(c.x0 + .25) + trave(c.x1 - .25);
  for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) o += box(c.x0 + L * fx - .07, c.y0 + h * fy - .07, 0, .14, .14, .08, P.concreto);
  const bola = iso(xm + .4, ym + .1, .06);
  o += `<g class="cv-anda" style="--dx:16px;--dy:-5px;animation-duration:3.6s"><circle cx="${f1(bola[0])}" cy="${f1(bola[1])}" r="2.3" fill="#FFFFFF" stroke="#1B1B1B" stroke-width=".6"/></g>`;
  ([[.38, .45, '#F2C14E'], [.62, .58, '#2836C6']] as [number, number, string][]).forEach(([fx, fy, cor], i) => {
    const g = iso(c.x0 + L * fx, c.y0 + h * fy, 0);
    o += `<g class="cv-anda" style="--dx:${i ? -9 : 11}px;--dy:${i ? 4 : -4}px;animation-duration:${3 + i * .6}s"><ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="3" ry="1.4" fill="rgba(0,0,0,.18)"/><rect x="${f1(g[0] - 2)}" y="${f1(g[1] - 9)}" width="4" height="7" rx="1.6" fill="${cor}"/><circle cx="${f1(g[0])}" cy="${f1(g[1] - 11)}" r="2" fill="#F2C9A0"/></g>`;
  });
  return o;
}

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
  for (let i = 0; i < 2; i++) {
    const y = py0 + .3 + i * (py1 - py0 - .9);
    o += topo(px0 + .4, y, px0 + 1.1, y + .18, .033, agua2, ' class="cv-agua"');
    o += topo(px1 - 1.5, y + .4, px1 - .8, y + .58, .033, agua2, ' class="cv-agua"');
  }
  const raias = 2;
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

function pistaOlimpica(a: Area, P: Paleta): string {
  if (a.y1 - a.y0 < 2.5) return '';
  const xc = (a.x0 + a.x1) / 2, R = Math.min((a.x1 - a.x0) / 2, (a.y1 - a.y0) / 2) - .1;
  const ya = a.y0 + R + .1, yb = Math.max(ya, a.y1 - R - .1), ym = (ya + yb) / 2;
  const forma = (r: number, z: number): P3[] => {
    const pts: P3[] = [];
    for (let k = 0; k <= 20; k++) { const t = Math.PI + (k / 20) * Math.PI; pts.push([xc + Math.cos(t) * r, ya + Math.sin(t) * r, z]); }
    for (let k = 0; k <= 20; k++) { const t = (k / 20) * Math.PI; pts.push([xc + Math.cos(t) * r, yb + Math.sin(t) * r, z]); }
    return pts;
  };
  const fechar = (p: P3[]) => [...p, p[0]];
  const tw = Math.min(1.2, R * .39), ri = R - tw, branco = P.noite ? '#DDE7F5' : '#FFFFFF';
  const tartan = P.noite ? '#7E3B31' : '#CF5B43', grama = P.noite ? '#2F6B45' : '#4FB36B', grama2 = P.noite ? '#2A603E' : '#46A762', areia = P.noite ? '#8A7A58' : '#EAD39C';
  let o = poly(forma(R + .2, .012), P.concreto) + poly(forma(R, .016), tartan) + poly(forma(ri, .018), grama);
  for (let k = 0; k < 6; k += 2) o += poly([[xc - ri * .75, ya + (yb - ya) * k / 6, .019], [xc + ri * .75, ya + (yb - ya) * k / 6, .019], [xc + ri * .75, ya + (yb - ya) * (k + 1) / 6, .019], [xc - ri * .75, ya + (yb - ya) * (k + 1) / 6, .019]], grama2);
  for (let k = 1; k < 6; k++) o += linha3(fechar(forma(ri + (k * tw) / 6, .017)), branco, .55, ' opacity=".9"');
  o += linha3(fechar(forma(ri, .02)), branco, 1.1) + linha3(fechar(forma(R, .02)), branco, .8);
  o += linha3([[xc + ri, ym, .021], [xc + R, ym, .021]], branco, 2);
  for (let k = 0; k < 6; k++) { const r = ri + ((k + .5) * tw) / 6, y = ym + .25 + k * .12; o += linha3([[xc - r - .04, y, .021], [xc - r + .04, y, .021]], branco, 1.2); }
  // caixa de areia do salto e círculo de arremesso
  const sx = xc + ri - .55;
  o += topo(sx - .25, ym - .4, sx + .25, ym + .55, .02, areia) + linha3([[sx, ym + .55, .021], [sx, yb + .2, .021]], branco, .7);
  const circ: P3[] = [];
  for (let k = 0; k <= 20; k++) { const t = (k / 20) * Math.PI * 2; circ.push([xc - ri * .35 + Math.cos(t) * .22, ya + Math.sin(t) * .22, .021]); }
  o += linha3(circ, branco, 1) + linha3([[xc - ri * .35, ya, .021], [xc - ri * .35 + .5, ya + 1.6, .021]], branco, .6) + linha3([[xc - ri * .35, ya, .021], [xc - ri * .35 - .5, ya + 1.6, .021]], branco, .6);
  // dois corredores na reta da frente
  const L = (yb - ya) * .8, d0 = iso(0, 0, 0), d1 = iso(0, -L, 0);
  [[xc - ri - tw * .3, yb, '#2836C6', 3.2], [xc - ri - tw * .7, yb - .35, '#F0506E', 3.6]].forEach(([x, y, cor, dur], i) => {
    const g = iso(x as number, y as number, 0);
    o += `<g class="cv-anda" style="--dx:${f1(d1[0] - d0[0])}px;--dy:${f1(d1[1] - d0[1])}px;animation-duration:${dur}s;animation-delay:-${i * .8}s"><ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="3" ry="1.4" fill="rgba(0,0,0,.18)"/><rect x="${f1(g[0] - 2)}" y="${f1(g[1] - 9)}" width="4" height="7" rx="1.6" fill="${cor}"/><circle cx="${f1(g[0])}" cy="${f1(g[1] - 11)}" r="2" fill="#F2C9A0"/></g>`;
  });
  return o + poste(a.x0 - .1, a.y0 + .2, P, 2.2) + poste(a.x0 - .1, a.y1 - .2, P, 2.2);
}

function trilhaCorrida(a: Area, P: Paleta): string {
  if (a.y1 - a.y0 < 2.5) return '';
  const xc = (a.x0 + a.x1) / 2, R = Math.min((a.x1 - a.x0) / 2, (a.y1 - a.y0) / 2) - .1;
  const ya = a.y0 + R + .1, yb = Math.max(ya, a.y1 - R - .1);
  const forma = (r: number, z: number): P3[] => {
    const pts: P3[] = [];
    for (let k = 0; k <= 20; k++) { const t = Math.PI + (k / 20) * Math.PI; pts.push([xc + Math.cos(t) * r, ya + Math.sin(t) * r, z]); }
    for (let k = 0; k <= 20; k++) { const t = (k / 20) * Math.PI; pts.push([xc + Math.cos(t) * r, yb + Math.sin(t) * r, z]); }
    return pts;
  };
  const terra = P.noite ? '#5E4B3A' : '#C9A77C', terra2 = P.noite ? '#544233' : '#B8956A', tw = Math.min(.8, R * .26), ri = R - tw;
  let o = poly(forma(R, .014), terra) + poly(forma(ri, .016), shade(P.grama, P.noite ? 1 : .97));
  o += linha3([...forma(ri + tw * .5, .015), forma(ri + tw * .5, .015)[0]], terra2, 1.2, ' stroke-dasharray="6 5" opacity=".7"');
  for (const [fx, fy] of [[-1, .2], [1, .55], [-1, .8], [1, .15]]) {
    const g = iso(xc + fx * (ri + tw * .5), ya + (yb - ya) * fy, .02);
    o += `<path d="M${f1(g[0] - 2.5)},${f1(g[1] + 1)} L${f1(g[0])},${f1(g[1] - 5)} L${f1(g[0] + 2.5)},${f1(g[1] + 1)} Z" fill="#F28C28"/><path d="M${f1(g[0] - 1.4)},${f1(g[1] - 2)} L${f1(g[0] + 1.4)},${f1(g[1] - 2)}" stroke="#FFFFFF" stroke-width="1"/>`;
  }
  for (const [fx, fy] of [[.3, .3], [-.4, .6], [.1, .75], [-.2, .2]]) {
    const g = iso(xc + fx * ri, ya + (yb - ya) * fy, .02);
    o += `<path d="M${f1(g[0] - 3)},${f1(g[1])} l1.5,-3 l1.5,3 l1.5,-3.5 l1.5,3.5" stroke="${P.arvore}" stroke-width="1" fill="none"/>`;
  }
  const L = (yb - ya) * .8, d0 = iso(0, 0, 0), d1 = iso(0, -L, 0), g = iso(xc - ri - tw * .5, yb, 0);
  o += `<g class="cv-anda" style="--dx:${f1(d1[0] - d0[0])}px;--dy:${f1(d1[1] - d0[1])}px;animation-duration:4.2s"><ellipse cx="${f1(g[0])}" cy="${f1(g[1])}" rx="3" ry="1.4" fill="rgba(0,0,0,.18)"/><rect x="${f1(g[0] - 2)}" y="${f1(g[1] - 9)}" width="4" height="7" rx="1.6" fill="#36B37D"/><circle cx="${f1(g[0])}" cy="${f1(g[1] - 11)}" r="2" fill="#F2C9A0"/></g>`;
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

export function desenharDistrito(xCampus: number, y0: number, y1: number, marcos: Set<ChaveMarco>, P: Paleta, novos: Set<ChaveMarco> = new Set(), atraso = 0, yPonte?: number): Distrito | null {
  if (!marcos.has('terra') && !marcos.has('campo')) return null;
  const dm = dimensoes(xCampus, y0, y1);
  const loteNovo = novos.has('terra') || (novos.has('campo') && !marcos.has('terra'));
  const anim = (k: ChaveMarco, svg: string, tipo = 'cresce') => novos.has(k) ? `<g class="cv-peca cv-nova cv-nova-${tipo}" style="animation-delay:${atraso + (loteNovo ? 800 : 0)}ms">${svg}</g>` : svg;

  const agua = topo(xCampus + .1, y0 - .4, dm.x0 - .1, y1 + .4, -.25, P.agua) +
    [0, 1, 2, 3].map(i => topo(xCampus + .3 + (i % 2) * .4, y0 + .4 + i * ((y1 - y0) / 4), xCampus + .5 + (i % 2) * .4, y0 + 1.6 + i * ((y1 - y0) / 4), -.24, P.aguaLuz, ' class="cv-agua"')).join('');
  const yb = yPonte !== undefined && yPonte > y0 + .5 && yPonte < y1 - .5 ? yPonte : dm.ponte;
  const ponte = P.decorado ? ponteDePedra(xCampus - .15, dm.x0 + .15, yb, .72, 'x', P) : box(xCampus - .1, yb - .3, 0, RIO + .2, .6, .1, P.madeira) +
    linha3([[xCampus - .1, yb - .28, .45], [dm.x0 + .1, yb - .28, .45]], shade(P.madeira, .7), 1.6) + linha3([[xCampus - .1, yb + .28, .45], [dm.x0 + .1, yb + .28, .45]], shade(P.madeira, .7), 1.6) +
    [0, .5, 1].map(f => box(xCampus - .1 + f * (RIO + .1), yb - .32, 0, .08, .08, .48, shade(P.madeira, .8)) + box(xCampus - .1 + f * (RIO + .1), yb + .24, 0, .08, .08, .48, shade(P.madeira, .8))).join('');
  const terreno = box(dm.x0, y0, -.9, dm.x1 - dm.x0, y1 - y0, .9, P.grama, { l: P.placaL, r: P.placaR }) + caminho(dm.x0, dm.ponte - .25, dm.x1 - .3, dm.ponte + .25, P) +
    (yb !== dm.ponte ? caminho(dm.x0, Math.min(yb, dm.ponte) - .25, dm.x0 + .45, Math.max(yb, dm.ponte) + .25, P) : '');

  let svg = agua + terreno + ponte;
  if (marcos.has('campo')) svg += anim('campo', arquibancadaEBosque(dm, P, 'fundo'), 'brota') + anim('campo', campoFutebol(dm.campo, P), 'surge');
  else svg += anim('terra', campoTerra(dm.campo, P), 'surge');
  svg += marcos.has('quadras') ? anim('quadras', quadras(dm.quadras, P), 'surge') : lazerReservado(dm.quadras, P);
  svg += marcos.has('pista') ? anim('pista', pistaOlimpica(dm.pista, P), 'surge') : marcos.has('trilha') ? anim('trilha', trilhaCorrida(dm.pista, P), 'surge') : dm.pista.y1 - dm.pista.y0 > 2.5 ? lazerReservado(dm.pista, P) : '';
  svg += marcos.has('piscina') ? anim('piscina', piscina(dm.piscina, P), 'surge') : lazerReservado(dm.piscina, P);
  svg += marcos.has('campo') ? anim('campo', arquibancadaEBosque(dm, P, 'frente'), 'brota') : anim('terra', [0, 1, 2].map(i => arvore(dm.x1 - .3, dm.y0 + 1.4 + i * 2.2, P, .65)).join(''), 'brota');
  if (loteNovo) svg = `<g class="cv-peca cv-nova cv-nova-lote" style="animation-delay:${atraso}ms">${svg}</g>`;
  return { svg, x0: xCampus, x1: dm.x1, y0: y0 - .4, y1: y1 + .4 };
}


const LARG_HOSP = 6.5;
export interface Hospital { svg: string; x0: number; }

export function desenharHospital(xCampus: number, y0: number, y1: number, P: Paleta, novo = false, atraso = 0, odonto = false, odontoNovo = false, atrasoOdonto = 0, posto = false, evoluiu = false): Hospital {
  const xh1 = xCampus - RIO, xh0 = xh1 - LARG_HOSP;
  const agua = topo(xh1 + .1, y0 - .4, xCampus - .1, y1 + .4, -.25, P.agua) +
    [0, 1, 2, 3].map(i => topo(xh1 + .3 + (i % 2) * .4, y0 + .4 + i * ((y1 - y0) / 4), xh1 + .5 + (i % 2) * .4, y0 + 1.6 + i * ((y1 - y0) / 4), -.24, P.aguaLuz, ' class="cv-agua"')).join('');
  const yb = (y0 + y1) / 2;
  const ponte = P.decorado ? ponteDePedra(xh1 - .15, xCampus + .15, yb, .72, 'x', P) : box(xh1 - .1, yb - .3, 0, RIO + .2, .6, .1, P.madeira) +
    linha3([[xh1 - .1, yb - .28, .45], [xCampus + .1, yb - .28, .45]], shade(P.madeira, .7), 1.6) + linha3([[xh1 - .1, yb + .28, .45], [xCampus + .1, yb + .28, .45]], shade(P.madeira, .7), 1.6);
  const terreno = box(xh0, y0, -.9, LARG_HOSP, y1 - y0, .9, P.grama, { l: P.placaL, r: P.placaR });
  let corpo = posto ? postoDeSaude(xh0, xh1, y0, y1, yb, P) : complexoHospital(xh0, xh1, y0, y1, yb, P, odonto, odontoNovo && !novo, atrasoOdonto);
  if (evoluiu && !novo) corpo = `<g class="cv-peca cv-nova cv-nova-surge" style="animation-delay:${atraso}ms">${corpo}</g>`;
  if (novo) corpo = `<g class="cv-peca cv-nova cv-nova-cresce" style="animation-delay:${atraso + 800}ms">${corpo}</g>`;
  let svg = terreno + corpo + agua + ponte;
  if (novo) svg = `<g class="cv-peca cv-nova cv-nova-lote" style="animation-delay:${atraso}ms">${svg}</g>`;
  return { svg, x0: xh0 };
}

export function miniaturaHospital(P: Paleta): string {
  const y0 = 0, y1 = 20, xh0 = 0;
  const chao = box(xh0, y0, -.5, LARG_HOSP, y1 - y0, .5, P.grama, { l: P.placaL, r: P.placaR });
  const c = iso(xh0 + LARG_HOSP / 2, 11, 2.4), w = 15 * 2 * .866 * U, h = w * .8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(c[0] - w / 2)} ${f1(c[1] - h / 2)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img">${chao}${complexoHospital(xh0, xh0 + LARG_HOSP, y0, y1, 10, P, false)}</svg>`;
}


const PECAS_DO_MARCO: Record<'praca' | 'reitoria' | 'fonte' | 'portal', string[]> = {
  praca: ['Praça · piso', 'Primeiros caminhos', 'Canteiros da praça'],
  reitoria: ['Reitoria · 1º andar', 'Reitoria · entrada', 'Reitoria · 2º andar', 'Reitoria · 3º andar', 'Reitoria · 4º andar', 'Reitoria · telhado'],
  fonte: ['Fonte monumental'],
  portal: ['Portal com arco']
};

export function miniaturaMarco(chave: ChaveMarco, P: Paleta): string {
  if (chave === 'alimentacao') return miniaturaPraca(P);
  if (chave === 'hospital') return miniaturaHospital(P);
  if (chave === 'posto') return miniaturaPosto(P);
  if (chave === 'odonto') return miniaturaOdonto(P);
  if (chave === 'metro') return miniaturaMetro(P);
  if (chave === 'decoracao') return miniaturaDecoracao(P);
  if (chave === 'trem') return miniaturaMetro(P, true);
  const todos = new Set(MARCOS.map(m => m.chave));
  let corpo = '', cx = 13, cy = 13, larg = 6, zc = 1;
  if (chave === 'pista' || chave === 'trilha') {
    const dm = dimensoes(-RIO, 0, 26), a = dm.pista;
    corpo = box(dm.x0, a.y0 - .5, -.5, dm.x1 - dm.x0, a.y1 - a.y0 + 1, .5, P.grama, { l: P.placaL, r: P.placaR }) + (chave === 'pista' ? pistaOlimpica(a, P) : trilhaCorrida(a, P));
    cx = (a.x0 + a.x1) / 2; cy = (a.y0 + a.y1) / 2; larg = 7.4; zc = .3;
  } else if (chave === 'terra') {
    const dm = dimensoes(-RIO, 0, 12);
    corpo = box(dm.x0, 0, -.5, dm.x1 - dm.x0, 12, .5, P.grama, { l: P.placaL, r: P.placaR }) + campoTerra(dm.campo, P);
    cx = (dm.campo.x0 + dm.campo.x1) / 2; cy = (dm.campo.y0 + dm.campo.y1) / 2; larg = 6.2; zc = .3;
  } else if (chave === 'campo' || chave === 'quadras' || chave === 'piscina') {
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

export function miniaturaDecoracao(P: Paleta): string {
  const Pd: Paleta = { ...P, decorado: true, registro: [] };
  const chao = box(8, 8, -.5, 10, 10, .5, P.grama, { l: P.placaL, r: P.placaR });
  const vias = caminho(8.6, 12.5, 18, 13.5, Pd) + caminho(12.5, 8.4, 13.5, 12.5, Pd) + caminho(12.5, 13.5, 13.5, 15.2, Pd);
  const rio = topo(8, 15.2, 18, 16.6, -.25, P.agua);
  const ponteP = ponteDePedra(15.1, 16.7, 12.95, .9, 'y', Pd);
  const c = iso(13, 13, .4), w = 7 * 2 * .866 * U, h = w * .8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(c[0] - w / 2)} ${f1(c[1] - h / 2)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img">${chao}${vias}${floresDosCaminhos(Pd.registro!, Pd)}${rio}${ponteP}</svg>`;
}

export function miniaturaOdonto(P: Paleta): string {
  const y0 = 0, y1 = 20, xh0 = 0;
  const chao = box(xh0, y0, -.5, LARG_HOSP, y1 - y0, .5, P.grama, { l: P.placaL, r: P.placaR });
  const c = iso(xh0 + 2.8, 4.4, 1.2), w = 6.4 * 2 * .866 * U, h = w * .8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(c[0] - w / 2)} ${f1(c[1] - h / 2)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img">${chao}${complexoHospital(xh0, xh0 + LARG_HOSP, y0, y1, 10, P)}</svg>`;
}

export function miniaturaPosto(P: Paleta): string {
  const y0 = 0, y1 = 20, xh0 = 0;
  const chao = box(xh0, y0, -.5, LARG_HOSP, y1 - y0, .5, P.grama, { l: P.placaL, r: P.placaR });
  const c = iso(xh0 + 3, 9.6, 1.6), w = 7.5 * 2 * .866 * U, h = w * .8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(c[0] - w / 2)} ${f1(c[1] - h / 2)} ${f1(w)} ${f1(h)}" preserveAspectRatio="xMidYMid meet" role="img">${chao}${postoDeSaude(xh0, xh0 + LARG_HOSP, y0, y1, 10, P)}</svg>`;
}
