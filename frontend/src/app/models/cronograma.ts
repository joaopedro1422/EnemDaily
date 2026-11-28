/** Tipos do "Meu cronograma" (o backend chama o módulo de mentor). */

export type ChaveArea = 'natureza' | 'humanas' | 'matematica' | 'linguagens';
export type Fase = 'base' | 'aprofundamento' | 'reta-final';
export type TipoTarefa = 'estudo' | 'parte' | 'revisao' | 'treino' | 'redacao';
export type Peso = 'leve' | 'medio' | 'extenso';

export interface AssuntoMini {
  id: number;
  nome: string;
  area: ChaveArea;
  disciplina: string;
  peso: Peso;
  /** "area/slug" do resumo de apoio, quando existe. */
  conteudo: string | null;
  habilidade: boolean;
}

export interface Tarefa {
  tipo: TipoTarefa;
  assunto: AssuntoMini | null;
  parte: number;
  partes: number;
  atrasoDias: number;
  deOntem: boolean;
  feita: boolean;
  revisaoFinal: boolean;
}

export interface DiaMapa { data: string; fase: Fase; feitas: number; planejadas: number | null; }

export interface DiaSemana extends DiaMapa { tarefas: Tarefa[]; }

export interface AreaProgresso { area: ChaveArea; estudados: number; noPlano: number; cobertura: number; }

export interface Proximo { assunto: AssuntoMini; data: string; }

export interface ConfigCronograma {
  inicio: string;
  /** Minutos de segunda a domingo. */
  disponibilidade: number[];
  foco: ChaveArea[];
  lingua: 'ingles' | 'espanhol';
  notificacoes: boolean;
}

export interface Resumo {
  noPlano: number;
  estudados: number;
  revisados: number;
  foraDoPlano: number;
  cobertura: number;
  coberturaPlano: number;
  terminoPrevisto: string | null;
  diasParaProva: number;
  sequenciaDias: number;
  bemVindo: number | null;
}

export interface Orientacao {
  oQueE: string;
  oQueNaoE: string;
  comoEstudar: string;
  comoConcluir: string;
  comoRevisar: string;
  resultado: string;
}

export interface Painel {
  configurado: boolean;
  hoje: string;
  prova: string;
  provaConfirmada: boolean;
  orientacao: Orientacao;
  config: ConfigCronograma | null;
  fases: { base: string; aprofundamento: string; retaFinal: string; atual: Fase } | null;
  resumo: Resumo | null;
  hojeTarefas: Tarefa[];
  semana: DiaSemana[];
  mapa: DiaMapa[];
  areas: AreaProgresso[];
  proximos: Proximo[];
  fora: AssuntoMini[];
  removidos: AssuntoMini[];
  estudadosAntes: number;
}

export interface Flashcard { pergunta: string; resposta: string; }

export interface DetalheAssunto {
  assunto: AssuntoMini;
  comoCai: string;
  dominar: string[];
  flashcards: Flashcard[];
  nivel: string;
  incidencia: number;
  situacao: 'pendente' | 'estudado' | 'removido';
  estudadoEm: string | null;
  revisoes: number;
  proximaRevisao: string | null;
  prerequisitos: AssuntoMini[];
}

export interface ConfigEntrada {
  inicio: string;
  disponibilidade: number[];
  foco: ChaveArea[];
  lingua: 'ingles' | 'espanhol';
  aceite?: boolean;
}

export interface HojeResumo { configurado: boolean; tarefas: Tarefa[]; }

export const NOMES_FASE: Record<Fase, string> = { base: 'Base', aprofundamento: 'Aprofundamento', 'reta-final': 'Reta final' };

export const NOMES_TIPO: Record<TipoTarefa, string> = { estudo: 'Estudo', parte: 'Parte feita', revisao: 'Revisão', treino: 'Treino', redacao: 'Redação' };

export const NOMES_PESO: Record<Peso, string> = { leve: 'Leve', medio: 'Médio', extenso: 'Extenso' };

/** Dia em que o texto ISO (aaaa-mm-dd) cai, sem fuso. */
export function dataLocal(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}
