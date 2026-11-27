// Capas do perfil: ilustrações em SVG (760×170), desenhadas com a arte principal à direita,
// porque o avatar cobre o canto inferior esquerdo e no celular a capa é cortada pela direita.

export type Raridade = 'comum' | 'rara' | 'epica' | 'lendaria';
export type CategoriaCapa = 'Estudos' | 'Cursos' | 'Conquistas' | 'Games' | 'Paisagens';

export interface StatsCapa {
  xp: number;
  maiorSequencia: number;
  maiorSequenciaAcertos: number;
  diasAtivos: number;
  acertos: { linguagens: number; humanas: number; naturezas: number; exatas: number };
  duelosVencidos: number;
  redacoes: number;
  simulados: number;
  emblemas: string[];
}

export interface DadosCapa { sequencia?: number; }

export interface Capa {
  codigo: string;
  nome: string;
  descricao: string;
  categoria: CategoriaCapa;
  raridade: Raridade;
  requisito: string;
  progresso: (s: StatsCapa) => [number, number];
  emblema?: string;
}

export const RARIDADES: Record<Raridade, { nome: string; cor: string }> = {
  comum: { nome: 'Comum', cor: '#8A93A8' },
  rara: { nome: 'Rara', cor: '#2F80ED' },
  epica: { nome: 'Épica', cor: '#8C4BFF' },
  lendaria: { nome: 'Lendária', cor: '#E8B931' },
};

const total = (s: StatsCapa) => s.acertos.linguagens + s.acertos.humanas + s.acertos.naturezas + s.acertos.exatas;
const livre = (): [number, number] => [1, 1];

export const CAPAS: Capa[] = [
  { codigo: 'caderno', nome: 'Caderno', descricao: 'Folha pautada, rabiscos e o avião de papel rumo ao ENEM.', categoria: 'Estudos', raridade: 'comum', requisito: 'Livre', progresso: livre },
  { codigo: 'areas', nome: 'Quatro Áreas', descricao: 'As cores de Linguagens, Humanas, Natureza e Matemática.', categoria: 'Estudos', raridade: 'comum', requisito: 'Livre', progresso: livre },
  { codigo: 'abstrato', nome: 'Ondas de Cor', descricao: 'Bolhas de cor flutuando devagar, nos tons da plataforma.', categoria: 'Paisagens', raridade: 'comum', requisito: 'Livre', progresso: livre },
  { codigo: 'madrugada', nome: 'Madrugada de Estudo', descricao: 'Luminária acesa, café quente e a lua na janela.', categoria: 'Estudos', raridade: 'comum', requisito: '3 dias seguidos', progresso: s => [s.maiorSequencia, 3], emblema: '3_streak' },
  { codigo: 'mapa', nome: 'Mapa da Aprovação', descricao: 'Uma trilha pelas 4 áreas até o X da aprovação.', categoria: 'Games', raridade: 'comum', requisito: '15 dias ativos', progresso: s => [s.diasAtivos, 15] },
  { codigo: 'praia', nome: 'Pôr do Sol', descricao: 'Sol se pondo no mar, ondas e um coqueiro.', categoria: 'Paisagens', raridade: 'comum', requisito: '10 dias ativos', progresso: s => [s.diasAtivos, 10] },
  { codigo: 'medicina', nome: 'Plantão', descricao: 'Batimentos no monitor e DNA girando. Para quem sonha com Medicina.', categoria: 'Cursos', raridade: 'rara', requisito: '40 acertos em Natureza', progresso: s => [s.acertos.naturezas, 40] },
  { codigo: 'direito', nome: 'Tribunal', descricao: 'A balança da justiça e o martelo. Para quem sonha com Direito.', categoria: 'Cursos', raridade: 'rara', requisito: '40 acertos em Humanas', progresso: s => [s.acertos.humanas, 40] },
  { codigo: 'engenharia', nome: 'Planta Baixa', descricao: 'Ponte pênsil, engrenagem girando e cálculo estrutural.', categoria: 'Cursos', raridade: 'rara', requisito: '40 acertos em Matemática', progresso: s => [s.acertos.exatas, 40] },
  { codigo: 'letras', nome: 'Máquina de Escrever', descricao: 'Letras voando de uma máquina antiga. Para Letras e Jornalismo.', categoria: 'Cursos', raridade: 'rara', requisito: '40 acertos em Linguagens', progresso: s => [s.acertos.linguagens, 40] },
  { codigo: 'sorriso', nome: 'Sorriso', descricao: 'Dente brilhando, escova e espuma. Para quem sonha com Odontologia.', categoria: 'Cursos', raridade: 'rara', requisito: '60 acertos em Natureza', progresso: s => [s.acertos.naturezas, 60] },
  { codigo: 'arquitetura', nome: 'Prancheta', descricao: 'Planta, régua T, compasso e a maquete pronta. Para Arquitetura.', categoria: 'Cursos', raridade: 'rara', requisito: '50 acertos em Matemática', progresso: s => [s.acertos.exatas, 50] },
  { codigo: 'psicologia', nome: 'Mente Aberta', descricao: 'Engrenagens girando e flores brotando das ideias. Para Psicologia.', categoria: 'Cursos', raridade: 'rara', requisito: '50 acertos em Humanas', progresso: s => [s.acertos.humanas, 50] },
  { codigo: 'veterinaria', nome: 'Patinhas', descricao: 'Cachorro, gato, estetoscópio e muito carinho. Para Veterinária.', categoria: 'Cursos', raridade: 'rara', requisito: '50 acertos em Natureza', progresso: s => [s.acertos.naturezas, 50] },
  { codigo: 'relacoes', nome: 'Diplomacia', descricao: 'Rotas entre bandeiras e um avião cruzando o mundo. Para Relações Internacionais.', categoria: 'Cursos', raridade: 'epica', requisito: '30 acertos em cada área', progresso: s => [Math.min(s.acertos.linguagens, s.acertos.humanas, s.acertos.naturezas, s.acertos.exatas), 30] },
  { codigo: 'cidade', nome: 'Cidade à Noite', descricao: 'Skyline com as janelas acendendo uma a uma.', categoria: 'Paisagens', raridade: 'rara', requisito: '20 dias ativos', progresso: s => [s.diasAtivos, 20] },
  { codigo: 'montanhas', nome: 'Cume', descricao: 'Cordilheira ao amanhecer, com a bandeira fincada no topo.', categoria: 'Paisagens', raridade: 'rara', requisito: '2.500 XP', progresso: s => [s.xp, 2500] },
  { codigo: 'arcade', nome: 'Modo Arcade', descricao: 'Sol retrô, grade neon e a barra de XP enchendo.', categoria: 'Games', raridade: 'rara', requisito: '1.500 XP', progresso: s => [s.xp, 1500] },
  { codigo: 'codigo', nome: 'Terminal', descricao: 'O algoritmo da aprovação rodando. Para quem quer Computação.', categoria: 'Cursos', raridade: 'epica', requisito: '3.000 XP', progresso: s => [s.xp, 3000] },
  { codigo: 'duelista', nome: 'Arena', descricao: 'Espadas cruzadas e faíscas. Só para quem vence duelos.', categoria: 'Conquistas', raridade: 'epica', requisito: '5 duelos vencidos', progresso: s => [s.duelosVencidos, 5] },
  { codigo: 'combo', nome: 'Combo x8', descricao: 'Contador de combo em neon: oito acertos sem errar nenhum.', categoria: 'Conquistas', raridade: 'epica', requisito: '8 acertos seguidos', progresso: s => [s.maiorSequenciaAcertos, 8] },
  { codigo: 'chamas', nome: 'Em Chamas', descricao: 'Fogo de verdade, com a sua maior sequência estampada.', categoria: 'Conquistas', raridade: 'epica', requisito: '15 dias seguidos', progresso: s => [s.maiorSequencia, 15] },
  { codigo: 'redacao', nome: 'Nota 1000', descricao: 'A redação corrigida com caneta vermelha e nota máxima.', categoria: 'Estudos', raridade: 'epica', requisito: '5 redações registradas', progresso: s => [s.redacoes, 5] },
  { codigo: 'gabarito', nome: 'Cartão-Resposta', descricao: 'O gabarito preenchido, o lápis e o relógio de prova.', categoria: 'Estudos', raridade: 'epica', requisito: '4 simulados cadastrados', progresso: s => [s.simulados, 4] },
  { codigo: 'aurora', nome: 'Aurora', descricao: 'Aurora boreal dançando sobre pinheiros e uma cabana acesa.', categoria: 'Paisagens', raridade: 'epica', requisito: '45 dias ativos', progresso: s => [s.diasAtivos, 45] },
  { codigo: 'fenix', nome: 'Fênix', descricao: 'Uma fênix de fogo de asas abertas. Trinta dias sem apagar a chama.', categoria: 'Conquistas', raridade: 'lendaria', requisito: '30 dias seguidos', progresso: s => [s.maiorSequencia, 30] },
  { codigo: 'constelacao', nome: 'Constelação', descricao: 'Estrelas que formam um capelo de formatura.', categoria: 'Conquistas', raridade: 'lendaria', requisito: '60 dias seguidos', progresso: s => [s.maiorSequencia, 60] },
  { codigo: 'foguete', nome: 'Rumo à Aprovação', descricao: 'Decolagem com planeta de anéis e rastro de fumaça.', categoria: 'Games', raridade: 'lendaria', requisito: '10.000 XP', progresso: s => [s.xp, 10000] },
  { codigo: 'aprovado', nome: 'Aprovado!', descricao: 'A carta da aprovação, carimbo e chuva de confete.', categoria: 'Conquistas', raridade: 'lendaria', requisito: '500 acertos', progresso: s => [total(s), 500] },
  { codigo: 'campeao', nome: 'Pódio', descricao: 'Troféu no topo do pódio, holofotes e louros.', categoria: 'Conquistas', raridade: 'lendaria', requisito: 'Emblema de campeão do mês', progresso: s => [s.emblemas.includes('campeao_mes') ? 1 : 0, 1], emblema: 'campeao_mes' },
];

export const CAPA_PADRAO = 'caderno';
export const capaPorCodigo = (c: string | null | undefined) => CAPAS.find(x => x.codigo === c) ?? CAPAS[0];
export const capaLiberada = (c: Capa, s: StatsCapa | null) => !!s && c.progresso(s)[0] >= c.progresso(s)[1];

// ───────────────────────── arte ─────────────────────────

const W = 760, H = 170;
const F = 'Schibsted Grotesk, Arial, sans-serif';

function sorteio(semente: number) {
  let s = semente;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function estrelas(n: number, semente: number, x0 = 0, x1 = W, y0 = 0, y1 = H, cor = '#FFFFFF'): string {
  const r = sorteio(semente);
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), t = r() < .18 ? 1.6 : r() * .9 + .5;
    o += `<circle class="${i % 3 === 0 ? 'ce-pisca' : ''}" style="animation-delay:-${(r() * 3).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${t.toFixed(2)}" fill="${cor}" opacity="${(.45 + r() * .5).toFixed(2)}"/>`;
  }
  return o;
}

function confete(n: number, semente: number, x0: number, x1: number, cores: string[]): string {
  const r = sorteio(semente);
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = r() * H, a = Math.round(r() * 180), cor = cores[i % cores.length], d = (r() * 6).toFixed(2), dur = (5 + r() * 4).toFixed(1);
    const forma = i % 3 === 0 ? `<circle r="2.6" fill="${cor}"/>` : `<rect x="-4" y="-2" width="8" height="4" rx="1" fill="${cor}" transform="rotate(${a})"/>`;
    o += `<g class="ce-confete" style="animation-delay:-${d}s;animation-duration:${dur}s"><g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${forma}</g></g>`;
  }
  return o;
}

