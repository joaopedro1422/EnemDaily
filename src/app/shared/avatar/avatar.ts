import { AVATARES_MOCK } from '../../models/mockAvatares';


export const BUCKET = 'enemdaily.firebasestorage.app';

export const AREAS_COR = { lc: '#C7455A', ch: '#12A5E1', cn: '#36B37D', mt: '#D08C21' };

export const TINTAS: Record<string, { nome: string; cor: string }> = {
  caneta: { nome: 'Caneta', cor: '#2836C6' },
  marinho: { nome: 'Marinho', cor: '#16204A' },
  linguagens: { nome: 'Linguagens', cor: '#B83A50' },
  humanas: { nome: 'Humanas', cor: '#0A86BA' },
  natureza: { nome: 'Natureza', cor: '#1E9468' },
  matematica: { nome: 'Matemática', cor: '#B8761A' },
  grafite: { nome: 'Grafite', cor: '#3A4256' },
  ameixa: { nome: 'Ameixa', cor: '#5B3E8E' }
};

export type Motivo = 'liso' | 'orbita' | 'quadrantes' | 'diagonal' | 'pontos' | 'dia4' | 'arcos' | 'constelacao';
export type Moldura = 'nenhuma' | 'caneta' | 'bronze' | 'prata' | 'ouro' | 'areas';
export type Selo = '' | 'medicina' | 'odontologia' | 'direito' | 'engenharia' | 'computacao' | 'licenciatura' | 'biologicas' | 'arquitetura' | 'formatura';

export const MOTIVOS: { chave: Motivo; nome: string; xp: number }[] = [
  { chave: 'liso', nome: 'Liso', xp: 0 }, { chave: 'orbita', nome: 'Órbita', xp: 0 }, { chave: 'quadrantes', nome: 'Quadrantes', xp: 0 },
  { chave: 'diagonal', nome: 'Diagonal', xp: 0 }, { chave: 'pontos', nome: 'Pontos', xp: 0 },
  { chave: 'arcos', nome: 'Arcos das áreas', xp: 500 }, { chave: 'constelacao', nome: 'Constelação', xp: 900 }, { chave: 'dia4', nome: 'O dia em 4', xp: 1500 }
];

export type RegraMoldura = { tipo: 'livre' } | { tipo: 'sequencia'; meta: number } | { tipo: 'acertos'; meta: number };
export const MOLDURAS: { chave: Moldura; nome: string; regra: RegraMoldura; texto: string }[] = [
  { chave: 'nenhuma', nome: 'Sem moldura', regra: { tipo: 'livre' }, texto: 'Livre' },
  { chave: 'caneta', nome: 'Caneta', regra: { tipo: 'livre' }, texto: 'Livre' },
  { chave: 'bronze', nome: 'Bronze', regra: { tipo: 'sequencia', meta: 2 }, texto: '2 dias' },
  { chave: 'prata', nome: 'Prata', regra: { tipo: 'sequencia', meta: 10 }, texto: '10 dias' },
  { chave: 'ouro', nome: 'Ouro', regra: { tipo: 'sequencia', meta: 25 }, texto: '25 dias' },
  { chave: 'areas', nome: '4 áreas', regra: { tipo: 'sequencia', meta: 60 }, texto: '60 dias' }
];

export const SELOS: { chave: Selo; nome: string }[] = [
  { chave: '', nome: 'Nenhum' }, { chave: 'medicina', nome: 'Medicina' }, { chave: 'odontologia', nome: 'Odontologia' }, { chave: 'direito', nome: 'Direito' }, { chave: 'engenharia', nome: 'Engenharia' },
  { chave: 'computacao', nome: 'Computação' }, { chave: 'licenciatura', nome: 'Licenciatura' }, { chave: 'biologicas', nome: 'Biológicas' },
  { chave: 'arquitetura', nome: 'Arquitetura' }, { chave: 'formatura', nome: 'Outro curso' }
];

// ícones Lucide (licença ISC)
const ICONES: Record<string, string> = {
  medicina: '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
  odontologia: '<path d="M7 3C4.8 3 3 4.8 3 7.2c0 2.3.9 3.7 1.6 5.6.6 1.6.8 3.6 1.2 5.6.3 1.6.9 2.6 1.8 2.6 1.2 0 1.5-1.6 1.8-3.4.3-1.6.8-2.6 2.6-2.6s2.3 1 2.6 2.6c.3 1.8.6 3.4 1.8 3.4.9 0 1.5-1 1.8-2.6.4-2 .6-4 1.2-5.6.7-1.9 1.6-3.3 1.6-5.6C21 4.8 19.2 3 17 3c-1.9 0-3 1-5 1S8.9 3 7 3z"/>',
  direito: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  engenharia: '<path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M14 6a6 6 0 0 1 6 6v3"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><rect x="2" y="15" width="20" height="4" rx="1"/>',
  computacao: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  licenciatura: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  biologicas: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
  arquitetura: '<path d="M10 18v-7"/><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
  formatura: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'
};

