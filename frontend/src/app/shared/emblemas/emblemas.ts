// Emblemas em SVG (120×120): uma família só, em que a forma diz o tipo da conquista,
// o metal da borda diz o nível e a cor interna diz a área.

type Forma = 'circulo' | 'chama' | 'selo' | 'hexagono' | 'escudo' | 'coroa';
type Metal = 'bronze' | 'prata' | 'ouro';
type Icone = 'lapis' | 'alvo' | 'check' | 'raio' | 'sol' | 'livro' | 'colunas' | 'folha' | 'sigma' | 'cronometro' | 'trofeu' | 'chama';

interface Desenho {
  nome: string;
  forma: Forma;
  metal: Metal;
  cor: [string, string];
  icone?: Icone;
  numero?: string;
  faixa: string;
  louros?: boolean;
}

const AREA = {
  lin: ['#E0607A', '#9E2B40'] as [string, string],
  hum: ['#3BB8EE', '#0A6FA3'] as [string, string],
  nat: ['#4FCB92', '#1E7A52'] as [string, string],
  mat: ['#F0A93C', '#A9650E'] as [string, string],
};

export const DESENHO_EMBLEMA: Record<string, Desenho> = {
  '1_respostas': { nome: 'Início da Jornada', forma: 'circulo', metal: 'bronze', cor: ['#5A68F0', '#1E2A9E'], icone: 'lapis', faixa: '1ª QUESTÃO' },
  '25_respostas': { nome: 'Persistente', forma: 'circulo', metal: 'prata', cor: ['#5A68F0', '#1E2A9E'], icone: 'check', numero: '25', faixa: 'RESPOSTAS' },
  '20_acertos': { nome: 'Pontaria', forma: 'circulo', metal: 'prata', cor: ['#2CC4B5', '#0E6E78'], icone: 'alvo', numero: '20', faixa: 'ACERTOS' },
  '50_respostas': { nome: 'Meio Centenário', forma: 'circulo', metal: 'ouro', cor: ['#7A5CF0', '#3A1E9E'], icone: 'alvo', numero: '50', faixa: 'ACERTOS', louros: true },
  '5_acertos_consec': { nome: 'Combo Perfeito', forma: 'selo', metal: 'prata', cor: ['#A07BFF', '#5A2BC2'], icone: 'raio', numero: '5', faixa: 'EM SEQUÊNCIA' },
  '4_dia': { nome: 'Dia Perfeito', forma: 'selo', metal: 'ouro', cor: ['#FFB547', '#E0503A'], icone: 'sol', numero: '4/4', faixa: 'DIA PERFEITO' },
  '3_streak': { nome: 'Pegando Fogo', forma: 'chama', metal: 'bronze', cor: ['#FFA23A', '#D9341E'], numero: '3', faixa: 'DIAS SEGUIDOS' },
  '7_streak': { nome: 'Semana em Chamas', forma: 'chama', metal: 'ouro', cor: ['#FF7A3A', '#9E1E5A'], numero: '7', faixa: 'DIAS SEGUIDOS', louros: true },
  '10_acertos_lin': { nome: 'Leitor Voraz', forma: 'hexagono', metal: 'prata', cor: AREA.lin, icone: 'livro', numero: '10', faixa: 'LINGUAGENS' },
  '10_acertos_hum': { nome: 'Historiador', forma: 'hexagono', metal: 'prata', cor: AREA.hum, icone: 'colunas', numero: '10', faixa: 'HUMANAS' },
  '10_acertos_nat': { nome: 'Cientista', forma: 'hexagono', metal: 'prata', cor: AREA.nat, icone: 'folha', numero: '10', faixa: 'NATUREZA' },
  '10_acertos_mat': { nome: 'Calculista', forma: 'hexagono', metal: 'prata', cor: AREA.mat, icone: 'sigma', numero: '10', faixa: 'MATEMÁTICA' },
  tempo_lin: { nome: 'Leitura Relâmpago', forma: 'escudo', metal: 'ouro', cor: AREA.lin, icone: 'cronometro', faixa: '1 MIN · LINGUAGENS' },
  tempo_hum: { nome: 'Memória Relâmpago', forma: 'escudo', metal: 'ouro', cor: AREA.hum, icone: 'cronometro', faixa: '1 MIN · HUMANAS' },
  tempo_nat: { nome: 'Reação Relâmpago', forma: 'escudo', metal: 'ouro', cor: AREA.nat, icone: 'cronometro', faixa: '1 MIN · NATUREZA' },
  tempo_mat: { nome: 'Cálculo Relâmpago', forma: 'escudo', metal: 'ouro', cor: AREA.mat, icone: 'cronometro', faixa: '1 MIN · MATEMÁTICA' },
  campeao_mes: { nome: 'Campeão do Mês', forma: 'coroa', metal: 'ouro', cor: ['#6A3BD8', '#2A1468'], icone: 'trofeu', numero: '1', faixa: 'CAMPEÃO DO MÊS' },
};

