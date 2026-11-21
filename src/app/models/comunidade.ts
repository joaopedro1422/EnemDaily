export type Relacao = 'EU' | 'AMIGOS' | 'ENVIADA' | 'RECEBIDA' | 'NENHUMA' | 'BLOQUEADO';
export type StatusDuelo = 'PENDENTE' | 'AGENDADO' | 'AO_VIVO' | 'CONCLUIDO' | 'RECUSADO' | 'EXPIRADO' | 'CANCELADO';
export type ResultadoDuelo = 'VITORIA' | 'DERROTA' | 'EMPATE';

export interface UsuarioMini { id: string; nome: string; usuario: string; avatar: string; }

export interface UsuarioComunidade extends UsuarioMini {
  xpTotal: number;
  sequencia: number;
  relacao: Relacao;
  perfilPrivado: boolean;
}

export interface Placar { vitorias: number; derrotas: number; empates: number; }

export interface Duelo {
  id: string;
  dia: string;
  status: StatusDuelo;
  souDesafiante: boolean;
  oponente: UsuarioMini;
  meuXp: number;
  xpOponente: number;
  meusAcertos: number;
  acertosOponente: number;
  minhasRespostas: number;
  respostasOponente: number;
  resultado: ResultadoDuelo | null;
  visto: boolean;
  criadoEm: string | null;
}

export interface PerfilPublico {
  id: string;
  nome: string;
  usuario: string;
  avatar: string;
  xpTotal: number;
  emblemas: string;
  sequenciaAtual: number;
  maiorSequencia: number;
  diasAtivos: number;
  podeVerCampus: boolean;
  acertosLinguagens: number;
  acertosHumanas: number;
  acertosNaturezas: number;
  acertosExatas: number;
  relacao: Relacao;
  amizadeId: string | null;
  perfilPrivado: boolean;
  podeDesafiar: boolean;
  motivoSemDuelo: string | null;
  podeDuelarHoje: boolean;
  placar: Placar;
  dueloAtivo: Duelo | null;
  duelosVencidos: number;
  duelosDisputados: number;
}

export interface SolicitacaoAmizade { id: string; usuario: UsuarioMini; criadaEm: string; }

export interface Solicitacoes {
  amizadesRecebidas: SolicitacaoAmizade[];
  amizadesEnviadas: SolicitacaoAmizade[];
  duelosRecebidos: Duelo[];
  duelosEnviados: Duelo[];
}

export interface Duelos { recebidos: Duelo[]; enviados: Duelo[]; agendados: Duelo[]; historico: Duelo[]; geral: Placar; }

export interface Notificacoes { amizades: number; duelos: number; convites: Duelo[]; resultados: Duelo[]; hoje: Duelo[]; }

export interface Privacidade { perfilPrivado: boolean; duelosSoAmigos: boolean; }

export interface Disponibilidade { hoje: boolean; motivo: string | null; primeiroDia: string | null; }