export interface ConfigAvatar { tinta: string; motivo: Motivo; moldura: Moldura; selo: Selo; fotoCaminho: string; fotoToken: string; }

function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

export function avatarPadrao(nome: string): ConfigAvatar {
  const t = Object.keys(TINTAS);
  return { tinta: t[hash(nome || '?') % t.length], motivo: 'liso', moldura: 'nenhuma', selo: '', fotoCaminho: '', fotoToken: '' };
}

export function lerAvatar(valor: string | null | undefined, nome = ''): ConfigAvatar {
  if (!valor || !valor.startsWith('ed1|')) return avatarPadrao(nome);
  const [, tinta, motivo, moldura, selo, caminho, token] = valor.split('|');
  const p = avatarPadrao(nome);
  return {
    tinta: TINTAS[tinta] ? tinta : p.tinta,
    motivo: (MOTIVOS.some(m => m.chave === motivo) ? motivo : 'liso') as Motivo,
    moldura: (MOLDURAS.some(m => m.chave === moldura) ? moldura : 'nenhuma') as Moldura,
    selo: (SELOS.some(s => s.chave === selo) ? selo : '') as Selo,
    fotoCaminho: caminho ?? '', fotoToken: token ?? ''
  };
}

export function gravarAvatar(c: ConfigAvatar): string {
  return ['ed1', c.tinta, c.motivo, c.moldura, c.selo, c.fotoCaminho, c.fotoToken].join('|');
}