export const nomeDoEmblema = (codigo: string) => DESENHO_EMBLEMA[codigo]?.nome ?? 'Conquista';

const METAL: Record<Metal, [string, string, string, string]> = {
  bronze: ['#FCD9B4', '#D08A4E', '#8C4F22', '#5E3214'],
  prata: ['#FFFFFF', '#D3D9E6', '#8E98AD', '#5A6378'],
  ouro: ['#FFF6C2', '#F5C94A', '#C08A12', '#7A5306'],
};

const F = 'Schibsted Grotesk, Arial, sans-serif';
const CX = 60, CY = 54;

function contorno(f: Forma): string {
  switch (f) {
    case 'circulo': return `M${CX},${CY - 44} a44,44 0 1 1 -0.01,0 Z`;
    case 'hexagono': return Array.from({ length: 6 }, (_, k) => { const a = (-90 + k * 60) * Math.PI / 180; return `${k ? 'L' : 'M'}${(CX + Math.cos(a) * 48).toFixed(1)},${(CY + Math.sin(a) * 48).toFixed(1)}`; }).join(' ') + ' Z';
    case 'selo': return Array.from({ length: 28 }, (_, k) => { const a = (-90 + k * 360 / 28) * Math.PI / 180, r = k % 2 ? 41 : 48; return `${k ? 'L' : 'M'}${(CX + Math.cos(a) * r).toFixed(1)},${(CY + Math.sin(a) * r).toFixed(1)}`; }).join(' ') + ' Z';
    case 'chama': return `M${CX},4 C${CX + 14},24 ${CX + 44},36 ${CX + 44},66 C${CX + 44},88 ${CX + 24},104 ${CX},104 C${CX - 24},104 ${CX - 44},88 ${CX - 44},66 C${CX - 44},48 ${CX - 32},38 ${CX - 24},24 C${CX - 20},38 ${CX - 12},44 ${CX - 6},44 C${CX - 10},30 ${CX - 6},16 ${CX},4 Z`;
    case 'escudo':
    case 'coroa': return `M${CX},8 L${CX + 42},20 L${CX + 42},56 C${CX + 42},82 ${CX + 24},98 ${CX},108 C${CX - 24},98 ${CX - 42},82 ${CX - 42},56 L${CX - 42},20 Z`;
  }
}

const esc = (k: number, cy = CY) => `translate(${CX} ${cy}) scale(${k}) translate(${-CX} ${-cy})`;

