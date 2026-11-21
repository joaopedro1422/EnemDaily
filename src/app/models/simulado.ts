export interface Simulado{
    id: number;
    numeracao: number;
    dif: number;
    dia: number;
    data: string;
    linguagens: number;
    humanas: number;
    naturezas: number;
    exatas: number;
    nome: string;
    acertosTotais: number;
    anotacoes: string;
    showNotes: boolean
}
export interface Dia {
    quantidade: number;
    totalAcertos: number;
    porcentagem: number;
    melhor: string;
    media: number;
}
export interface simuladoRequest{
    dia: string;
    data: string;
    linguagens: number;
    humanas: number;
    naturezas: number;
    exatas: number;
    nome: string;
    anotacoes: string;
}
export const MOCK_SIMULADOS: Simulado[] = [
  {
    id: 1,
    numeracao: 1,
    dia: 1,
    dif: 0,
    data: '05/10/2023',
    linguagens: 38,
    humanas: 42,
    naturezas: 0,
    exatas: 0,
    acertosTotais: 80, // 38 + 42
    nome: 'Bernoulli',
    anotacoes: "11 acertos em biologia; revisar quimica orgânica",
    showNotes: false
  },
  {
    id: 2,
    numeracao: 1,
    dia: 2,
    dif: 0,
    data: '12/10/2023',
    linguagens: 0,
    humanas: 0,
    naturezas: 35,
    exatas: 40,
    acertosTotais: 75, // 35 + 40
    nome: 'Poliedro',
    anotacoes: "11 acertos em biologia; revisar quimica orgânica",
    showNotes: false
  },
  {
    id: 3,
    numeracao: 2,
    dia: 1,
    dif: -3,
    data: '02/11/2023',
    linguagens: 40,
    humanas: 37,
    naturezas: 0,
    exatas: 0,
    acertosTotais: 77, // 40 + 37
    nome: 'SAS 01',
    anotacoes: "11 acertos em biologia; revisar quimica orgânica",
    showNotes: false
  },
  {
    id: 4,
    numeracao: 2,
    dia: 2,
    dif: 3,
    data: '09/11/2023',
    linguagens: 0,
    humanas: 0,
    naturezas: 37,
    exatas: 41,
    acertosTotais: 78, // 37 + 41
    nome: 'SAS 02',
    anotacoes: "11 acertos em biologia; revisar quimica orgânica",
    showNotes: false
  },
  {
    id: 5,
    numeracao: 3,
    dia: 1,
    dif: 8,
    data: '01/12/2023',
    linguagens: 40,
    humanas: 45,
    naturezas: 0,
    exatas: 0,
    acertosTotais: 85, // 40 + 45
    nome: 'Final',
    anotacoes: "11 acertos em biologia; revisar quimica orgânica",
    showNotes: false
  },
   {
    id: 6,
    numeracao: 3,
    dia: 2,
    dif: 3,
    data: '08/12/2023',
    linguagens: 0,
    humanas: 0,
    naturezas: 39,
    exatas: 42,
    acertosTotais: 81, // 40 + 45
    nome: 'Final',
    anotacoes: "11 acertos em biologia; revisar quimica orgânica",
    showNotes: false
  }
];