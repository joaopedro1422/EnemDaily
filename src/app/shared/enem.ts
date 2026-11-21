export interface EdicaoEnem { ano: number; dia1: string; dia2: string; confirmada: boolean; }

export const EDICOES_ENEM: EdicaoEnem[] = [
  { ano: 2026, dia1: '2026-11-08', dia2: '2026-11-15', confirmada: true },
  { ano: 2027, dia1: '2027-11-07', dia2: '2027-11-14', confirmada: false }
];

export interface Contagem { edicao: EdicaoEnem; dias: number; hoje: 'dia1' | 'dia2' | null; entreDias: boolean; data: Date; }

const meiaNoite = (iso: string) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };

export function contagemEnem(agora = new Date()): Contagem | null {
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const edicao = EDICOES_ENEM.find(e => meiaNoite(e.dia2) >= hoje);
  if (!edicao) return null;
  const d1 = meiaNoite(edicao.dia1), d2 = meiaNoite(edicao.dia2);
  const dias = Math.round((d1.getTime() - hoje.getTime()) / 86400000);
  const ehHoje = hoje.getTime() === d1.getTime() ? 'dia1' : hoje.getTime() === d2.getTime() ? 'dia2' : null;
  return { edicao, dias: Math.max(0, dias), hoje: ehHoje, entreDias: hoje > d1 && hoje < d2, data: d1 };
}