function icone(i: Icone, cor: string): string {
  const L = `fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`;
  switch (i) {
    case 'lapis': return `<g transform="translate(60 52) rotate(-40)"><rect x="-6" y="-26" width="12" height="40" rx="2" fill="#FFD66B"/><rect x="-6" y="-26" width="4" height="40" fill="#FFE9A8"/><rect x="-6" y="-32" width="12" height="8" rx="2" fill="#F28AB2"/><rect x="-6" y="-25" width="12" height="3" fill="#C9CFDC"/><polygon points="-6,14 6,14 0,26" fill="#F4D9B5"/><polygon points="-2,21 2,21 0,26" fill="#2E3140"/></g>`;
    case 'alvo': return `<g opacity=".28"><circle cx="60" cy="52" r="30" ${L}/><circle cx="60" cy="52" r="19" ${L}/><circle cx="60" cy="52" r="8" fill="#FFFFFF" stroke="none"/></g>`;
    case 'check': return `<g opacity=".28"><path d="M34,52 l16,16 34,-34" ${L} stroke-width="8"/></g>`;
    case 'raio': return `<g opacity=".3"><path d="M66,18 L40,58 H58 L52,88 L80,46 H62 Z" fill="#FFFFFF"/></g>`;
    case 'sol': return `<g opacity=".3">${Array.from({ length: 12 }, (_, k) => `<line x1="60" y1="20" x2="60" y2="28" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" transform="rotate(${k * 30} 60 52)"/>`).join('')}</g>`;
    case 'livro': return `<path d="M40,36 h14 a6,6 0 0 1 6,4 a6,6 0 0 1 6,-4 h14 v28 h-14 a6,6 0 0 0 -6,4 a6,6 0 0 0 -6,-4 h-14 z M60,40 v28" ${L}/>`;
    case 'colunas': return `<path d="M38,66 h44 M42,62 v-20 M52,62 v-20 M68,62 v-20 M78,62 v-20 M36,40 h48 l-24,-12 z" ${L}/>`;
    case 'folha': return `<path d="M42,68 C42,46 58,34 80,34 C80,56 66,68 42,68 Z M42,68 L66,46" ${L}/>`;
    case 'sigma': return `<text x="60" y="66" text-anchor="middle" font-family="${F}" font-size="38" font-weight="800" fill="#FFFFFF">Σ</text>`;
    case 'cronometro': return `<circle cx="60" cy="58" r="24" fill="#FFFFFF"/><circle cx="60" cy="58" r="24" fill="none" stroke="${cor}" stroke-width="3"/><rect x="55" y="26" width="10" height="8" rx="2" fill="#FFFFFF"/><line x1="78" y1="38" x2="83" y2="33" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>` +
      Array.from({ length: 12 }, (_, k) => `<line x1="60" y1="${k % 3 ? 37 : 36}" x2="60" y2="${k % 3 ? 39 : 41}" stroke="${cor}" stroke-width="${k % 3 ? 1.4 : 2.4}" transform="rotate(${k * 30} 60 58)"/>`).join('') +
      `<path d="M60,58 L60,42" stroke="#1E2230" stroke-width="3" stroke-linecap="round"/><path d="M60,58 L71,63" stroke="#1E2230" stroke-width="2.4" stroke-linecap="round"/><circle cx="60" cy="58" r="3" fill="#1E2230"/><path d="M84,46 L74,62 H81 L77,74 L89,57 H82 Z" fill="#FFD23F" stroke="#7A5306" stroke-width="1.2" stroke-linejoin="round"/>`;
    case 'trofeu': return `<path d="M44,30 h32 v8 c0,16 -8,24 -16,26 c-8,-2 -16,-10 -16,-26 z" fill="#FFE38A" stroke="#B5871A" stroke-width="1.5"/><path d="M44,34 c-10,0 -10,14 0,16 M76,34 c10,0 10,14 0,16" fill="none" stroke="#FFE38A" stroke-width="4"/><rect x="56" y="64" width="8" height="8" fill="#E8B931"/><rect x="47" y="72" width="26" height="7" rx="2" fill="#FFE38A" stroke="#B5871A" stroke-width="1.2"/><path d="M50,34 c1,10 4,16 8,19" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`;
    case 'chama': return '';
  }
}