export function urlDaFoto(c: ConfigAvatar): string | null {
  if (!c.fotoCaminho) return null;
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(c.fotoCaminho)}?alt=media${c.fotoToken ? '&token=' + c.fotoToken : ''}`;
}

export function motivoHerdado(valor: string | null | undefined): Motivo | null {
  const antigo = AVATARES_MOCK.find(a => a.url === valor);
  return antigo && (antigo.custo ?? 0) > 0 ? 'arcos' : null;
}

export function iniciais(nome: string): string {
  const p = (nome || '').replace(/^@/, '').trim().split(/[\s._-]+/).filter(w => w && !/^(da|de|do|das|dos|e)$/i.test(w));
  if (!p.length) return '?';
  return (p.length === 1 ? p[0][0] : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function rgb(h: string) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function hex(r: number, g: number, b: number) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function tom(h: string, f: number) { const [r, g, b] = rgb(h); return f >= 1 ? hex(r + (255 - r) * (f - 1), g + (255 - g) * (f - 1), b + (255 - b) * (f - 1)) : hex(r * f, g * f, b * f); }

let uid = 0;

export function svgDoAvatar(c: ConfigAvatar, nome: string, comSelo = true): string {
  const id = 'av' + (uid++).toString(36), base = TINTAS[c.tinta]?.cor ?? TINTAS['caneta'].cor, txt = iniciais(nome), foto = urlDaFoto(c);
  const claro = tom(base, 1.09), escuro = tom(base, .88);
  const defs = [`<clipPath id="${id}c"><circle cx="100" cy="100" r="100"/></clipPath>`,
    `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${claro}"/><stop offset="1" stop-color="${escuro}"/></linearGradient>`,
    `<radialGradient id="${id}r" cx=".28" cy=".2" r=".75"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".14"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`];
  let fundo = `<rect width="200" height="200" fill="url(#${id}g)"/>`, deco = '';
  const m = c.motivo;
  if (m === 'orbita') deco = [64, 100, 136, 172].map((r, i) => `<circle cx="178" cy="178" r="${r}" fill="none" stroke="#FFFFFF" stroke-opacity="${(.16 - i * .03).toFixed(2)}" stroke-width="11"/>`).join('');
  if (m === 'quadrantes') deco = `<path d="M100 0H0V100H100Z" fill="${tom(base, 1.1)}"/><path d="M200 100V0H100V100Z" fill="${base}"/><path d="M0 100V200H100V100Z" fill="${tom(base, .92)}"/><path d="M100 100V200H200V100Z" fill="${tom(base, .84)}"/><circle cx="100" cy="100" r="64" fill="${tom(base, .9)}" opacity=".55"/>`;
  if (m === 'diagonal') { defs.push(`<pattern id="${id}p" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="11" height="26" fill="#FFFFFF" fill-opacity=".085"/></pattern>`); deco = `<rect width="200" height="200" fill="url(#${id}p)"/>`; }
  if (m === 'pontos') {
    defs.push(`<radialGradient id="${id}f" cx=".85" cy=".85" r=".9"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".75" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient><mask id="${id}k"><rect width="200" height="200" fill="url(#${id}f)"/></mask>`);
    let d = ''; for (let y = 10; y < 200; y += 18) for (let x = 10; x < 200; x += 18) d += `<circle cx="${x}" cy="${y}" r="2.6"/>`;
    deco = `<g fill="#FFFFFF" fill-opacity=".42" mask="url(#${id}k)">${d}</g>`;
  }
  if (m === 'dia4') {
    fundo = `<path d="M100 0H0V100H100Z" fill="${AREAS_COR.lc}"/><path d="M200 100V0H100V100Z" fill="${AREAS_COR.ch}"/><path d="M0 100V200H100V100Z" fill="${AREAS_COR.cn}"/><path d="M100 100V200H200V100Z" fill="${AREAS_COR.mt}"/>`;
    deco = `<circle cx="100" cy="100" r="70" fill="url(#${id}g)"/>`;
  }
  if (m === 'arcos') deco = ([[118, AREAS_COR.lc], [102, AREAS_COR.ch], [86, AREAS_COR.cn], [70, AREAS_COR.mt]] as [number, string][]).map(([r, cor]) => `<circle cx="100" cy="262" r="${r}" fill="none" stroke="${cor}" stroke-width="11"/>`).join('');
  if (m === 'constelacao') {
    const pts: [number, number, keyof typeof AREAS_COR][] = [[28, 52, 'lc'], [58, 26, 'ch'], [150, 30, 'cn'], [176, 64, 'mt'], [34, 150, 'mt'], [170, 152, 'lc'], [142, 180, 'ch'], [62, 178, 'cn']];
    deco = `<g stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1.6" fill="none"><path d="M28 52L58 26M150 30L176 64M34 150L62 178M170 152L142 180"/></g>` +
      pts.map(([x, y, a]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="${AREAS_COR[a]}" stroke="#FFFFFF" stroke-width="2.4"/>`).join('');
  }

  const temSelo = comSelo && !!c.selo;
  const fs = (txt.length === 1 ? 80 : 64) * (temSelo ? .88 : 1), dx = temSelo ? -7 : 0, dy = temSelo ? -6 : 0, ls = txt.length === 1 ? 0 : -2;
  const y = (100 + dy + fs * .355).toFixed(1);
  const letra = (extra: string) => `<text x="${100 + dx}" y="${y}" text-anchor="middle" font-family="'Schibsted Grotesk', Arial, sans-serif" font-weight="800" font-size="${fs.toFixed(1)}" letter-spacing="${ls}" ${extra}>${txt}</text>`;
  const conteudo = foto
    ? `<rect width="200" height="200" fill="${escuro}"/><image href="${foto}" x="0" y="0" width="200" height="200" preserveAspectRatio="xMidYMid slice"/>`
    : `${fundo}${deco}<rect width="200" height="200" fill="url(#${id}r)"/>${letra('fill="#000" fill-opacity=".14" transform="translate(0 2.5)"')}${letra('fill="#FFFFFF"')}`;

  let aro = '';
  const metal: Record<string, [string, string, string]> = { bronze: ['#F0C29A', '#A9633B', '#E3A878'], prata: ['#F4F6FA', '#98A2B5', '#E2E6EE'], ouro: ['#FBE4A0', '#C38A22', '#F5D27C'], caneta: ['#5D69E6', '#1E28A0', '#4F5BDD'] };
  if (metal[c.moldura]) {
    const [a, b, d] = metal[c.moldura];
    defs.push(`<linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${d}"/></linearGradient>`);
    aro = `<circle cx="100" cy="100" r="95" fill="none" stroke="url(#${id}a)" stroke-width="10"/><circle cx="100" cy="100" r="89.5" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="1.4"/>`;
  }
  if (c.moldura === 'areas') {
    const r = 95, q = Math.PI / 2, g = .16, p = (t: number) => `${(100 + r * Math.cos(t)).toFixed(2)} ${(100 + r * Math.sin(t)).toFixed(2)}`;
    aro = `<circle cx="100" cy="100" r="95" fill="none" stroke="#FFFFFF" stroke-width="12"/>` +
      [AREAS_COR.ch, AREAS_COR.mt, AREAS_COR.cn, AREAS_COR.lc].map((cor, i) => `<path d="M${p(-q + i * q + g)} A${r} ${r} 0 0 1 ${p(i * q - g)}" fill="none" stroke="${cor}" stroke-width="10" stroke-linecap="round"/>`).join('') +
      `<circle cx="100" cy="100" r="89" fill="none" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1.2"/>`;
  }
  const selo = temSelo ? `<g transform="translate(156 156)"><circle r="34" fill="#FFFFFF"/><circle r="28.5" fill="${tom(base, 1.85)}"/><g transform="translate(-16 -16) scale(1.333)" fill="none" stroke="${tom(base, .78)}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${ICONES[c.selo] ?? ''}</g></g>` : '';
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avatar de ${txt}"><defs>${defs.join('')}</defs><g clip-path="url(#${id}c)">${conteudo}</g>${aro}${selo}</svg>`;
}

export function motivoLiberado(m: Motivo, xp: number, herdado: Motivo | null): boolean {
  const info = MOTIVOS.find(x => x.chave === m)!;
  return info.xp <= xp || herdado === m;
}

export function molduraLiberada(m: Moldura, maiorSequencia: number, acertos: number): boolean {
  const r = MOLDURAS.find(x => x.chave === m)!.regra;
  return r.tipo === 'livre' || (r.tipo === 'sequencia' ? maiorSequencia >= r.meta : acertos >= r.meta);
}
