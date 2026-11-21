import { ChaveMarco, ExtrasCampus, MARCOS, desenharHospital, desenharDistrito, desenhoComMarcos, marcoDaPeca, marcosAtingidos } from './especiais';
import { TRILHAS, Peca, Trilha, BASE_GERAL, portaoSimples } from './pecas';
import { NIVEIS_ACABAMENTO, pecasDeAcabamento } from './acabamentos';
import { NEGOCIOS, desenharPraca, negociosAbertos } from './alimentacao';
import { Paleta, DIA, NOITE, box, grama, iso, f1, U, shade, topo, linha3, caminho } from './motor';

export type { Peca, Trilha } from './pecas';
export type Progresso = Record<Trilha, number>;
export type Caixa = [number, number, number, number];

export const ORDEM_TRILHAS: Trilha[] = ['geral', 'linguagens', 'humanas', 'naturezas', 'exatas'];
export const PECAS_BASE = Object.fromEntries(ORDEM_TRILHAS.map(t => [t, TRILHAS[t].length])) as Record<Trilha, number>;
export const TOTAL_POR_TRILHA = Object.fromEntries(ORDEM_TRILHAS.map(t => [t, TRILHAS[t].length + (t === 'geral' ? 0 : NIVEIS_ACABAMENTO.length)])) as Record<Trilha, number>;
export const TOTAL_PECAS = ORDEM_TRILHAS.reduce((s, t) => s + TOTAL_POR_TRILHA[t], 0);

export interface InfoRegiao { trilha: Trilha; nome: string; destaque: string; regra: string; cor: string; lote: Caixa; }
export const REGIOES: InfoRegiao[] = [
  { trilha: 'linguagens', nome: 'Linguagens', destaque: 'Biblioteca, auditório e rádio', regra: 'Cada acerto em Linguagens constrói uma peça aqui.', cor: 'var(--ed-lc)', lote: [0, 0, 10, 12.4] },
  { trilha: 'humanas', nome: 'Humanas', destaque: 'Museu, arquivo e sítio arqueológico', regra: 'Cada acerto em Humanas constrói uma peça aqui.', cor: 'var(--ed-ch)', lote: [0, 16, 10, 26] },
  { trilha: 'naturezas', nome: 'Naturezas', destaque: 'Estufa, lago e laboratórios', regra: 'Cada acerto em Naturezas constrói uma peça aqui.', cor: 'var(--ed-cn)', lote: [16, 16, 26, 26] },
  { trilha: 'exatas', nome: 'Matemática', destaque: 'Observatório, institutos, pirâmide e labirinto', regra: 'Cada acerto em Matemática constrói uma peça aqui.', cor: 'var(--ed-mt)', lote: [16, 0, 26, 12.4] },
  { trilha: 'geral', nome: 'Universidade', destaque: 'Entrada, praça, reitoria e mata', regra: 'Cada dia em que você responde melhora a estrutura.', cor: 'var(--ed-caneta)', lote: [0, 0, 26, 26] },
];
export const regiao = (t: Trilha) => REGIOES.find(r => r.trilha === t)!;

export interface DadosCampus {
  acertos: { linguagens: number; humanas: number; naturezas: number; exatas: number };
  diasAtivos: number;
}

const limitar = (t: Trilha, n: number) => Math.max(0, Math.min(TOTAL_POR_TRILHA[t], Math.floor(n || 0)));

const ehPredio = (p: Peca) => p.nome.includes(' · ') && !p.lote;
function etapasDe(lista: Peca[]): number[] {
  const tamanhos: number[] = [];
  if (!lista.length) return tamanhos;
  tamanhos.push(Math.min(2, lista.length));
  let pendente = 0, i = tamanhos[0];
  while (i < lista.length) {
    const p = lista[i];
    if (p.lote) { pendente++; i++; continue; }
    if (ehPredio(p)) { tamanhos.push(pendente + 1); pendente = 0; i++; continue; }
    let j = i;
    while (j < lista.length && !lista[j].lote && !ehPredio(lista[j])) j++;
    const run = j - i;
    if (run === 1 && j < lista.length) { pendente += 1; i = j; continue; }
    tamanhos.push(pendente + run); pendente = 0; i = j;
  }
  if (pendente) tamanhos.push(pendente);
  return tamanhos;
}
const ETAPAS = Object.fromEntries((['linguagens', 'humanas', 'naturezas', 'exatas'] as Trilha[]).map(t => [t, etapasDe(TRILHAS[t])])) as Record<Trilha, number[]>;
export const ETAPAS_POR_AREA = Object.fromEntries(Object.entries(ETAPAS).map(([t, e]) => [t, e.length])) as Record<Trilha, number>;
const pecasDaEtapa = (t: Trilha, acertos: number) => {
  const e = ETAPAS[t] ?? [], n = Math.max(0, Math.floor(acertos || 0));
  if (n <= e.length) return e.slice(0, n).reduce((s, k) => s + k, 0);
  return PECAS_BASE[t] + (n - e.length);
};
export const nivelAcabamento = (t: Trilha, prog: Progresso) => (t === 'geral' ? 0 : Math.max(0, prog[t] - PECAS_BASE[t]));