const ARTE: Record<string, (id: string, d: DadosCapa) => string> = {
  caderno: () => {
    let o = `<rect width="${W}" height="${H}" fill="#FBF8F1"/>`;
    for (let y = 26; y < H; y += 18) o += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#CFE0F5" stroke-width="1.2"/>`;
    o += `<line x1="72" y1="0" x2="72" y2="${H}" stroke="#F2A7A7" stroke-width="1.4"/><line x1="76" y1="0" x2="76" y2="${H}" stroke="#F2A7A7" stroke-width=".8"/>`;
    for (const y of [24, 66, 108, 150]) o += `<circle cx="24" cy="${y}" r="6.5" fill="#E9E3D6"/><circle cx="24" cy="${y}" r="6.5" fill="none" stroke="#D8D0BF"/>`;
    o += `<path d="M300,128 C360,150 400,70 470,96 S560,60 600,52" fill="none" stroke="#2836C6" stroke-width="1.8" stroke-dasharray="5 6" stroke-linecap="round" opacity=".75"/>`;
    o += `<g transform="translate(602 46) rotate(-18)"><path d="M0,0 L44,-12 L14,10 Z" fill="#FFFFFF" stroke="#2836C6" stroke-width="1.8" stroke-linejoin="round"/><path d="M14,10 L44,-12 L20,18 Z" fill="#E4E9FF" stroke="#2836C6" stroke-width="1.8" stroke-linejoin="round"/><path d="M14,10 L16,22 L20,18" fill="none" stroke="#2836C6" stroke-width="1.6" stroke-linejoin="round"/></g>`;
    o += `<path d="M700,22 l5,11 12,1 -9,8 3,12 -11,-6 -11,6 3,-12 -9,-8 12,-1 z" fill="none" stroke="#E8B931" stroke-width="2" stroke-linejoin="round" class="ce-pisca"/>`;
    o += `<g transform="rotate(-3 520 122)"><rect x="452" y="112" width="148" height="20" rx="3" fill="#FFE066" opacity=".75"/><text x="526" y="128" text-anchor="middle" font-family="${F}" font-size="17" font-weight="800" fill="#1E2A5A">foco no ENEM</text></g>`;
    o += `<text x="640" y="104" font-family="Georgia, serif" font-style="italic" font-size="19" fill="#2836C6" opacity=".8" transform="rotate(-6 640 104)">E = mc²</text>`;
    for (const [i, t] of ['Linguagens', 'Humanas', 'Natureza'].entries()) o += `<path d="M352,${36 + i * 18} l4,5 8,-10" fill="none" stroke="#36B37D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="370" y="${44 + i * 18}" font-family="${F}" font-size="12" font-weight="700" fill="#5A6380">${t}</text>`;
    o += `<g transform="translate(676 150) rotate(-24)"><rect x="0" y="-7" width="96" height="14" rx="2" fill="#F2C14E"/><rect x="0" y="-7" width="96" height="4.5" fill="#F7D57A"/><polygon points="0,-7 -18,0 0,7" fill="#F1D9B5"/><polygon points="-12,-2.4 -18,0 -12,2.4" fill="#3A3D4C"/><rect x="96" y="-7" width="9" height="14" fill="#B9BFCC"/><rect x="105" y="-7" width="14" height="14" rx="3" fill="#F28AB2"/></g>`;
    return o;
  },

  areas: id => {
    const cores = ['#C7455A', '#12A5E1', '#36B37D', '#D08C21'];
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0F1550"/><stop offset="1" stop-color="#232E9E"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    cores.forEach((c, i) => {
      const y = 150 - i * 30;
      o += `<path d="M0,${y + 40} C180,${y + 10} 300,${y + 60} 480,${y + 6} S700,${y - 30} ${W},${y - 18} L${W},${y + 4} C700,${y - 8} 640,${y + 30} 480,${y + 34} S180,${y + 40} 0,${y + 66} Z" fill="${c}" opacity=".9"/>`;
    });
    o += `<g opacity=".12">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i % 10) * 76 + 20}" cy="${Math.floor(i / 10) * 18 + 14}" r="1.6" fill="#FFFFFF"/>`).join('')}</g>`;
    const icones = [
      '<path d="M-9,-7 h7 a3,3 0 0 1 2,1 a3,3 0 0 1 2,-1 h7 v14 h-7 a2,2 0 0 0 -2,2 a2,2 0 0 0 -2,-2 h-7 z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>',
      '<path d="M-10,8 h20 M-8,5 v-9 M-3,5 v-9 M3,5 v-9 M8,5 v-9 M-11,-4 h22 l-11,-6 z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
      '<path d="M-8,9 C-8,-4 2,-10 10,-10 C10,2 4,9 -8,9 Z M-8,9 L3,-2" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
      `<text y="7" text-anchor="middle" font-family="${F}" font-size="21" font-weight="800" fill="#FFFFFF">Σ</text>`,
    ];
    icones.forEach((ic, i) => {
      const x = 500 + i * 66, y = 48 + (i % 2) * 14;
      o += `<g class="ce-flutua" style="animation-delay:-${i * .7}s"><circle cx="${x}" cy="${y}" r="22" fill="${cores[i]}" stroke="#FFFFFF" stroke-width="2.5"/><g transform="translate(${x} ${y})">${ic}</g></g>`;
    });
    return o;
  },

  madrugada: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1030"/><stop offset="1" stop-color="#1F2756"/></linearGradient><linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16206A"/><stop offset="1" stop-color="#3A3F8F"/></linearGradient><radialGradient id="${id}l" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".5"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient></defs>`;
    o += `<rect width="${W}" height="${H}" fill="url(#${id}f)"/>` + estrelas(30, 7, 0, 520, 0, 120);
    o += `<rect x="548" y="14" width="168" height="112" rx="6" fill="url(#${id}c)"/>` + estrelas(12, 3, 556, 708, 20, 118) + `<path d="M662,38 a20,20 0 1 0 22,26 a15,15 0 1 1 -22,-26 z" fill="#FFF3C4"/>`;
    o += `<rect x="548" y="14" width="168" height="112" rx="6" fill="none" stroke="#4A527E" stroke-width="7"/><line x1="632" y1="14" x2="632" y2="126" stroke="#4A527E" stroke-width="5"/><line x1="548" y1="70" x2="716" y2="70" stroke="#4A527E" stroke-width="5"/>`;

    o += `<rect x="0" y="140" width="${W}" height="30" fill="#3B2A22"/><rect x="0" y="138" width="${W}" height="5" fill="#5A4032"/>`;
    o += `<polygon points="452,74 472,86 540,140 446,140" fill="#FFE9A8" opacity=".2"/><ellipse cx="496" cy="140" rx="48" ry="5" fill="#FFE9A8" opacity=".3"/>`;
    o += `<ellipse cx="420" cy="139" rx="18" ry="4.5" fill="#4A4F66"/><path d="M420,137 L408,100 L440,70" fill="none" stroke="#5A6080" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="408" cy="100" r="4" fill="#5A6080"/>`;
    o += `<path d="M432,60 L456,72 L470,90 L448,80 Z" fill="#E5484D"/><path d="M440,62 L458,72" stroke="#FF8A8A" stroke-width="2" stroke-linecap="round"/><ellipse cx="461" cy="84" rx="7" ry="3.5" fill="#FFF3C4" transform="rotate(38 461 84)"/>`;
    o += [['#36B37D', 300, 26], ['#12A5E1', 306, 22], ['#C7455A', 296, 24], ['#D08C21', 304, 20]].map(([c, x, w], i) => `<rect x="${x}" y="${128 - i * 10}" width="${(w as number) * 2.6}" height="10" rx="2" fill="${c}"/><rect x="${(x as number) + 6}" y="${131 - i * 10}" width="${(w as number) * 1.4}" height="2" fill="#FFFFFF" opacity=".5"/>`).join('');
    o += `<path d="M470,138 L478,118 L520,116 L512,138 Z" fill="#F4F1E8"/><path d="M482,124 h28 M481,129 h24 M480,134 h26" stroke="#B9BFCC" stroke-width="1.2"/>`;
    o += `<rect x="540" y="114" width="22" height="24" rx="4" fill="#F2F4FA"/><path d="M562,120 q9,0 9,7 t-9,7" fill="none" stroke="#F2F4FA" stroke-width="3"/>`;
    for (const [i, x] of [546, 553, 559].entries()) o += `<path class="ce-vapor" style="animation-delay:-${i * .6}s" d="M${x},108 q-5,-8 0,-14 t0,-14" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".55"/>`;
    o += `<rect x="684" y="112" width="52" height="26" rx="6" fill="#1B2142"/><text x="710" y="130" text-anchor="middle" font-family="ui-monospace, Consolas, monospace" font-size="14" font-weight="700" fill="#FF6B6B">02:47</text>`;
    return o;
  },

  mapa: id => {
    let o = `<defs><radialGradient id="${id}v" cx=".55" cy=".5" r=".75"><stop offset=".55" stop-color="#EFDDB4"/><stop offset="1" stop-color="#C9A46A"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}v)"/>`;
    o += `<path d="M0,0 L250,0 C230,40 290,60 250,95 C215,125 260,150 230,${H} L0,${H} Z" fill="#9FD0DB"/><path d="M0,0 L250,0 C230,40 290,60 250,95 C215,125 260,150 230,${H}" fill="none" stroke="#7FB4C2" stroke-width="3"/>`;
    for (const [x, y] of [[80, 40], [150, 90], [60, 130], [190, 30]]) o += `<path d="M${x},${y} q6,-5 12,0 t12,0" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".8"/>`;
    for (const [x, h] of [[316, 40], [346, 54], [376, 36]]) o += `<path d="M${x - 24},60 L${x},${60 - h} L${x + 24},60 Z" fill="#B58A5A"/><path d="M${x},${60 - h} L${x + 24},60 L${x + 6},60 Z" fill="#8C6A44"/><path d="M${x - 6},${60 - h + 12} L${x},${60 - h} L${x + 7},${60 - h + 13}" fill="#FFFFFF" opacity=".8"/>`;
    for (const x of [380, 650]) o += `<path d="M${x},146 q2,-18 0,-30" stroke="#7A5530" stroke-width="3" fill="none"/><path d="M${x},116 q-14,-4 -20,6 M${x},116 q14,-4 20,6 M${x},116 q-8,-12 -18,-12 M${x},116 q8,-12 18,-12" stroke="#3E8A4E" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    const pts: [number, number][] = [[300, 142], [400, 96], [520, 128], [600, 78], [690, 110]];
    o += `<path d="M300,142 C340,140 360,98 400,96 S480,132 520,128 S560,80 600,78 S660,112 690,110" fill="none" stroke="#B5303A" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>`;
    ['#C7455A', '#12A5E1', '#36B37D', '#D08C21'].forEach((c, i) => { const [x, y] = pts[i]; o += `<circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="#6B4A2A" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3" fill="#FFFFFF"/>`; });
    o += `<path d="M680,100 l20,20 M700,100 l-20,20" stroke="#B5303A" stroke-width="6" stroke-linecap="round"/>`;
    o += `<line x1="710" y1="104" x2="710" y2="58" stroke="#6B4A2A" stroke-width="3"/><path class="ce-bandeira" d="M710,58 l32,6 -32,10 z" fill="#E8B931" stroke="#B5871A" stroke-width="1.2"/>`;
    o += `<g transform="translate(728 140)"><circle r="18" fill="none" stroke="#6B4A2A" stroke-width="1.5" opacity=".7"/><path d="M0,-16 L4,0 L0,16 L-4,0 Z" fill="#B5303A"/><path d="M-16,0 L0,-4 L16,0 L0,4 Z" fill="#6B4A2A" opacity=".7"/><text y="-21" text-anchor="middle" font-family="Georgia, serif" font-size="9" font-weight="700" fill="#6B4A2A">N</text></g>`;
    o += `<text x="590" y="34" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="20" fill="#6B4A2A">Rumo à aprovação</text>`;
    return o;
  },

  medicina: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B5563"/><stop offset="1" stop-color="#062A37"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    for (let x = 0; x < W; x += 14) o += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#5CF2C8" stroke-opacity="${x % 70 === 0 ? .14 : .05}"/>`;
    for (let y = 0; y < H; y += 14) o += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#5CF2C8" stroke-opacity="${y % 70 === 0 ? .14 : .05}"/>`;
    let ecg = 'M0,100';
    for (let x = 0; x < W; x += 152) ecg += ` L${x + 40},100 q8,-10 16,0 L${x + 70},100 l6,10 8,-62 8,72 6,-20 L${x + 112},100 q12,-14 24,0 L${x + 152},100`;
    o += `<path d="${ecg}" fill="none" stroke="#5CF2C8" stroke-width="7" stroke-opacity=".15" stroke-linejoin="round"/>`;
    o += `<path class="ce-ecg" d="${ecg}" fill="none" stroke="#5CF2C8" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
    o += `<g class="ce-pulso" style="transform-origin:600px 46px"><path d="M600,64 C580,50 572,40 572,32 a14,14 0 0 1 28,-4 a14,14 0 0 1 28,4 c0,8 -8,18 -28,32 z" fill="#FF5C7A"/><path d="M584,30 a8,8 0 0 1 10,-4" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".7"/></g>`;
    let dna = '';
    for (let i = 0; i <= 16; i++) {
      const y = 12 + i * 9.5, a = i * .55, x1 = 712 + Math.sin(a) * 18, x2 = 712 - Math.sin(a) * 18;
      dna += `<line x1="${x1.toFixed(1)}" y1="${y}" x2="${x2.toFixed(1)}" y2="${y}" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="2"/><circle cx="${x1.toFixed(1)}" cy="${y}" r="3.2" fill="#5CF2C8"/><circle cx="${x2.toFixed(1)}" cy="${y}" r="3.2" fill="#FF8FA3"/>`;
    }
    o += `<g opacity=".9">${dna}</g>`;
    for (const [x, y] of [[420, 30], [470, 140], [660, 140], [520, 24]]) o += `<path d="M${x - 6},${y} h12 M${x},${y - 6} v12" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".25"/>`;
    o += `<text x="456" y="62" font-family="ui-monospace, Consolas, monospace" font-size="13" font-weight="700" fill="#5CF2C8">♥ 72 bpm</text>`;
    return o;
  },

  direito: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A0F1E"/><stop offset="1" stop-color="#4E1834"/></linearGradient><linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset="1" stop-color="#C9971A"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<g fill="#FFFFFF" opacity=".07"><rect x="330" y="30" width="250" height="12"/><polygon points="320,30 455,4 590,30"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${342 + i * 44}" y="44" width="18" height="110"/>`).join('')}<rect x="324" y="154" width="262" height="10"/></g>`;
    o += `<text x="740" y="92" text-anchor="end" font-family="Georgia, serif" font-size="96" fill="#FFFFFF" opacity=".08">§</text>`;
    o += `<rect x="630" y="40" width="8" height="112" fill="url(#${id}o)"/><path d="M606,152 h56 l-6,-10 h-44 z" fill="url(#${id}o)"/><circle cx="634" cy="34" r="8" fill="url(#${id}o)"/>`;
    o += `<g class="ce-balanca" style="transform-origin:634px 48px"><rect x="566" y="45" width="136" height="6" rx="3" fill="url(#${id}o)"/>`;
    for (const x of [576, 692]) o += `<path d="M${x},51 L${x - 22},98 M${x},51 L${x + 22},98" stroke="#E8B931" stroke-width="1.4"/><path d="M${x - 28},98 h56 a28,12 0 0 1 -56,0 z" fill="url(#${id}o)"/>`;
    o += `</g>`;
    o += `<g transform="translate(470 124) rotate(-30)"><rect x="-26" y="-10" width="52" height="20" rx="5" fill="#8B5A2B"/><rect x="-30" y="-12" width="8" height="24" rx="2" fill="#E8B931"/><rect x="22" y="-12" width="8" height="24" rx="2" fill="#E8B931"/><rect x="-4" y="10" width="8" height="46" rx="3" fill="#6B4423"/></g><ellipse cx="452" cy="156" rx="34" ry="6" fill="#6B4423"/>`;
    return o;
  },

  engenharia: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0D4C92"/><stop offset="1" stop-color="#0A2F61"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    for (let x = 0; x < W; x += 14) o += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#FFFFFF" stroke-opacity="${x % 70 === 0 ? .13 : .05}"/>`;
    for (let y = 0; y < H; y += 14) o += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#FFFFFF" stroke-opacity="${y % 70 === 0 ? .13 : .05}"/>`;
    const L = 'fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"';
    o += `<path d="M380,128 L660,128" ${L}/><path d="M440,128 V36 M600,128 V36" ${L} stroke-width="3"/><path d="M380,104 Q410,96 440,36 Q520,118 600,36 Q630,96 660,104" ${L}/>`;
    for (let x = 452; x < 600; x += 12) { const t = (x - 440) / 160, y = 36 + 82 * (1 - Math.pow(2 * t - 1, 2)); o += `<line x1="${x}" y1="${y.toFixed(1)}" x2="${x}" y2="128" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1"/>`; }
    o += `<path d="M380,140 L660,140 M380,134 v12 M660,134 v12" ${L} stroke-opacity=".75"/><path d="M386,140 l8,-4 v8 z M654,140 l-8,-4 v8 z" fill="#FFFFFF" opacity=".75"/><rect x="496" y="132" width="48" height="16" fill="#0C437F"/><text x="520" y="144" text-anchor="middle" font-family="ui-monospace, Consolas, monospace" font-size="11" fill="#FFFFFF">220 m</text>`;
    let dentes = '';
    for (let k = 0; k < 12; k++) dentes += `<rect x="-5" y="-33" width="10" height="10" rx="2" transform="rotate(${k * 30})"/>`;
    o += `<g transform="translate(708 52)"><g class="ce-gira"><g fill="none" stroke="#FFFFFF" stroke-width="1.8">${dentes}<circle r="24"/><circle r="9"/></g></g></g>`;
    o += `<g transform="translate(672 112)"><g class="ce-gira-inv"><g fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".8">${Array.from({ length: 8 }, (_, k) => `<rect x="-4" y="-21" width="8" height="7" rx="1.5" transform="rotate(${k * 45})"/>`).join('')}<circle r="15"/><circle r="5"/></g></g></g>`;
    o += `<text x="720" y="160" text-anchor="end" font-family="ui-monospace, Consolas, monospace" font-size="13" fill="#9CD3FF">σ = F / A</text><path d="M340,40 l40,0 l-40,-34 z" ${L} stroke-opacity=".6"/>`;
    return o;
  },

  letras: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4EA"/><stop offset="1" stop-color="#FCD9C6"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<text x="330" y="150" font-family="Georgia, serif" font-size="210" fill="#C7455A" opacity=".1">“</text>`;
    o += `<g transform="rotate(-4 640 40)"><rect x="584" y="4" width="116" height="92" fill="#FFFFFF" stroke="#E7D9CC"/><text x="596" y="30" font-family="Georgia, serif" font-style="italic" font-size="13" fill="#2E3140">Era uma vez</text><text x="596" y="48" font-family="Georgia, serif" font-style="italic" font-size="13" fill="#2E3140">um aluno que</text><text x="596" y="66" font-family="Georgia, serif" font-style="italic" font-size="13" fill="#2E3140">não desistiu</text><rect class="ce-cursor" x="682" y="56" width="2" height="12" fill="#C7455A"/></g>`;
    o += `<rect x="560" y="84" width="170" height="20" rx="6" fill="#3A3D4C"/><circle cx="556" cy="94" r="9" fill="#2E3140"/><circle cx="734" cy="94" r="9" fill="#2E3140"/>`;
    o += `<path d="M548,104 h196 l18,52 h-232 z" fill="#2E3140"/><path d="M548,104 h196 l4,10 h-204 z" fill="#C7455A"/>`;
    for (let r = 0; r < 3; r++) for (let k = 0; k < 9 - r; k++) o += `<circle cx="${572 + r * 10 + k * 20}" cy="${126 + r * 11}" r="6" fill="#F4F1E8" stroke="#1B1D26" stroke-width="1.5"/>`;
    const letras = ['A', 'ç', 'ã', 'Z', '&', 'é', 'R', '?'];
    letras.forEach((l, i) => {
      const x = 360 + i * 26 + (i % 2) * 8, y = 60 + (i % 3) * 30, a = (i * 37) % 50 - 25;
      o += `<g class="ce-sobe" style="animation-delay:-${(i * .9).toFixed(1)}s"><text x="${x}" y="${y}" font-family="Georgia, serif" font-size="${22 + (i % 3) * 6}" font-weight="700" fill="${['#C7455A', '#2E3140', '#D08C21'][i % 3]}" transform="rotate(${a} ${x} ${y})">${l}</text></g>`;
    });
    o += `<circle cx="460" cy="146" r="6" fill="#2E3140" opacity=".8"/><circle cx="474" cy="152" r="3" fill="#2E3140" opacity=".8"/><circle cx="448" cy="156" r="2.4" fill="#2E3140" opacity=".8"/>`;
    return o;
  },

  arcade: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160A3A"/><stop offset=".55" stop-color="#6A1B9A"/><stop offset=".66" stop-color="#FF6F91"/><stop offset="1" stop-color="#1A0B3D"/></linearGradient><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE66D"/><stop offset="1" stop-color="#FF4FA3"/></linearGradient><linearGradient id="${id}x" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5CF2C8"/><stop offset="1" stop-color="#4FA3FF"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += estrelas(26, 11, 0, W, 0, 70);
    o += `<circle cx="600" cy="100" r="50" fill="url(#${id}s)"/>`;
    for (let k = 0; k < 6; k++) o += `<rect x="540" y="${82 + k * 6}" width="120" height="${1.4 + k * .5}" fill="#6A1B9A"/>`;
    o += `<path d="M300,112 L360,86 L400,100 L450,72 L500,104 L560,92 L640,112 L700,80 L760,104 L760,112 Z" fill="#2A0E52"/>`;
    o += `<rect x="0" y="112" width="${W}" height="${H - 112}" fill="#1A0B3D"/>`;
    for (let k = 0; k < 7; k++) { const y = 112 + Math.pow(k / 6, 1.8) * 58; o += `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}" stroke="#FF2BD6" stroke-opacity=".7" stroke-width="1.2"/>`; }
    for (let k = -10; k <= 10; k++) o += `<line x1="${600 + k * 18}" y1="112" x2="${600 + k * 110}" y2="${H}" stroke="#FF2BD6" stroke-opacity=".55" stroke-width="1.1"/>`;
    const px = (x: number, y: number, mapa: string[], cor: string, s = 3) => mapa.map((l, j) => [...l].map((c, i) => c === '#' ? `<rect x="${x + i * s}" y="${y + j * s}" width="${s}" height="${s}" fill="${cor}"/>` : '').join('')).join('');
    const coracao = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
    for (let k = 0; k < 3; k++) o += px(612 + k * 25, 12, coracao, k < 2 ? '#FF4F6E' : '#5A3A7A');
    o += `<text x="612" y="48" font-family="ui-monospace, Consolas, monospace" font-size="12" font-weight="800" fill="#FFFFFF" letter-spacing="1">XP</text><rect x="636" y="38" width="110" height="12" fill="#2A0E52" stroke="#FFFFFF" stroke-width="2"/><rect class="ce-xp" x="638" y="40" width="80" height="8" fill="url(#${id}x)"/>`;
    o += `<text x="455" y="30" font-family="ui-monospace, Consolas, monospace" font-size="15" font-weight="800" fill="#FFE66D" letter-spacing="2">LV 99</text>`;
    const moeda = ['.###.', '#####', '##.##', '#####', '.###.'];
    for (const [i, x] of [420, 470, 520].entries()) o += `<g class="ce-flutua" style="animation-delay:-${i * .4}s">${px(x, 52 + (i % 2) * 10, moeda, '#FFD23F', 3)}</g>`;
    o += `<text class="ce-cursor" x="600" y="160" text-anchor="middle" font-family="ui-monospace, Consolas, monospace" font-size="12" font-weight="800" fill="#FFFFFF" letter-spacing="3">PRESS START</text>`;
    return o;
  },

  codigo: () => {
    let o = `<rect width="${W}" height="${H}" fill="#0A0E1F"/>`;
    const r = sorteio(21);
    for (let c = 0; c < 22; c++) {
      const x = c * 17 + 6, d = (r() * 5).toFixed(2), dur = (4 + r() * 4).toFixed(1);
      let col = '';
      for (let k = 0; k < 12; k++) col += `<text x="${x}" y="${k * 15}" font-family="ui-monospace, Consolas, monospace" font-size="11" fill="#36E39B" opacity="${(.06 + (k / 12) * .3).toFixed(2)}">${r() > .5 ? 1 : 0}</text>`;
      o += `<g class="ce-chuva" style="animation-delay:-${d}s;animation-duration:${dur}s">${col}</g>`;
    }
    o += `<rect x="384" y="14" width="360" height="142" rx="10" fill="#141B33" stroke="#2A3358" stroke-width="1.5"/><rect x="384" y="14" width="360" height="24" rx="10" fill="#1E2747"/><rect x="384" y="30" width="360" height="8" fill="#1E2747"/>`;
    o += ['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => `<circle cx="${400 + i * 15}" cy="26" r="4.5" fill="${c}"/>`).join('') + `<text x="564" y="30" text-anchor="middle" font-family="ui-monospace, Consolas, monospace" font-size="10.5" fill="#8A93B8">aprovacao.ts</text>`;
    const K = '#FF79C6', S = '#F1FA8C', C = '#6E7BB0', N = '#BD93F9', Fn = '#50FA7B', T = '#E6E9F5';
    const linhas: [string, string][][] = [
      [[K, 'const '], [T, 'aluno = '], [K, 'new '], [Fn, 'Estudante'], [T, '();']],
      [[K, 'while '], [T, '(!aluno.'], [N, 'aprovado'], [T, ') {']],
      [[T, '  aluno.'], [Fn, 'responder'], [T, '('], [N, '4'], [T, ');  '], [C, '// todo dia']],
      [[T, '  aluno.'], [Fn, 'revisar'], [T, '(erros);']],
      [[T, '}']],
      [[T, 'console.'], [Fn, 'log'], [T, '('], [S, '"Aprovado!"'], [T, ');']],
    ];
    linhas.forEach((l, i) => {
      o += `<text x="398" y="${58 + i * 16}" font-family="ui-monospace, Consolas, monospace" font-size="12.5"><tspan fill="#4A5580">${i + 1}  </tspan>${l.map(([c, t]) => `<tspan fill="${c}" xml:space="preserve">${t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</tspan>`).join('')}</text>`;
    });
    o += `<rect class="ce-cursor" x="588" y="135" width="8" height="14" fill="#50FA7B"/>`;
    return o;
  },

  duelista: id => {
    let o = `<defs><radialGradient id="${id}f" cx=".78" cy=".5" r=".8"><stop offset="0" stop-color="#FF7A2E"/><stop offset=".35" stop-color="#A3221E"/><stop offset="1" stop-color="#1A0A0F"/></radialGradient><linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9EEF7"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#A9B3C7"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<g transform="translate(600 85)"><g class="ce-gira-lento" opacity=".16">${Array.from({ length: 12 }, (_, k) => `<polygon points="0,0 -18,-260 18,-260" fill="#FFE2A0" transform="rotate(${k * 30})"/>`).join('')}</g></g>`;
    const espada = (rot: number) => `<g transform="translate(604 78) rotate(${rot}) scale(.78)"><polygon points="-5,-74 5,-74 5,34 0,44 -5,34" fill="url(#${id}l)" stroke="#6B7591" stroke-width="1"/><line x1="0" y1="-70" x2="0" y2="34" stroke="#9AA3B8" stroke-width="1.2"/><rect x="-24" y="-80" width="48" height="8" rx="4" fill="#E8B931" stroke="#9C7413"/><rect x="-4" y="-104" width="8" height="24" rx="2" fill="#5A2E1A"/><circle cx="0" cy="-108" r="6" fill="#E8B931" stroke="#9C7413"/></g>`;
    o += espada(-40 + 180) + espada(40 + 180);
    for (const [x, y, s, d] of [[600, 85, 1.3, 0], [584, 70, .7, .6], [618, 100, .8, 1.1], [622, 66, .6, 1.6]]) o += `<path class="ce-pisca" style="animation-delay:-${d}s" d="M${x},${y - 12 * s} L${x + 3 * s},${y - 3 * s} L${x + 12 * s},${y} L${x + 3 * s},${y + 3 * s} L${x},${y + 12 * s} L${x - 3 * s},${y + 3 * s} L${x - 12 * s},${y} L${x - 3 * s},${y - 3 * s} Z" fill="#FFF3B0"/>`;
    o += `<text x="470" y="104" text-anchor="middle" font-family="${F}" font-size="52" font-weight="800" font-style="italic" fill="#FFFFFF" stroke="#3A0A0A" stroke-width="2" paint-order="stroke">VS</text>`;
    o += `<path d="M720,20 l-14,30 h12 l-10,26 24,-36 h-12 l10,-20 z" fill="#FFE066" opacity=".9"/>`;
    return o;
  },

  chamas: (id, d) => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A0905"/><stop offset="1" stop-color="#5E1A06"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    const chama = (x: number, h: number, w: number, i: number) => {
      const b = H + 4;
      const forma = (k: number) => `M${x - w * k},${b} C${x - w * k},${b - h * k * .5} ${x - w * k * .2},${b - h * k * .7} ${x},${b - h * k} C${x + w * k * .3},${b - h * k * .6} ${x + w * k},${b - h * k * .45} ${x + w * k},${b} Z`;
      return `<g class="ce-chama" style="transform-origin:${x}px ${b}px;animation-delay:-${(i * .37).toFixed(2)}s"><path d="${forma(1)}" fill="#E63B1E"/><path d="${forma(.72)}" fill="#FF7A1A"/><path d="${forma(.42)}" fill="#FFC93C"/></g>`;
    };
    const r = sorteio(5);
    for (let i = 0; i < 16; i++) { const x = 320 + i * 29 + r() * 10; o += chama(x, 40 + r() * 60 + (x > 540 ? 26 : 0), 14 + r() * 10, i); }
    for (let i = 0; i < 14; i++) o += `<circle class="ce-brasa" style="animation-delay:-${(r() * 4).toFixed(2)}s;animation-duration:${(2.5 + r() * 2.5).toFixed(1)}s" cx="${(360 + r() * 380).toFixed(0)}" cy="${(110 + r() * 40).toFixed(0)}" r="${(1 + r() * 1.8).toFixed(1)}" fill="#FFC93C"/>`;
    const n = d.sequencia ?? 0;
    o += `<g transform="translate(560 64)"><path d="M0,-40 C14,-24 28,-12 28,8 C28,26 14,38 0,38 C-14,38 -28,26 -28,8 C-28,-6 -18,-14 -12,-26 C-10,-14 -4,-8 2,-6 C6,-20 2,-30 0,-40 Z" fill="#FF7A1A" stroke="#FFE3A0" stroke-width="2"/><path d="M0,-6 C8,4 14,10 14,20 C14,30 8,36 0,36 C-8,36 -14,30 -14,20 C-14,12 -8,8 -6,0 C-4,8 0,10 0,-6 Z" fill="#FFC93C"/></g>`;
    o += `<text x="604" y="70" font-family="${F}" font-size="40" font-weight="800" fill="#FFFFFF" stroke="#5E1A06" stroke-width="2" paint-order="stroke">${n}</text><text x="606" y="88" font-family="${F}" font-size="12" font-weight="800" fill="#FFD9A8" letter-spacing="1.5">${n === 1 ? 'DIA' : 'DIAS'} SEGUIDOS</text>`;
    return o;
  },

  redacao: () => {
    let o = `<rect width="${W}" height="${H}" fill="#FFFDF6"/>`;
    for (let y = 22; y < H; y += 16) o += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#DCE6F2" stroke-width="1"/>`;
    o += `<line x1="320" y1="0" x2="320" y2="${H}" stroke="#F2A7A7" stroke-width="1.4"/>`;
    const r = sorteio(9);
    for (let k = 0; k < 8; k++) {
      let x = k % 4 === 0 ? 352 : 336;
      while (x < 610) { const w = 18 + r() * 44; if (x + w > 620) break; o += `<rect x="${x.toFixed(0)}" y="${16 + k * 16}" width="${w.toFixed(0)}" height="4" rx="2" fill="#4A5170" opacity=".55"/>`; x += w + 6; }
    }
    o += `<ellipse cx="400" cy="50" rx="34" ry="9" fill="none" stroke="#E5484D" stroke-width="2"/><path d="M470,90 q8,5 16,0 t16,0 t16,0 t16,0" fill="none" stroke="#E5484D" stroke-width="2"/><text x="560" y="62" font-family="Georgia, serif" font-style="italic" font-size="15" fill="#E5484D" transform="rotate(-5 560 62)">Ótimo!</text><path d="M548,124 l6,7 12,-15" fill="none" stroke="#E5484D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    o += `<g transform="rotate(-9 680 82)"><circle cx="680" cy="82" r="52" fill="none" stroke="#E5484D" stroke-width="3" stroke-dasharray="4 3"/><text x="680" y="62" text-anchor="middle" font-family="${F}" font-size="11" font-weight="800" fill="#E5484D" letter-spacing="3">NOTA</text><text x="680" y="98" text-anchor="middle" font-family="${F}" font-size="40" font-weight="800" fill="#E5484D">1000</text><path d="M646,106 h68 M652,112 h56" stroke="#E5484D" stroke-width="2.4" stroke-linecap="round"/></g>`;
    o += `<g transform="translate(520 150) rotate(-14)"><rect x="0" y="-5" width="110" height="10" rx="5" fill="#E5484D"/><polygon points="0,-5 -16,0 0,5" fill="#F4D9C0"/><polygon points="-10,-2 -16,0 -10,2" fill="#B5303A"/><rect x="84" y="-6" width="5" height="12" fill="#B5303A"/></g>`;
    return o;
  },

  constelacao: id => {
    let o = `<defs><radialGradient id="${id}f" cx=".75" cy=".4" r=".9"><stop offset="0" stop-color="#2A1D6B"/><stop offset=".5" stop-color="#0F1442"/><stop offset="1" stop-color="#050818"/></radialGradient><radialGradient id="${id}n" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#B07BFF" stop-opacity=".45"/><stop offset="1" stop-color="#B07BFF" stop-opacity="0"/></radialGradient><radialGradient id="${id}b" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".3" stop-color="#CFE0FF" stop-opacity=".7"/><stop offset="1" stop-color="#CFE0FF" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<ellipse cx="560" cy="70" rx="220" ry="70" fill="url(#${id}n)"/><ellipse cx="700" cy="130" rx="140" ry="50" fill="url(#${id}n)" opacity=".7"/>` + estrelas(90, 17);
    const pts: [number, number][] = [[560, 64], [624, 36], [688, 64], [624, 92], [688, 64], [700, 104], [596, 80], [596, 118], [652, 118], [652, 80]];
    const ligar = [[0, 1], [1, 2], [2, 3], [3, 0], [2, 5], [6, 7], [7, 8], [8, 9]];
    o += ligar.map(([a, b]) => `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" stroke="#CFE0FF" stroke-opacity=".55" stroke-width="1.3"/>`).join('');
    [0, 1, 2, 3, 5, 6, 7, 8, 9].forEach((i, k) => o += `<circle class="ce-pisca" style="animation-delay:-${(k * .45).toFixed(2)}s" cx="${pts[i][0]}" cy="${pts[i][1]}" r="9" fill="url(#${id}b)"/><circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="2.2" fill="#FFFFFF"/>`);
    o += `<g class="ce-cadente"><line x1="430" y1="20" x2="470" y2="34" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".9"/></g>`;
    o += `<text x="626" y="152" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="12.5" fill="#CFE0FF" opacity=".75" letter-spacing="1">Constelação da Aprovação</text>`;
    return o;
  },

  foguete: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060A24"/><stop offset=".6" stop-color="#1B2560"/><stop offset="1" stop-color="#43306E"/></linearGradient><linearGradient id="${id}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB15C"/><stop offset="1" stop-color="#C2452D"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>` + estrelas(70, 29);
    o += `<circle cx="730" cy="150" r="58" fill="url(#${id}p)"/><path d="M684,126 C700,118 740,118 772,128" stroke="#FFD9A8" stroke-width="5" fill="none" opacity=".5"/><ellipse cx="730" cy="150" rx="96" ry="18" fill="none" stroke="#FFE3B8" stroke-width="4" opacity=".75" transform="rotate(-14 730 150)"/>`;
    o += `<circle cx="430" cy="38" r="16" fill="#D9DEEE"/><circle cx="425" cy="34" r="4" fill="#B9BFCC"/><circle cx="436" cy="44" r="3" fill="#B9BFCC"/>`;
    o += `<path d="M330,180 C420,170 480,140 540,104" fill="none" stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" opacity=".08"/><path d="M330,180 C420,170 480,140 540,104" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity=".14"/>`;
    for (const [x, y, r] of [[470, 146, 12], [500, 132, 10], [440, 158, 14], [524, 118, 8]]) o += `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" opacity=".18"/>`;
    o += `<g class="ce-flutua"><g transform="translate(580 76) rotate(45)">`;
    o += `<g class="ce-fogo" style="transform-origin:0px 40px"><path d="M-10,38 Q0,78 10,38 Z" fill="#FF7A1A"/><path d="M-6,38 Q0,62 6,38 Z" fill="#FFE066"/></g>`;
    o += `<path d="M-14,30 L-28,46 L-14,40 Z M14,30 L28,46 L14,40 Z" fill="#E5484D"/><path d="M0,-46 C16,-30 16,10 14,38 L-14,38 C-16,10 -16,-30 0,-46 Z" fill="#F4F6FA"/><path d="M0,-46 C8,-38 12,-28 13,-20 L-13,-20 C-12,-28 -8,-38 0,-46 Z" fill="#E5484D"/><circle cx="0" cy="-4" r="7" fill="#4FA3FF" stroke="#2836C6" stroke-width="2.5"/><rect x="-14" y="30" width="28" height="8" fill="#B9BFCC"/></g></g>`;
    return o;
  },

  aprovado: () => {
    let o = `<rect width="${W}" height="${H}" fill="#FFF3D1"/><circle cx="600" cy="85" r="150" fill="#FFE3A3"/><circle cx="600" cy="85" r="95" fill="#FFD77A" opacity=".6"/>`;
    o += confete(60, 13, 0, W, ['#E5484D', '#2836C6', '#36B37D', '#E8B931', '#12A5E1', '#F0508C']);
    o += `<g transform="rotate(-6 600 88)"><rect x="520" y="22" width="160" height="128" rx="4" fill="#FFFFFF" stroke="#E7DFC8"/><rect x="520" y="22" width="160" height="22" rx="4" fill="#2836C6"/><text x="600" y="37" text-anchor="middle" font-family="${F}" font-size="10" font-weight="800" fill="#FFFFFF" letter-spacing="2">RESULTADO FINAL</text>`;
    for (let k = 0; k < 4; k++) o += `<rect x="536" y="${54 + k * 11}" width="${120 - k * 18}" height="4" rx="2" fill="#C9CFDC"/>`;
    o += `<g transform="rotate(-10 600 118)"><rect x="534" y="100" width="132" height="34" rx="6" fill="none" stroke="#1F9E5B" stroke-width="3.5"/><text x="600" y="125" text-anchor="middle" font-family="${F}" font-size="21" font-weight="800" fill="#1F9E5B" letter-spacing="2">APROVADO</text></g></g>`;
    o += `<g class="ce-flutua"><g transform="translate(450 50) rotate(-18)"><polygon points="0,-12 40,0 0,12 -40,0" fill="#1E2230"/><rect x="-16" y="2" width="32" height="14" rx="3" fill="#2E3140"/><line x1="30" y1="2" x2="34" y2="26" stroke="#E8B931" stroke-width="2.4"/><circle cx="34" cy="28" r="3.6" fill="#E8B931"/></g></g>`;
    o += `<path d="M700,20 c20,10 0,24 20,32 s0,24 20,32" fill="none" stroke="#F0508C" stroke-width="3" stroke-linecap="round"/><path d="M372,130 c14,-12 26,4 40,-8 s26,4 40,-8" fill="none" stroke="#12A5E1" stroke-width="3" stroke-linecap="round"/>`;
    return o;
  },

  campeao: id => {
    let o = `<defs><radialGradient id="${id}f" cx=".78" cy=".1" r="1"><stop offset="0" stop-color="#6B4E0A"/><stop offset=".55" stop-color="#2A1E05"/><stop offset="1" stop-color="#120C02"/></radialGradient><linearGradient id="${id}o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0A8"/><stop offset=".5" stop-color="#F2C14E"/><stop offset="1" stop-color="#A97A12"/></linearGradient><linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".45"/><stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<polygon points="560,0 590,0 640,150 520,150" fill="url(#${id}h)"/><polygon points="700,0 730,0 700,150 600,150" fill="url(#${id}h)" opacity=".7"/>`;
    o += confete(34, 31, 380, W, ['#E8B931', '#FFFFFF', '#F2C14E', '#E5484D']);
    const bloco = (x: number, h: number, cor: string, n: string) => `<rect x="${x}" y="${H - h}" width="64" height="${h}" fill="${cor}"/><rect x="${x}" y="${H - h}" width="64" height="6" fill="#FFFFFF" opacity=".25"/><text x="${x + 32}" y="${H - h + 30}" text-anchor="middle" font-family="${F}" font-size="22" font-weight="800" fill="#FFFFFF" opacity=".9">${n}</text>`;
    o += bloco(512, 40, '#9AA3B5', '2') + bloco(576, 58, '#D9A91F', '1') + bloco(640, 28, '#B0703A', '3');
    let louro = '';
    for (let k = 0; k < 7; k++) { const a = -150 + k * 18; louro += `<ellipse cx="${(Math.cos(a * Math.PI / 180) * 34).toFixed(1)}" cy="${(Math.sin(a * Math.PI / 180) * 34).toFixed(1)}" rx="8" ry="3.4" fill="#8DBF5A" transform="rotate(${a + 90} ${(Math.cos(a * Math.PI / 180) * 34).toFixed(1)} ${(Math.sin(a * Math.PI / 180) * 34).toFixed(1)})"/>`; }
    o += `<g transform="translate(608 72)">${louro}<g transform="scale(-1 1)">${louro}</g></g>`;
    o += `<g transform="translate(608 74)"><path d="M-22,-30 h44 v10 c0,22 -12,34 -22,36 c-10,-2 -22,-14 -22,-36 z" fill="url(#${id}o)"/><path d="M-22,-24 c-14,0 -16,18 -2,22 M22,-24 c14,0 16,18 2,22" fill="none" stroke="#F2C14E" stroke-width="4"/><rect x="-4" y="16" width="8" height="12" fill="#C9971A"/><rect x="-16" y="28" width="32" height="10" rx="2" fill="url(#${id}o)"/><path d="M-12,-24 c2,14 6,22 10,26" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".55" stroke-linecap="round"/><text y="-2" text-anchor="middle" font-family="${F}" font-size="14" font-weight="800" fill="#8A5E0A">1º</text></g>`;
    for (const [x, y, d] of [[560, 26, 0], [664, 34, .8], [700, 70, 1.5]]) o += `<path class="ce-pisca" style="animation-delay:-${d}s" d="M${x},${y - 9} L${x + 2},${y - 2} L${x + 9},${y} L${x + 2},${y + 2} L${x},${y + 9} L${x - 2},${y + 2} L${x - 9},${y} L${x - 2},${y - 2} Z" fill="#FFF3B0"/>`;
    return o;
  },
  gabarito: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DCE5F5"/><stop offset="1" stop-color="#B8C6E4"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<g opacity=".18">${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * 22}" x2="${W}" y2="${i * 22 - 60}" stroke="#FFFFFF" stroke-width="10"/>`).join('')}</g>`;
    o += `<g transform="rotate(-4 560 88)"><rect x="440" y="6" width="240" height="176" rx="6" fill="#000000" opacity=".12" transform="translate(6 6)"/><rect x="440" y="6" width="240" height="176" rx="6" fill="#FFFFFF"/>`;
    o += `<rect x="440" y="6" width="240" height="26" rx="6" fill="#2836C6"/><rect x="440" y="24" width="240" height="8" fill="#2836C6"/><text x="560" y="24" text-anchor="middle" font-family="${F}" font-size="12" font-weight="800" fill="#FFFFFF" letter-spacing="2">CARTÃO-RESPOSTA</text>`;
    const marcadas = [2, 0, 4, 1, 3, 1, 0, 2, 4, 3];
    for (let i = 0; i < 10; i++) {
      const col = i < 5 ? 0 : 1, lin = i % 5, x = 452 + col * 116, y = 50 + lin * 22;
      o += `<text x="${x}" y="${y + 4}" font-family="${F}" font-size="10" font-weight="800" fill="#5A6380">${String(i + 1).padStart(2, '0')}</text>`;
      for (let k = 0; k < 5; k++) {
        const cx = x + 26 + k * 17, ok = marcadas[i] === k;
        o += `<circle cx="${cx}" cy="${y}" r="6.5" fill="${ok ? '#1E2230' : '#FFFFFF'}" stroke="${ok ? '#1E2230' : '#B9BFCC'}" stroke-width="1.2"/>` + (ok ? '' : `<text x="${cx}" y="${y + 3}" text-anchor="middle" font-family="${F}" font-size="7" font-weight="800" fill="#B9BFCC">${'ABCDE'[k]}</text>`);
      }
    }
    o += `<path d="M452,166 h216" stroke="#C9CFDC" stroke-dasharray="3 3"/><text x="456" y="160" font-family="${F}" font-size="8" font-weight="700" fill="#8A93A8">ASSINATURA</text></g>`;
    o += `<g transform="translate(372 132) rotate(-16)"><rect x="0" y="-6" width="96" height="12" rx="2" fill="#F2C14E"/><rect x="0" y="-6" width="96" height="4" fill="#F7D57A"/><polygon points="0,-6 -16,0 0,6" fill="#F1D9B5"/><polygon points="-10,-2.2 -16,0 -10,2.2" fill="#3A3D4C"/><rect x="96" y="-6" width="8" height="12" fill="#B9BFCC"/><rect x="104" y="-6" width="12" height="12" rx="3" fill="#F28AB2"/></g>`;
    o += `<g transform="translate(722 50)"><circle r="28" fill="#FFFFFF" stroke="#2836C6" stroke-width="4"/><rect x="-6" y="-38" width="12" height="8" rx="2" fill="#2836C6"/><path d="M0,0 L0,-18" stroke="#1E2230" stroke-width="3" stroke-linecap="round"/><path class="ce-ponteiro" d="M0,0 L14,6" stroke="#E5484D" stroke-width="2.4" stroke-linecap="round"/><circle r="3" fill="#1E2230"/><text y="18" text-anchor="middle" font-family="${F}" font-size="9" font-weight="800" fill="#2836C6">5h30</text></g>`;
    o += `<g transform="translate(386 40) rotate(-10)"><rect x="-18" y="-10" width="36" height="20" rx="4" fill="#F28AB2"/><rect x="-18" y="-10" width="14" height="20" rx="4" fill="#4FA3FF"/></g>`;
    return o;
  },

  sorriso: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E4FAF5"/><stop offset="1" stop-color="#9FE3D5"/></linearGradient><linearGradient id="${id}d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DDEFF4"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    const r = sorteio(41);
    for (let i = 0; i < 16; i++) { const x = 340 + r() * 420, y = r() * H, rr = 3 + r() * 9; o += `<g class="ce-sobe" style="animation-delay:-${(r() * 4).toFixed(2)}s"><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rr.toFixed(1)}" fill="#FFFFFF" opacity=".55"/><circle cx="${(x - rr * .3).toFixed(1)}" cy="${(y - rr * .3).toFixed(1)}" r="${(rr * .3).toFixed(1)}" fill="#FFFFFF" opacity=".9"/></g>`; }
    o += `<path d="M360,150 C420,110 470,170 540,120 S640,90 700,140" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round" opacity=".9"/>`;
    const dente = `M-40,-20 C-40,-56 -14,-60 0,-46 C14,-60 40,-56 40,-20 C40,4 30,14 26,34 C22,56 12,62 8,40 C5,24 -5,24 -8,40 C-12,62 -22,56 -26,34 C-30,14 -40,4 -40,-20 Z`;
    o += `<g class="ce-flutua"><g transform="translate(598 88)"><path d="${dente}" fill="#0E6E64" opacity=".15" transform="translate(6 8)"/><path d="${dente}" fill="url(#${id}d)" stroke="#9FCBD6" stroke-width="2"/><path d="M-26,-34 C-22,-44 -12,-46 -6,-40" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/><path d="M18,-14 C24,-4 22,8 18,18" fill="none" stroke="#C9E4EC" stroke-width="7" stroke-linecap="round"/>`;
    o += `<path d="M-14,-8 q14,14 28,0" fill="none" stroke="#2BB5A8" stroke-width="3.4" stroke-linecap="round"/><circle cx="-12" cy="-20" r="3" fill="#2BB5A8"/><circle cx="12" cy="-20" r="3" fill="#2BB5A8"/></g></g>`;
    for (const [x, y, s, d] of [[652, 30, 1.2, 0], [548, 56, .8, .7], [666, 112, .7, 1.4]]) o += `<path class="ce-pisca" style="animation-delay:-${d}s" d="M${x},${y - 10 * s} L${x + 2.6 * s},${y - 2.6 * s} L${x + 10 * s},${y} L${x + 2.6 * s},${y + 2.6 * s} L${x},${y + 10 * s} L${x - 2.6 * s},${y + 2.6 * s} L${x - 10 * s},${y} L${x - 2.6 * s},${y - 2.6 * s} Z" fill="#FFFFFF"/>`;
    o += `<g transform="translate(700 112) rotate(-56)"><rect x="-6" y="-4" width="96" height="10" rx="5" fill="#2BB5A8"/><rect x="40" y="-4" width="14" height="10" fill="#FFFFFF" opacity=".5"/><rect x="-30" y="-6" width="26" height="14" rx="3" fill="#2BB5A8"/>${Array.from({ length: 7 }, (_, k) => `<rect x="${-29 + k * 3.6}" y="-20" width="2.6" height="14" rx="1" fill="${k % 2 ? '#7FD3F2' : '#FFFFFF'}"/>`).join('')}</g>`;
    o += `<g transform="translate(470 130) rotate(18)"><rect x="0" y="-2" width="70" height="4" rx="2" fill="#8A93A8"/><circle cx="76" cy="0" r="9" fill="#DDEFF4" stroke="#8A93A8" stroke-width="2"/></g>`;
    return o;
  },

  abstrato: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#151C6B"/><stop offset="1" stop-color="#2836C6"/></linearGradient>`;
    const cores = ['#6E7BFF', '#12A5E1', '#F0508C', '#8C4BFF', '#36E39B'];
    cores.forEach((c, i) => o += `<radialGradient id="${id}b${i}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`);
    o += `</defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    [[520, 40, 150], [680, 140, 130], [400, 150, 110], [740, 20, 90], [600, 90, 80]].forEach(([x, y, r], i) => o += `<g class="ce-deriva" style="animation-delay:-${i * 1.7}s;animation-duration:${9 + i * 2}s"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}b${i})"/></g>`);
    for (const [x, y, r] of [[610, 70, 46], [610, 70, 70], [610, 70, 94]]) o += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="1.2"/>`;
    o += `<g opacity=".18">${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 53) % W}" cy="${(i * 37) % H}" r="1" fill="#FFFFFF"/>`).join('')}</g>`;
    o += `<path d="M300,120 C400,60 480,160 580,100 S720,40 ${W},80" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="2"/>`;
    return o;
  },

  praia: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2A8F"/><stop offset=".45" stop-color="#E5487A"/><stop offset=".62" stop-color="#FFB35C"/><stop offset=".62" stop-color="#2D5BA8"/><stop offset="1" stop-color="#13285E"/></linearGradient><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF2B0"/><stop offset="1" stop-color="#FF8A3C"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<path d="M520,105 a64,64 0 0 1 128,0 Z" fill="url(#${id}s)"/>`;
    for (let k = 0; k < 7; k++) { const y = 110 + k * 8, w = 110 - k * 12; o += `<rect class="ce-agua" style="animation-delay:-${k * .4}s" x="${584 - w / 2}" y="${y}" width="${w}" height="2.6" rx="1.3" fill="#FFD9A0" opacity="${(.8 - k * .1).toFixed(2)}"/>`; }
    for (let k = 0; k < 3; k++) o += `<path class="ce-onda" style="animation-delay:-${k}s" d="M300,${128 + k * 14} q20,-6 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0" fill="none" stroke="#FFFFFF" stroke-opacity="${.35 - k * .08}" stroke-width="2"/>`;
    o += `<path d="M690,${H} C694,120 700,86 718,60" fill="none" stroke="#1B1033" stroke-width="7" stroke-linecap="round"/>`;
    for (const [dx, dy, rot] of [[-42, 10, -10], [-34, -8, -40], [34, -4, 30], [44, 14, 8], [4, -26, 80]]) o += `<path d="M718,60 q${dx * .5},${dy - 14} ${dx},${dy}" fill="none" stroke="#1B1033" stroke-width="6" stroke-linecap="round" transform="rotate(${rot * .1} 718 60)"/>`;
    for (const [x, y] of [[420, 40], [450, 52], [470, 34]]) o += `<path d="M${x},${y} q5,-5 10,0 q5,-5 10,0" fill="none" stroke="#1B1033" stroke-width="1.8" stroke-linecap="round"/>`;
    return o;
  },

  cidade: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A0F2E"/><stop offset=".7" stop-color="#2A2370"/><stop offset="1" stop-color="#5A2E7A"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>` + estrelas(50, 51, 0, W, 0, 80);
    o += `<circle cx="660" cy="38" r="20" fill="#FFF3C4"/><circle cx="668" cy="32" r="18" fill="#141A45"/>`;
    const r = sorteio(61);
    let x = 300, k = 0;
    const fundo: string[] = [], frente: string[] = [];
    while (x < W) {
      const w = 26 + r() * 34, h = 40 + r() * 90, longe = k % 2 === 0;
      const cor = longe ? '#1E1F55' : '#14163D', y = H - h - (longe ? 10 : 0);
      let b = `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(h + 20).toFixed(0)}" fill="${cor}"/>`;
      if (!longe && r() > .5) b += `<rect x="${(x + w / 2 - 1).toFixed(0)}" y="${(y - 16).toFixed(0)}" width="2" height="16" fill="${cor}"/><circle class="ce-pisca" cx="${(x + w / 2).toFixed(0)}" cy="${(y - 17).toFixed(0)}" r="2" fill="#FF4F6E"/>`;
      for (let wy = y + 8; wy < H - 6; wy += 11) for (let wx = x + 5; wx < x + w - 7; wx += 9) if (r() > .45) b += `<rect class="${r() > .9 ? 'ce-pisca' : ''}" style="animation-delay:-${(r() * 3).toFixed(1)}s" x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="5" height="6" fill="${r() > .3 ? '#FFD66B' : '#7FD3F2'}" opacity="${longe ? .55 : .9}"/>`;
      (longe ? fundo : frente).push(b);
      x += longe ? w * .6 : w + 4; k++;
    }
    return o + fundo.join('') + frente.join('');
  },

  montanhas: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB88C"/><stop offset=".5" stop-color="#FFD9B0"/><stop offset="1" stop-color="#FFEFD8"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<circle cx="470" cy="96" r="34" fill="#FFF3D6"/>`;
    o += `<g class="ce-deriva" style="animation-duration:22s"><path d="M360,46 q12,-12 26,-4 q10,-12 24,-2 q14,2 10,12 h-62 q-8,-2 2,-6 z" fill="#FFFFFF" opacity=".8"/></g>`;
    const camada = (pts: string, cor: string) => `<path d="M0,${H} ${pts} L${W},${H} Z" fill="${cor}"/>`;
    o += camada('L0,110 L120,80 L220,104 L340,66 L460,100 L560,70 L660,96 L760,74', '#E7A98C');
    o += camada('L0,130 L160,104 L280,124 L420,92 L520,120 L640,40 L700,80 L760,66', '#B5708A');
    o += `<path d="M640,40 L622,62 L633,58 L640,67 L650,56 L660,61 Z" fill="#FFFFFF" opacity=".92"/>`;
    o += camada('L0,150 L200,128 L340,146 L480,118 L600,142 L760,122', '#6E4A7A');
    o += camada('L0,164 L260,150 L420,162 L560,148 L760,160', '#3E2A55');
    o += `<line x1="640" y1="40" x2="640" y2="14" stroke="#3E2A55" stroke-width="2.2"/><path class="ce-bandeira" d="M640,14 l22,4 -22,8 z" fill="#E5484D"/>`;
    for (const [x, y] of [[520, 30], [540, 22], [556, 34]]) o += `<path d="M${x},${y} q4,-4 8,0 q4,-4 8,0" fill="none" stroke="#6E4A7A" stroke-width="1.6" stroke-linecap="round"/>`;
    return o;
  },

  aurora: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030818"/><stop offset=".7" stop-color="#0B1E3A"/><stop offset="1" stop-color="#16324F"/></linearGradient>`;
    [['#36F2A8', 0], ['#4FC3FF', 1], ['#B07BFF', 2]].forEach(([c, i]) => o += `<linearGradient id="${id}a${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset=".55" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`);
    o += `</defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>` + estrelas(70, 71, 0, W, 0, 110);
    o += `<g class="ce-aurora" style="transform-origin:560px 60px"><path d="M300,90 C380,20 450,80 520,30 S640,0 760,40 L760,100 C640,70 600,110 520,80 S380,120 300,120 Z" fill="url(#${id}a0)"/></g>`;
    o += `<g class="ce-aurora" style="transform-origin:600px 60px;animation-delay:-3s"><path d="M380,70 C460,30 520,70 600,20 S700,10 760,20 L760,70 C700,60 650,90 590,60 S460,90 380,100 Z" fill="url(#${id}a1)"/></g>`;
    o += `<g class="ce-aurora" style="transform-origin:640px 50px;animation-delay:-6s"><path d="M460,50 C540,10 600,50 660,10 S740,0 760,6 L760,46 C720,40 680,70 640,46 S540,70 460,74 Z" fill="url(#${id}a2)"/></g>`;
    o += `<path d="M0,${H} L0,142 C120,128 240,150 360,136 S560,126 680,138 L760,132 L760,${H} Z" fill="#E8F1FA"/><path d="M0,142 C120,128 240,150 360,136 S560,126 680,138 L760,132" fill="none" stroke="#FFFFFF" stroke-width="2"/>`;
    for (const [x, h] of [[420, 40], [446, 30], [700, 46], [728, 34], [750, 40]]) o += `<path d="M${x},${138 - h} l-12,${h * .45} h6 l-10,${h * .4} h8 l-8,${h * .3} h32 l-8,${-h * .3} h8 l-10,${-h * .4} h6 z" fill="#0B1E3A"/>`;
    o += `<path d="M560,138 v-18 l16,-12 16,12 v18 z" fill="#3B2A22"/><path d="M556,122 l20,-16 20,16" fill="none" stroke="#E8F1FA" stroke-width="3"/><rect x="570" y="124" width="8" height="8" fill="#FFD66B"/><circle cx="574" cy="128" r="12" fill="#FFD66B" opacity=".18"/><rect x="584" y="110" width="4" height="10" fill="#3B2A22"/>`;
    return o;
  },
  arquitetura: id => {
    const azul = '#2A3A5E', terra = '#D9734E';
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7F2E8"/><stop offset="1" stop-color="#E9E0CF"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    for (let x = 0; x < W; x += 12) o += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#7FA6D9" stroke-opacity="${x % 60 === 0 ? .25 : .1}"/>`;
    for (let y = 0; y < H; y += 12) o += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#7FA6D9" stroke-opacity="${y % 60 === 0 ? .25 : .1}"/>`;
    const L = `fill="none" stroke="${azul}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
    // fachada desenhada
    o += `<path d="M360,140 V86 L420,46 L480,86 V140 Z" ${L}/><path d="M352,92 L420,40 L488,92" ${L} stroke-width="2"/><rect x="378" y="100" width="22" height="22" ${L}/><path d="M389,100 v22 M378,111 h22" ${L} stroke-width="1"/><rect x="436" y="104" width="26" height="36" ${L}/><circle cx="456" cy="122" r="1.6" fill="${azul}"/><circle cx="420" cy="72" r="8" ${L}/>`;
    o += `<path d="M352,152 H488 M352,148 v8 M488,148 v8" ${L} stroke-width="1"/><text x="420" y="164" text-anchor="middle" font-family="ui-monospace, Consolas, monospace" font-size="9" fill="${azul}">8,40 m</text>`;
    // compasso de desenho
    o += `<g transform="translate(520 26)"><circle r="4" fill="${azul}"/><path d="M0,0 L-14,56 M0,0 L16,54" stroke="#8A93A8" stroke-width="3" stroke-linecap="round"/><path d="M-14,56 l-2,6 M16,54 l1,6" stroke="${azul}" stroke-width="2"/></g><path d="M490,86 A34,34 0 0 1 540,74" fill="none" stroke="${terra}" stroke-width="1.4" stroke-dasharray="3 3"/>`;
    // maquete isométrica
    const iso2 = (x: number, y: number, z: number) => [626 + (x - y) * 17, 92 + (x + y) * 9.5 - z * 19];
    const p = (pts: number[][]) => pts.map(([x, y, z]) => iso2(x, y, z).map(v => v.toFixed(1)).join(',')).join(' ');
    o += `<polygon points="${p([[-1.2, -1.2, 0], [3.4, -1.2, 0], [3.4, 2.6, 0], [-1.2, 2.6, 0]])}" fill="#D7CDB8"/>`;
    o += `<polygon points="${p([[0, 2, 0], [3, 2, 0], [3, 2, 1.6], [0, 2, 1.6]])}" fill="#FFFFFF" stroke="${azul}" stroke-width=".8"/>`;
    o += `<polygon points="${p([[3, 0, 0], [3, 2, 0], [3, 2, 1.6], [3, 0, 1.6]])}" fill="#E6E2DA" stroke="${azul}" stroke-width=".8"/>`;
    o += `<polygon points="${p([[0, 2, 1.6], [3, 2, 1.6], [3, 1, 2.6], [0, 1, 2.6]])}" fill="${terra}" stroke="${azul}" stroke-width=".8"/>`;
    o += `<polygon points="${p([[0, 0, 1.6], [3, 0, 1.6], [3, 1, 2.6], [0, 1, 2.6]])}" fill="#B85A3A"/>`;
    o += `<polygon points="${p([[3, 0, 1.6], [3, 2, 1.6], [3, 1, 2.6]])}" fill="#F2EEE6" stroke="${azul}" stroke-width=".8"/>`;
    for (const x of [.5, 2]) o += `<polygon points="${p([[x, 2, .5], [x + .6, 2, .5], [x + .6, 2, 1.1], [x, 2, 1.1]])}" fill="#7FB4E0"/>`;
    o += `<polygon points="${p([[3, .7, 0], [3, 1.3, 0], [3, 1.3, 1], [3, .7, 1]])}" fill="#7A5530"/>`;
    o += `<circle cx="${iso2(-.6, 2, 0)[0]}" cy="${iso2(-.6, 2, 0)[1] - 10}" r="9" fill="#7CC66F"/><line x1="${iso2(-.6, 2, 0)[0]}" y1="${iso2(-.6, 2, 0)[1]}" x2="${iso2(-.6, 2, 0)[0]}" y2="${iso2(-.6, 2, 0)[1] - 6}" stroke="#7A5530" stroke-width="2"/>`;
    // régua T e esquadro
    o += `<g transform="translate(548 160) rotate(-3)"><rect x="0" y="-4" width="190" height="8" fill="#F2C14E" stroke="#B5871A"/><rect x="-6" y="-18" width="10" height="36" fill="#F2C14E" stroke="#B5871A"/>${Array.from({ length: 18 }, (_, k) => `<line x1="${12 + k * 10}" y1="-4" x2="${12 + k * 10}" y2="${k % 5 ? -1 : 1}" stroke="#7A5306" stroke-width=".8"/>`).join('')}</g>`;
    o += `<path d="M700,20 L748,20 L700,80 Z" fill="#9CD3FF" fill-opacity=".45" stroke="#4FA3FF" stroke-width="1.4"/><path d="M710,30 L728,30 L710,52 Z" fill="none" stroke="#4FA3FF" stroke-width="1"/>`;
    return o;
  },

  psicologia: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EFE6FF"/><stop offset="1" stop-color="#FFD6E7"/></linearGradient><linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5A3FB0"/><stop offset="1" stop-color="#3A2470"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<text x="370" y="150" font-family="Georgia, serif" font-size="170" fill="#7A5CF0" opacity=".1">ψ</text>`;
    // perfil de uma cabeça olhando para a esquerda
    o += `<path d="M690,${H} C690,150 700,140 706,128 C716,108 720,90 716,70 C710,36 682,14 646,14 C606,14 578,40 574,74 C572,86 566,94 560,102 C556,108 560,112 566,112 L570,112 C570,120 568,124 572,128 C566,132 570,138 576,138 C574,146 578,152 590,152 C604,152 612,156 614,${H} Z" fill="url(#${id}c)"/>`;
    // engrenagens dentro da cabeça
    const eng = (cx: number, cy: number, r: number, n: number, cls: string, cor: string) => {
      let d = ''; for (let k = 0; k < n; k++) d += `<rect x="${-r * .22}" y="${-r - r * .34}" width="${r * .44}" height="${r * .4}" rx="1.5" transform="rotate(${(k * 360) / n})"/>`;
      return `<g transform="translate(${cx} ${cy})"><g class="${cls}"><g fill="${cor}">${d}<circle r="${r}"/></g><circle r="${r * .4}" fill="#3A2470"/></g></g>`;
    };
    o += eng(634, 66, 16, 10, 'ce-gira', '#FFD66B') + eng(666, 94, 11, 8, 'ce-gira-inv', '#FF9CC2') + eng(670, 50, 8, 7, 'ce-gira-inv', '#9CD3FF');
    // flores brotando do topo
    for (const [x, y, c, d] of [[612, 18, '#FF7AA8', 0], [640, 8, '#FFD66B', .6], [672, 14, '#9CD3FF', 1.2], [700, 30, '#B7F0C8', 1.8]] as [number, number, string, number][]) {
      o += `<path d="M${x},${y + 14} q-2,-8 0,-14" stroke="#5FAE5A" stroke-width="2" fill="none"/><g class="ce-flutua" style="animation-delay:-${d}s">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="${y - 5}" rx="3" ry="5" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="2.6" fill="#FFF6C2"/></g>`;
    }
    // balões de pensamento
    o += `<circle cx="548" cy="70" r="4" fill="#FFFFFF"/><circle cx="534" cy="54" r="6.5" fill="#FFFFFF"/><g class="ce-flutua"><path d="M440,52 c-6,-22 22,-34 36,-22 c8,-14 34,-10 36,6 c18,0 22,24 6,30 c2,16 -22,22 -32,12 c-10,12 -36,8 -38,-8 c-16,-2 -18,-20 -8,-18 z" fill="#FFFFFF"/><text x="478" y="60" text-anchor="middle" font-family="${F}" font-size="13" font-weight="800" fill="#5A3FB0">e se…?</text></g>`;
    // peça de quebra-cabeça
    o += `<g class="ce-sobe" style="animation-delay:-1s"><path d="M400,112 h12 c0,-8 12,-8 12,0 h12 v12 c8,0 8,12 0,12 v12 h-36 z" fill="#FF9CC2" stroke="#D9578A" stroke-width="1.5"/></g>`;
    o += `<path d="M380,40 q6,-8 12,0 q6,8 12,0" fill="none" stroke="#7A5CF0" stroke-width="2" stroke-linecap="round" opacity=".5"/>`;
    return o;
  },

  veterinaria: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF8EE"/><stop offset="1" stop-color="#BFEBD0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    const pata = (x: number, y: number, a: number, cor: string) => `<g transform="translate(${x} ${y}) rotate(${a})" fill="${cor}"><ellipse cx="0" cy="4" rx="7" ry="6"/><circle cx="-7" cy="-5" r="2.8"/><circle cx="-2.4" cy="-8.4" r="2.8"/><circle cx="2.4" cy="-8.4" r="2.8"/><circle cx="7" cy="-5" r="2.8"/></g>`;
    for (let k = 0; k < 8; k++) o += pata(300 + k * 34, 150 - k * 10 + (k % 2) * 12, 70, '#2E7D55').replace('<g ', `<g opacity="${(.12 + k * .03).toFixed(2)}" `);
    // cachorro
    o += `<g transform="translate(560 98)"><ellipse cx="0" cy="58" rx="44" ry="8" fill="#000000" opacity=".08"/><path d="M-38,-26 C-52,-30 -58,4 -44,14 C-38,18 -34,6 -32,-6 Z" fill="#A9743F"/><path d="M38,-26 C52,-30 58,4 44,14 C38,18 34,6 32,-6 Z" fill="#A9743F"/><ellipse cx="0" cy="0" rx="38" ry="40" fill="#E2B27A"/><ellipse cx="0" cy="18" rx="20" ry="15" fill="#F6DFC0"/><ellipse cx="0" cy="8" rx="8" ry="6" fill="#2E3140"/><path d="M0,14 v6 M-7,22 q7,6 14,0" stroke="#2E3140" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-4,24 q4,10 8,0 z" fill="#F28AB2"/><circle cx="-14" cy="-10" r="5" fill="#2E3140"/><circle cx="14" cy="-10" r="5" fill="#2E3140"/><circle cx="-12" cy="-12" r="1.6" fill="#FFFFFF"/><circle cx="16" cy="-12" r="1.6" fill="#FFFFFF"/></g>`;
    // gato
    o += `<g transform="translate(672 104)"><polygon points="-28,-22 -22,-48 -6,-30" fill="#8A93A8"/><polygon points="28,-22 22,-48 6,-30" fill="#8A93A8"/><polygon points="-24,-26 -21,-40 -12,-30" fill="#F28AB2"/><polygon points="24,-26 21,-40 12,-30" fill="#F28AB2"/><ellipse cx="0" cy="0" rx="32" ry="30" fill="#A9B1C2"/><path d="M-10,-28 l2,10 M0,-30 v10 M10,-28 l-2,10" stroke="#8A93A8" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="-11" cy="-2" rx="4" ry="6" fill="#36B37D"/><ellipse cx="11" cy="-2" rx="4" ry="6" fill="#36B37D"/><ellipse cx="-11" cy="-2" rx="1.4" ry="4.4" fill="#1E2230"/><ellipse cx="11" cy="-2" rx="1.4" ry="4.4" fill="#1E2230"/><path d="M-3,8 h6 l-3,4 z" fill="#F28AB2"/><path d="M0,12 q-4,5 -8,2 M0,12 q4,5 8,2" stroke="#4A4F66" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M-12,10 h-18 M-12,14 h-16 M12,10 h18 M12,14 h16" stroke="#FFFFFF" stroke-width="1" opacity=".8"/></g>`;
    // estetoscópio entre os dois
    o += `<path d="M590,128 C610,170 650,170 660,132" fill="none" stroke="#2BB5A8" stroke-width="4" stroke-linecap="round"/><path d="M590,128 l-6,-12 M660,132 l6,-12" stroke="#2BB5A8" stroke-width="3" stroke-linecap="round"/><circle cx="625" cy="160" r="8" fill="#DDEFF4" stroke="#2BB5A8" stroke-width="3"/>`;
    // coração e osso
    o += `<g class="ce-pulso" style="transform-origin:618px 34px"><path d="M618,46 C606,38 600,32 600,26 a9,9 0 0 1 18,-3 a9,9 0 0 1 18,3 c0,6 -6,12 -18,20 z" fill="#FF5C7A"/></g>`;
    o += `<g class="ce-flutua"><g transform="translate(470 60) rotate(-20)"><rect x="-22" y="-5" width="44" height="10" rx="4" fill="#FFFFFF" stroke="#C9CFDC"/><circle cx="-22" cy="-6" r="6.5" fill="#FFFFFF" stroke="#C9CFDC"/><circle cx="-22" cy="6" r="6.5" fill="#FFFFFF" stroke="#C9CFDC"/><circle cx="22" cy="-6" r="6.5" fill="#FFFFFF" stroke="#C9CFDC"/><circle cx="22" cy="6" r="6.5" fill="#FFFFFF" stroke="#C9CFDC"/><rect x="-20" y="-4" width="40" height="8" fill="#FFFFFF"/></g></g>`;
    for (const [x, y, s, d] of [[738, 30, 1, 0], [512, 136, .7, .9]]) o += `<path class="ce-pisca" style="animation-delay:-${d}s" d="M${x},${y - 8 * s} L${x + 2 * s},${y - 2 * s} L${x + 8 * s},${y} L${x + 2 * s},${y + 2 * s} L${x},${y + 8 * s} L${x - 2 * s},${y + 2 * s} L${x - 8 * s},${y} L${x - 2 * s},${y - 2 * s} Z" fill="#FFFFFF"/>`;
    return o;
  },

  relacoes: id => {
    let o = `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B2447"/><stop offset="1" stop-color="#19376D"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    for (let k = 1; k < 6; k++) o += `<path d="M300,${k * 28} Q530,${k * 28 - 12} 760,${k * 28}" fill="none" stroke="#FFFFFF" stroke-opacity=".06"/>`;
    for (let k = 0; k < 9; k++) o += `<line x1="${320 + k * 52}" y1="0" x2="${310 + k * 54}" y2="${H}" stroke="#FFFFFF" stroke-opacity=".05"/>`;
    // continentes simplificados em pontilhado
    const r = sorteio(81);
    const blobs: [number, number, number, number][] = [[380, 60, 46, 26], [400, 118, 22, 32], [520, 56, 34, 22], [540, 110, 24, 34], [640, 64, 56, 30], [700, 130, 26, 14]];
    for (const [cx, cy, rx, ry] of blobs) for (let k = 0; k < 90; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      o += `<circle cx="${(cx + Math.cos(a) * rx * d).toFixed(1)}" cy="${(cy + Math.sin(a) * ry * d).toFixed(1)}" r="1.5" fill="#5CF2C8" opacity="${(.35 + r() * .4).toFixed(2)}"/>`;
    }
    const pins: [number, number, string[]][] = [[392, 70, ['#2F9E5B', '#F2C14E', '#2836C6']], [536, 52, ['#E5484D', '#FFFFFF', '#2836C6']], [660, 64, ['#E5484D', '#F2C14E', '#E5484D']], [548, 120, ['#36B37D', '#FFFFFF', '#E5484D']], [700, 128, ['#2836C6', '#FFFFFF', '#E5484D']]];
    const rotas = [[0, 1], [1, 2], [1, 3], [2, 4], [0, 3]];
    rotas.forEach(([a, b]) => { const [x1, y1] = pins[a], [x2, y2] = pins[b], mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 30; o += `<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="#FFD66B" stroke-width="1.6" stroke-dasharray="4 4" opacity=".8"/>`; });
    for (const [x, y, cores] of pins) o += `<circle cx="${x}" cy="${y}" r="10" fill="#FFD66B" opacity=".15" class="ce-pisca"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 20}" stroke="#FFFFFF" stroke-width="1.4"/><g transform="translate(${x} ${y - 20})">${cores.map((c, i) => `<rect x="${i * 6}" y="0" width="6" height="11" fill="${c}"/>`).join('')}<rect width="18" height="11" fill="none" stroke="#FFFFFF" stroke-opacity=".5"/></g><circle cx="${x}" cy="${y}" r="3" fill="#FFD66B"/>`;
    const [x1, y1] = pins[1], [x2, y2] = pins[2], rota = `M${x1},${y1} Q${(x1 + x2) / 2},${Math.min(y1, y2) - 30} ${x2},${y2}`;
    o += `<g><path d="M-8,0 L8,0 M-2,-7 L3,0 L-2,7 M-7,-3 L-5,0 L-7,3" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><animateMotion dur="5s" repeatCount="indefinite" rotate="auto" path="${rota}"/></g>`;
    o += `<g transform="translate(470 150)"><circle r="12" fill="none" stroke="#FFFFFF" stroke-opacity=".5"/><path d="M0,-10 L3,0 L0,10 L-3,0 Z" fill="#FFD66B"/></g>`;
    return o;
  },
  combo: id => {
    let o = `<defs><radialGradient id="${id}f" cx=".78" cy=".5" r=".9"><stop offset="0" stop-color="#4A1A9E"/><stop offset=".5" stop-color="#1E0A4A"/><stop offset="1" stop-color="#0A0420"/></radialGradient>
      <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6A0"/><stop offset=".5" stop-color="#FFC23D"/><stop offset="1" stop-color="#FF4FA3"/></linearGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5CF2FF"/><stop offset="1" stop-color="#8C7BFF"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    const r = sorteio(91);
    for (let k = 0; k < 40; k++) {
      const a = r() * Math.PI * 2, d0 = 60 + r() * 30, d1 = d0 + 60 + r() * 220;
      o += `<line class="ce-pisca" style="animation-delay:-${(r() * 2).toFixed(2)}s;animation-duration:1.2s" x1="${(600 + Math.cos(a) * d0).toFixed(0)}" y1="${(85 + Math.sin(a) * d0 * .55).toFixed(0)}" x2="${(600 + Math.cos(a) * d1).toFixed(0)}" y2="${(85 + Math.sin(a) * d1 * .55).toFixed(0)}" stroke="#FFFFFF" stroke-opacity="${(.08 + r() * .18).toFixed(2)}" stroke-width="${(1 + r() * 1.6).toFixed(1)}"/>`;
    }
    o += `<circle cx="600" cy="84" r="70" fill="#FF4FA3" opacity=".12"/><circle cx="600" cy="84" r="46" fill="#FFC23D" opacity=".12"/>`;
    for (const [x, y, rot, c] of [[470, 42, -20, '#5CF2FF'], [726, 128, 25, '#FFC23D'], [736, 36, 10, '#FF4FA3']] as [number, number, number, string][]) o += `<path transform="translate(${x} ${y}) rotate(${rot})" d="M4,-22 L-10,2 H0 L-6,22 L12,-4 H2 Z" fill="${c}"/>`;
    o += `<text x="604" y="34" text-anchor="middle" font-family="${F}" font-size="22" font-weight="800" font-style="italic" fill="url(#${id}c)" stroke="#0A0420" stroke-width="4" paint-order="stroke" letter-spacing="3" transform="skewX(-8)">COMBO!</text>`;
    o += `<g class="ce-pulso" style="transform-origin:600px 90px"><text x="600" y="122" text-anchor="middle" font-family="${F}" font-size="104" font-weight="800" font-style="italic" fill="#0A0420" stroke="#0A0420" stroke-width="14" stroke-linejoin="round" opacity=".7">x8</text><text x="600" y="122" text-anchor="middle" font-family="${F}" font-size="104" font-weight="800" font-style="italic" fill="url(#${id}t)" stroke="#FFFFFF" stroke-width="2.5" paint-order="stroke">x8</text></g>`;
    const cores = ['#36E39B', '#36E39B', '#5CF2FF', '#5CF2FF', '#FFC23D', '#FFC23D', '#FF7A3A', '#FF4FA3'];
    cores.forEach((c, k) => o += `<rect class="ce-barra" style="animation-delay:${(k * .12).toFixed(2)}s" x="${548 + k * 14}" y="${140 - k * 1.5}" width="10" height="${12 + k * 1.5}" rx="2" fill="${c}"/>`);
    o += `<text x="548" y="${H - 6}" font-family="ui-monospace, Consolas, monospace" font-size="9" font-weight="800" fill="#FFFFFF" opacity=".6" letter-spacing="2">8 ACERTOS SEGUIDOS</text>`;
    for (const [x, y, s, d] of [[668, 40, 1.2, 0], [530, 70, .9, .5], [690, 112, .8, 1], [476, 118, .7, 1.4]]) o += `<path class="ce-pisca" style="animation-delay:-${d}s" d="M${x},${y - 10 * s} L${x + 2.6 * s},${y - 2.6 * s} L${x + 10 * s},${y} L${x + 2.6 * s},${y + 2.6 * s} L${x},${y + 10 * s} L${x - 2.6 * s},${y + 2.6 * s} L${x - 10 * s},${y} L${x - 2.6 * s},${y - 2.6 * s} Z" fill="#FFFFFF"/>`;
    return o;
  },

  fenix: id => {
    let o = `<defs><radialGradient id="${id}f" cx=".78" cy=".55" r=".9"><stop offset="0" stop-color="#5A1206"/><stop offset=".45" stop-color="#2A0806"/><stop offset="1" stop-color="#0E0303"/></radialGradient>
      <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFB347" stop-opacity=".75"/><stop offset=".5" stop-color="#FF5A1F" stop-opacity=".3"/><stop offset="1" stop-color="#FF5A1F" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".5" stop-color="#FFB347"/><stop offset="1" stop-color="#E8381E"/></linearGradient>
      <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset="1" stop-color="#C9871A"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}f)"/>`;
    o += `<ellipse cx="600" cy="72" rx="160" ry="95" fill="url(#${id}g)"/>`;
    const r = sorteio(33);
    for (let i = 0; i < 18; i++) o += `<circle class="ce-brasa" style="animation-delay:-${(r() * 4).toFixed(2)}s;animation-duration:${(2.6 + r() * 2.4).toFixed(1)}s" cx="${(420 + r() * 340).toFixed(0)}" cy="${(120 + r() * 50).toFixed(0)}" r="${(1 + r() * 1.8).toFixed(1)}" fill="${r() > .5 ? '#FFC93C' : '#FF7A3A'}"/>`;
    const pena = (x0: number, y0: number, x1: number, y1: number, w: number, cor: string) => {
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L * w, ny = dx / L * w;
      return `<path d="M${x0},${y0} Q${(mx + nx).toFixed(1)},${(my + ny).toFixed(1)} ${x1},${y1} Q${(mx - nx).toFixed(1)},${(my - ny).toFixed(1)} ${x0},${y0} Z" fill="${cor}"/>`;
    };
    const corPena = ['#FFF3B0', '#FFD66B', '#FFB347', '#FF8A3C', '#FF5A1F', '#E8381E', '#B8221A'];
    o += `<g transform="translate(600 84) scale(1.3) translate(-600 -84)">`;
    // cauda dourada com olhos nas pontas
    for (const [x1, y1, w] of [[560, 146, 9], [600, 154, 10], [640, 146, 9], [580, 152, 7], [620, 152, 7]] as [number, number, number][]) o += pena(600, 84, x1, y1, w, `url(#${id}d)`) + `<circle cx="${x1}" cy="${y1 - 5}" r="4" fill="#E8381E"/><circle cx="${x1}" cy="${y1 - 5}" r="1.8" fill="#FFF3B0"/>`;
    // asas abertas em duas camadas de penas, batendo devagar
    for (const lado of [-1, 1]) {
      let asa = '';
      for (let k = 0; k < 8; k++) {
        const ang = (-78 + k * 10) * Math.PI / 180, comp = 92 - Math.abs(k - 2) * 7;
        const x1 = 600 + lado * (12 + Math.cos(ang) * comp), y1 = 64 + Math.sin(ang) * comp * .62 + k * 3;
        asa += pena(600 + lado * 10, 62, +x1.toFixed(1), +y1.toFixed(1), 13, corPena[Math.min(6, 2 + Math.floor(k / 2))]);
      }
      for (let k = 0; k < 6; k++) {
        const ang = (-60 + k * 11) * Math.PI / 180, comp = 52 - k * 3;
        const x1 = 600 + lado * (10 + Math.cos(ang) * comp), y1 = 64 + Math.sin(ang) * comp * .6 + k * 2;
        asa += pena(600 + lado * 8, 64, +x1.toFixed(1), +y1.toFixed(1), 10, corPena[Math.min(3, Math.floor(k / 2))]);
      }
      o += `<g class="ce-asa" style="transform-origin:${600 + lado * 8}px 64px">${asa}</g>`;
    }
    // corpo, cabeça e crista
    o += `<ellipse cx="600" cy="74" rx="11" ry="20" fill="url(#${id}p)"/><circle cx="600" cy="48" r="9" fill="#FFD66B"/>`;
    o += `<path d="M608,46 L620,50 L608,53 Z" fill="#FFF3B0"/><circle cx="603" cy="46" r="1.8" fill="#3A0A0A"/>`;
    o += [[-6, -16], [0, -20], [6, -16]].map(([dx, dy], i) => `<path class="ce-chama" style="transform-origin:${600 + dx}px 40px;animation-delay:-${i * .3}s" d="M${600 + dx},40 q-4,${dy / 2} 0,${dy} q4,${-dy / 2} 0,${-dy} z" fill="#FF8A3C"/>`).join('');
    o += `</g>`;
    o += `<text x="452" y="40" text-anchor="middle" font-family="${F}" font-size="12" font-weight="800" fill="#FFD9A8" opacity=".85" letter-spacing="2">30 DIAS SEGUIDOS</text>`;
    return o;
  },
};

let contador = 0;
export function svgCapa(codigo: string, dados: DadosCapa = {}): string {
  const id = `cp${++contador}`;
  const arte = (ARTE[codigo] ?? ARTE[CAPA_PADRAO])(id, dados);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice" role="img" aria-hidden="true">${arte}</svg>`;
}

export const capaDoEmblema = (codigo: string) => CAPAS.find(c => c.emblema === codigo) ?? null;
