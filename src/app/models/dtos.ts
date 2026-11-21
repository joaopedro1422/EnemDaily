import { Usuario } from "./usuario";


export interface LoginRequest {
  email: string;
  senha: string;
}
export interface RegisterRequest {
  nome: string;
  usuario: string;
  email: string;
  senha: string;
  avatar: string;
  demo: boolean;
}

export interface RespostaRequest {
  area: string;
  /** Índice da alternativa marcada; null quando o tempo acabou. */
  alternativa: number | null;
  tempoGasto: number;
}
export interface NovoGrupoResponse{
  idGrupo: string;
  usuarioRet: Usuario;
}
export interface RankingDeltaEvent {
  grupoId: string;
  usuario: string;
  xpGanho: number;
  seq: number;
}
export interface GrupoRequest {
  nome: string;
  img: string;
  naturezas: boolean;
  exatas: boolean;
  humanas: boolean;
  linguagens: boolean;
  publico: boolean,
}
export interface CodigoResponse{
  codigo: string
}