import { Questao } from './questao';

export type ChaveAreaConteudo = 'linguagens' | 'humanas' | 'natureza' | 'matematica';

export interface ResumoConteudo {
  area: ChaveAreaConteudo;
  slug: string;
  assunto: string;
  titulo: string;
  descricao: string;
  atualizadoEm: string | null;
}

export interface PaginaConteudo {
  id: number | null;
  assuntoId: number | null;
  area: ChaveAreaConteudo;
  assunto: string;
  slug: string;
  titulo: string | null;
  seoTitulo: string | null;
  seoDescricao: string | null;
  resumo: string | null;
  comoCai: string | null;
  paraNaoErrar: string | null;
  publicado: boolean;
  atualizadoEm: string | null;
  publicadoEm: string | null;
  questao: Questao | null;
  relacionados: ResumoConteudo[];
}

export interface ItemConteudoAdmin {
  assuntoId: number;
  assunto: string;
  area: ChaveAreaConteudo;
  conteudoId: number | null;
  status: 'sem' | 'rascunho' | 'publicado';
  atualizadoEm: string | null;
  slug: string | null;
}

export interface InfoAreaConteudo { chave: ChaveAreaConteudo; nome: string; curto: string; icone: string; cor: string; corTexto: string; }

export const AREAS_CONTEUDO: InfoAreaConteudo[] = [
  { chave: 'linguagens', nome: 'Linguagens, Códigos e suas Tecnologias', curto: 'Linguagens', icone: 'book-open', cor: 'var(--ed-lc)', corTexto: 'var(--ed-lc-texto)' },
  { chave: 'humanas', nome: 'Ciências Humanas e suas Tecnologias', curto: 'Ciências Humanas', icone: 'landmark', cor: 'var(--ed-ch)', corTexto: 'var(--ed-ch-texto)' },
  { chave: 'natureza', nome: 'Ciências da Natureza e suas Tecnologias', curto: 'Ciências da Natureza', icone: 'leaf', cor: 'var(--ed-cn)', corTexto: 'var(--ed-cn-texto)' },
  { chave: 'matematica', nome: 'Matemática e suas Tecnologias', curto: 'Matemática', icone: 'sigma', cor: 'var(--ed-mt)', corTexto: 'var(--ed-mt-texto)' }
];

export function infoAreaConteudo(chave: string): InfoAreaConteudo {
  return AREAS_CONTEUDO.find(a => a.chave === chave) ?? AREAS_CONTEUDO[0];
}

const ENUM_PARA_CHAVE: Record<string, ChaveAreaConteudo> = { LINGUAGENS: 'linguagens', HUMANAS: 'humanas', NATUREZAS: 'natureza', EXATAS: 'matematica' };
export function chaveConteudoDaQuestao(area: string): ChaveAreaConteudo | null {
  return ENUM_PARA_CHAVE[area] ?? null;
}
