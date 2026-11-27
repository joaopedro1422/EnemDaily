import {
  Paleta, Predio, P3, iso, f1, shade, mix, box, topo, faceX, faceY, poly, linha3, cilindro, elipseChao, cupula, sombraChao,
  janelas, fundacao, andar, fachadaVidro, telhado, entrada, entradaLateral, arvore, pessoa, banco, poste, canteiro, placa, placaMadeira, textoNoPlano,
  simboloFaceY, caminho, sebe, cerca, bandeirinhas, quiosque, antena, estatua, lago, fumaca, turbina, piramide, degraus, TipoArvore, U, ponteDePedra } from './motor';
import { teatroFundacao, teatroSalao, teatroCornija, teatroCaixaCenica, teatroPortico, teatroFrontao, teatroLetreiro, teatroCartazes, teatroEstandartes, teatroLuzes, bibliotecaAndar, bibliotecaPorta, bibliotecaCobertura, bibliotecaPaineis, livroAberto, palcoSarau, livrosGigantes, bilheteria, cinemaCorpo, cinemaTorre, cinemaMarquise } from './predios-letras';
import { observatorioBase, observatorioTorre, observatorioGaleria, observatorioCupula, observatorioTelescopio, observatorioLuzes, computacaoAndar, computacaoEntrada, computacaoCobertura, computacaoCubo, computacaoBits, computacaoTelhadoExtras, institutoCobertura, institutoFormula, institutoTorre, placaPi, xadrez } from './predios-exatas';
import { temploBase, temploCela, temploColunata, temploEntablamento, temploFrontao, temploLuzes, telhadoClassico, pilastras, globoMonumental, rosaDosVentos, anfora, emEscala, escadariaMarmore, obelisco, estandartes, relogioFrontao, lanternaCobre, estacaoMeteorologica, rosaFrontao, antenaSatelite, estatuaLiberdade } from './predios-humanas';
import { bibliotecaTerreoSimples, bibliotecaAndarSimples, bibliotecaTelhadoSimples, bibliotecaEntradaSimples, teatroSimples, cinemaSimples, temploLajeSimples, temploPilaresSimples, estufaEstrutura, estufaSimples, observatorioTorreSimples, observatorioCupulaSimples } from './simples';
import { bancoFundacao, bancoObra, bancoSimples, bancoPremium } from './predios-banco';
import { Coliseu, coliseuFundacao, coliseuArena, coliseuNivel, coliseuArquibancadas, coliseuMastros, coliseuLuzes } from './coliseu';
import { estufaBase, estufaPlantas, estufaAlas, estufaPavilhao, estufaCupula, estufaLuzes, galpao, cisterna, pergola, hortaIrrigacao, quimicaAndar, quimicaCobertura, quimicaHexagono, frascoGigante, deque } from './predios-natureza';

export type Trilha = 'geral' | 'linguagens' | 'humanas' | 'naturezas' | 'exatas';
export type Anim = 'cresce' | 'cai' | 'brota' | 'surge';
export type Lote = [number, number, number, number];

export interface Peca {
  trilha: Trilha;
  ordem: number;
  nome: string;
  ax: number;
  ay: number;
  chave: number;
  camada: number;
  anim: Anim;
  desenho: (P: Paleta) => string;
  lote?: Lote;
  grupo?: string;
  nivel?: number;
  ceu?: boolean;
}

interface Opc { chave?: number; camada?: number; anim?: Anim; lote?: Lote; grupo?: string; nivel?: number; ceu?: boolean; }

function criarTrilha(trilha: Trilha) {
  const lista: Peca[] = [];
  const add = (nome: string, ax: number, ay: number, desenho: (P: Paleta) => string, o: Opc = {}) => {
    lista.push({ trilha, ordem: lista.length, nome, ax, ay, chave: o.chave ?? ax + ay, camada: o.camada ?? 1, anim: o.anim ?? 'brota', desenho, lote: o.lote, grupo: o.grupo, nivel: o.nivel, ceu: o.ceu });
  };
  return { lista, add };
}

const k = (b: Predio) => b.x + b.w / 2 + b.y + b.d / 2;
const corArea = (P: Paleta, t: Trilha) => t === 'linguagens' ? P.lc : t === 'humanas' ? P.ch : t === 'naturezas' ? P.cn : t === 'exatas' ? P.mt : P.caneta;

function loteRegiao(l: Lote, trilha: Trilha) {
  return (P: Paleta) => {
    const [x0, y0, x1, y1] = l, cor = mix(P.grama, corArea(P, trilha), P.noite ? .1 : .13);
    return topo(x0, y0, x1, y1, .003, cor) + topo(x0, y0, x1, y0 + .08, .02, P.concreto) + topo(x0, y0, x0 + .08, y1, .02, P.concreto) +
      topo(x0, y1 - .08, x1, y1, .02, P.concreto) + topo(x1 - .08, y0, x1, y1, .02, P.concreto);
  };
}

function placaRegiao(nivel: number, x: number, y: number, P: Paleta, _nome: string, cor: string): string {
  const flores = canteiro(x - .45, y - .45, .9, .9, P, 1, [cor, P.branco, cor]);
  if (nivel === 1) return flores;
  if (nivel === 2) return flores + poste(x + .3, y + .3, P, 1.4);
  const g = iso(x, y, 1.62);
  let o = flores + box(x - .14, y - .14, 0, .28, .28, 1.5, P.parede) + box(x - .17, y - .17, 1.5, .34, .34, .1, cor) +
    `<circle cx="${f1(g[0])}" cy="${f1(g[1] - 3)}" r="4" fill="${cor}" stroke="#FFFFFF" stroke-width="1.3"/>`;
  if (nivel === 4) {
    const b = iso(x, y, 1.9);
    o = (P.noite ? `<ellipse cx="${f1(b[0])}" cy="${f1(b[1] + 4)}" rx="34" ry="14" fill="${cor}" opacity=".28"/>` : '') + o +
      [-12, -4, 4, 12].map((dx, i) => `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${i * .4}s" cx="${f1(b[0] + dx)}" cy="${f1(b[1] + 14)}" r="1.6" fill="${P.luz}"/>`).join('');
  }
  return o;
}

function terracoLeitura(b: Predio, n: number, P: Paleta, cor: string): string {
  const z = b.z0 + n * b.h + .2;
  let o = box(b.x + .2, b.y + .2, z, 1.2, .3, .24, P.madeira) + box(b.x + .2, b.y + .5, z, .3, 1.0, .24, P.madeira);
  [[b.x + .4, b.y + .35], [b.x + .85, b.y + .35], [b.x + 1.25, b.y + .35], [b.x + .35, b.y + .85], [b.x + .35, b.y + 1.25]].forEach(([x, y], i) => {
    const c = iso(x, y, z + .38);
    o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${i % 2 ? 4 : 5}" fill="${i % 3 === 1 ? cor : P.arvore}"/>`;
  });
  const ux = b.x + b.w - .9, uy = b.y + b.d - .9, base = iso(ux, uy, z), tp = iso(ux, uy, z + 1.05);
  o += box(ux - .35, uy - .35, z, .7, .7, .32, P.branco) + `<line x1="${f1(base[0])}" y1="${f1(base[1])}" x2="${f1(tp[0])}" y2="${f1(tp[1])}" stroke="${P.ferro}" stroke-width="1.6"/>` +
    `<path d="M${f1(tp[0] - 20)},${f1(tp[1] + 7)} Q${f1(tp[0])},${f1(tp[1] - 9)} ${f1(tp[0] + 20)},${f1(tp[1] + 7)} Z" fill="${cor}"/>` +
    `<path d="M${f1(tp[0] - 7)},${f1(tp[1] + 7)} Q${f1(tp[0])},${f1(tp[1] - 9)} ${f1(tp[0] + 7)},${f1(tp[1] + 7)} Z" fill="${P.branco}" opacity=".85"/>`;
  return o;
}

function sinalAoVivo(b: Predio, P: Paleta): string {
  const x = b.x + .45, y = b.y + .45, z = b.z0 + b.h + .2, t = iso(x, y, z + .75);
  let o = box(x - .05, y - .05, z, .1, .1, .7, P.ferro) + `<circle class="cv-pisca" style="animation-duration:1.2s" cx="${f1(t[0])}" cy="${f1(t[1])}" r="3.2" fill="#FF4D5E"/>`;
  [7, 12, 17].forEach((r, i) => {
    const est = `class="cv-pisca" style="animation-duration:1.8s;animation-delay:-${i * .3}s" fill="none" stroke="#FF4D5E" stroke-width="1.4" stroke-linecap="round" opacity="${.9 - i * .25}"`;
    o += `<path ${est} d="M${f1(t[0] + r * .7)},${f1(t[1] - r * .7)} A${r},${r} 0 0 1 ${f1(t[0] + r * .7)},${f1(t[1] + r * .7)}"/>`;
    o += `<path ${est} d="M${f1(t[0] - r * .7)},${f1(t[1] - r * .7)} A${r},${r} 0 0 0 ${f1(t[0] - r * .7)},${f1(t[1] + r * .7)}"/>`;
  });
  return o;
}

function mastrosMuseu(b: Predio, P: Paleta, cores: string[]): string {
  const y = b.y + b.d + .45;
  return cores.map((c, i) => {
    const x = b.x + .55 + i * (b.w - 1.1) / (cores.length - 1), t = iso(x, y, 2.5);
    return box(x - .03, y - .03, 0, .06, .06, 2.5, P.ferro) + `<path class="cv-bandeira" style="animation-delay:-${i * .5}s" d="M${f1(t[0])},${f1(t[1])} l15,2 l0,10 l-15,-2 Z" fill="${c}"/>`;
  }).join('');
}

function colmeias(x: number, y: number, P: Paleta): string {
  let o = sombraChao(x + .4, y + .2, .6, .25, P);
  [0, .42].forEach((dx, i) => {
    o += box(x + dx, y, 0, .32, .32, .16, P.madeira) + box(x + dx, y, .16, .32, .32, .16, '#F2C14E') + box(x + dx, y, .32, .32, .32, .16, P.madeira);
    if (i === 0) o += box(x + dx, y, .48, .32, .32, .16, '#F2C14E') + box(x + dx - .03, y - .03, .64, .38, .38, .05, P.branco);
    else o += box(x + dx - .03, y - .03, .48, .38, .38, .05, P.branco);
  });
  const c = iso(x + .4, y + .2, 1.1);
  [[0, 0, 2.6], [8, -4, 3.4], [-6, 3, 3]].forEach(([dx, dy, d], i) => {
    o += `<g class="cv-anda" style="--dx:${10 - i * 7}px;--dy:${-5 + i * 4}px;animation-duration:${d}s"><circle cx="${f1(c[0] + dx)}" cy="${f1(c[1] + dy)}" r="1.4" fill="#2B2B2B"/><circle cx="${f1(c[0] + dx)}" cy="${f1(c[1] + dy - 1.2)}" r="1.1" fill="#FFFFFF" opacity=".8"/></g>`;
  });
  return o;
}

function tanquesReagente(b: Predio, n: number, P: Paleta, cor: string): string {
  const z = b.z0 + n * b.h + .22;
  let o = '';
  ([[b.x + .55, b.y + .55, cor], [b.x + 1.15, b.y + .55, '#F2C14E'], [b.x + .55, b.y + 1.1, '#7DB7FF']] as [number, number, string][]).forEach(([x, y, c]) => {
    o += cilindro(x, y, z, .55, .2, P.branco) + cilindro(x, y, z + .55, .07, .22, c);
  });
  return o + linha3([[b.x + .55, b.y + .55, z + .35], [b.x + 1.15, b.y + .55, z + .35]], P.ferro, 1.6) +
    linha3([[b.x + .55, b.y + .55, z + .2], [b.x + .55, b.y + 1.1, z + .2]], P.ferro, 1.6);
}

function radiotelescopio(x: number, y: number, P: Paleta, cor: string): string {
  const g = iso(x, y, .55), f = iso(x, y, 1.15);
  return sombraChao(x, y, .5, .25, P) + box(x - .12, y - .12, 0, .24, .24, .55, P.concreto) +
    `<g transform="rotate(-25 ${f1(g[0])} ${f1(g[1])})"><ellipse cx="${f1(g[0])}" cy="${f1(g[1] - 6)}" rx="15" ry="8" fill="${P.branco}" stroke="${shade(P.branco, .8)}" stroke-width="1"/>` +
    `<ellipse cx="${f1(g[0])}" cy="${f1(g[1] - 6)}" rx="9" ry="4.6" fill="${shade(P.branco, .9)}"/>` +
    `<line x1="${f1(g[0])}" y1="${f1(g[1] - 6)}" x2="${f1(g[0])}" y2="${f1(g[1] - 18)}" stroke="${P.ferro}" stroke-width="1.4"/></g>` +
    `<circle class="cv-pisca" cx="${f1(f[0] + 4)}" cy="${f1(f[1] - 8)}" r="2" fill="${cor}"/>`;
}

function paineisSolares(b: Predio, n: number, P: Paleta): string {
  const z = b.z0 + n * b.h + .22;
  let o = '';
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
    const x = b.x + .3 + i * 1.0, y = b.y + .35 + j * .95;
    o += poly([[x, y, z + .1], [x + .8, y, z + .1], [x + .8, y + .7, z + .4], [x, y + .7, z + .4]], '#25407E', ' stroke="#8FB2FF" stroke-width=".6"') +
      linha3([[x + .4, y, z + .1], [x + .4, y + .7, z + .4]], '#8FB2FF', .5) + linha3([[x, y + .35, z + .25], [x + .8, y + .35, z + .25]], '#8FB2FF', .5);
  }
  return o;
}

function placaNoPortal(xc: number, Y: number, P: Paleta): string {
  const z0 = .7, z1 = 1.24, meio = 1.5;
  const c = iso(xc, Y, (z0 + z1) / 2);
  return faceY(Y, xc - meio, xc + meio, z0, z1, P.madeira, ` stroke="${shade(P.madeira, .7)}" stroke-width=".8"`) +
    linha3([[xc - meio + .06, Y + .002, z1 - .05], [xc + meio - .06, Y + .002, z1 - .05]], shade(P.madeira, 1.08), .8) +
    `<text transform="translate(${f1(c[0])} ${f1(c[1])}) skewY(30)" y="2.6" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="7.4" font-weight="800" fill="${shade(P.madeira, .38)}" letter-spacing=".2">Universidade</text>`;
}

export const BASE_GERAL = 6;

const DIAS_FIXOS: [number, string][] = [
  [0, 'Terreno da Universidade'], [0, 'Terreno da reitoria'], [0, 'Reitoria · em obras'], [0, 'Primeiros caminhos'], [0, 'Fonte simples'], [0, 'Portão simples'],
  [3, 'Reitoria · 1º andar'], [7, 'Reitoria · entrada'], [16, 'Reitoria · 2º andar'], [17, 'Reitoria · 3º andar'],
  [28, 'Reitoria · 4º andar'], [30, 'Reitoria · telhado'], [35, 'Torre do relógio · base'], [36, 'Torre · relógio do dia'], [37, 'Torre · cobertura']
];

function comDiasFixos(lista: Peca[]): Peca[] {
  const fixas = DIAS_FIXOS.map(([dia, nome]) => ({ dia, peca: lista.find(p => p.nome === nome)! })).filter(f => f.peca);
  const resto = lista.filter(p => !fixas.some(f => f.peca === p));
  const saida = [...resto];
  fixas.map((f, k) => ({ ...f, alvo: f.dia === 0 ? k : BASE_GERAL - 1 + f.dia }))
    .sort((a, b) => a.alvo - b.alvo)
    .forEach(f => saida.splice(Math.min(f.alvo, saida.length), 0, f.peca));
  saida.forEach((p, i) => (p.ordem = i));
  return saida;
}

