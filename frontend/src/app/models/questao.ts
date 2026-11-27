export interface Questao {
  area: 'LINGUAGENS' | 'HUMANAS' | 'EXATAS' | 'NATUREZAS';
  assunto: string;
  texto: string;
  enunciado: string;
  explicacao: string;
  alternativas: Alternativa[];
  linkEstudo: string;
  linkImg: string;
  resolucao?: string | null;
  competencia?: string | null;
  habilidade?: string | null;
  fonte?: string | null;
  tabela?: TabelaQuestao | null;
}

export interface TabelaQuestao {
  titulo: string | null;
  colunas: string[];
  linhas: string[][];
  nota: string | null;
}

export interface Correcao {
  usuario: import('./usuario').Usuario;
  acerto: boolean;
  xp: number;
  xpBase: number;
  bonusPct: number;
  indiceCorreto: number;
  questao: Questao;
}

export interface Revisao {
  questao: Questao;
  alternativa: number | null;
  acerto: boolean;
  xp: number;
  tempoGasto: number;
  indiceCorreto: number;
  respondidaEm: string;
}

export interface Alternativa {
    texto: string;
    correta?: boolean;
    analise?: string | null;
}

export interface AssuntoResumo{
  area: string;
  assunto: string;
  totalRespostas: number;
  totalAcertos: number;
  porcentagem : number;
}
export interface BonusStatus {
  disponivel: boolean;
  respondida: boolean;
  area: 'LINGUAGENS' | 'HUMANAS' | 'EXATAS' | 'NATUREZAS' | null;
  xpMax: number;
  erradaEm: string | null;
  questao: Questao | null;
  revisao: Revisao | null;
}
