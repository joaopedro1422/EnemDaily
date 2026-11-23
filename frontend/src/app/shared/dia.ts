import { Usuario } from '../models/usuario';

export const MODO_TESTE = false;

export type ChaveArea = 'linguagens' | 'humanas' | 'naturezas' | 'exatas';
export type EstadoArea = 'pendente' | 'acertou' | 'errou';

export interface InfoArea {
  chave: ChaveArea;
  sigla: string;
  nome: string;
  icone: string;
  cor: string;
  corTexto: string;
}

export const AREAS: InfoArea[] = [
  { chave: 'linguagens', sigla: 'LC', nome: 'Linguagens', icone: 'book-open', cor: 'var(--ed-lc)', corTexto: 'var(--ed-lc-texto)' },
  { chave: 'humanas', sigla: 'CH', nome: 'Humanas', icone: 'landmark', cor: 'var(--ed-ch)', corTexto: 'var(--ed-ch-texto)' },
  { chave: 'naturezas', sigla: 'CN', nome: 'Naturezas', icone: 'leaf', cor: 'var(--ed-cn)', corTexto: 'var(--ed-cn-texto)' },
  { chave: 'exatas', sigla: 'MT', nome: 'Matemática', icone: 'sigma', cor: 'var(--ed-mt)', corTexto: 'var(--ed-mt-texto)' },
];

export function hojeISO(): string {
  return new Date().toLocaleDateString('sv-SE');
}

export function estadoArea(usuario: Usuario | null, chave: ChaveArea): EstadoArea {
  const area = usuario?.[chave];
  if (!area || area.ultimaResposta !== hojeISO()) return 'pendente';
  return area.acertoHoje ? 'acertou' : 'errou';
}

export function coresDoDia(usuario: Usuario | null): (string | null)[] {
  return AREAS.map(a => (estadoArea(usuario, a.chave) === 'pendente' ? null : a.cor));
}

export function formatarNumero(valor: number): string {
  return (valor ?? 0).toLocaleString('pt-BR');
}