function reitoriaEmObras(b: Predio, P: Paleta): string {
  const z = b.z0, X = b.x + b.w, Y = b.y + b.d, tijolo = P.noite ? '#7A5A4A' : '#C98B6B';
  let o = fundacao(b, P);
  o += box(b.x, b.y, z, b.w, .16, 1.05, tijolo) + box(b.x, b.y, z, .16, b.d, .75, tijolo);
  o += box(X - .16, b.y, z, .16, 1.4, .9, tijolo) + box(X - .16, b.y + 1.4, z, .16, b.d - 1.4, .35, tijolo);
  o += box(b.x, Y - .16, z, 1.5, .16, .62, tijolo) + box(b.x + 3.1, Y - .16, z, 1.5, .16, .38, tijolo);
  for (const [x, y] of [[b.x - .25, Y + .2], [X + .2, Y + .2], [X + .2, b.y - .2]] as [number, number][]) o += box(x - .03, y - .03, 0, .06, .06, 1.7, P.ferro);
  o += linha3([[b.x - .25, Y + .2, .8], [X + .2, Y + .2, .8], [X + .2, b.y - .2, .8]], P.ferro, 1.1) + linha3([[b.x - .25, Y + .2, 1.5], [X + .2, Y + .2, 1.5], [X + .2, b.y - .2, 1.5]], P.ferro, 1.1);
  o += box(b.x - .25, Y + .1, .8, b.w + .45, .22, .05, P.madeira);
  o += box(b.x + 1.9, Y + .35, 0, .7, .4, .25, tijolo) + box(b.x + 2.0, Y + .4, .25, .5, .3, .15, shade(tijolo, .9));
  const g = iso(X + .55, Y + .55, 0), t = iso(X + .55, Y + .55, .45);
  o += `<path d="M${f1(t[0])},${f1(t[1])} L${f1(g[0] - 5)},${f1(g[1])} L${f1(g[0] + 5)},${f1(g[1])} Z" fill="#F28C28"/><path d="M${f1(t[0] - 2.4)},${f1(t[1] + 6)} L${f1(t[0] + 2.4)},${f1(t[1] + 6)}" stroke="#FFFFFF" stroke-width="1.6"/>`;
  return o;
}

function pessoas(P: Paleta, lista: [number, number, Trilha | 'caneta', number?, [number, number, number, number?]?][]): string {
  return lista.map(([x, y, c, v, anda], i) => {
    const k = (Math.round(x * 7 + y * 3) + i) % 4;
    const auto: [number, number, number, number] = [k % 2 ? 1.6 : 0, k % 2 ? 0 : 1.6, 5 + (k % 3), (x + y) % 4];
    const caminha = i === 0 && Math.round(x * 3 + y * 5) % 3 === 0;
    return pessoa(x, y, P, c === 'caneta' ? P.caneta : corArea(P, c), v ?? 0, caminha ? anda ?? auto : undefined);
  }).join('');
}

function arvoreMata(x: number, y: number, P: Paleta, s: number, v: number): string {
  if (v % 6 === 5) return arvore(x, y, P, s * 1.1, 'pinheiro');
  const base = v % 3 === 0 ? P.pinheiro : v % 3 === 1 ? shade(P.arvore, .84) : P.arvore;
  let o = sombraChao(x, y, .7 * s, .35 * s, P) + box(x - .1 * s, y - .1 * s, 0, .2 * s, .2 * s, .8 * s, P.tronco, { r: shade(P.tronco, .72) });
  const c = iso(x, y, 1.4 * s), r = .56 * s * U;
  ([[-.55, .28, .74, .74], [.58, .3, .78, .68], [0, -.5, .8, .9], [-.18, .12, .95, 1], [.3, -.1, .66, 1.08]] as const)
    .forEach(([dx, dy, k, f]) => (o += `<circle cx="${f1(c[0] + dx * r)}" cy="${f1(c[1] + dy * r)}" r="${f1(r * k)}" fill="${shade(base, f)}"/>`));
  return o + `<circle cx="${f1(c[0] - r * .38)}" cy="${f1(c[1] - r * .48)}" r="${f1(r * .34)}" fill="${P.arvoreLuz}" opacity=".85"/>`;
}

function pontosMata(x0: number, x1: number, y0: number, y1: number, passo: number, semente: number): [number, number, number][] {
  const h = (i: number) => { const t = Math.sin(i * 12.9898 + semente * 78.233) * 43758.5453; return t - Math.floor(t); };
  const out: [number, number, number][] = [];
  let i = 0, linha = 0;
  for (let y = y0; y <= y1; y += passo * .8, linha++) for (let x = x0 + (linha % 2) * passo / 2; x <= x1; x += passo) {
    i++;
    const px = x + (h(i) - .5) * passo * .45, py = y + (h(i + 97) - .5) * passo * .35;
    if (py < 14.3) continue;
    out.push([px, py, i]);
  }
  return out.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
}

function arvores(P: Paleta, lista: [number, number, number?, TipoArvore?][]): string {
  return lista.map(([x, y, s, t]) => arvore(x, y, P, s ?? 1, t ?? 'redonda')).join('');
}

function estanteLivros(x: number, y: number, P: Paleta): string {
  let o = box(x, y, 0, .9, .3, .9, P.madeira) + box(x - .05, y - .05, .9, 1.0, .4, .08, P.lc);
  const cores = [P.lc, P.ch, P.cn, P.mt, P.caneta, P.branco];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) o += faceY(y + .302, x + .08 + i * .13, x + .18 + i * .13, .12 + r * .4, .42 + r * .4, cores[(i + r) % 6]);
  return o;
}

function lousa(x: number, y: number, P: Paleta, texto: string, zb = 0, alto = 1.3): string {
  const meio = 30 / (.866 * U), z0 = zb + alto, z1 = z0 + 26 / U;
  return box(x - 1.12, y - .03, zb, .06, .06, alto + .1, P.ferro) + box(x + 1.06, y - .03, zb, .06, .06, alto + .1, P.ferro) +
    faceY(y + .04, x - meio - .08, x + meio + .08, z0 - .08, z1 + .08, P.madeira) + faceY(y + .045, x - meio, x + meio, z0, z1, '#24443A') +
    textoNoPlano(x, y + .05, (z0 + z1) / 2, texto, '#F4F5F9', 9);
}

function ponte(x0: number, x1: number, y: number, P: Paleta): string {
  if (P.decorado) return ponteDePedra(x0, x1, y + .25, .6, 'x', P);
  return box(x0, y, .18, x1 - x0, .5, .08, P.madeira) + linha3([[x0, y, .5], [x1, y, .5]], P.tronco, 1.4) + linha3([[x0, y + .5, .5], [x1, y + .5, .5]], P.tronco, 1.4) +
    [0, .25, .5, .75, 1].map(f => { const x = x0 + (x1 - x0) * f; return linha3([[x, y, .26], [x, y, .5]], P.tronco, 1.2) + linha3([[x, y + .5, .26], [x, y + .5, .5]], P.tronco, 1.2); }).join('');
}

function barraca(x: number, y: number, P: Paleta, cor: string): string {
  const t = 1.0;
  return sombraChao(x + .4, y + .4, .7, .35, P) + box(x, y, 0, .8, .8, .55, P.parede) + faceY(y + .802, x + .1, x + .7, .1, .45, P.madeira) +
    poly([[x - .1, y + .9, t - .25], [x + .9, y + .9, t - .25], [x + .9, y + .4, t + .15], [x - .1, y + .4, t + .15]], cor) +
    poly([[x + .9, y - .1, t - .25], [x + .9, y + .9, t - .25], [x + .9, y + .4, t + .15]], shade(cor, .78));
}

function colunaAntiga(x: number, y: number, h: number, P: Paleta): string {
  return box(x - .22, y - .22, 0, .44, .44, .12, P.concreto) + cilindro(x, y, .12, h, .15, '#E9E4D8') + box(x - .2, y - .2, .12 + h, .4, .4, .1, '#E2DCCD');
}

function cuboEscultura(x: number, y: number, P: Paleta): string {
  return box(x - .45, y - .45, 0, .9, .9, .25, P.concreto) + box(x - .3, y - .3, .25, .6, .6, .6, P.mt) + piramide(x, y, .85, .3, .7, P, P.noite ? '#7D89FF' : '#2836C6');
}

function globo(x: number, y: number, P: Paleta): string {
  const c = iso(x, y, 1.4), r = 15;
  return sombraChao(x, y, .6, .3, P) + box(x - .3, y - .3, 0, .6, .6, .45, P.concreto) + linha3([[x, y, .45], [x, y, .75]], P.ferro, 2) +
    `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="${P.ch}"/><path d="M${f1(c[0] - 9)},${f1(c[1] - 6)} q5,-4 9,1 q2,6 -4,9 q-6,-2 -5,-10 z M${f1(c[0] + 3)},${f1(c[1] + 2)} q6,-3 8,3 q-2,6 -7,5 z" fill="${P.cn}"/>` +
    `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${r}" ry="5" fill="none" stroke="#FFFFFF" stroke-width=".8" opacity=".7"/><ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="5" ry="${r}" fill="none" stroke="#FFFFFF" stroke-width=".8" opacity=".7"/>` +
    `<circle cx="${f1(c[0] - 5)}" cy="${f1(c[1] - 6)}" r="4" fill="#FFFFFF" opacity=".25"/>`;
}

function dinossauro(x: number, y: number, P: Paleta): string {
  const o = iso(x, y, .4), osso = P.noite ? '#C9CEE0' : '#F2EEE3';
  let s = box(x - .9, y - .5, 0, 1.8, 1.0, .25, P.concreto);
  s += `<g transform="translate(${f1(o[0])},${f1(o[1])})" stroke="${osso}" stroke-width="2.2" fill="none" stroke-linecap="round">`;
  s += `<path d="M-26,-6 q12,-16 30,-12 q14,3 22,-10"/><path d="M26,-28 q6,-2 8,3 l-6,2"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M${-14 + i * 6},${-12 - i} q2,8 0,11"/>`;
  s += `<path d="M-8,-8 l-3,12 M10,-12 l2,14"/></g>`;
  return s;
}

function colmeia(x: number, y: number, P: Paleta): string {
  return box(x, y, 0, .4, .4, .12, P.madeira) + box(x + .02, y + .02, .12, .36, .36, .22, '#F2C14E') + box(x + .02, y + .02, .34, .36, .36, .22, '#E9B23A') + box(x - .02, y - .02, .56, .44, .44, .05, P.madeira);
}


function trave(x: number, y: number, P: Paleta, cor: string): string {
  return linha3([[x, y - .45, 0], [x, y - .45, .7], [x, y + .45, .7], [x, y + .45, 0]], cor, 2.2);
}

function tabela(x: number, y: number, P: Paleta): string {
  return box(x - .04, y - .04, 0, .08, .08, 1.5, P.ferro) + faceX(x + .06, y - .38, y + .38, 1.3, 1.85, P.branco, ` stroke="${P.ferro}" stroke-width=".6"`);
}

