export interface UsuarioGrupo {
  id: string;
  usuario: string;
  xpTotal: number;
  xpGrupo: number;
  avatar: string;
  tempoMedio: number;
  xpSemanal: number;
  xpMensal: number;
  xpHoje: number;
  sequenciaAtual: number;
  sequenciaAcertos: number;
  titulosMensais: number;
  isAdm: boolean;
  emblemas: string;
  acertosLinguagens?: number;
  acertosHumanas?: number;
  acertosNaturezas?: number;
  acertosExatas?: number;
  diasAtivos?: number;
  primeiraRespostaHoje?: string | null;
}
export interface AtividadeRecente{
  usuario: string;
  dataHora : string;
}
export interface PodioResponse {
  posicaoUsuarioLogado: number;
  usuarios: UsuarioPodio[]
}
export interface UsuarioPodio{
  avatar: string;
  usuario: string;
  xp: number;
}
export interface GrupoAtualizado{
  id: string,
  nome: string,
  img: string,
  admVisivel: boolean
}
export interface Grupo {
  id: string;
  nome: string;
  img: string;
  naturezas: boolean;
  exatas: boolean;
  humanas: boolean;
  linguagens: boolean;
  idAdmin: string;
  admVisivel: boolean;
  publico: boolean,
  usuariogrupo: UsuarioGrupo[];
  atividadesRecentes: AtividadeRecente[];
  dtCriacao: string;
}