export function calcularProgresso(d: DadosCampus): Progresso {
  return {
    geral: limitar('geral', BASE_GERAL + d.diasAtivos),
    linguagens: limitar('linguagens', pecasDaEtapa('linguagens', d.acertos.linguagens)),
    humanas: limitar('humanas', pecasDaEtapa('humanas', d.acertos.humanas)),
    naturezas: limitar('naturezas', pecasDaEtapa('naturezas', d.acertos.naturezas)),
    exatas: limitar('exatas', pecasDaEtapa('exatas', d.acertos.exatas)),
  };
}

interface UsuarioComAreas {
  linguagens?: { acertos: number }; humanas?: { acertos: number }; naturezas?: { acertos: number }; exatas?: { acertos: number };
  qntDiasAtivos?: number;
}
export function progressoDoUsuario(u: UsuarioComAreas | null | undefined): Progresso {
  return calcularProgresso({
    acertos: { linguagens: u?.linguagens?.acertos ?? 0, humanas: u?.humanas?.acertos ?? 0, naturezas: u?.naturezas?.acertos ?? 0, exatas: u?.exatas?.acertos ?? 0 },
    diasAtivos: u?.qntDiasAtivos ?? 0,
  });
}

interface ColegaComAcertos { acertosLinguagens?: number; acertosHumanas?: number; acertosNaturezas?: number; acertosExatas?: number; diasAtivos?: number; }
export function progressoDeColega(u: ColegaComAcertos | null | undefined): Progresso {
  return calcularProgresso({
    acertos: { linguagens: u?.acertosLinguagens ?? 0, humanas: u?.acertosHumanas ?? 0, naturezas: u?.acertosNaturezas ?? 0, exatas: u?.acertosExatas ?? 0 },
    diasAtivos: u?.diasAtivos ?? 0,
  });
}

export const totalDePecas = (p: Progresso) => ORDEM_TRILHAS.reduce((s, t) => s + p[t], 0);
export const proximaPeca = (t: Trilha, p: Progresso): Peca | null => TRILHAS[t][p[t]] ?? null;
export const ultimaPeca = (t: Trilha, p: Progresso): Peca | null => (p[t] > 0 ? TRILHAS[t][p[t] - 1] : null);

export function novasPecas(antes: Progresso, depois: Progresso): Peca[] {
  const lista: Peca[] = [];
  for (const t of ORDEM_TRILHAS) if (depois[t] > antes[t]) lista.push(...TRILHAS[t].slice(antes[t], depois[t]));
  return lista;
}

const TODAS = ORDEM_TRILHAS.flatMap(t => TRILHAS[t]);
const ORDENADAS = TODAS.map((p, i) => ({ p, i })).sort((a, b) => (a.p.camada - b.p.camada) || (a.p.chave - b.p.chave) || (a.i - b.i)).map(o => o.p);

export function caixaDoTerreno(x0: number, y0: number, x1: number, y1: number): Caixa {
  const pad = 26;
  const minX = iso(x0, y1)[0] - pad, maxX = iso(x1, y0)[0] + pad;
  const minY = iso(x0, y0)[1] - 7.5 * U, maxY = iso(x1, y1, -.9)[1] + pad;
  return [minX, minY, maxX - minX, maxY - minY];
}

export function caixaEm(x: number, y: number, larguraMundo = 9, proporcao = .78): Caixa {
  const c = iso(x, y, 1.2), w = larguraMundo * 2 * .866 * U, h = w * proporcao;
  return [c[0] - w / 2, c[1] - h / 2, w, h];
}

export interface Destaque { rotulo: string; nome: string; cor: string; x: number; y: number; terreno: boolean; atraso: number; }
export interface Cena { svg: string; caixa: Caixa; ceu: boolean; novas: Peca[]; terreno: Caixa; destaques: Destaque[]; }
export interface OpcoesCena { novasDesde?: Progresso | null; atrasoInicial?: number; intervalo?: number; camera?: Caixa; extras?: ExtrasCampus | null; extrasAntes?: ExtrasCampus | null; }

