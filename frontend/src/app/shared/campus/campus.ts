import { ChaveMarco, ExtrasCampus, MARCOS, desenharHospital, desenharDistrito, desenhoComMarcos, marcoDaPeca, marcosAtingidos } from './especiais';
import { TRILHAS, Peca, Trilha, BASE_GERAL, portaoSimples } from './pecas';
import { NIVEIS_ACABAMENTO, pecasDeAcabamento } from './acabamentos';
import { NEGOCIOS, desenharPraca, negociosAbertos } from './alimentacao';
import { desenharMetro } from './metro';
import { Paleta, DIA, NOITE, box, grama, iso, f1, U, shade, topo, linha3, caminho, floresDosCaminhos } from './motor';

export type { Peca, Trilha } from './pecas';
export type Progresso = Record<Trilha, number>;
export type Caixa = [number, number, number, number];

export const ORDEM_TRILHAS: Trilha[] = ['geral', 'linguagens', 'humanas', 'naturezas', 'exatas'];
export const PECAS_BASE = Object.fromEntries(ORDEM_TRILHAS.map(t => [t, TRILHAS[t].length])) as Record<Trilha, number>;
export const TOTAL_POR_TRILHA = Object.fromEntries(ORDEM_TRILHAS.map(t => [t, TRILHAS[t].length + (t === 'geral' ? 0 : NIVEIS_ACABAMENTO.length)])) as Record<Trilha, number>;
export const TOTAL_PECAS = ORDEM_TRILHAS.reduce((s, t) => s + TOTAL_POR_TRILHA[t], 0);

export interface InfoRegiao { trilha: Trilha; nome: string; destaque: string; regra: string; cor: string; lote: Caixa; }
export const REGIOES: InfoRegiao[] = [
  { trilha: 'linguagens', nome: 'Linguagens', destaque: 'Teatro, biblioteca e rádio', regra: 'Cada acerto em Linguagens constrói uma peça aqui.', cor: 'var(--ed-lc)', lote: [0, 0, 10, 12.4] },
  { trilha: 'humanas', nome: 'Humanas', destaque: 'Templo grego, globo e sítio arqueológico', regra: 'Cada acerto em Humanas constrói uma peça aqui.', cor: 'var(--ed-ch)', lote: [0, 16, 10, 26] },
  { trilha: 'naturezas', nome: 'Naturezas', destaque: 'Estufa, lago e Instituto de Química', regra: 'Cada acerto em Naturezas constrói uma peça aqui.', cor: 'var(--ed-cn)', lote: [16, 16, 26, 26] },
  { trilha: 'exatas', nome: 'Matemática', destaque: 'Observatório, computação, instituto e labirinto', regra: 'Cada acerto em Matemática constrói uma peça aqui.', cor: 'var(--ed-mt)', lote: [16, 0, 26, 12.4] },
  { trilha: 'geral', nome: 'Universidade', destaque: 'Entrada, praça, reitoria e mata', regra: 'Cada dia em que você responde melhora a estrutura.', cor: 'var(--ed-caneta)', lote: [0, 0, 26, 26] },
];
export const regiao = (t: Trilha) => REGIOES.find(r => r.trilha === t)!;

export interface DadosCampus {
  acertos: { linguagens: number; humanas: number; naturezas: number; exatas: number };
  diasAtivos: number;
}

const limitar = (t: Trilha, n: number) => Math.max(0, Math.min(TOTAL_POR_TRILHA[t], Math.floor(n || 0)));