function trilhaGeral(): Peca[] {
  const { lista, add } = criarTrilha('geral');
  const RC: Predio = { x: 10.7, y: 6.3, w: 4.6, d: 3, z0: .25, h: 1.3 };
  const topoRC = RC.z0 + 4 * RC.h + .22;
  const TR = { x: 12.35, y: 7.15, w: 1.3, d: 1.3 };
  const RA: Predio = { x: 6.4, y: 13.9, w: 3.0, d: 1.9, z0: .25, h: 1.2 };
  const RB: Predio = { x: 1.2, y: 13.9, w: 3.2, d: 1.9, z0: .25, h: 1.2 };
  const fonte = (n: number) => (P: Paleta) => {
    const c = iso(13, 13, 0);
    if (n === 1) return sombraChao(13, 13, .8, .4, P) + cilindro(13, 13, 0, .28, .7, P.concreto) + elipseChao(13, 13, .28, .58, P.agua) + `<g class="cv-jato"><path d="M${f1(c[0])},${f1(c[1] - 7)} l0,-10" stroke="${P.agua}" stroke-width="2.4" stroke-linecap="round"/></g>`;
    const t = iso(13, 13, n === 2 ? .87 : 1.5);
    let o = sombraChao(13, 13, 1.2, .6, P) + cilindro(13, 13, 0, .32, 1.05, P.concreto) + elipseChao(13, 13, .32, .9, P.agua);
    if (n === 3) o += cilindro(13, 13, .32, .55, .55, P.concreto) + elipseChao(13, 13, .87, .45, P.agua);
    o += cilindro(13, 13, n === 2 ? .32 : .87, .55, .12, P.concreto);
    o += `<g class="cv-jato"><path d="M${f1(t[0])},${f1(t[1])} q-8,-15 -18,6 M${f1(t[0])},${f1(t[1])} q8,-15 18,6 M${f1(t[0])},${f1(t[1])} l0,-15" stroke="${P.agua}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
    if (n === 3) [[-6, -22], [6, -22], [-6, -32], [6, -32]].forEach(([dx, dy], i) => o += i === 3 ? `<circle cx="${f1(t[0] + dx)}" cy="${f1(t[1] + dy)}" r="4.2" fill="none" stroke="${P.caneta}" stroke-width="1.8"/>` : `<circle cx="${f1(t[0] + dx)}" cy="${f1(t[1] + dy)}" r="4.5" fill="${P.caneta}"/>`);
    return o;
  };
  const portal = (n: number) => (P: Paleta) => {
    const y = n === 1 ? 19.6 : 25.2;
    if (n === 1) return box(11.3, y, 0, .16, .16, 1.4, P.tronco) + box(14.5, y, 0, .16, .16, 1.4, P.tronco) + linha3([[11.38, y + .08, 1.3], [14.58, y + .08, 1.3]], P.tronco, 2.2) + placaNoPortal(13, y + .17, P);
    if (n === 2) return box(11.1, y, 0, .4, .4, 1.8, P.concreto) + box(14.5, y, 0, .4, .4, 1.8, P.concreto) + box(11.0, y, 1.8, 4.0, .4, .3, P.concreto) + placa(13, y + .2, 1.85, P, 'Universidade', P.ferro, 72, .35);
    return box(11.0, y, 0, .45, .45, 2.1, P.parede) + box(14.55, y, 0, .45, .45, 2.1, P.parede) + box(10.9, y - .02, 2.1, 4.2, .5, .38, P.caneta) +
      simboloFaceY(y + .45, 11.22, 1.3, .38, P, P.branco) + simboloFaceY(y + .45, 14.77, 1.3, .38, P, P.branco) + placa(13, y + .25, 2.2, P, 'Universidade', P.caneta, 76, .45);
  };
  const mata = (n: number) => (P: Paleta) => {
    const xf = n <= 2 ? 19.8 : 25.8;
    let o = '';
    const passo = [0, 1.25, 1.25, 1.35, 1.25][n], esc = [0, .45, .6, .78, .88][n];
    for (const [x, y, i] of pontosMata(16.85, xf - .25, 14.35, 15.65, passo, n)) {
      if (x > 24.1 && y > 13.5) continue;
      const s = esc * (.85 + ((i * 37) % 10) / 33);
      o += n === 1 && i % 2 ? arvore(x, y, P, .55, 'arbusto') : arvoreMata(x, y, P, s, i);
    }
    if (n >= 3) for (const [x, y, i] of pontosMata(17.1, xf - .5, 14.6, 15.4, 2.3, 7 + n)) if (!(x > 24.1 && y > 13.5)) o += arvore(x + .4, y + .35, P, .5 + (i % 3) * .08, 'arbusto');
    if (n >= 2) for (let x = 16.7, k = 0; x < xf - .3; x += .85, k++) if (!(x > 24.1)) o += arvore(x, 14.12 + (k % 3) * .1, P, .45 + (k % 2) * .1, 'arbusto');
    return o;
  };
  const placaGeral = (n: number) => (P: Paleta) => {
    if (n === 1) return canteiro(10.6, 15.2, .9, .9, P);
    if (n === 2) return canteiro(10.6, 15.2, .9, .9, P) + poste(11.3, 15.9, P, 1.5);
    const base = box(10.2, 23.7, 0, 2.2, .5, .25, P.concreto);
    const t = iso(11.3, 24.0, .25);
    const letras = `<text transform="translate(${f1(t[0])} ${f1(t[1])}) skewY(30)" y="-2" text-anchor="middle" font-family="Schibsted Grotesk, Arial, sans-serif" font-size="12.5" font-weight="800" letter-spacing="-.3" fill="${P.caneta}" stroke="${P.noite ? '#0B1020' : '#FFFFFF'}" stroke-width="2.2" paint-order="stroke">UNIVERSIDADE</text>`;
    let o = base + letras;
    if (n === 4) o = (P.noite ? `<ellipse cx="${f1(t[0])}" cy="${f1(t[1] - 6)}" rx="64" ry="16" fill="${P.luz}" opacity=".22"/>` : '') + o + [-34, -12, 12, 34].map(dx => `<circle cx="${f1(t[0] + dx)}" cy="${f1(t[1] + 6)}" r="1.8" fill="${P.luz}"/>`).join('');
    return o;
  };

  add('Terreno da Universidade', 13, 13, () => '', { lote: [10, 10, 16, 16], camada: -1, anim: 'surge' });
  add('Canteiro da praça', 11, 15.6, placaGeral(1), { grupo: 'placa', nivel: 1 });
  add('Primeiros caminhos', 13, 13, P => caminho(12.5, 10, 13.5, 16, P) + caminho(10, 12.5, 16, 13.5, P), { camada: 0, anim: 'surge' });
  add('Árvore', 10.7, 10.8, P => arvore(10.7, 10.8, P), {});
  add('Banco', 20.7, 20.5, P => banco(20.6, 20.1, P, 'y'), {});
  add('Poste de luz', 15.4, 11.0, P => poste(15.4, 11.0, P), {});
  add('Praça · piso', 13, 13, P => topo(10.7, 10.7, 15.3, 15.3, .01, P.praca) + [11.7, 12.7, 13.7, 14.7].map(v => topo(v, 10.7, v + .04, 15.3, .011, P.caminho2) + topo(10.7, v, 15.3, v + .04, .011, P.caminho2)).join(''), { camada: 0, anim: 'surge' });
  add('Fonte simples', 13, 13, fonte(1), { grupo: 'fonte', nivel: 1, anim: 'cresce' });
  add('Terreno da entrada', 13, 18, P => caminho(12.5, 16, 13.5, 20, P), { lote: [10, 16, 16, 20], camada: 0, anim: 'surge' });
  add('Caminho até Natureza', 14.9, 18, P => caminho(13.5, 17.6, 16.3, 18.4, P), { camada: 0, anim: 'surge' });
  add('Portão simples', 13, 15.7, P => portaoSimples(15.72, P), { grupo: 'portal', nivel: 0, anim: 'cresce' });
  add('Portal de madeira', 13, 19.7, portal(1), { grupo: 'portal', nivel: 1, anim: 'cresce' });
  add('Canteiros da praça', 13, 13, P => canteiro(14.5, 10.75, .7, .45, P, 11) + canteiro(10.75, 14.5, .45, .7, P, 12), { chave: 25.1 });
  add('Terreno da reitoria', 13, 8, P => caminho(12.5, 9.3, 13.5, 10, P), { lote: [10, 6, 16, 10], camada: 0, anim: 'surge' });
  add('Reitoria · em obras', 13, 7.8, P => reitoriaEmObras(RC, P), { chave: k(RC), anim: 'cresce', grupo: 'reitoria-base', nivel: 1 });
  add('Reitoria · 1º andar', 13, 7.8, P => fundacao(RC, P) + andar(RC, 0, P, { pular: (i, n) => i === Math.floor(n / 2) }), { chave: k(RC), anim: 'cai', grupo: 'reitoria-base', nivel: 2 });
  add('Reitoria · entrada', 13, 9.5, P => entrada(RC, P, 13), { chave: k(RC), anim: 'brota' });
  add('Árvore da reitoria', 10.35, 7.6, P => arvore(10.35, 7.6, P, .9, 'alta'), {});
  add('Reitoria · 2º andar', 13, 7.8, P => andar(RC, 1, P), { chave: k(RC), anim: 'cai' });
  add('Reitoria · 3º andar', 13, 7.8, P => andar(RC, 2, P), { chave: k(RC), anim: 'cai' });
  add('Reitoria · 4º andar', 13, 7.8, P => andar(RC, 3, P), { chave: k(RC), anim: 'cai' });
  add('Reitoria · telhado', 13, 7.8, P => telhado(RC, 4, P, undefined, true), { chave: k(RC), anim: 'cai' });
  add('Canteiro com luminária', 11, 15.6, placaGeral(2), { grupo: 'placa', nivel: 2 });
  add('Terreno oeste', 8, 13, P => caminho(6, 12.5, 10, 13.5, P), { lote: [6, 10, 10, 16], camada: 0, anim: 'surge' });
  add('Estudantes na praça', 12, 12.2, P => pessoas(P, [[11.6, 12.0, 'caneta', 0, [1.6, 0, 7, 0]], [14.4, 14.2, 'linguagens', 2, [0, -1.5, 6, 2]]]), { chave: 26.2 });
  add('Terreno leste', 18, 13, P => caminho(16, 12.5, 17.4, 13.5, P), { lote: [16, 10, 20, 16], camada: 0, anim: 'surge' });
  add('Mudas da mata', 18.2, 15.6, mata(1), { grupo: 'mata', nivel: 1, anim: 'brota' });
  add('Fonte com três jatos', 13, 13, fonte(2), { grupo: 'fonte', nivel: 2, anim: 'cresce' });
  add('Torre do relógio · base', 13, 7.8, P => box(TR.x, TR.y, topoRC, TR.w, TR.d, 1.7, P.parede), { chave: k(RC) + .02, anim: 'cai' });
  add('Torre · relógio do dia', 13, 8.5, P => simboloFaceY(TR.y + TR.d, TR.x + TR.w / 2, topoRC + 1.0, .95, P, P.branco), { chave: k(RC) + .03, anim: 'brota' });
  add('Torre · cobertura', 13, 7.8, P => { const z = topoRC + 1.7, c = [TR.x + TR.w / 2, TR.y + TR.d / 2]; return box(TR.x - .08, TR.y - .08, z, TR.w + .16, TR.d + .16, .1, P.caneta) + poly([[TR.x - .05, TR.y + TR.d + .05, z + .1], [TR.x + TR.w + .05, TR.y + TR.d + .05, z + .1], [c[0], c[1], z + 1.0]], shade(P.caneta, .9)) + poly([[TR.x + TR.w + .05, TR.y - .05, z + .1], [TR.x + TR.w + .05, TR.y + TR.d + .05, z + .1], [c[0], c[1], z + 1.0]], shade(P.caneta, .72)); }, { chave: k(RC) + .04, anim: 'cai' });
  add('Residência A · fundação', 7.9, 14.8, P => fundacao(RA, P), { chave: k(RA), anim: 'cresce' });
  add('Residência A · 1º andar', 7.9, 14.8, P => andar(RA, 0, P, { passo: .75 }), { chave: k(RA), anim: 'cai' });
  add('Residência A · 2º andar', 7.9, 14.8, P => andar(RA, 1, P, { passo: .75 }), { chave: k(RA), anim: 'cai' });
  add('Residência A · varandas e telhado', 7.9, 14.8, P => { let o = telhado(RA, 2, P, P.ch) + entradaLateral(RA, P, RA.y + RA.d / 2, P.ch); for (let f = 0; f < 2; f++) for (let i = 0; i < 3; i++) { const x = RA.x + .25 + i * 1.0, z = RA.z0 + f * RA.h + .25; o += box(x, RA.y + RA.d, z, .7, .3, .06, P.concreto) + faceY(RA.y + RA.d + .3, x, x + .7, z + .06, z + .3, P.ch, ' fill-opacity=".85"'); } return o; }, { chave: k(RA) + .01, anim: 'cai' });
  add('Bosque jovem', 18.2, 15.6, mata(2), { grupo: 'mata', nivel: 2, anim: 'brota' });
  add('Terreno da entrada ampliado', 13, 23, P => caminho(12.5, 20, 13.5, 26, P), { lote: [10, 16, 16, 26], camada: 0, anim: 'surge' });
  add('Portal de concreto', 13, 25.4, portal(2), { grupo: 'portal', nivel: 2, anim: 'cresce' });
  add('Árvores na avenida', 13, 22.5, P => arvores(P, [[14.3, 21.0, .9, 'alta'], [11.7, 23.4, 1.05], [14.3, 24.3, .9, 'alta']]), {});
  add('Bicicletário', 11.2, 18.4, P => box(10.8, 18.3, 0, .9, .1, .06, P.ferro) + [0, .3, .6].map(i => { const a = iso(10.9 + i, 18.35, 0), b = iso(10.9 + i, 18.35, .42); return `<path d="M${f1(a[0] - 3)},${f1(a[1])} L${f1(b[0] - 3)},${f1(b[1] + 3)} Q${f1(b[0])},${f1(b[1] - 3)} ${f1(b[0] + 3)},${f1(b[1] + 3)} L${f1(a[0] + 3)},${f1(a[1])}" fill="none" stroke="${P.ferro}" stroke-width="1.6"/>`; }).join(''), {});
  add('Terreno leste ampliado', 22, 13, P => topo(16.6, 13.75, 25.8, 15.85, .011, shade(P.grama, P.noite ? .9 : .86)), { lote: [16, 10, 26, 16], camada: -1, anim: 'surge' });
  add('Mata', 21, 15.6, mata(3), { grupo: 'mata', nivel: 3, anim: 'brota', chave: 34.5 });
  add('Toras na trilha', 20.8, 12.4, P => [[18.3, 13.85], [22.6, 13.85]].map(([x, y], i) => box(x - .55, y - .16, 0, 1.1, .32, .3, P.tronco, { t: shade(P.tronco, 1.25), r: shade(P.tronco, .75) }) +
    (i % 2 ? '' : box(x + .65, y - .06, 0, .1, .1, .14, P.branco) + box(x + .6, y - .11, .14, .2, .2, .07, '#E5484D'))).join(''), { anim: 'cresce' });
  add('Terreno norte ampliado', 13, 3, () => '', { lote: [10, 0, 16, 10], camada: -1, anim: 'surge' });
  add('Jardim da reitoria', 13, 3.2, P => sebe(10.6, 1.0, 1.85, .3, .45, P) + sebe(13.55, 1.0, 1.85, .3, .45, P) + sebe(10.6, 1.0, .3, 4.4, .45, P) + sebe(15.1, 1.0, .3, 4.4, .45, P) + canteiro(11.0, 2.2, 1.3, .8, P, 21) + canteiro(13.7, 2.2, 1.3, .8, P, 22) + caminho(12.5, 1.0, 13.5, 6.1, P), { chave: 16.2 });
  add('Painéis solares da reitoria', 13, 7.8, P => { let o = ''; for (const x0 of [10.95, 11.55, 14.0, 14.6]) o += poly([[x0, 6.6, topoRC + .02], [x0 + .5, 6.6, topoRC + .02], [x0 + .5, 8.95, topoRC + .2], [x0, 8.95, topoRC + .2]], P.painel, ` stroke="${shade(P.painel, 1.6)}" stroke-width=".6"`); return o; }, { chave: k(RC) + .015, anim: 'cai' });
  add('Varal de luzes na praça', 13, 13, P => { const a = iso(10.9, 15.1, 1.5), b = iso(13, 13, 1.3), c = iso(15.1, 10.9, 1.5); const ps: number[][] = []; for (let i = 0; i <= 12; i++) { const t = i / 12, A = t < .5 ? a : b, B = t < .5 ? b : c, u = t < .5 ? t * 2 : (t - .5) * 2; ps.push([A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u + Math.sin(u * Math.PI) * 6]); } return poste(10.9, 15.1, P) + `<polyline points="${ps.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}" fill="none" stroke="${P.ferro}" stroke-width=".8"/>` + ps.map((p, i) => `<circle class="${P.noite ? 'cv-pisca' : ''}" style="animation-delay:-${i * .3}s" cx="${f1(p[0])}" cy="${f1(p[1] + 2)}" r="2.2" fill="${[P.luz, P.lc, P.ch, P.cn, P.mt][i % 5]}"/>`).join(''); }, { chave: 26.5, anim: 'surge' });
  add('Terreno oeste ampliado', 3, 13, P => caminho(0, 12.5, 6, 13.5, P), { lote: [0, 10, 10, 16], camada: 0, anim: 'surge' });
  add('Residência B · fundação', 2.8, 14.8, P => fundacao(RB, P), { chave: k(RB), anim: 'cresce' });
  add('Residência B · 1º andar', 2.8, 14.8, P => andar(RB, 0, P, { passo: .75 }), { chave: k(RB), anim: 'cai' });
  add('Residência B · 2º andar', 2.8, 14.8, P => andar(RB, 1, P, { passo: .75 }), { chave: k(RB), anim: 'cai' });
  add('Residência B · telhado', 2.8, 14.8, P => telhado(RB, 2, P, P.ch) + entradaLateral(RB, P, RB.y + RB.d / 2, P.ch), { chave: k(RB) + .01, anim: 'cai' });
  add('Monumento "Universidade"', 11.3, 24, placaGeral(3), { grupo: 'placa', nivel: 3, anim: 'cresce' });
  add('Portal com arco', 13, 25.4, portal(3), { grupo: 'portal', nivel: 3, anim: 'cresce' });
  add('Bandeira da Universidade', 15.4, 24.9, P => { const b = iso(15.4, 24.9, 3.2); return box(15.36, 24.86, 0, .08, .08, 3.2, P.ferro) + `<g class="cv-bandeira"><path d="M${f1(b[0])},${f1(b[1])} l24,3 l0,14 l-24,-3 Z" fill="${P.caneta}"/>${[[6, 6], [12, 6.8], [6, 12], [12, 12.8]].map(([dx, dy], i) => `<circle cx="${f1(b[0] + dx)}" cy="${f1(b[1] + dy)}" r="2.1" fill="${i < 3 ? '#FFFFFF' : 'none'}" stroke="#FFFFFF" stroke-width="1"/>`).join('')}</g>`; }, { anim: 'cresce' });
  add('Caixa d’água', 15.3, 1.2, P => [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]].map(([a, b]) => box(15.3 + a - .04, 1.2 + b - .04, 0, .08, .08, 1.7, P.ferro)).join('') + cilindro(15.3, 1.2, 1.7, .8, .6, P.parede) + cilindro(15.3, 1.2, 2.2, .12, .62, P.caneta), { anim: 'cresce' });
  add('Deque da mata', 20.9, 14.35, P => deque(20.2, 13.85, P), { anim: 'cresce' });
  add('Mata densa', 21, 15.6, mata(4), { grupo: 'mata', nivel: 4, anim: 'brota', chave: 34.5 });
  add('Cabana da trilha', 25.0, 15.1, P => {
    const x = 24.45, y = 14.55, w = 1.3, d = 1.05, h = .85, mad = P.noite ? shade(P.madeira, .6) : P.madeira;
    let o = sombraChao(x + w / 2, y + d / 2, .9, .45, P) + box(x, y, 0, w, d, h, mad, { l: mad, r: shade(mad, .82), t: shade(mad, .9) });
    for (let k = 1; k < 4; k++) o += linha3([[x, y + d + .003, k * h / 4], [x + w, y + d + .003, k * h / 4]], shade(mad, .7), .7);
    o += faceY(y + d + .005, x + .5, x + .8, 0, .6, shade(P.madeira, .5)) + faceY(y + d + .005, x + .12, x + .38, .32, .6, P.noite ? P.janela : '#A9D1F5');
    return o + poly([[x - .1, y - .1, h], [x + w + .1, y - .1, h], [x + w + .1, y + d / 2, h + .5], [x - .1, y + d / 2, h + .5]], shade(P.pinheiro, .8)) +
      poly([[x - .1, y + d / 2, h + .5], [x + w + .1, y + d / 2, h + .5], [x + w + .1, y + d + .1, h], [x - .1, y + d + .1, h]], P.pinheiro);
  }, { anim: 'cai' });
  add('Estudantes na trilha', 20.8, 12.9, P => pessoas(P, [[17.6, 13.0, 'humanas', 0, [6.5, 0, 9, 0]], [24.3, 12.8, 'naturezas', 1, [-6, 0, 9, 3]], [20.4, 13.15, 'exatas', 3, [3.5, 0, 6, 1]]]), {});
  add('Monumento iluminado', 11.3, 24, placaGeral(4), { grupo: 'placa', nivel: 4, anim: 'brota' });
  add('Fonte monumental', 13, 13, fonte(3), { grupo: 'fonte', nivel: 3, anim: 'cresce' });
  add('Passarinhos', 13, 0, () => '', { ceu: true, camada: 2, anim: 'surge' });
  add('Bandeiras das quatro áreas', 13, 25.8, P => [[10.6, P.lc], [11.6, P.ch], [14.4, P.cn], [15.4, P.mt]].map(([x, c]) => { const X = x as number, b = iso(X, 25.8, 2.4); return box(X - .03, 25.77, 0, .06, .06, 2.4, P.ferro) + `<path class="cv-bandeira" d="M${f1(b[0])},${f1(b[1])} l14,2 l0,9 l-14,-2 Z" fill="${c}"/>`; }).join(''), { anim: 'cresce' });
  add('Estudantes chegando', 13, 23.5, P => pessoas(P, [[12.8, 25.6, 'caneta', 1, [0, -3, 10, 0]], [13.2, 25.9, 'naturezas', 3, [0, -3.2, 10, 2]]]), {});
  add('Arvoredo no fundo', 13, .5, P => arvores(P, [[10.4, .4, 1, 'pinheiro'], [11.4, .3, 1.1, 'pinheiro'], [14.8, .4, 1, 'pinheiro']]), { chave: 1.0 });
  return comDiasFixos(lista);
}

function trilhaLinguagens(): Peca[] {
  const { lista, add } = criarTrilha('linguagens');
  const BI: Predio = { x: 5.7, y: 4.6, w: 3.6, d: 3.0, z0: .25, h: 1.5 };
  const TE = { x: .5, y: 4.3, w: 3.8, d: 3.3, z0: .3, h: 3.4 };
  const PX0 = 1.0, PX1 = 3.8;
  const RD: Predio = { x: 5.4, y: .6, w: 1.9, d: 1.4, z0: .2, h: 1.25 };
  const EI: Predio = { x: 8.0, y: .3, w: 1.8, d: 2.2, z0: .25, h: 1.15 };
  const CI: Predio = { x: .55, y: .35, w: 2.7, d: 3.0, z0: .2, h: 3.4 };
  const porta = { x0: 7.25, x1: 7.75 };
  const kT = TE.x + TE.w / 2 + TE.y + TE.d / 2;
  const nome = 'Linguagens';
  const pl = (_n: number) => (P: Paleta) => placaRegiao(1, 9.35, 9.55, P, nome, P.lc);
  const forecourt = (P: Paleta) => {
    let o = topo(.25, 8.45, 4.85, 9.95, .011, P.praca);
    for (let x = .85; x < 4.8; x += .6) o += topo(x, 8.45, x + .03, 9.95, .012, P.caminho2);
    return o + topo(.25, 9.9, 4.85, 9.95, .012, P.caminho2) + topo(.25, 8.45, .3, 9.95, .012, P.caminho2);
  };

  add('Terreno de Linguagens', 7.2, 6.9, loteRegiao([4.4, 3.8, 10, 10], 'linguagens'), { lote: [4.4, 3.8, 10, 10], grupo: 'lote-lc', nivel: 1, camada: 0, anim: 'surge' });
  add('Biblioteca · fundação', 7.5, 6.1, P => fundacao(BI, P), { chave: k(BI), anim: 'cresce' });
  add('Biblioteca · térreo simples', 7.5, 6.1, P => bibliotecaTerreoSimples(BI, P), { chave: k(BI), anim: 'cai' });
  add('Calçadão da biblioteca', 7.4, 8.9, P => caminho(4.85, 8.6, 10, 9.15, P) + caminho(7.2, 7.6, 7.8, 8.6, P), { camada: 0, anim: 'surge' });
  add('Canteiro da região', 9.35, 9.55, pl(1), { grupo: 'placa-lc', nivel: 1 });
  add('Biblioteca · 2º andar simples', 7.5, 6.1, P => bibliotecaAndarSimples(BI, P), { chave: k(BI) + .001, grupo: 'bib-andar2', nivel: 1, anim: 'cai' });
  add('Árvore', 9.7, 4.35, P => arvore(9.7, 4.35, P), {});
  add('Biblioteca · telhado simples', 7.5, 6.1, P => bibliotecaTelhadoSimples(BI, P, false), { chave: k(BI) + .002, grupo: 'bib-topo', nivel: 1, anim: 'cai' });
  add('Banco de leitura', 8.6, 9.4, P => banco(8.15, 9.3, P, 'x'), {});
  add('Biblioteca · entrada simples', 7.5, 8.0, P => bibliotecaEntradaSimples(BI, P, 7.5), { chave: k(BI) + .01, grupo: 'bib-entrada', nivel: 1, anim: 'brota' });
  add('Estudante lendo', 8.75, 9.5, P => pessoa(8.75, 9.5, P, P.lc, 0), {});
  add('Canteiro', 9.6, 6.1, P => canteiro(9.42, 4.95, .42, 2.3, P, 31), {});
  add('Biblioteca · letreiro simples', 7.5, 6.1, P => bibliotecaTelhadoSimples(BI, P, true), { chave: k(BI) + .002, grupo: 'bib-topo', nivel: 2, anim: 'cresce' });
  add('Árvore florida', 9.7, 8.0, P => arvore(9.68, 8.0, P, .85, 'florida'), {});
  add('Arbusto da calçada', 6.0, 8.3, P => arvore(6.0, 8.3, P, .5, 'arbusto'), {});
  add('Banco colorido', 5.6, 9.4, P => banco(5.2, 9.3, P, 'x', P.lc), {});
  add('Estudantes conversando', 6.5, 9.5, P => pessoas(P, [[6.3, 9.5, 'humanas', 1], [6.7, 9.55, 'exatas', 2]]), {});
  add('Terreno de Linguagens ampliado', 5, 6.9, loteRegiao([0, 3.8, 10, 10], 'linguagens'), { lote: [0, 3.8, 10, 10], grupo: 'lote-lc', nivel: 2, camada: 0, anim: 'surge' });
  add('Teatro · fundação e escadaria', 2.4, 6.0, P => teatroFundacao(TE, P, PX0, PX1), { chave: kT, anim: 'cresce' });
  add('Praça do teatro', 2.5, 9.2, forecourt, { camada: 0, anim: 'surge' });
  add('Teatro · em obras', 2.4, 6.0, P => obraDePredio({ x: TE.x + .3, y: TE.y + .25, w: TE.w - .6, d: TE.d - .5, z0: TE.z0, h: 0 }, P, P.lc), { chave: kT, grupo: 'teatro', nivel: 1, anim: 'cresce' });
  add('Luminária da região', 9.35, 9.55, pl(2), { grupo: 'placa-lc', nivel: 2 });
  add('Estante de troca de livros', 4.95, 8.3, P => estanteLivros(4.55, 8.15, P), {});
  add('Teatro · paredes', 2.4, 6.0, P => teatroSimples(TE, P, 1, (PX0 + PX1) / 2), { chave: kT, grupo: 'teatro', nivel: 2, anim: 'cai' });
  add('Jardim de leitura', 5.0, 4.3, P => canteiro(4.45, 3.95, 1.15, .45, P, 32), {});
  add('Luminárias do pátio', 5.0, 7.9, P => arvore(4.75, 7.85, P, .55, 'arbusto') + arvore(5.45, 5.95, P, .55, 'arbusto'), {});
  add('Teatro · 2º andar e telhado', 2.4, 6.0, P => teatroSimples(TE, P, 2, (PX0 + PX1) / 2), { chave: kT, grupo: 'teatro', nivel: 3, anim: 'cai' });
  add('Árvores', .3, 5.9, P => arvores(P, [[.22, 4.7, .95, 'alta'], [.25, 6.9, .8]]), {});
  add('Bilheteria', 4.4, 9.05, P => bilheteria(3.95, 8.7, P), {});
  add('Teatro · letreiro simples', 2.4, 6.0, P => teatroSimples(TE, P, 3, (PX0 + PX1) / 2), { chave: kT, grupo: 'teatro', nivel: 4, anim: 'cresce' });
  add('Fila do teatro', 2.4, 9.6, P => pessoas(P, [[1.6, 9.55, 'humanas', 0, [0, 0, 1, 0]], [2.05, 9.62, 'linguagens', 1, [0, 0, 1, 0]], [2.5, 9.55, 'caneta', 2, [0, 0, 1, 0]]]), {});
  add('Estátua do escritor', .8, 9.3, P => estatua(.85, 9.3, P), { anim: 'cresce' });
  add('Biblioteca · reforma do térreo', 7.5, 6.1, P => bibliotecaAndar(BI, 0, P, porta), { chave: k(BI), grupo: 'obra-linguagens', nivel: 3, anim: 'cai' });
  add('Palco do sarau', 5.05, 6.7, P => palcoSarau(4.45, 6.35, P), { anim: 'cresce' });
  add('Sarau no palco', 5.0, 6.8, P => `<g transform="translate(0 -6)">${pessoa(5.0, 6.75, P, P.lc, 1)}</g>`, {});
  add('Biblioteca · nova entrada', 7.5, 8.0, P => bibliotecaPorta(BI, P, porta.x0, porta.x1), { chave: k(BI) + .01, grupo: 'bib-entrada', nivel: 2, anim: 'brota' });
  add('Bicicletário', 6.3, 9.75, P => box(5.9, 9.7, 0, .9, .1, .06, P.ferro) + [0, .3, .6].map(i => { const a = iso(6.0 + i, 9.75, 0), b = iso(6.0 + i, 9.75, .42); return `<path d="M${f1(a[0] - 3)},${f1(a[1])} L${f1(b[0] - 3)},${f1(b[1] + 3)} Q${f1(b[0])},${f1(b[1] - 3)} ${f1(b[0] + 3)},${f1(b[1] + 3)} L${f1(a[0] + 3)},${f1(a[1])}" fill="none" stroke="${P.ferro}" stroke-width="1.6"/>`; }).join(''), {});
  add('Totem de poesia', 4.6, 9.75, P => box(4.55, 9.62, 0, .2, .2, 1.4, P.lc) + [0, 1, 2, 3].map(i => faceY(9.822, 4.57, 4.73, .3 + i * .25, .4 + i * .25, P.branco)).join(''), {});
  add('Biblioteca · reforma do 2º andar', 7.5, 6.1, P => bibliotecaAndar(BI, 1, P, null), { chave: k(BI) + .001, grupo: 'bib-andar2', nivel: 2, anim: 'cai' });
  add('Totem da região', 9.35, 9.55, pl(3), { grupo: 'placa-lc', nivel: 3, anim: 'cresce' });
  add('Lanternas do calçadão', 7.0, 9.3, P => arvore(6.95, 9.3, P, .55, 'arbusto') + arvore(9.85, 9.3, P, .55, 'arbusto'), {});
  add('Biblioteca · cobertura e letreiro', 7.5, 6.1, P => bibliotecaCobertura(BI, 2, P), { chave: k(BI) + .002, grupo: 'bib-topo', nivel: 3, anim: 'cai' });
  add('Estudante com violão', 9.75, 9.0, P => pessoa(9.75, 8.95, P, P.lc, 3) + (() => { const g = iso(9.75, 8.95, 0); return `<ellipse cx="${f1(g[0] + 3.5)}" cy="${f1(g[1] - 7)}" rx="2.6" ry="3.4" fill="${P.madeira}" transform="rotate(-30 ${f1(g[0] + 3.5)} ${f1(g[1] - 7)})"/>`; })(), {});
  add('Estudante escrevendo', 3.3, 9.7, P => pessoa(3.3, 9.7, P, P.mt, 2), {});
  add('Biblioteca · marquise de livro aberto', 7.5, 8.1, P => livroAberto(7.5, 7.6, 8.45, 1.84, P), { chave: k(BI) + .03, anim: 'cresce' });
  add('Livros gigantes', 4.95, 4.9, P => livrosGigantes(4.5, 4.6, P), {});
  add('Biblioteca · terraço de leitura', 7.5, 6.1, P => terracoLeitura({ ...BI, z0: BI.z0 + .27 }, 2, P, P.lc), { chave: k(BI) + .02, anim: 'cresce' });
  add('Terreno de Linguagens completo', 5, 5, loteRegiao([0, 0, 10, 10], 'linguagens'), { lote: [0, 0, 10, 10], grupo: 'lote-lc', nivel: 3, camada: 0, anim: 'surge' });
  add('Teatro · salão', 2.4, 6.0, P => teatroSalao(TE, P, PX0, PX1), { chave: kT, grupo: 'teatro', nivel: 5, anim: 'cai' });
  add('Teatro · cornija', 2.4, 6.0, P => teatroCornija(TE, P), { chave: kT, anim: 'cai' });
  add('Pinheiros no fundo', 2.0, 3.9, P => arvores(P, [[.25, 3.85, .9, 'pinheiro'], [7.0, 2.6, .8, 'alta']]), { chave: 4.1 });
  add('Bosque das letras', 4.4, 1.2, P => arvores(P, [[4.95, .3, 1.1, 'pinheiro'], [4.6, 1.65, .9, 'pinheiro']]), { chave: 5.0 });
  add('Teatro · caixa cênica', 2.4, 5.0, P => teatroCaixaCenica(TE, P), { chave: kT + .02, anim: 'cai' });
  add('Teatro · colunata', 2.4, 8.2, P => teatroPortico(TE, P, PX0, PX1), { chave: kT + .03, anim: 'cresce' });
  add('Árvores floridas', 4.6, 3.4, P => arvores(P, [[4.3, 3.3, .9, 'florida'], [5.5, 3.2, .8, 'florida']]), { chave: 7.0 });
  add('Árvore alta', 7.1, 3.6, P => arvore(7.1, 3.55, P, 1, 'alta'), { chave: 10.6 });
  add('Teatro · frontão com máscaras', 2.4, 8.2, P => teatroFrontao(TE, P, PX0, PX1), { chave: kT + .04, anim: 'cai' });
  add('Rádio do campus · estúdio', 6.35, 1.3, P => fundacao(RD, P) + andar(RD, 0, P, { passo: .7 }) + telhado(RD, 1, P, P.lc), { chave: k(RD), anim: 'cai' });
  add('Teatro · cartazes', 2.4, 7.7, P => teatroCartazes(TE, P, PX0, PX1), { chave: kT + .035 });
  add('Rádio · antena', 7.65, 2.85, P => antena(7.65, 2.85, 4.3, P, P.lc), { anim: 'cresce' });
  add('Teatro · letreiro luminoso', 4.6, 7.3, P => teatroLetreiro(TE, P), { chave: kT + .05, anim: 'cresce' });
  add('Café literário', 9.2, 3.4, P => quiosque(8.7, 2.95, P, P.lc, 'Café'), {});
  add('Escola de idiomas · fundação', 8.75, 1.5, P => fundacao(EI, P), { chave: k(EI), anim: 'cresce' });
  add('Teatro · estandartes', 4.6, 5.4, P => teatroEstandartes(TE, P), { chave: kT + .06 });
  add('Escola de idiomas · 1º andar', 8.75, 1.5, P => andar(EI, 0, P, { passo: .7 }), { chave: k(EI), anim: 'cai' });
  add('Rádio · sinal ao vivo', 6.35, 1.3, P => sinalAoVivo(RD, P), { chave: k(RD) + .01, anim: 'cresce' });
  add('Escola de idiomas · 2º andar', 8.75, 1.5, P => andar(EI, 1, P, { passo: .7 }), { chave: k(EI), anim: 'cai' });
  add('Teatro · luzes da fachada', 2.4, 8.6, P => teatroLuzes(TE, P, PX0, PX1), { chave: kT + .045, anim: 'surge' });
  add('Escola de idiomas · 3º andar', 8.75, 1.5, P => andar(EI, 2, P, { passo: .7 }), { chave: k(EI), anim: 'cai' });
  add('Escola de idiomas · telhado', 8.75, 1.5, P => telhado(EI, 3, P, P.lc) + entradaLateral(EI, P, EI.y + EI.d / 2, P.lc), { chave: k(EI) + .01, anim: 'cai' });
  add('Cinema · fundação', 1.9, 1.85, P => fundacao(CI, P), { chave: k(CI), anim: 'cresce' });
  add('Cinema · em obras', 1.9, 1.85, P => obraDePredio({ ...CI, h: 0 }, P, P.lc), { chave: k(CI), grupo: 'cinema', nivel: 1, anim: 'cresce' });
  add('Cinema · paredes', 1.9, 1.85, P => cinemaSimples(CI, P, 1), { chave: k(CI), grupo: 'cinema', nivel: 2, anim: 'cai' });
  add('Cinema · 2º andar e telhado', 1.9, 1.85, P => cinemaSimples(CI, P, 2), { chave: k(CI), grupo: 'cinema', nivel: 3, anim: 'cai' });
  add('Cinema · letreiro simples', 1.9, 1.85, P => cinemaSimples(CI, P, 3), { chave: k(CI), grupo: 'cinema', nivel: 4, anim: 'cresce' });
  add('Biblioteca · painéis solares', 7.5, 6.1, P => bibliotecaPaineis(BI, 2, P), { chave: k(BI) + .015, anim: 'cai' });
  add('Cinema · sala', 1.9, 1.85, P => cinemaCorpo(CI, P), { chave: k(CI), grupo: 'cinema', nivel: 5, anim: 'cai' });
  add('Cinema · cobertura', 1.9, 1.85, P => telhado(CI, 1, P, P.lc), { chave: k(CI), anim: 'cai' });
  add('Cinema · torre art déco', 3.4, 1.0, P => cinemaTorre(CI, P), { chave: k(CI) + .02, anim: 'cresce' });
  add('Cinema · marquise e letreiro', 3.8, 2.4, P => cinemaMarquise(CI, P), { chave: k(CI) + .03, anim: 'cresce' });
  add('Totem iluminado', 9.35, 9.55, pl(4), { grupo: 'placa-lc', nivel: 4, anim: 'brota' });
  return lista;
}

function trilhaHumanas(): Peca[] {
  const { lista, add } = criarTrilha('humanas');
  const TP = { x: 5.25, y: 16.45, w: 4.35, d: 4.2 };
  const kT = TP.x + TP.w / 2 + TP.y + TP.d / 2;
  const AR: Predio = { x: .55, y: 23.6, w: 2.7, d: 1.75, z0: .25, h: 1.25 };
  const CO: Coliseu = { cx: 2.72, cy: 19.4, ax: 2.2, ay: 2.85, aax: .8, aay: 1.42 };
  const kC = CO.cx + CO.cy;
  const GE: Predio = { x: 3.9, y: 24.3, w: 3.9, d: 1.4, z0: .2, h: 1.3 };
  const GL = { x: 10.6, y: 21.1 };
  const parAR = (P: Paleta) => (P.noite ? P.parede : '#F3EFE7');
  const nome = 'Humanas';
  const pl = (n: number) => (P: Paleta) => placaRegiao(n, 9.75, 16.4, P, nome, P.ch);
  add('Terreno de Humanas', 7.5, 18.5, loteRegiao([5, 16, 10, 21], 'humanas'), { lote: [5, 16, 10, 21], grupo: 'lote-ch', nivel: 1, camada: 0, anim: 'surge' });
  add('Templo · base', 7.4, 18, P => temploBase(TP, P), { chave: kT, anim: 'cresce' });
  add('Templo · cela', 7.4, 18, P => temploCela(TP, P), { chave: kT + .01, anim: 'cai' });
  add('Canteiro da região', 9.75, 16.4, pl(1), { grupo: 'placa-ch', nivel: 1 });
  add('Caminho do templo', 9.6, 18, P => caminho(9.6, 17.6, 12.5, 18.4, P), { camada: 0, anim: 'surge' });
  add('Templo · pilares', 7.4, 18, P => temploPilaresSimples(TP, P), { chave: kT + .02, grupo: 'templo-col', nivel: 1, anim: 'cresce' });
  add('Templo · laje provisória', 7.4, 18, P => temploLajeSimples(TP, P, false), { chave: kT + .03, grupo: 'templo-topo', nivel: 1, anim: 'cai' });
  add('Luminária da região', 9.75, 16.4, pl(2), { grupo: 'placa-ch', nivel: 2 });
  add('Templo · placa HUMANAS', 7.4, 18, P => temploLajeSimples(TP, P, true), { chave: kT + .03, grupo: 'templo-topo', nivel: 2, anim: 'cresce' });
  add('Terreno de Humanas ampliado', 7.5, 21, loteRegiao([5, 16, 10, 26], 'humanas'), { lote: [5, 16, 10, 26], grupo: 'lote-ch', nivel: 2, camada: 0, anim: 'surge' });
  add('Praça do globo', GL.x, GL.y, P => emEscala(GL.x, GL.y, .72, rosaDosVentos(GL.x, GL.y, P)), { camada: 0, anim: 'surge' });
  add('Globo · versão de praça', GL.x, GL.y, P => emEscala(GL.x, GL.y, .42, globoMonumental(GL.x, GL.y, P)), { grupo: 'globo', nivel: 1, anim: 'cresce' });
  add('Caminho do coliseu', 7.5, 21.15, P => caminho(5, 20.9, 10, 21.4, P), { camada: 0, anim: 'surge' });
  add('Jardim clássico · eixo', 8.0, 23.7, P => caminho(7.8, 21.4, 8.25, 26, P), { camada: 0, anim: 'surge' });
  add('Jardim clássico · sebes', 8.0, 22.85, P => [[6.3, 7.55], [8.5, 9.75]].map(([a, b]) => topo(a, 21.75, b, 23.95, .012, shade(P.grama, P.noite ? .95 : .93)) + sebe(a, 21.75, b - a, .2, .32, P) + sebe(a, 23.75, b - a, .2, .32, P) + sebe(a, 21.95, .2, 1.8, .32, P) + sebe(b - .2, 21.95, .2, 1.8, .32, P)).join(''), { anim: 'cresce', chave: 29.5 });
  add('Jardim clássico · topiarias', 8.0, 22.85, P => arvore(6.93, 22.85, P, .7, 'arbusto') + arvore(9.13, 22.85, P, .7, 'arbusto'), { anim: 'brota', chave: 29.6 });
  add('Totem da região', 9.75, 16.4, pl(3), { grupo: 'placa-ch', nivel: 3, anim: 'cresce' });
  add('Terreno de Humanas completo', 5, 21, loteRegiao([0, 16, 10, 26], 'humanas'), { lote: [0, 16, 10, 26], grupo: 'lote-ch', nivel: 3, camada: 0, anim: 'surge' });
  add('História · fundação', 1.9, 24.48, P => fundacao(AR, P), { chave: k(AR), anim: 'cresce' });
  add('História · 1º andar', 1.9, 24.48, P => andar(AR, 0, P, { parede: parAR(P), passo: .75 }), { chave: k(AR), anim: 'cai' });
  add('Coliseu · fundação', CO.cx, CO.cy, P => coliseuFundacao(CO, P), { chave: kC, anim: 'cresce' });
  add('História · 2º andar', 1.9, 24.48, P => andar(AR, 1, P, { parede: parAR(P), passo: .75 }), { chave: k(AR), anim: 'cai' });
  add('Coliseu · arena e hipogeu', CO.cx, CO.cy, P => coliseuArena(CO, P), { chave: kC + .001, anim: 'surge' });
  add('História · telhado simples', 1.9, 24.48, P => telhado(AR, 2, P, P.ch), { chave: k(AR) + .02, grupo: 'arq-topo', nivel: 1, anim: 'cai' });
  add('História · entrada', 1.9, 25.35, P => entrada(AR, P, 1.9, P.ch), { chave: k(AR) + .03 });
  add('Coliseu · 1º andar de arcos', CO.cx, CO.cy, P => coliseuNivel(CO, 0, P), { chave: kC + .002, anim: 'cai' });
  add('Geografia · fundação', 5.85, 25.0, P => fundacao(GE, P), { chave: k(GE), anim: 'cresce' });
  add('Geografia · paredes', 5.85, 25.0, P => andar(GE, 0, P, { parede: parAR(P), passo: .9, pular: (i) => i >= 1 && i <= 3 }), { chave: k(GE), anim: 'cai' });
  add('Geografia · telhado simples', 5.85, 25.0, P => telhado(GE, 1, P, P.ch), { chave: k(GE) + .02, grupo: 'geo-topo', nivel: 1, anim: 'cai' });
  add('Templo · colunata', 7.4, 18, P => temploColunata(TP, P), { chave: kT + .02, grupo: 'templo-col', nivel: 2, anim: 'cresce' });
  add('Coliseu · arquibancadas', CO.cx, CO.cy, P => coliseuArquibancadas(CO, P), { chave: kC + .003, anim: 'cresce' });
  add('Templo · friso HUMANAS', 7.4, 18, P => temploEntablamento(TP, P), { chave: kT + .03, grupo: 'templo-topo', nivel: 3, anim: 'cai' });
  add('Cipreste', 3.62, 24.15, P => arvore(3.62, 24.15, P, .9, 'alta'), {});
  add('Templo · frontão e telhado', 7.4, 18, P => temploFrontao(TP, P), { chave: kT + .04, anim: 'cai' });
  add('Globo terrestre monumental', GL.x, GL.y, P => emEscala(GL.x, GL.y, .72, globoMonumental(GL.x, GL.y, P)), { grupo: 'globo', nivel: 2, anim: 'cresce' });
  add('Templo · iluminação', 7.4, 18, P => temploLuzes(TP, P), { chave: kT + .05, anim: 'surge' });
  add('Coliseu · 2º andar de arcos', CO.cx, CO.cy, P => coliseuNivel(CO, 1, P), { chave: kC + .004, anim: 'cai' });
  add('História · pilastras', 1.9, 25.35, P => pilastras(AR, 2, P), { chave: k(AR) + .01, anim: 'cresce' });
  add('Coliseu · 3º andar de arcos', CO.cx, CO.cy, P => coliseuNivel(CO, 2, P), { chave: kC + .005, anim: 'cai' });
  add('História · frontão e telhado', 1.9, 24.48, P => telhadoClassico(AR, 2, P, 'y', 'HISTÓRIA'), { chave: k(AR) + .02, grupo: 'arq-topo', nivel: 2, anim: 'cai' });
  add('Geografia · mapa-múndi', 5.85, 25.8, P => { const Y = GE.y + GE.d + .004; let o = faceY(Y, 4.5, 7.3, GE.z0 + .2, GE.z0 + 1.1, P.noite ? '#1E3A55' : '#CFEAF7', ` stroke="${P.ch}" stroke-width="1"`); const blobs = [[4.9, .6, .25], [5.7, .75, .35], [6.5, .55, .3], [7.0, .85, .2]]; blobs.forEach(([x, z, r]) => { const pts: P3[] = []; for (let t = 0; t < 10; t++) { const a = t / 10 * Math.PI * 2; pts.push([x + Math.cos(a) * r, Y + .001, GE.z0 + z + Math.sin(a) * r * .55]); } o += poly(pts, P.cn); }); return o; }, { chave: k(GE) + .01 });
  add('Coliseu · ático e janelas', CO.cx, CO.cy, P => coliseuNivel(CO, 3, P), { chave: kC + .006, anim: 'cai' });
  add('Geografia · frontão e telhado', 5.85, 25.0, P => telhadoClassico(GE, 1, P, 'x', 'GEOGRAFIA'), { chave: k(GE) + .02, grupo: 'geo-topo', nivel: 2, anim: 'cai' });
  add('História · escadaria de mármore', 1.9, 25.6, P => escadariaMarmore(AR, P), { chave: k(AR) + .025, anim: 'cresce' });
  add('Geografia · estação meteorológica', 7.4, 25.0, P => estacaoMeteorologica(GE, 1, P), { chave: k(GE) + .03, anim: 'cresce' });
  add('História · estandartes', 1.9, 25.4, P => estandartes(AR, 2, P), { chave: k(AR) + .035, anim: 'brota' });
  add('Geografia · rosa dos ventos no frontão', 7.9, 25.0, P => rosaFrontao(GE, 1, P), { chave: k(GE) + .025, anim: 'brota' });
  add('História · relógio no frontão', 1.9, 25.45, P => relogioFrontao(AR, 2, P), { chave: k(AR) + .045, anim: 'brota' });
  add('Geografia · antena de satélite', 4.6, 25.0, P => antenaSatelite(GE, 1, P), { chave: k(GE) + .035, anim: 'cresce' });
  add('História · lanterna de cobre', 1.9, 24.48, P => lanternaCobre(AR, 2, P), { chave: k(AR) + .05, anim: 'cai' });
  add('Alameda de ciprestes', .42, 22.25, P => arvores(P, [[.42, 21.75, .85, 'alta'], [.42, 22.75, .85, 'alta']]), {});
  add('Coliseu · mastros do velário', CO.cx, CO.cy, P => coliseuMastros(CO, P), { chave: kC + .007 });
  add('Fragmentos romanos', 5.35, 22.8, P => colunaAntiga(5.1, 22.5, .5, P) + colunaAntiga(5.75, 23.0, .3, P) + box(5.15, 23.3, 0, .7, .2, .2, P.noite ? '#8E8AA8' : '#E2DCCD'), { anim: 'cresce' });
  add('Totem iluminado', 9.75, 16.4, pl(4), { grupo: 'placa-ch', nivel: 4 });
  add('Estátua da liberdade', 9.35, 25.25, P => estatuaLiberdade(9.35, 25.25, P), { anim: 'cresce' });
  add('Obelisco · monumento', 11.2, 16.85, P => obelisco(11.2, 16.85, P), { anim: 'cresce' });
  add('Coliseu · iluminação', CO.cx, CO.cy, P => coliseuLuzes(CO, P), { chave: kC + .008, anim: 'surge' });
  return lista;
}

function trilhaNaturezas(): Peca[] {
  const { lista, add } = criarTrilha('naturezas');
  const GH = { x: 16.35, y: 16.55, w: 4.3, d: 2.6 };
  const kE = GH.x + GH.w / 2 + GH.y + GH.d / 2;
  const QI: Predio = { x: 20.6, y: 23.6, w: 2.6, d: 2.0, z0: .25, h: 1.25 };
  const LF: Predio = { x: 16.6, y: 23.5, w: 3.0, d: 1.9, z0: .25, h: 1.4 };
  const nome = 'Naturezas';
  const pl = (n: number) => (P: Paleta) => placaRegiao(n, 16.4, 20.95, P, nome, P.cn);
  add('Terreno de Naturezas', 18.5, 18.5, loteRegiao([16, 16, 21, 21], 'naturezas'), { lote: [16, 16, 21, 21], grupo: 'lote-cn', nivel: 1, camada: 0, anim: 'surge' });
  add('Estufa · base', 18.5, 17.85, P => estufaBase(GH, P), { chave: kE, anim: 'cresce' });
  add('Estufa · estrutura metálica', 18.5, 17.85, P => estufaEstrutura(GH, P), { chave: kE + .02, anim: 'cresce' });
  add('Canteiro da região', 16.4, 20.95, pl(1), { grupo: 'placa-cn', nivel: 1 });
  add('Caminho da estufa', 18.5, 16.3, P => caminho(16, 16.1, 21, 16.55, P), { camada: 0, anim: 'surge' });
  add('Estufa · estufa simples', 18.5, 17.85, P => estufaSimples(GH, P), { chave: kE + .02, grupo: 'obra-naturezas', nivel: 3, anim: 'cresce' });
  add('Árvore', 20.85, 16.75, P => arvore(20.85, 16.75, P), {});
  add('Estufa · plantas', 18.5, 17.85, P => estufaPlantas(GH, P), { chave: kE + .01 });
  add('Espantalho', 18.1, 19.9, P => { const g = iso(18.1, 19.9, 0), t = iso(18.1, 19.9, 1.2); return `<line x1="${f1(g[0])}" y1="${f1(g[1])}" x2="${f1(t[0])}" y2="${f1(t[1])}" stroke="${P.tronco}" stroke-width="2"/><line x1="${f1(t[0] - 8)}" y1="${f1(t[1] + 6)}" x2="${f1(t[0] + 8)}" y2="${f1(t[1] + 6)}" stroke="${P.tronco}" stroke-width="2"/><rect x="${f1(t[0] - 4)}" y="${f1(t[1] + 3)}" width="8" height="9" rx="2" fill="${P.lc}"/><circle cx="${f1(t[0])}" cy="${f1(t[1])}" r="3.4" fill="#E8C98A"/><path d="M${f1(t[0] - 6)},${f1(t[1] - 2)} l12,0 l-3,-4 l-6,0 z" fill="${P.madeira}"/>`; }, { chave: 38.2 });
  add('Horta · canteiros', 18.1, 20, P => [0, 1, 2].map(i => box(16.5, 19.45 + i * .5, 0, 2.8, .32, .14, P.terra)).join(''), { anim: 'cresce' });
  add('Composteira', 20.65, 19.65, P => box(20.4, 19.4, 0, .55, .55, .45, P.madeira) + topo(20.45, 19.45, 20.9, 19.9, .46, P.terra), {});
  add('Horta · mudas', 18.1, 20, P => [0, 1, 2].map(i => Array.from({ length: 7 }, (_, j) => { const c = iso(16.7 + j * .4, 19.61 + i * .5, .22); return `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="2.6" fill="${j % 3 ? P.cn : P.arvore}"/>`; }).join('')).join(''), { chave: 38.15 });
  add('Colmeias e abelhas', 19.9, 20.45, P => colmeias(19.65, 20.3, P), { anim: 'cresce' });
  add('Estufa · placa ESTUFA', 18.5, 17.85, P => estufaSimples(GH, P, true), { chave: kE + .02, grupo: 'obra-naturezas', nivel: 4, anim: 'cresce' });
  add('Banco', 20.35, 18.2, P => banco(20.2, 17.8, P, 'y'), {});
  add('Horta · irrigação', 17.9, 20.1, P => hortaIrrigacao(P), { anim: 'surge' });
  add('Estudante regando', 18.0, 20.9, P => {
    const g = iso(18.0, 20.85, 0), rx = g[0] - 6, ry = g[1] - 7;
    const gotas = [0, 1, 2, 3].map(i => `<circle class="cv-gota" style="animation-delay:-${(i * .25).toFixed(2)}s" cx="${f1(rx - 3 - i * .8)}" cy="${f1(ry + 1)}" r="1.1" fill="#4FA3FF"/>`).join('');
    return pessoa(18.0, 20.85, P, P.cn, 0) + `<path d="M${f1(rx + 3)},${f1(ry - 1)} l-4,0 l-1,3 l5,0 z M${f1(rx - 1)},${f1(ry)} l-3,-2" fill="#3FA36B" stroke="#2C7A4E" stroke-width=".6"/>` + gotas;
  }, {});
  add('Luminária da região', 16.4, 20.95, pl(2), { grupo: 'placa-cn', nivel: 2 });
  add('Terreno de Naturezas ampliado', 20, 20, loteRegiao([16, 16, 24, 24], 'naturezas'), { lote: [16, 16, 24, 24], grupo: 'lote-cn', nivel: 2, camada: 0, anim: 'surge' });
  add('Cisterna · água da chuva', 21.55, 19.15, P => cisterna(21.55, 19.15, P, [21.3, 18.85, 1.3]), { anim: 'cresce' });
  add('Canteiro de flores', 19.9, 19.65, P => canteiro(19.5, 19.4, .8, .55, P, 51), {});
  add('Galpão · ferramentas', 22.8, 19.43, P => galpao(22.3, 19.0, P), { grupo: 'galpao', nivel: 1, anim: 'cresce' });
  add('Árvore frutífera', 20.85, 18.95, P => arvore(20.85, 18.95, P, .85, 'florida'), {});
  add('Pérgola · flores', 19.2, 21.6, P => pergola(18.5, 21.3, 1.4, .6, P), { anim: 'cresce' });
  add('Borboletas', 20.3, 19.6, P => { const c = iso(20.3, 19.6, .9); return `<g class="cv-anda" style="--dx:14px;--dy:-6px;animation-duration:3s"><path d="M${f1(c[0])},${f1(c[1])} l-3,-3 l0,6 z M${f1(c[0])},${f1(c[1])} l3,-3 l0,6 z" fill="${P.mt}"/></g><g class="cv-anda" style="--dx:-10px;--dy:-8px;animation-duration:2.6s"><path d="M${f1(c[0] + 8)},${f1(c[1] + 4)} l-3,-3 l0,6 z M${f1(c[0] + 8)},${f1(c[1] + 4)} l3,-3 l0,6 z" fill="${P.lc}"/></g>`; }, { chave: 40.2 });
  add('Galpão · telhado verde', 22.8, 19.43, P => galpao(22.3, 19.0, P, true), { grupo: 'galpao', nivel: 2, anim: 'surge' });
  add('Estudantes de jaleco', 19.2, 20.9, P => pessoas(P, [[18.9, 20.9, 'caneta', 2], [19.4, 20.95, 'naturezas', 3]]).replace(new RegExp(P.caneta, 'g'), P.branco), {});
  add('Poste', 16.25, 19.0, P => arvore(16.25, 19.0, P, .55, 'arbusto'), {});
  add('Lago', 21.9, 21.8, P => lago(21.9, 21.8, 1.5, 1.2, P), { camada: 0, anim: 'surge' });
  add('Ponte do lago', 21.9, 21.8, P => ponte(20.1, 23.7, 21.55, P), { chave: 43.6, anim: 'cresce' });
  add('Patos', 22.4, 22.4, P => { const c = iso(22.4, 22.4, .05); return [0, 1, 2].map(i => `<g class="cv-anda" style="--dx:${10 - i * 6}px;--dy:${-3 + i * 2}px;animation-duration:${5 + i}s"><ellipse cx="${f1(c[0] + i * 8)}" cy="${f1(c[1] + i * 3)}" rx="4" ry="2.4" fill="#FFFFFF"/><circle cx="${f1(c[0] + i * 8 + 3)}" cy="${f1(c[1] + i * 3 - 3)}" r="1.8" fill="#FFFFFF"/><path d="M${f1(c[0] + i * 8 + 4.5)},${f1(c[1] + i * 3 - 3)} l2,.6 l-2,.6 z" fill="${P.mt}"/></g>`).join(''); }, { chave: 44.9 });
  add('Estufa · alas de vidro', 18.5, 17.85, P => estufaAlas(GH, P), { chave: kE + .019, anim: 'cresce' });
  add('Fazenda solar', 22.3, 17.6, P => [17.0, 17.65, 18.3].map(y => [21.2, 22.1, 23.0].map(x => box(x + .38, y + .1, 0, .06, .06, .3, P.ferro) + poly([[x, y, .3], [x + .8, y, .3], [x + .8, y + .4, .5], [x, y + .4, .5]], P.painel, ` stroke="${shade(P.painel, 1.6)}" stroke-width=".6"`)).join('')).join(''), {});
  add('Caminho até o lago', 21.2, 18.5, P => caminho(21, 16.1, 24, 16.55, P) + caminho(20.65, 16.55, 21.1, 20.2, P), { camada: 0, anim: 'surge' });
  add('Árvores do lago', 22, 22, P => arvores(P, [[23.7, 20.2], [20.1, 23.6, .95], [23.6, 23.5, .9, 'outono']]), {});
  add('Postes do lago', 21, 20.4, P => poste(20.4, 20.3, P) + poste(23.6, 19.6, P), {});
  add('Bancos à beira do lago', 21.75, 20.3, P => banco(21.3, 20.15, P), {});
  add('Estufa · pavilhão central', 18.5, 17.85, P => estufaPavilhao(GH, P), { chave: kE + .02, grupo: 'obra-naturezas', nivel: 5, anim: 'cresce' });
  add('Estudantes na ponte', 21.9, 21.8, P => pessoas(P, [[21.4, 21.8, 'naturezas', 1], [22.4, 21.8, 'humanas', 2]]), { chave: 43.7 });
  add('Totem da região', 16.4, 20.95, pl(3), { grupo: 'placa-cn', nivel: 3, anim: 'cresce' });
  add('Estufa · cúpula de vidro', 18.5, 17.85, P => estufaCupula(GH, P), { chave: kE + .03, anim: 'cai' });
  add('Casinha de passarinho', 20.1, 22.6, P => { const t = iso(20.1, 22.6, 1.4); return box(20.06, 22.56, 0, .08, .08, 1.3, P.tronco) + box(19.95, 22.45, 1.3, .3, .3, .3, P.madeira) + poly([[19.92, 22.78, 1.6], [20.28, 22.78, 1.6], [20.1, 22.6, 1.85]], P.lc) + `<circle cx="${f1(t[0] - 3)}" cy="${f1(t[1] + 3)}" r="1.4" fill="${P.porta}"/>`; }, {});
  add('Pedras do lago', 21.9, 21.8, P => [[20.4, 21.0], [23.3, 22.6], [21.0, 23.0], [22.9, 20.7]].map(([x, y]) => { const c = iso(x, y, .08); return `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="5" ry="3" fill="${P.concreto}"/><ellipse cx="${f1(c[0] - 1)}" cy="${f1(c[1] - 1)}" rx="3" ry="1.6" fill="${shade(P.concreto, 1.1)}"/>`; }).join(''), { camada: 0, anim: 'brota' });
  add('Vitórias-régias', 21.9, 21.8, P => [[21.2, 21.3], [22.6, 22.2], [22.0, 22.6]].map(([x, y]) => { const c = iso(x, y, .03); return `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="4.5" ry="2.4" fill="${P.cn}"/><circle cx="${f1(c[0] + 1)}" cy="${f1(c[1] - 1)}" r="1.4" fill="#F4A6C0"/>`; }).join(''), { camada: 0, anim: 'brota' });
  add('Estufa · luzes da noite', 18.5, 17.85, P => estufaLuzes(GH, P), { chave: kE + .04, anim: 'surge' });
  add('Coleta seletiva', 16.4, 22.2, P => [[16.2, P.ch], [16.5, P.lc], [16.8, P.mt], [17.1, P.cn]].map(([x, c]) => box(x as number, 22.0, 0, .26, .26, .42, c as string)).join(''), {});
  add('Terreno de Naturezas completo', 21, 21, loteRegiao([16, 16, 26, 26], 'naturezas'), { lote: [16, 16, 26, 26], grupo: 'lote-cn', nivel: 3, camada: 0, anim: 'surge' });
  add('Química · fundação', 21.9, 24.6, P => fundacao(QI, P), { chave: k(QI), anim: 'cresce' });
  add('Química · térreo simples', 21.9, 24.6, P => andar(QI, 0, P, { passo: .75 }) + entrada(QI, P, QI.x + QI.w / 2, P.cn), { chave: k(QI), grupo: 'qui-0', nivel: 1, anim: 'cai' });
  add('Turbina eólica · torre', 25.0, 17.6, P => { const b = iso(25, 17.6, 0), t = iso(25, 17.6, 3.5); return sombraChao(25, 17.6, .5, .25, P) + `<path d="M${f1(b[0] - 3)},${f1(b[1])} L${f1(t[0] - 1.2)},${f1(t[1])} L${f1(t[0] + 1.2)},${f1(t[1])} L${f1(b[0] + 3)},${f1(b[1])} Z" fill="${P.parede}"/><path d="M${f1(b[0])},${f1(b[1])} L${f1(t[0])},${f1(t[1])} L${f1(t[0] + 1.2)},${f1(t[1])} L${f1(b[0] + 3)},${f1(b[1])} Z" fill="${shade(P.parede, .82)}"/>`; }, { anim: 'cresce' });
  add('Química · 2º andar simples', 21.9, 24.6, P => andar(QI, 1, P, { passo: .75 }), { chave: k(QI) + .001, grupo: 'qui-1', nivel: 1, anim: 'cai' });
  add('Turbina · pás', 25.0, 17.6, P => turbina(25, 17.6, 3.5, P), { chave: 42.61 });
  add('Química · telhado simples', 21.9, 24.6, P => telhado(QI, 2, P, P.cn, true), { chave: k(QI) + .002, grupo: 'qui-topo', nivel: 1, anim: 'cai' });
  add('Laboratório de física · fundação', 18.1, 24.45, P => fundacao(LF, P), { chave: k(LF), anim: 'cresce' });
  add('Física · paredes', 18.1, 24.45, P => andar(LF, 0, P, { passo: .8 }), { chave: k(LF), anim: 'cai' });
  add('Colmeias', 25, 25, P => colmeia(24.3, 24.4, P) + colmeia(24.95, 24.5, P) + colmeia(25.5, 24.3, P), {});
  add('Apicultora', 24.6, 25.4, P => pessoa(24.6, 25.45, P, P.branco, 1), {});
  add('Física · cúpula', 18.1, 24.45, P => telhado(LF, 1, P, P.cn) + cilindro(18.1, 24.45, LF.z0 + LF.h + .22, .25, .7, P.parede) + cupula(18.1, 24.45, LF.z0 + LF.h + .47, .7, P.cn), { chave: k(LF) + .01, anim: 'cai' });
  add('Viveiro de mudas', 25.1, 21.2, P => topo(24.4, 19.9, 25.8, 22.5, .01, P.terra) + Array.from({ length: 12 }, (_, i) => { const c = iso(24.6 + (i % 3) * .5, 20.1 + Math.floor(i / 3) * .6, .1); return `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="2.6" fill="${i % 2 ? P.cn : P.arvoreLuz}"/>`; }).join(''), { camada: 0, anim: 'surge' });
  add('Bosque', 24.5, 23.4, P => arvores(P, [[25.6, 23.2, 1, 'pinheiro'], [24.2, 23.4, .9, 'pinheiro'], [25.4, 19.0, .9]]), {});
  add('Química · laboratório', 21.9, 24.6, P => quimicaAndar(QI, 0, P), { chave: k(QI), grupo: 'qui-0', nivel: 2, anim: 'cai' });
  add('Trilha ecológica', 23.9, 21, P => topo(23.75, 16.6, 24.15, 25.8, .008, P.noite ? '#4A3A30' : '#D8C3A5'), { camada: 0, anim: 'surge' });
  add('Postes solares', 21, 24, P => arvore(19.9, 25.6, P, .55, 'arbusto') + arvore(23.9, 25.8, P, .55, 'arbusto'), {});
  add('Química · 2º andar', 21.9, 24.6, P => quimicaAndar(QI, 1, P), { chave: k(QI) + .001, grupo: 'qui-1', nivel: 2, anim: 'cai' });
  add('Bobina de Tesla', 20.2, 24.3, P => { const t = iso(20.2, 24.3, 1.9); return box(19.95, 24.05, 0, .5, .5, .3, P.concreto) + cilindro(20.2, 24.3, .3, 1.2, .12, P.bronze) + elipseChao(20.2, 24.3, 1.6, .3, P.concreto) + `<path class="cv-pisca" d="M${f1(t[0])},${f1(t[1] - 4)} l-5,-6 l3,0 l-4,-7 M${f1(t[0])},${f1(t[1] - 4)} l6,-5 l-3,-1 l5,-6" stroke="${P.noite ? '#B9C2FF' : '#7D89FF'}" stroke-width="1.4" fill="none"/>`; }, { anim: 'cresce' });
  add('Química · cobertura e letreiro', 21.9, 24.6, P => quimicaCobertura(QI, 2, P), { chave: k(QI) + .002, grupo: 'qui-topo', nivel: 2, anim: 'cai' });
  add('Observadores de aves', 24.1, 18.2, P => pessoas(P, [[24.0, 18.1, 'naturezas', 2], [24.3, 18.5, 'exatas', 0]]), {});
  add('Pluviômetro', 20.8, 22.8, P => box(20.75, 22.75, 0, .1, .1, .7, P.ferro) + cilindro(20.8, 22.8, .7, .25, .1, P.vidro), {});
  add('Química · hexágono do benzeno', 23.2, 24.6, P => quimicaHexagono(QI, 2, P), { chave: k(QI) + .01, anim: 'brota' });
  add('Girassóis', 16.6, 22.95, P => canteiro(16.1, 22.75, 1.0, .4, P, 52, ['#F2C14E', '#E9B23A']), {});
  add('Fóssil de dinossauro', 17.4, 22.0, P => dinossauro(17.4, 22.0, P), { anim: 'cresce' });
  add('Química · frasco gigante', 21.9, 24.6, P => frascoGigante(QI, 2, P), { chave: k(QI) + .03, anim: 'cresce' });
  add('Totem iluminado', 16.4, 20.95, pl(4), { grupo: 'placa-cn', nivel: 4 });
  add('Jato do lago', 21.9, 21.8, P => { const c = iso(21.9, 22.05, .05); return `<g class="cv-jato"><path d="M${f1(c[0])},${f1(c[1])} l0,-14 M${f1(c[0])},${f1(c[1])} q-5,-10 -10,2 M${f1(c[0])},${f1(c[1])} q5,-10 10,2" stroke="${P.aguaLuz}" stroke-width="2" fill="none" stroke-linecap="round"/></g>`; }, { chave: 43.95 });
  add('Química · tanques de reagentes', 21.9, 24.6, P => tanquesReagente({ ...QI, z0: QI.z0 + .24, x: QI.x - .1 }, 2, P, P.cn), { chave: k(QI) + .02, anim: 'cresce' });
  add('Painéis solares da química', 21.9, 24.6, P => { const z = QI.z0 + 2 * QI.h + .48; return poly([[22.6, 23.8, z], [23.05, 23.8, z], [23.05, 24.6, z + .18], [22.6, 24.6, z + .18]], P.painel, ` stroke="${shade(P.painel, 1.6)}" stroke-width=".6"`); }, { chave: k(QI) + .015, anim: 'cai' });
  add('Árvores floridas', 17, 21, P => arvores(P, [[16.3, 21.6, .8, 'florida'], [19.3, 22.8, .75, 'florida']]), {});
  add('Comedouro de pássaros', 17.4, 25.8, P => box(17.36, 25.76, 0, .08, .08, 1.0, P.tronco) + elipseChao(17.4, 25.8, 1.0, .25, P.madeira), {});
  add('Estudantes no bosque', 25, 22.4, P => pessoas(P, [[25.2, 22.7, 'linguagens', 1, [0, -1.2, 6, 0]]]), {});
  add('Lanternas da trilha', 23.95, 20, P => arvore(24.3, 21.0, P, .55, 'arbusto') + arvore(24.3, 23.9, P, .55, 'arbusto'), {});
  add('Ponte iluminada', 21.9, 21.8, P => [20.2, 21.3, 22.5, 23.6].map(x => { const c = iso(x, 21.55, .58); return `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="1.8" fill="${P.luz}"/>` + (P.noite ? `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="6" fill="${P.luz}" opacity=".25"/>` : ''); }).join(''), { chave: 43.65 });
  add('Jardim de suculentas', 25.05, 25.6, P => canteiro(24.4, 25.45, 1.3, .35, P, 53, [P.cn, P.arvoreLuz, '#7BC9A6']), {});
  add('Árvore centenária', 18.0, 23.0, P => arvore(18.0, 22.95, P, 1.7), {});
  return lista;
}

function trilhaExatas(): Peca[] {
  const { lista, add } = criarTrilha('exatas');
  const OB = { cx: 18.3, cy: 7.5 };
  const kO = OB.cx + OB.cy;
  const CC: Predio = { x: 21.3, y: 5.5, w: 2.8, d: 3.1, z0: .25, h: 1.2 };
  const IM: Predio = { x: 16.4, y: .45, w: 4.2, d: 2.0, z0: .25, h: 1.25 };
  const porta = { x0: 22.45, x1: 22.95 };
  const BK: Predio = { x: 22.75, y: .75, w: 2.7, d: 2.2, z0: .32, h: 0 };
  const kB = BK.x + BK.w / 2 + BK.y + BK.d / 2;
  const nome = 'Matemática';
  const pl = (n: number) => (P: Paleta) => placaRegiao(n, 20.6, 9.55, P, nome, P.mt);
  add('Terreno de Matemática', 18.5, 7.5, loteRegiao([16, 5, 21, 10], 'exatas'), { lote: [16, 5, 21, 10], grupo: 'lote-mt', nivel: 1, camada: 0, anim: 'surge' });
  add('Observatório · base', OB.cx, OB.cy, P => observatorioBase(OB, P), { chave: kO, anim: 'cresce' });
  add('Observatório · torre simples', OB.cx, OB.cy, P => observatorioTorreSimples(OB, P), { chave: kO + .01, anim: 'cai' });
  add('Canteiro da região', 20.6, 9.55, pl(1), { grupo: 'placa-mt', nivel: 1 });
  add('Caminho do observatório', 18.5, 9.5, P => caminho(16, 9.3, 21, 9.75, P) + caminho(18.0, 9.2, 18.6, 9.3, P) + caminho(18.15, 9.75, 18.65, 10.1, P), { camada: 0, anim: 'surge' });
  add('Observatório · cúpula simples', OB.cx, OB.cy, P => observatorioCupulaSimples(OB, P), { chave: kO + .03, grupo: 'obs-cupula', nivel: 1, anim: 'cai' });
  add('Árvore', 20.6, 5.4, P => arvore(20.6, 5.4, P), {});
  add('Relógio de sol', 16.55, 9.45, P => { const c = iso(16.55, 9.45, .3), t = iso(16.55, 9.45, .9); return cilindro(16.55, 9.45, 0, .3, .42, P.concreto) + elipseChao(16.55, 9.45, .3, .34, P.branco) + `<polygon points="${f1(c[0])},${f1(c[1])} ${f1(t[0])},${f1(t[1])} ${f1(c[0] + 8)},${f1(c[1] + 3)}" fill="${P.mt}"/>`; }, { anim: 'cresce' });
  add('Banco', 16.4, 5.8, P => banco(16.2, 5.4, P, 'y'), {});
  add('Poste', 16.3, 8.9, P => arvore(16.3, 8.9, P, .55, 'arbusto'), {});
  add('Estudante calculando', 19.6, 8.95, P => pessoa(19.6, 8.95, P, P.mt, 2), {});
  add('Canteiro', 17.0, 5.3, P => canteiro(16.7, 5.15, 1.0, .3, P, 61), {});
  add('Árvore alta', 16.3, 6.7, P => arvore(16.3, 6.75, P, .8, 'alta'), {});
  add('Telescópio portátil', 19.6, 9.9, P => { const g = iso(19.6, 9.9, 0), t = iso(19.6, 9.9, .7); return `<path d="M${f1(g[0] - 4)},${f1(g[1])} L${f1(t[0])},${f1(t[1])} L${f1(g[0] + 4)},${f1(g[1])} M${f1(t[0])},${f1(t[1])} L${f1(g[0])},${f1(g[1] + 2)}" stroke="${P.ferro}" stroke-width="1.2" fill="none"/><rect x="${f1(t[0] - 2)}" y="${f1(t[1] - 10)}" width="4" height="13" rx="1.5" fill="${P.mt}" transform="rotate(-40 ${f1(t[0])} ${f1(t[1])})"/>`; }, {});
  add('Estudantes medindo', 19.6, 5.6, P => pessoas(P, [[19.5, 5.5, 'exatas', 1], [19.9, 5.75, 'caneta', 3]]), {});
  add('Luminária da região', 20.6, 9.55, pl(2), { grupo: 'placa-mt', nivel: 2 });
  add('Terreno de Matemática ampliado', 20, 6, loteRegiao([16, 2, 24, 10], 'exatas'), { lote: [16, 2, 24, 10], grupo: 'lote-mt', nivel: 2, camada: 0, anim: 'surge' });
  add('Caminho das exatas', 21, 9.5, P => caminho(21, 9.3, 26, 9.75, P) + caminho(20.75, 2.4, 21.1, 9.3, P) + caminho(22.45, 8.6, 22.95, 9.3, P), { camada: 0, anim: 'surge' });
  add('Computação · fundação', 22.7, 7.05, P => fundacao(CC, P), { chave: k(CC), anim: 'cresce' });
  add('Computação · térreo simples', 22.7, 7.05, P => andar(CC, 0, P, { passo: .7 }) + entrada(CC, P, (porta.x0 + porta.x1) / 2, P.mt), { chave: k(CC), grupo: 'cc-0', nivel: 1, anim: 'cai' });
  add('Árvore', 16.5, 8.2, P => arvore(16.45, 8.2, P, .8), {});
  add('Fractal no chão', 20.4, 8.5, P => { let o = ''; const tri = (x: number, y: number, s: number, n: number): void => { if (n === 0) { o += poly([[x, y + s, .02], [x + s, y + s, .02], [x + s / 2, y, .02]], P.mt); return; } tri(x, y + s / 2, s / 2, n - 1); tri(x + s / 2, y + s / 2, s / 2, n - 1); tri(x + s / 4, y, s / 2, n - 1); }; tri(19.9, 7.75, 1.0, 2); return o; }, { camada: 0, anim: 'surge' });
  add('Computação · 2º andar simples', 22.7, 7.05, P => andar(CC, 1, P, { passo: .7 }), { chave: k(CC) + .001, grupo: 'cc-1', nivel: 1, anim: 'cai' });
  add('Radiotelescópio', 20.35, 6.7, P => radiotelescopio(20.35, 6.7, P, P.mt), { anim: 'cresce' });
  add('Computação · 3º andar simples', 22.7, 7.05, P => andar(CC, 2, P, { passo: .7 }), { chave: k(CC) + .002, grupo: 'cc-2', nivel: 1, anim: 'cai' });
  add('Computação · telhado simples', 22.7, 7.05, P => telhado(CC, 3, P, P.mt, true), { chave: k(CC) + .003, grupo: 'cc-topo', nivel: 1, anim: 'cai' });
  add('Pirâmide de vidro', 18.0, 4.05, P => sombraChao(18.0, 4.05, 1.5, .75, P) + box(16.75, 2.8, 0, 2.5, 2.5, .12, P.concreto) + piramide(18.0, 4.05, .12, 1.15, 1.9, P), { anim: 'cresce' });
  add('Sólidos geométricos', 20.3, 3.0, P => cuboEscultura(20.3, 3.0, P), { anim: 'cresce' });
  add('Observatório · torre com vitrais', OB.cx, OB.cy, P => observatorioTorre(OB, P), { chave: kO + .01, grupo: 'obra-exatas', nivel: 3, anim: 'cai' });
  add('Árvores', 21.4, 2.5, P => arvores(P, [[21.4, 2.5, .9]]), {});
  add('Postes', 22.5, 6, P => arvore(21.05, 5.2, P, .55, 'arbusto') + arvore(24.4, 9.05, P, .55, 'arbusto'), {});
  add('Observatório · galeria', OB.cx, OB.cy, P => observatorioGaleria(OB, P), { chave: kO + .02, anim: 'cai' });
  add('Bancos da pirâmide', 18, 5.6, P => banco(17.4, 5.45, P), {});
  add('Estudantes na pirâmide', 18.6, 5.55, P => pessoas(P, [[18.6, 5.55, 'exatas', 0, [-1, 0, 6, 0]]]), {});
  add('Observatório · cúpula dourada', OB.cx, OB.cy, P => observatorioCupula(OB, P), { chave: kO + .03, grupo: 'obs-cupula', nivel: 2, anim: 'cai' });
  add('Totem da região', 20.6, 9.55, pl(3), { grupo: 'placa-mt', nivel: 3, anim: 'cresce' });
  add('Robô passeando', 21.6, 9.55, P => { const g = iso(21.6, 9.55, 0); return `<g transform="translate(${f1(g[0])},${f1(g[1])})"><g class="cv-anda" style="--dx:16px;--dy:9px;animation-duration:7s"><ellipse rx="4" ry="1.6" fill="${P.sombra}"/><rect x="-3.5" y="-9" width="7" height="8" rx="2" fill="${P.branco}" stroke="${P.ferro}" stroke-width=".8"/><circle cx="-1.4" cy="-6" r="1" fill="${P.ch}"/><circle cx="1.4" cy="-6" r="1" fill="${P.ch}"/><line x1="0" y1="-9" x2="0" y2="-12" stroke="${P.ferro}"/><circle cx="0" cy="-12.5" r="1.2" fill="${P.mt}"/></g></g>`; }, {});
  add('Observatório · telescópio', OB.cx, OB.cy, P => observatorioTelescopio(OB, P), { chave: kO + .04, anim: 'cresce' });
  add('Monitoria ao ar livre', 22.0, 4.75, P => box(21.5, 4.5, .32, 1.0, .5, .06, P.madeira) + box(21.95, 4.7, 0, .1, .1, .32, P.ferro) + pessoas(P, [[21.6, 5.2, 'exatas', 2], [22.4, 5.2, 'humanas', 0]]), {});
  add('Gráfico de barras gigante', 23.5, 4.65, P => ([[P.lc, .7], [P.ch, 1.1], [P.cn, .9], [P.mt, 1.4]] as [string, number][]).map(([c, h], i) => box(23.0 + i * .26, 4.45, 0, .2, .3, h, c)).join(''), { anim: 'cresce' });
  add('Observatório · luzes da galeria', OB.cx, OB.cy, P => observatorioLuzes(OB, P), { chave: kO + .05, anim: 'surge' });
  add('Lousa do π', 20.0, 4.7, P => placaPi(19.95, 4.65, P), { anim: 'cresce' });
  add('Estudantes na lousa', 20.2, 5.3, P => pessoas(P, [[19.7, 5.3, 'linguagens', 0], [20.2, 5.35, 'caneta', 3]]), {});
  add('Computação · laboratório', 22.7, 7.05, P => computacaoAndar(CC, 0, P, porta), { chave: k(CC), grupo: 'cc-0', nivel: 2, anim: 'cai' });
  add('Computação · entrada', 22.7, 8.9, P => computacaoEntrada(CC, P, porta.x0, porta.x1), { chave: k(CC) + .01, anim: 'brota' });
  add('Computação · sala de servidores', 22.7, 7.05, P => computacaoAndar(CC, 1, P, null), { chave: k(CC) + .001, grupo: 'cc-1', nivel: 2, anim: 'cai' });
  add('Terreno de Matemática completo', 21, 5, loteRegiao([16, 0, 26, 10], 'exatas'), { lote: [16, 0, 26, 10], grupo: 'lote-mt', nivel: 3, camada: 0, anim: 'surge' });
  add('Instituto de Matemática · fundação', 18.5, 1.45, P => fundacao(IM, P), { chave: k(IM), anim: 'cresce' });
  add('Computação · andar do código', 22.7, 7.05, P => computacaoAndar(CC, 2, P, null), { chave: k(CC) + .002, grupo: 'cc-2', nivel: 2, anim: 'cai' });
  add('Instituto · 1º andar', 18.5, 1.45, P => andar(IM, 0, P, { passo: .7, parede: P.noite ? P.parede : '#F6F1E8' }), { chave: k(IM), anim: 'cai' });
  add('Computação · cobertura e letreiro', 22.7, 7.05, P => computacaoCobertura(CC, 3, P), { chave: k(CC) + .003, grupo: 'cc-topo', nivel: 2, anim: 'cai' });
  add('Instituto · 2º andar', 18.5, 1.45, P => andar(IM, 1, P, { passo: .7, parede: P.noite ? P.parede : '#F6F1E8' }), { chave: k(IM), anim: 'cai' });
  add('Computação · cubo </> luminoso', 22.7, 7.05, P => computacaoCubo(CC, 3, P), { chave: k(CC) + .03, anim: 'cresce' });
  add('Instituto · 3º andar', 18.5, 1.45, P => andar(IM, 2, P, { passo: .7, parede: P.noite ? P.parede : '#F6F1E8' }), { chave: k(IM), anim: 'cai' });
  add('Banco · fundação', 24.1, 1.85, P => bancoFundacao(BK, P), { chave: kB, anim: 'cresce' });
  add('Instituto · telhado simples', 18.5, 1.45, P => telhado(IM, 3, P, P.mt) + entrada(IM, P, IM.x + IM.w / 2, P.mt), { chave: k(IM) + .01, grupo: 'im-topo', nivel: 1, anim: 'cai' });
  add('Computação · faixa de bits', 24.1, 8.3, P => computacaoBits(CC, 3, P), { chave: k(CC) + .02, anim: 'surge' });
  add('Banco · paredes', 24.1, 1.85, P => bancoObra(BK, P), { chave: kB + .01, grupo: 'banco', nivel: 1, anim: 'cai' });
  add('Computação · painéis e antena', 22.7, 7.05, P => computacaoTelhadoExtras(CC, 3, P), { chave: k(CC) + .015, anim: 'cai' });
  add('Banco · primeira versão', 24.1, 1.85, P => bancoSimples(BK, P), { chave: kB + .01, grupo: 'banco', nivel: 2, anim: 'cresce' });
  add('Caminho do banco', 22.4, 4.0, P => caminho(21.1, 3.8, 25.6, 4.25, P) + caminho(23.85, 3.35, 24.35, 3.8, P), { camada: 0, anim: 'surge' });
  add('Instituto · letreiro MATEMÁTICA', 18.5, 1.45, P => institutoCobertura(IM, 3, P) + entrada(IM, P, IM.x + IM.w / 2, P.mt), { chave: k(IM) + .01, grupo: 'im-topo', nivel: 2, anim: 'cai' });
  add('Tabuleiro de xadrez gigante', 25.25, 5.25, P => xadrez(24.5, 4.55, P), { camada: 0, anim: 'surge' });
  add('Instituto · fórmula na fachada', 18.5, 2.5, P => institutoFormula(IM, 2, P), { chave: k(IM) + .02, anim: 'brota' });
  add('Peças de xadrez', 25.25, 5.25, P => ([[24.68, 4.73, P.branco], [25.73, 5.43, P.ferro], [25.03, 5.78, P.branco], [25.38, 4.73, P.ferro]] as [number, number, string][]).map(([x, y, c]) => cilindro(x, y, 0, .42, .1, c) + elipseChao(x, y, .46, .085, c)).join(''), {});
  add('Monumento ao infinito', 25.4, 7.2, P => { const c = iso(25.4, 7.2, 1.3); return box(25.0, 6.8, 0, .8, .8, .5, P.concreto) + `<path d="M${f1(c[0])},${f1(c[1])} c-6,-8 -16,-8 -16,0 c0,8 10,8 16,0 c6,-8 16,-8 16,0 c0,8 -10,8 -16,0 z" fill="none" stroke="${P.mt}" stroke-width="3.2"/>`; }, { anim: 'cresce' });
  add('Instituto · torre Σ', 18.5, 1.45, P => institutoTorre(IM, 3, P), { chave: k(IM) + .03, anim: 'cai' });
  add('Braço robótico', 25.3, 9.3, P => { const g = iso(25.3, 9.3, .3); return box(25.0, 9.0, 0, .6, .6, .3, P.concreto) + `<g stroke="${P.mt}" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M${f1(g[0])},${f1(g[1])} l0,-12 l10,-8 l6,6"/></g><circle cx="${f1(g[0])}" cy="${f1(g[1] - 12)}" r="2.4" fill="${P.ferro}"/><circle cx="${f1(g[0] + 10)}" cy="${f1(g[1] - 20)}" r="2.2" fill="${P.ferro}"/>`; }, {});
  add('Pinheiros no fundo', 21, .3, P => arvores(P, [[21.0, .3, 1, 'pinheiro']]), { chave: 22.0 });
  add('Canteiros geométricos', 24.9, 8.2, P => canteiro(24.4, 7.95, .5, .5, P, 62) + canteiro(25.1, 7.95, .5, .5, P, 63), {});
  add('Bancos da torre', 24.9, 9.5, P => banco(24.1, 9.85, P, 'x', P.mt), {});
  add('Totem iluminado', 20.6, 9.55, pl(4), { grupo: 'placa-mt', nivel: 4 });
  add('Árvores floridas', 18.6, 2.9, P => arvores(P, [[16.35, 4.3, .8, 'florida'], [20.55, 2.0, .75, 'florida']]), {});
  add('Esfera armilar', 17.4, 9.95, P => { const c = iso(17.4, 9.95, 1.1); return box(17.2, 9.75, 0, .4, .4, .5, P.concreto) + `<g fill="none" stroke="${P.bronze}" stroke-width="1.6"><circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="9"/><ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="9" ry="3.2"/><ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="3.2" ry="9" transform="rotate(25 ${f1(c[0])} ${f1(c[1])})"/></g>`; }, { anim: 'cresce' });
  add('Lanternas', 18, 9.6, P => arvore(17.0, 9.85, P, .55, 'arbusto') + arvore(19.25, 9.85, P, .55, 'arbusto'), {});
  add('Pirâmide iluminada', 18.0, 4.05, P => { const t = iso(18.0, 4.05, 2.02); return `<circle cx="${f1(t[0])}" cy="${f1(t[1])}" r="${P.noite ? 9 : 3}" fill="${P.luz}" opacity="${P.noite ? .5 : .9}"/><circle cx="${f1(t[0])}" cy="${f1(t[1])}" r="2.2" fill="${P.luz}"/>`; }, { chave: 22.06 });
  add('Ábaco gigante', 22.1, 1.5, P => { let o = box(21.65, 1.25, 0, .1, .1, 1.3, P.madeira) + box(22.45, 1.25, 0, .1, .1, 1.3, P.madeira) + box(21.6, 1.2, 1.3, 1.0, .2, .08, P.madeira); for (let r = 0; r < 4; r++) { const z = .35 + r * .25; o += linha3([[21.7, 1.3, z], [22.5, 1.3, z]], P.ferro, .8); for (let i = 0; i < 4; i++) { const c = iso(21.78 + i * .13 + (r % 2) * .1, 1.3, z); o += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="2.3" fill="${[P.lc, P.ch, P.cn, P.mt][r]}"/>`; } } return o; }, { anim: 'cresce' });
  add('Telescópio solar', 16.35, 4.7, P => { const g = iso(16.35, 4.7, 0), t = iso(16.35, 4.7, .6); return `<path d="M${f1(g[0] - 3)},${f1(g[1])} L${f1(t[0])},${f1(t[1])} L${f1(g[0] + 3)},${f1(g[1])}" stroke="${P.ferro}" stroke-width="1.2" fill="none"/><rect x="${f1(t[0] - 2.2)}" y="${f1(t[1] - 11)}" width="4.4" height="12" rx="1.6" fill="${P.branco}" stroke="${P.mt}" stroke-width="1" transform="rotate(35 ${f1(t[0])} ${f1(t[1])})"/>`; }, {});
  add('Banco · sede premium', 24.1, 1.85, P => bancoPremium(BK, P), { chave: kB + .01, grupo: 'banco', nivel: 3, anim: 'cresce' });
  return lista;
}

export function portaoSimples(y: number, P: Paleta): string {
  const c = iso(13, y + .05, .95);
  return box(12.2, y, 0, .12, .12, 1.05, P.tronco) + box(13.68, y, 0, .12, .12, 1.05, P.tronco) + linha3([[12.26, y + .06, 1.0], [13.74, y + .06, 1.0]], P.tronco, 2) +
    linha3([[12.26, y + .06, .55], [12.6, y + .06, .55]], P.tronco, 1.4) + linha3([[13.4, y + .06, .55], [13.74, y + .06, .55]], P.tronco, 1.4) +
    `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="2.4" fill="${P.lc}"/>`;
}

function obraDePredio(b: Predio, P: Paleta, cor: string): string {
  const z = b.z0, X = b.x + b.w, Y = b.y + b.d, tijolo = P.noite ? '#7A5A4A' : '#C98B6B';
  let o = box(b.x, b.y, z, b.w, .14, .95, tijolo) + box(b.x, b.y, z, .14, b.d, .7, tijolo);
  o += box(X - .14, b.y, z, .14, b.d * .55, .85, tijolo) + box(X - .14, b.y + b.d * .55, z, .14, b.d * .45, .3, tijolo);
  o += box(b.x, Y - .14, z, b.w * .4, .14, .6, tijolo) + box(b.x + b.w * .68, Y - .14, z, b.w * .32, .14, .35, tijolo);
  for (const [x, y] of [[b.x - .2, Y + .18], [X + .18, Y + .18], [X + .18, b.y - .18]] as [number, number][]) o += box(x - .03, y - .03, z - .2, .06, .06, 1.6, P.ferro);
  o += linha3([[b.x - .2, Y + .18, z + .7], [X + .18, Y + .18, z + .7], [X + .18, b.y - .18, z + .7]], P.ferro, 1.1) + linha3([[b.x - .2, Y + .18, z + 1.3], [X + .18, Y + .18, z + 1.3], [X + .18, b.y - .18, z + 1.3]], P.ferro, 1.1);
  o += box(b.x - .2, Y + .08, z + .7, b.w + .38, .2, .05, P.madeira);
  const t = iso(X + .18, b.y - .18, z + 1.45);
  o += `<path class="cv-bandeira" d="M${f1(t[0])},${f1(t[1])} l11,1.5 l0,7 l-11,-1.5 Z" fill="${cor}"/>`;
  const g = iso(X + .5, Y + .5, 0), c = iso(X + .5, Y + .5, .42);
  return o + `<path d="M${f1(c[0])},${f1(c[1])} L${f1(g[0] - 4.5)},${f1(g[1])} L${f1(g[0] + 4.5)},${f1(g[1])} Z" fill="#F28C28"/><path d="M${f1(c[0] - 2.2)},${f1(c[1] + 5)} L${f1(c[0] + 2.2)},${f1(c[1] + 5)}" stroke="#FFFFFF" stroke-width="1.5"/>`;
}

export const DY_EXATAS = 2.4;
export const DY_LETRAS = 2.4;
function deslocarY(lista: Peca[], dy: number): Peca[] {
  const a = iso(0, 0, 0), b = iso(0, dy, 0), t = `translate(${f1(b[0] - a[0])} ${f1(b[1] - a[1])})`;
  return lista.map(p => ({
    ...p, ay: p.ay + dy, chave: p.chave + dy, lote: p.lote ? [p.lote[0], p.lote[1] + dy, p.lote[2], p.lote[3] + dy] as Lote : undefined,
    desenho: (P: Paleta) => `<g transform="${t}">${p.desenho(P.registro ? { ...P, desloc: (P.desloc ?? 0) + dy } : P)}</g>`
  }));
}

function comPredioLogo(trilha: Trilha, lista: Peca[], fundacaoNome: string, primeiroNome: string, b: Predio, rotulo: string): Peca[] {
  const mover = (nome: string, para: number) => { const i = lista.findIndex(p => p.nome === nome); if (i >= 0 && i !== para) lista.splice(para, 0, ...lista.splice(i, 1)); };
  mover(fundacaoNome, 1);
  const primeiro = lista.find(p => p.nome === primeiroNome);
  const chave = b.x + b.w / 2 + b.y + b.d / 2;
  const obra: Peca = {
    trilha, ordem: 0, nome: `${rotulo} · em obras`, ax: b.x + b.w / 2, ay: b.y + b.d / 2, chave: primeiro?.chave ?? chave, camada: 1, anim: 'cresce',
    desenho: P => obraDePredio(b, P, corArea(P, trilha)), grupo: `obra-${trilha}`, nivel: 1
  };
  lista.splice(2, 0, obra);
  if (primeiro) {
    primeiro.grupo = primeiro.grupo ?? `obra-${trilha}`;
    if (primeiro.grupo === `obra-${trilha}`) primeiro.nivel = 2;
    mover(primeiroNome, 3);
  }
  lista.forEach((p, k) => (p.ordem = k));
  return lista;
}

export const TRILHAS: Record<Trilha, Peca[]> = {
  geral: trilhaGeral(),
  linguagens: deslocarY(comPredioLogo('linguagens', trilhaLinguagens(), 'Biblioteca · fundação', 'Biblioteca · térreo simples', { x: 5.7, y: 4.6, w: 3.6, d: 3.0, z0: .25, h: 0 }, 'Biblioteca'), DY_LETRAS),
  humanas: comPredioLogo('humanas', trilhaHumanas(), 'Templo · base', 'Templo · cela', { x: 5.8, y: 16.95, w: 3.3, d: 3.25, z0: .36, h: 0 }, 'Templo'),
  naturezas: comPredioLogo('naturezas', trilhaNaturezas(), 'Estufa · base', 'Estufa · estrutura metálica', { x: 17.6, y: 16.95, w: 1.8, d: 1.8, z0: .22, h: 0 }, 'Estufa'),
  exatas: deslocarY(comPredioLogo('exatas', trilhaExatas(), 'Observatório · base', 'Observatório · torre simples', { x: 17.3, y: 6.5, w: 2.0, d: 2.0, z0: .3, h: 0 }, 'Observatório'), DY_EXATAS),
};