function louros(metal: [string, string, string, string]): string {
  let o = '';
  for (const lado of [-1, 1]) for (let k = 0; k < 6; k++) {
    const a = (130 - k * 20) * Math.PI / 180, x = CX + lado * Math.cos(a) * 54, y = CY + 18 - Math.sin(a) * 50, rot = lado * (k * 20 - 40);
    o += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="4" fill="${k % 2 ? '#5FAE5A' : '#7CC66F'}" stroke="#2E6B2E" stroke-width="1" transform="rotate(${rot + (lado > 0 ? 60 : -60)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return o + `<circle cx="${CX - 30}" cy="${CY + 40}" r="3" fill="${metal[1]}"/><circle cx="${CX + 30}" cy="${CY + 40}" r="3" fill="${metal[1]}"/>`;
}

function asas(metal: [string, string, string, string], id: string): string {
  let o = '';
  for (const lado of [-1, 1]) {
    for (let k = 3; k >= 0; k--) {
      const comp = 20 + k * 5, ang = -8 - k * 17, x = CX + lado * 38, y = 40 + k * 3;
      o += `<g transform="translate(${x} ${y}) rotate(${lado * ang}) scale(${lado} 1)"><path d="M0,-5 C${comp * .5},-9 ${comp},-6 ${comp + 6},0 C${comp},5 ${comp * .5},7 0,5 Z" fill="url(#${id}m)" stroke="${metal[3]}" stroke-width="1"/><path d="M4,0 H${comp}" stroke="${metal[3]}" stroke-width=".8" opacity=".6"/></g>`;
    }
  }
  return o;
}

let contador = 0;
export function svgEmblema(codigo: string, animar = true): string {
  const d = DESENHO_EMBLEMA[codigo] ?? DESENHO_EMBLEMA['1_respostas'];
  const id = `em${++contador}`, m = METAL[d.metal], c = contorno(d.forma);
  let o = `<defs>
    <linearGradient id="${id}m" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="${m[0]}"/><stop offset=".35" stop-color="${m[1]}"/><stop offset=".75" stop-color="${m[2]}"/><stop offset="1" stop-color="${m[3]}"/></linearGradient>
    <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.cor[0]}"/><stop offset="1" stop-color="${d.cor[1]}"/></linearGradient>
    <radialGradient id="${id}r" cx=".35" cy=".25" r=".8"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity=".06"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}k"><path d="${c}"/></clipPath>
  </defs>`;
  o += `<ellipse cx="60" cy="112" rx="34" ry="5" fill="#000000" opacity=".22"/>`;
  if (d.forma === 'coroa') o += asas(m, id);
  if (d.louros) o += louros(m);
  // aro metálico em dois tons e o miolo colorido
  o += `<path d="${c}" fill="url(#${id}m)" stroke="${m[3]}" stroke-width="1.5"/>`;
  o += `<path d="${c}" transform="${esc(.9)}" fill="${m[2]}" opacity=".55"/>`;
  o += `<path d="${c}" transform="${esc(.84)}" fill="url(#${id}c)"/>`;
  if (d.forma === 'circulo' || d.forma === 'selo') o += `<circle cx="${CX}" cy="${CY}" r="${d.forma === 'selo' ? 30 : 32}" fill="none" stroke="#FFFFFF" stroke-opacity=".28" stroke-width="1.4" stroke-dasharray="${d.forma === 'selo' ? '2 3' : '0'}"/>`;
  if (d.forma === 'chama') o += `<path d="${c}" transform="${esc(.52, 74)}" fill="#FFD66B" opacity=".85"/><path d="${c}" transform="${esc(.3, 84)}" fill="#FFF6C2"/>`;
  if (d.forma === 'hexagono') o += Array.from({ length: 6 }, (_, k) => { const a = (-90 + k * 60) * Math.PI / 180; return `<circle cx="${(CX + Math.cos(a) * 44).toFixed(1)}" cy="${(CY + Math.sin(a) * 44).toFixed(1)}" r="2.2" fill="${m[0]}" stroke="${m[3]}" stroke-width=".8"/>`; }).join('');
  o += `<path d="${c}" transform="${esc(.84)}" fill="url(#${id}r)"/>`;
  // ícone e número
  if (d.icone) o += icone(d.icone, d.cor[1]);
  if (d.numero) {
    const grande = !d.icone || ['alvo', 'check', 'raio', 'sol'].includes(d.icone);
    const y = d.forma === 'chama' ? 84 : grande ? 66 : d.forma === 'hexagono' ? 84 : 66;
    const tam = d.numero.length > 2 ? 26 : grande ? (d.forma === 'chama' ? 30 : 38) : 16;
    if (d.forma === 'hexagono') o += `<circle cx="${CX}" cy="${y - 5}" r="10" fill="${m[1]}" stroke="${m[3]}" stroke-width="1.2"/>`;
    o += `<text x="${CX}" y="${y}" text-anchor="middle" font-family="${F}" font-size="${d.forma === 'hexagono' ? 12 : tam}" font-weight="800" fill="${d.forma === 'hexagono' ? m[3] : d.forma === 'chama' ? '#8A2A0A' : '#FFFFFF'}" stroke="${d.forma === 'hexagono' || d.forma === 'chama' ? 'none' : 'rgba(0,0,0,.28)'}" stroke-width="3" paint-order="stroke">${d.numero}</text>`;
  }
  if (d.forma === 'coroa') o += `<g transform="translate(60 2)"><path d="M-18,14 L-18,0 L-9,8 L0,-4 L9,8 L18,0 L18,14 Z" fill="url(#${id}m)" stroke="${m[3]}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="0" cy="-4" r="2.4" fill="#E5484D"/><circle cx="-18" cy="0" r="2" fill="#4FA3FF"/><circle cx="18" cy="0" r="2" fill="#4FA3FF"/><rect x="-18" y="11" width="36" height="4" fill="${m[2]}"/></g>`;
  // reflexo que passa
  if (animar) o += `<g clip-path="url(#${id}k)"><rect class="em-brilho" x="0" y="-10" width="22" height="140" fill="#FFFFFF" opacity=".32"/></g>`;
  // faixa com a legenda
  const fy = d.forma === 'chama' ? 96 : 92, tam = d.faixa.length > 14 ? 6.6 : d.faixa.length > 11 ? 7.6 : 8.6;
  o += `<path d="M10,${fy - 2} l10,0 0,14 -10,0 5,-7 z" fill="${shade(d.cor[1], .7)}"/><path d="M110,${fy - 2} l-10,0 0,14 10,0 -5,-7 z" fill="${shade(d.cor[1], .7)}"/>`;
  o += `<path d="M18,${fy - 6} h84 v16 h-84 z" fill="${d.cor[1]}" stroke="${m[2]}" stroke-width="1.6"/><path d="M18,${fy - 6} h84 v4 h-84 z" fill="#FFFFFF" opacity=".16"/>`;
  o += `<text x="60" y="${fy + 5.2}" text-anchor="middle" font-family="${F}" font-size="${tam}" font-weight="800" fill="#FFFFFF" letter-spacing=".4">${d.faixa}</text>`;
  // brilhos
  if (d.metal !== 'bronze') for (const [x, y, s, dl] of [[96, 16, 1, 0], [22, 26, .7, 1.2]]) o += `<path class="em-pisca" style="animation-delay:-${dl}s" d="M${x},${y - 7 * s} L${x + 1.8 * s},${y - 1.8 * s} L${x + 7 * s},${y} L${x + 1.8 * s},${y + 1.8 * s} L${x},${y + 7 * s} L${x - 1.8 * s},${y + 1.8 * s} L${x - 7 * s},${y} L${x - 1.8 * s},${y - 1.8 * s} Z" fill="#FFFFFF"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="${d.nome}">${o}</svg>`;
}

function shade(h: string, f: number): string {
  const c = [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * f))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

export const ESTILO_EMBLEMAS = `
  ed-emblema { display: inline-block; }
  ed-emblema svg { width: 100%; height: 100%; display: block; overflow: visible; }
  .em-brilho { animation: em-brilho 4.8s ease-in-out infinite; }
  @keyframes em-brilho { 0%, 55% { transform: translateX(-60px) skewX(-22deg); } 85%, 100% { transform: translateX(170px) skewX(-22deg); } }
  .em-pisca { animation: em-pisca 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  @keyframes em-pisca { 50% { opacity: .15; transform: scale(.6); } }
  @media (prefers-reduced-motion: reduce) { ed-emblema * { animation: none !important; } }
`;