export const paletaDe = (noite: boolean): Paleta => (noite ? NOITE : DIA);

export type TipoEstrada = 'terra' | 'pedras' | 'asfalto';
export const ESTRADA_PEDRAS = 70;
export const ESTRADA_ASFALTO = 200;
export const tipoEstrada = (pecas: number): TipoEstrada => (pecas >= ESTRADA_ASFALTO ? 'asfalto' : pecas >= ESTRADA_PEDRAS ? 'pedras' : 'terra');

function estrada(xa: number, xb: number, y: number, tipo: TipoEstrada, P: Paleta): string {
  const L = 1.15, z = .006, y2 = y + L;
  const base = box(xa, y, -.9, xb - xa, L, .9, shade(P.grama, .96), { l: P.placaL, r: P.placaR });
  if (tipo === 'terra') {
    const terra = P.noite ? '#5E4B3A' : '#CFAE84', sulco = P.noite ? '#4E3E30' : '#B8956A';
    let o = base + topo(xa, y + .05, xb, y2 - .05, z, terra);
    o += topo(xa, y + .28, xb, y + .36, z + .001, sulco) + topo(xa, y2 - .36, xb, y2 - .28, z + .001, sulco);
    for (let x = xa + .6; x < xb - .3; x += 1.7) { const c = iso(x, y + .62, z); o += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="3" ry="1.3" fill="${sulco}" opacity=".7"/>`; }
    return o;
  }
  if (tipo === 'pedras') {
    const pedra = P.noite ? '#5B6178' : '#C3C7D0', junta = P.noite ? '#474C60' : '#A6ABB6';
    let o = base + topo(xa, y, xb, y2, z, junta) + topo(xa, y, xb, y + .1, z + .002, P.concreto) + topo(xa, y2 - .1, xb, y2, z + .002, P.concreto);
    const passo = .34, linhas = 3;
    for (let r = 0; r < linhas; r++) {
      const ya = y + .14 + r * ((L - .28) / linhas), yb = ya + (L - .28) / linhas - .04;
      for (let x = xa + (r % 2 ? passo / 2 : 0); x < xb - .02; x += passo) o += topo(Math.max(xa, x), ya, Math.min(xb, x + passo - .05), yb, z + .001, shade(pedra, .97 + ((Math.floor(x * 7) + r) % 3) * .03));
    }
    return o;
  }
  const asfalto = P.noite ? '#262A3A' : '#454B5E', guia = P.noite ? '#6A7090' : '#D9DDE6';
  let o = base + topo(xa, y, xb, y + .16, z + .002, guia) + topo(xa, y + .16, xb, y2 - .16, z, asfalto) + topo(xa, y2 - .16, xb, y2, z + .002, guia);
  const ym = y + L / 2;
  for (let x = xa + .3; x < xb - .4; x += .9) o += linha3([[x, ym, z + .003], [x + .45, ym, z + .003]], '#F2C94C', 1.4);
  return o;
}

export function renderizarCampus(prog: Progresso, P: Paleta, o: OpcoesCena = {}): Cena {
  const visiveis = ORDENADAS.filter(p => p.ordem < prog[p.trilha]);
  const nivelMax = new Map<string, number>();
  for (const p of visiveis) if (p.grupo) nivelMax.set(p.grupo, Math.max(nivelMax.get(p.grupo) ?? 0, p.nivel ?? 0));
  let exibidas = visiveis.filter(p => !p.grupo || p.nivel === nivelMax.get(p.grupo));
  const acabNovas = new Set<Peca>();
  for (const t of ORDEM_TRILHAS) {
    const nivel = nivelAcabamento(t, prog);
    if (!nivel) continue;
    const antes = o.novasDesde ? nivelAcabamento(t, o.novasDesde) : null;
    const { pecas, novas: nv } = pecasDeAcabamento(t, nivel, antes, P);
    exibidas = exibidas.concat(pecas);
    nv.forEach(p => acabNovas.add(p));
  }
  exibidas.sort((a, b) => (a.camada - b.camada) || (a.chave - b.chave));
  const marcos = marcosAtingidos(o.extras);
  const novosMarcos = new Set<ChaveMarco>();
  if (o.extrasAntes) { const antes = marcosAtingidos(o.extrasAntes); marcos.forEach(m => { if (!antes.has(m)) novosMarcos.add(m); }); }

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of visiveis) if (p.lote) { x0 = Math.min(x0, p.lote[0]); y0 = Math.min(y0, p.lote[1]); x1 = Math.max(x1, p.lote[2]); y1 = Math.max(y1, p.lote[3]); }
  if (!isFinite(x0)) { x0 = 10; y0 = 10; x1 = 16; y1 = 16; }

  const novas = o.novasDesde ? novasPecas(o.novasDesde, prog) : [];
  const atraso = new Map<Peca, number>();
  novas.forEach((p, i) => atraso.set(p, (o.atrasoInicial ?? 350) + i * (o.intervalo ?? 520)));
  [...acabNovas].forEach((p, i) => atraso.set(p, (o.atrasoInicial ?? 350) + (novas.length + Math.floor(i / 3)) * (o.intervalo ?? 520)));
  const atrasoMarcos = (o.atrasoInicial ?? 350) + novas.length * (o.intervalo ?? 520);

  const Pc: Paleta = tipoEstrada(totalDePecas(prog)) === 'terra'
    ? { ...P, caminho: P.noite ? '#5E4B3A' : '#D6B88E', caminho2: P.noite ? '#4E3E30' : '#BC9A6E' }
    : P;
  let corpo = '', marcas = '';
  const portaoNaFrente = exibidas.some(p => p.nome === 'Portão simples');
  for (const p of exibidas) {
    if (p.nome === 'Portão simples') continue;
    const d = atraso.get(p);
    const nova = d !== undefined;
    const variante = desenhoComMarcos(p, marcos);
    const marco = variante ? marcoDaPeca(p) : null;
    const upgrade = !nova && marco !== null && novosMarcos.has(marco);
    const desenho = (variante ?? p.desenho)(Pc);
    corpo += upgrade
      ? `<g class="cv-peca cv-nova cv-nova-surge" style="animation-delay:${atrasoMarcos}ms">${desenho}</g>`
      : `<g class="cv-peca${nova ? ' cv-nova cv-nova-' + p.anim : ''}"${nova ? ` style="animation-delay:${d}ms"` : ''}>${desenho}</g>`;
    if (nova && p.camada >= 0 && !p.ceu) {
      const g = iso(p.ax, p.ay, 0);
      marcas += `<ellipse class="cv-marca" style="animation-delay:${d}ms" cx="${f1(g[0])}" cy="${f1(g[1])}" rx="${f1(1.1 * U)}" ry="${f1(.55 * U)}" fill="none" stroke="${P.caneta}" stroke-width="2.4"/>`;
    }
  }

  const acesso = y1 > 16.05 && visiveis.some(p => p.nome === 'Primeiros caminhos') ? caminho(12.5, 15.9, 13.5, y1, Pc) : '';
  if (portaoNaFrente) corpo += `<g class="cv-peca">${portaoSimples(y1 - .28, Pc)}</g>`;
  const CENTRO: ChaveMarco[] = ['praca', 'reitoria', 'fonte', 'portal'];
  const upgradesCentro = MARCOS.filter(m => novosMarcos.has(m.chave) && CENTRO.includes(m.chave));
  let vez = atrasoMarcos + (upgradesCentro.length ? 1600 : 0);
  const turno = (dur: number) => { const a = vez; vez += dur; return a; };
  const novoDistrito = novosMarcos.has('campo') || novosMarcos.has('quadras') || novosMarcos.has('piscina');
  const aDistrito = novoDistrito ? turno(novosMarcos.has('campo') ? 2600 : 1600) : atrasoMarcos;
  const aHospital = novosMarcos.has('hospital') ? turno(2600) : atrasoMarcos;
  const negAntes = o.extrasAntes ? negociosAbertos(o.extrasAntes.acertos ?? 0) : null, negAgora = negociosAbertos(o.extras?.acertos ?? 0);
  const novoNaPraca = negAntes !== null && negAgora >= 0 && negAgora > negAntes;
  const aPraca = novoNaPraca ? turno(negAntes! < 0 ? 2600 : 1600) : atrasoMarcos;
  const distrito = desenharDistrito(x1, y0, y1, marcos, P, novosMarcos, aDistrito, 13);
  const ligaLazer = x1 > 16 && (distrito || visiveis.some(p => p.trilha === 'exatas' && p.lote)) && visiveis.some(p => p.nome === 'Primeiros caminhos') ? caminho(16, 12.5, x1, 13.5, Pc) : '';
  const terreno = box(x0, y0, -.9, x1 - x0, y1 - y0, .9, P.grama, { l: P.placaL, r: P.placaR }) +
    topo(x0, y1 - .08, x1, y1, .001, shade(P.grama, .95)) + topo(x1 - .08, y0, x1, y1, .001, shade(P.grama, .9)) + grama(x0, y0, x1, y1, P);
  const hospital = marcos.has('hospital') ? desenharHospital(x0, y0, y1, P, novosMarcos.has('hospital'), aHospital) : null;
  const praca = desenharPraca(x0, x1, y0, o.extras?.acertos ?? 0, P, o.extrasAntes ? o.extrasAntes.acertos ?? 0 : null, aPraca);
  const ligaLetras = visiveis.some(p => p.nome === 'Terreno de Linguagens') ? caminho(6.75, 10.6, 7.25, 12.5, Pc) + caminho(6.75, 12.5, 10, 13.5, Pc) : '';
  const ligaPraca = praca && y0 < 6.3 ? caminho(12.5, y0, 13.5, 6.3, Pc) : '';
  const xIni = Math.min(hospital ? hospital.x0 : x0, praca?.x0 ?? x0);
  const xFim = Math.max(distrito ? distrito.x1 : x1, praca?.x1 ?? x1);
  const rua = estrada(xIni, xFim, y1, tipoEstrada(totalDePecas(prog)), P);
  const caixaTerreno = caixaDoTerreno(xIni, praca ? praca.y0 : distrito || hospital ? y0 - .4 : y0, xFim, y1 + 1.15);
  const caixa = o.camera ?? caixaTerreno;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${caixa.map(f1).join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Campus com ${totalDePecas(prog)} peças construídas">${praca?.svg ?? ''}${hospital?.svg ?? ''}<g class="cv-terreno">${terreno}${acesso}${ligaLazer}${ligaPraca}${ligaLetras}</g>${corpo}${distrito?.svg ?? ''}<g class="cv-estrada">${rua}</g><g>${marcas}</g></svg>`;
  const destaques: Destaque[] = [];
  const meioY = (y0 + y1) / 2;
  upgradesCentro.forEach(m => {
    const [x, y] = m.chave === 'reitoria' ? [13, 7.8] : m.chave === 'portal' ? [13, Math.min(25.6, y1 - .6)] : [13, 13];
    if (!destaques.some(d => d.x === x && d.y === y)) destaques.push({ rotulo: 'Upgrade do campus', nome: upgradesCentro.map(u => u.nome).join(' · '), cor: '#2836C6', x, y, terreno: false, atraso: atrasoMarcos });
  });
  if (novoDistrito && distrito) {
    const extra = MARCOS.filter(m => (m.chave === 'quadras' || m.chave === 'piscina') && novosMarcos.has(m.chave)).map(m => m.nome);
    destaques.push(novosMarcos.has('campo')
      ? { rotulo: 'Novo terreno liberado', nome: 'Área de lazer', cor: '#36B37D', x: (distrito.x0 + distrito.x1) / 2, y: meioY, terreno: true, atraso: aDistrito }
      : { rotulo: 'Nova estrutura na área de lazer', nome: extra.join(' · '), cor: '#36B37D', x: (distrito.x0 + distrito.x1) / 2, y: meioY, terreno: false, atraso: aDistrito });
  }
  if (novosMarcos.has('hospital') && hospital) destaques.push({ rotulo: 'Novo terreno liberado', nome: 'Hospital Universitário', cor: '#E5484D', x: (hospital.x0 + x0) / 2, y: meioY, terreno: true, atraso: aHospital });
  if (novoNaPraca && praca) {
    const yPraca = praca.y0 + 4.9;
    destaques.push(negAntes! < 0
      ? { rotulo: 'Novo terreno liberado', nome: 'Praça de alimentação · ' + NEGOCIOS[0].nome, cor: '#E5484D', x: 13, y: yPraca, terreno: true, atraso: aPraca }
      : { rotulo: 'Novo na praça de alimentação', nome: NEGOCIOS[negAgora - 1].nome, cor: NEGOCIOS[negAgora - 1].cor, x: 13, y: yPraca, terreno: false, atraso: aPraca });
  }
  return { svg, caixa, ceu: visiveis.some(p => p.ceu), novas, terreno: caixaTerreno, destaques };
}

export function caixaDaRegiao(t: Trilha, prog: Progresso): Caixa | null {
  if (t === 'geral') return null;
  const lotes = TRILHAS[t].filter(p => p.lote && p.ordem < prog[t]).map(p => p.lote!);
  if (!lotes.length) return null;
  const l = lotes[lotes.length - 1];
  const c = caixaDoTerreno(l[0], l[1], l[2], l[3]);
  return [c[0], c[1] + 2.5 * U, c[2], c[3] - 2.5 * U];
}