const ehPredio = (p: Peca) => p.nome.includes(' · ') && !p.lote;
// pessoas nunca são uma etapa sozinhas: entram junto com a próxima peça de verdade
const ehPessoa = (p: any) => /^(Estudante|Estudantes|Fila do teatro|Sarau no palco|Apicultora|Arqueóloga|Observadores|Turistas|Visitantes|Guia|Monitoria|Robô)/.test(p.nome);
function etapasDe(lista: Peca[]): number[] {
  const tamanhos: number[] = [];
  if (!lista.length) return tamanhos;
  tamanhos.push(Math.min(2, lista.length));
  let pendente = 0, i = tamanhos[0];
  while (i < lista.length) {
    const p = lista[i];
    if (p.lote) { pendente++; i++; continue; }
    if (ehPredio(p)) { tamanhos.push(pendente + 1); pendente = 0; i++; continue; }
    if (ehPessoa(p)) { pendente++; i++; continue; }
    let j = i;
    while (j < lista.length && !lista[j].lote && !ehPredio(lista[j]) && !ehPessoa(lista[j])) j++;
    const run = j - i;
    if (run === 1 && j < lista.length) { pendente += 1; i = j; continue; }
    for (let c = 0; c < run; c += 2) tamanhos.push((c === 0 ? pendente : 0) + Math.min(2, run - c));
    pendente = 0; i = j;
  }
  if (pendente) { if (tamanhos.length) tamanhos[tamanhos.length - 1] += pendente; else tamanhos.push(pendente); }
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
export interface OpcoesCena { acesas?: Partial<Record<Trilha, boolean>> | null; novasDesde?: Progresso | null; atrasoInicial?: number; intervalo?: number; camera?: Caixa; extras?: ExtrasCampus | null; extrasAntes?: ExtrasCampus | null; }

const BASE_PORTAL: Record<string, number> = { 'Portal de madeira': 20, 'Portal de concreto': 26, 'Portal com arco': 26 };

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
  // troca de versão: a peça que estava antes some enquanto a nova aparece
  const saindo = new Map<Peca, Peca>();
  if (o.novasDesde) {
    const antes = o.novasDesde;
    for (const nova of exibidas) {
      if (!nova.grupo || nova.ordem < antes[nova.trilha]) continue;
      let velha: Peca | null = null;
      for (const p of visiveis) if (p.grupo === nova.grupo && p.ordem < antes[p.trilha] && (!velha || (p.nivel ?? 0) > (velha.nivel ?? 0))) velha = p;
      if (velha) saindo.set(velha, nova);
    }
    exibidas = exibidas.concat([...saindo.keys()]);
  }
  const acabNovas = new Set<Peca>();
  for (const t of ORDEM_TRILHAS) {
    const nivel = nivelAcabamento(t, prog);
    if (!nivel) continue;
    const antes = o.novasDesde ? nivelAcabamento(t, o.novasDesde) : null;
    const { pecas, novas: nv } = pecasDeAcabamento(t, nivel, antes, P);
    exibidas = exibidas.concat(pecas);
    nv.forEach(p => acabNovas.add(p));
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of visiveis) if (p.lote) { x0 = Math.min(x0, p.lote[0]); y0 = Math.min(y0, p.lote[1]); x1 = Math.max(x1, p.lote[2]); y1 = Math.max(y1, p.lote[3]); }
  if (!isFinite(x0)) { x0 = 10; y0 = 10; x1 = 16; y1 = 16; }
  // o portal acompanha a avenida: quando o lote cresce para a frente, ele vai junto
  const desloc = (p: Peca) => { const base = BASE_PORTAL[p.nome]; return base === undefined ? 0 : Math.max(0, y1 - base); };
  exibidas.sort((a, b) => (a.camada - b.camada) || (a.chave + desloc(a) - (b.chave + desloc(b))));
  const marcos = marcosAtingidos(o.extras);
  if (marcos.has('decoracao')) P = { ...P, decorado: true };
  const novosMarcos = new Set<ChaveMarco>();
  if (o.extrasAntes) { const antes = marcosAtingidos(o.extrasAntes); marcos.forEach(m => { if (!antes.has(m)) novosMarcos.add(m); }); }


  const novas = o.novasDesde ? novasPecas(o.novasDesde, prog) : [];
  const atraso = new Map<Peca, number>();
  novas.forEach((p, i) => atraso.set(p, (o.atrasoInicial ?? 350) + i * (o.intervalo ?? 520)));
  [...acabNovas].forEach((p, i) => atraso.set(p, (o.atrasoInicial ?? 350) + (novas.length + Math.floor(i / 3)) * (o.intervalo ?? 520)));
  const atrasoMarcos = (o.atrasoInicial ?? 350) + novas.length * (o.intervalo ?? 520);

  const Pc: Paleta = tipoEstrada(totalDePecas(prog)) === 'terra'
    ? { ...P, caminho: P.noite ? '#5E4B3A' : '#D6B88E', caminho2: P.noite ? '#4E3E30' : '#BC9A6E' }
    : { ...P };
  if (P.decorado) Pc.registro = [];
  let floresPostas = false;
  let corpo = '', marcas = '';
  const portaoNaFrente = exibidas.some(p => p.nome === 'Portão simples');
  for (const p of exibidas) {
    if (p.nome === 'Portão simples') continue;
    if (!floresPostas && p.camada >= 1) { corpo += '%%FLORES%%'; floresPostas = true; }
    const substituta = saindo.get(p);
    if (substituta) {
      const dy0 = desloc(p), b0 = iso(0, 0, 0), b1 = iso(0, dy0, 0), arte = (desenhoComMarcos(p, marcos) ?? p.desenho)(Pc);
      corpo += `<g class="cv-peca cv-sai" style="animation-delay:${atraso.get(substituta) ?? atrasoMarcos}ms">${dy0 ? `<g transform="translate(${f1(b1[0] - b0[0])} ${f1(b1[1] - b0[1])})">${arte}</g>` : arte}</g>`;
      continue;
    }
    const d = atraso.get(p);
    const nova = d !== undefined;
    const variante = desenhoComMarcos(p, marcos);
    const marco = variante ? marcoDaPeca(p) : null;
    const upgrade = !nova && marco !== null && novosMarcos.has(marco);
    const dy = desloc(p), base0 = iso(0, 0, 0), base1 = iso(0, dy, 0);
    const apagada = P.noite && !!o.acesas && p.trilha !== 'geral' && o.acesas[p.trilha] === false;
    const arte0 = (variante ?? p.desenho)(Pc), arte = apagada ? apagarLuzes(arte0) : arte0;
    const desenho = dy ? `<g transform="translate(${f1(base1[0] - base0[0])} ${f1(base1[1] - base0[1])})">${arte}</g>` : arte;
    corpo += upgrade
      ? `<g class="cv-peca cv-nova cv-nova-surge" style="animation-delay:${atrasoMarcos}ms">${desenho}</g>`
      : `<g class="cv-peca${nova ? ' cv-nova cv-nova-' + p.anim : ''}"${nova ? ` style="animation-delay:${d}ms"` : ''}>${desenho}</g>`;
    if (nova && p.camada >= 0 && !p.ceu) {
      const g = iso(p.ax, p.ay + desloc(p), 0);
      marcas += `<ellipse class="cv-marca" style="animation-delay:${d}ms" cx="${f1(g[0])}" cy="${f1(g[1])}" rx="${f1(1.1 * U)}" ry="${f1(.55 * U)}" fill="none" stroke="${P.caneta}" stroke-width="2.4"/>`;
    }
  }

  const acesso = y1 > 16.05 && visiveis.some(p => p.nome === 'Primeiros caminhos') ? caminho(12.5, 15.9, 13.5, y1, Pc) : '';
  if (portaoNaFrente) corpo += `<g class="cv-peca">${portaoSimples(y1 - .28, Pc)}</g>`;
  const CENTRO: ChaveMarco[] = ['praca', 'reitoria', 'fonte', 'portal'];
  const upgradesCentro = MARCOS.filter(m => novosMarcos.has(m.chave) && CENTRO.includes(m.chave));
  let vez = atrasoMarcos + (upgradesCentro.length ? 1600 : 0);
  const turno = (dur: number) => { const a = vez; vez += dur; return a; };
  const novoDistrito = novosMarcos.has('terra') || novosMarcos.has('campo') || novosMarcos.has('quadras') || novosMarcos.has('piscina') || novosMarcos.has('trilha') || novosMarcos.has('pista');
  const aDistrito = novoDistrito ? turno(novosMarcos.has('terra') ? 2600 : 1600) : atrasoMarcos;
  const aHospital = novosMarcos.has('posto') || novosMarcos.has('hospital') ? turno(2600) : atrasoMarcos;
  const aMetro = novosMarcos.has('trem') || novosMarcos.has('metro') ? turno(2600) : atrasoMarcos;
  const negAntes = o.extrasAntes ? negociosAbertos(o.extrasAntes.acertos ?? 0) : null, negAgora = negociosAbertos(o.extras?.acertos ?? 0);
  const novoNaPraca = negAntes !== null && negAgora >= 0 && negAgora > negAntes;
  const aPraca = novoNaPraca ? turno(negAntes! < 0 ? 2600 : 1600) : atrasoMarcos;
  const distrito = desenharDistrito(x1, y0, y1, marcos, P, novosMarcos, aDistrito, 13);
  const ligaLazer = x1 > 16 && (distrito || visiveis.some(p => p.trilha === 'exatas' && p.lote)) && visiveis.some(p => p.nome === 'Primeiros caminhos') ? caminho(16, 12.5, x1, 13.5, Pc) : '';
  const terreno = box(x0, y0, -.9, x1 - x0, y1 - y0, .9, P.grama, { l: P.placaL, r: P.placaR }) +
    topo(x0, y1 - .08, x1, y1, .001, shade(P.grama, .95)) + topo(x1 - .08, y0, x1, y1, .001, shade(P.grama, .9)) + grama(x0, y0, x1, y1, P);
  const aOdonto = novosMarcos.has('odonto') && !novosMarcos.has('hospital') ? turno(2200) : aHospital + 900;
  const temHospital = marcos.has('posto') || marcos.has('hospital'), terrenoNovo = novosMarcos.has('posto') || (novosMarcos.has('hospital') && !marcos.has('posto'));
  const hospital = temHospital ? desenharHospital(x0, y0, y1, P, terrenoNovo, aHospital, marcos.has('hospital') && marcos.has('odonto'), novosMarcos.has('odonto'), aOdonto, !marcos.has('hospital'), novosMarcos.has('hospital') && !terrenoNovo) : null;
  const praca = desenharPraca(x0, x1, y0, o.extras?.acertos ?? 0, P, o.extrasAntes ? o.extrasAntes.acertos ?? 0 : null, aPraca);
  const ligaLetras = visiveis.some(p => p.nome === 'Terreno de Linguagens') ? caminho(7.25, 11.55, 7.75, 12.5, Pc) + caminho(7.25, 12.5, 10, 13.5, Pc) : '';
  const ligaPraca = praca && y0 < 6.3 ? caminho(12.5, y0, 13.5, 6.3, Pc) : '';
  const xIni = Math.min(hospital ? hospital.x0 : x0, praca?.x0 ?? x0);
  const xFim = Math.max(distrito ? distrito.x1 : x1, praca?.x1 ?? x1);
  const rua = estrada(xIni, xFim, y1, tipoEstrada(totalDePecas(prog)), P);
  const metro = marcos.has('trem') || marcos.has('metro') ? desenharMetro(xIni, xFim, y1 + 1.15, P, novosMarcos.has('trem') || (novosMarcos.has('metro') && !marcos.has('trem')), aMetro, !marcos.has('metro'), novosMarcos.has('metro') && !novosMarcos.has('trem')) : null;
  const caixaTerreno = caixaDoTerreno(xIni, praca ? praca.y0 : distrito || hospital ? y0 - .4 : y0, xFim, y1 + 1.15 + (metro ? metro.fundo : 0));
  const caixa = o.camera ?? caixaTerreno;
  if (!floresPostas) corpo += '%%FLORES%%';
  const flores = Pc.registro ? floresDosCaminhos(Pc.registro, Pc, [[10.4, 10.4, 15.6, 15.6]]) : '';
  corpo = corpo.replace('%%FLORES%%', flores && novosMarcos.has('decoracao') ? `<g class="cv-peca cv-nova cv-nova-surge" style="animation-delay:${atrasoMarcos}ms">${flores}</g>` : flores);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${caixa.map(f1).join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Campus com ${totalDePecas(prog)} peças construídas">${praca?.svg ?? ''}${hospital?.svg ?? ''}<g class="cv-terreno">${terreno}${acesso}${ligaLazer}${ligaPraca}${ligaLetras}</g>${corpo}${distrito?.svg ?? ''}<g class="cv-estrada">${rua}</g>${metro?.svg ?? ''}<g>${marcas}</g></svg>`;
  const destaques: Destaque[] = [];
  const meioY = (y0 + y1) / 2;
  upgradesCentro.forEach(m => {
    const [x, y] = m.chave === 'reitoria' ? [13, 7.8] : m.chave === 'portal' ? [13, Math.min(25.6, y1 - .6)] : [13, 13];
    if (!destaques.some(d => d.x === x && d.y === y)) destaques.push({ rotulo: 'Upgrade do campus', nome: upgradesCentro.map(u => u.nome).join(' · '), cor: '#2836C6', x, y, terreno: false, atraso: atrasoMarcos });
  });
  if (novoDistrito && distrito) {
    const extra = MARCOS.filter(m => (m.chave === 'campo' || m.chave === 'quadras' || m.chave === 'piscina' || m.chave === 'trilha' || m.chave === 'pista') && novosMarcos.has(m.chave)).map(m => m.nome);
    destaques.push(novosMarcos.has('terra')
      ? { rotulo: 'Novo terreno liberado', nome: 'Área de lazer', cor: '#36B37D', x: (distrito.x0 + distrito.x1) / 2, y: meioY, terreno: true, atraso: aDistrito }
      : { rotulo: 'Nova estrutura na área de lazer', nome: extra.join(' · '), cor: '#36B37D', x: (distrito.x0 + distrito.x1) / 2, y: meioY, terreno: false, atraso: aDistrito });
  }
  if (novosMarcos.has('decoracao')) destaques.push({ rotulo: 'Upgrade do campus', nome: 'Caminhos floridos e pontes de pedra', cor: '#36B37D', x: 13, y: 13, terreno: false, atraso: atrasoMarcos });
  if (novosMarcos.has('trem') && metro) destaques.push({ rotulo: 'Novo terreno liberado', nome: 'Estação de trem', cor: '#2836C6', x: 13, y: y1 + 2.4, terreno: true, atraso: aMetro });
  else if (novosMarcos.has('metro') && metro) destaques.push({ rotulo: 'Upgrade do campus', nome: 'Estação de metrô', cor: '#2836C6', x: 13, y: y1 + 2.4, terreno: false, atraso: aMetro });
  if (novosMarcos.has('odonto') && !novosMarcos.has('hospital') && hospital) destaques.push({ rotulo: 'Nova estrutura no hospital', nome: 'Clínica de Odontologia', cor: '#2BB5A8', x: (hospital.x0 + x0) / 2, y: y0 + 3, terreno: false, atraso: aOdonto });
  if (terrenoNovo && hospital) destaques.push({ rotulo: 'Novo terreno liberado', nome: marcos.has('hospital') ? 'Hospital Universitário' : 'Posto de saúde', cor: '#E5484D', x: (hospital.x0 + x0) / 2, y: meioY, terreno: true, atraso: aHospital });
  else if (novosMarcos.has('hospital') && hospital) destaques.push({ rotulo: 'Upgrade do campus', nome: 'Hospital Universitário', cor: '#E5484D', x: (hospital.x0 + x0) / 2, y: meioY, terreno: false, atraso: aHospital });
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

// À noite, a área cuja questão do dia ainda não foi respondida fica com as luzes apagadas: só as cores quentes mudam.
const LUZ_APAGADA: Record<string, string> = {
  '#ffd66b': '#2e3660', '#f2c55a': '#293058', '#ffe3a0': '#323b66', '#ffd27a': '#2e3660', '#ffe9a8': '#343d68', '#fff3c8': '#363f6a',
  '#ffe1a0': '#323b66', '#ffc566': '#2c345c', '#ffe27a': '#303860', '#fff1b8': '#343d68', '#e9a94e': '#3a3550', '#ffe2a0': '#323b66',
  '#f0b259': '#38344f', '#fff6c8': '#363f6a', '#ffb84d': '#38344f', '#ffd27a33': '#2e366033'
};
export const apagarLuzes = (svg: string) => svg.replace(/#(?:ffd66b|f2c55a|ffe3a0|ffd27a|ffe9a8|fff3c8|ffe1a0|ffc566|ffe27a|fff1b8|e9a94e|ffe2a0|f0b259|fff6c8|ffb84d)/gi, c => LUZ_APAGADA[c.toLowerCase()] ?? c);
