export interface Usuario{
    id: string;
    nome: string;
    avatar: string;
    usuario: string;
    ultimoAcesso: string;
    pagFavorita: string;
    sequenciaAtual: number;
    streak: number;
    streakDiasAtivos: number;
    qntDiasAtivos: number;
    maiorSequencia?: number;
    onboardingVisto?: boolean;
    email?: string;
    demo: boolean;
    naturezas: Area;
    humanas: Area;
    linguagens: Area;
    exatas: Area;
    xpTotal: number;
    xpHoje: number;
    presencaSemanal: Semana;
    exatRespHj: boolean;
    humRespHj: boolean;
    natRespHj: boolean;
    lingRespHj: boolean;
    xpAnoAreas: XpAnoAreas[];
    grupos: GrupoResumido[];
    emblemas: string;
}
export interface DiaStreak {
  label: string;
  concluido: boolean;
  hoje: boolean;
}

export interface Estagio {
  max: number;
  stage: string;
  nivel: string;
  limite: number;
}
export const CONFIG_ESTAGIOS: Estagio[] = [
  { max: 0,    stage: 'stage1',   nivel: 'Nível 1',  limite: 50   },
  { max: 50,   stage: 'stage2',   nivel: 'Nível 2',  limite: 130  },
  { max: 130,  stage: 'stage3',   nivel: 'Nível 3',  limite: 250  },
  { max: 250,  stage: 'stage4',   nivel: 'Nível 4',  limite: 380  },
  { max: 380,  stage: 'stageAux1',nivel: 'Nível 5',  limite: 650  },
  { max: 650,  stage: 'stage5',   nivel: 'Nível 6',  limite: 1050 },
  { max: 1050, stage: 'stage6',   nivel: 'Nível 7',  limite: 1550 },
  { max: 1550, stage: 'stage7',   nivel: 'Nível 8',  limite: 2350 },
  { max: 2350, stage: 'stage8',   nivel: 'Nível 9',  limite: 3150 },
  { max: 3150, stage: 'stage9',   nivel: 'Nível 10', limite: 4150 },
  { max: 4150, stage: 'stage10',  nivel: 'Nível 11', limite: 5250 },
  { max: 5250, stage: 'stage11',  nivel: 'Nível 12', limite: 6450 },
  { max: 6450, stage: 'stage12',  nivel: 'Nível 13', limite: 7450 },
  { max: 7450, stage: 'stage13',  nivel: 'Nível 14', limite: 8650 },
  { max: 8650, stage: 'stage14',  nivel: 'Nível 15', limite: 999999 },
];
export interface GrupoResumido{
  id: string;
  nome: string;
  img: string;
  posicao: number;
  membros: number;
  publico: boolean;
  naturezas: boolean;
  humanas: boolean;
  linguagens: boolean;
  exatas: boolean;
}
export interface Semana{
  segunda: boolean;
  terca: boolean;
  quarta: boolean;
  quinta: boolean;
  sexta: boolean;
  sabado: boolean;
  domingo: boolean;
}
export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface XpAnoAreas{
  mes: number;
  naturezas: number | null;
  humanas: number | null;
  linguagens: number | null;
  exatas: number | null;
}
export interface Area{
    nome: string;
    xp: number;
    ultimaResposta: string;
    questoesRespondidas: number;
    acertoHoje: boolean;
    acertos: number;
    streak: number;
    tempoGasto: number;
}

export interface Emblema {
  url: string;
  codigo: string;
  desc: string;
}

export const EMBLEMAS_MOCK: Emblema[] = [
  {
    url: 'emblemas/5_acertos_consec.png',
    codigo: '5_acertos_consec',
    desc: '5 acertos consecutivos'
  },
 {
    url: 'emblemas/3_streak.png',
    codigo: '3_streak',
    desc: '3 dias seguidos respondendo'
  },
  {
    url: 'emblemas/4_dia.png',
    codigo: '4_dia',
    desc: '4 acertos no mesmo dia'
  },
    {
    url: 'emblemas/campeao_mes.png',
    codigo: 'campeao_mes',
    desc: 'Campeão do mês em competições'
  },
    {
    url: 'emblemas/1_questao.png',
    codigo: '1_respostas',
    desc: 'Início da jornada'
  },
  {
    url: 'emblemas/7_streak.png',
    codigo: '7_streak',
    desc: '7 dias seguidos respondendo'
  },
  {
    url: 'emblemas/10_acertos_hum.png',
    codigo: '10_acertos_hum',
    desc: '10 acertos em Humanas'
  },
  {
    url: 'emblemas/10_acertos_lin.png',
    codigo: '10_acertos_lin',
    desc: '10 acertos em Linguagens'
  },
  {
    url: 'emblemas/10_acertos_mat.png',
    codigo: '10_acertos_mat',
    desc: '10 acertos em Exatas'
  },
  {
    url: 'emblemas/10_acertos_nat.png',
    codigo: '10_acertos_nat',
    desc: '10 acertos em Naturezas'
  },
  {
    url: 'emblemas/20_acertos.png',
    codigo: '20_acertos',
    desc: '20 acertos em questões'
  },
   {
    url: 'emblemas/50_respostas.png',
    codigo: '50_respostas',
    desc: '50 acertos em questões'
  },
  {
    url: 'emblemas/25_respostas.png',
    codigo: '25_respostas',
    desc: '25 respostas totais'
  },
   {
    url: 'emblemas/tempo_nat.png',
    codigo: 'tempo_nat',
    desc: 'Acerto em 1 minuto - Naturezas'
  },
    {
    url: 'emblemas/tempo_lin.png',
    codigo: 'tempo_lin',
    desc: 'Acerto em 1 minuto - Linguagens'
  },
    {
    url: 'emblemas/tempo_hum.png',
    codigo: 'tempo_hum',
    desc: 'Acerto em 1 minuto - Humanas'
  },
    {
    url: 'emblemas/tempo_mat.png',
    codigo: 'tempo_mat',
    desc: 'Acerto em 1 minuto - Exatas'
  },
  // adicionar para primeira resposta '1_respostas' e para 50 respostas
];