export interface Redacao {
    id: number;
    tema: string;
    data: string;
    nota: number;
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
    dif: number;
    showDetails: boolean;
}
export interface RedacaoRequest{
    tema: string;
    data: string;
    nota: number;
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
}
export const mockRedacoes: Redacao[] = [
  {
    id: 1,
    tema: "Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil",
    data: "2023-10-01",
    nota: 720,
    c1: 120,
    c2: 160,
    c3: 120,
    c4: 160,
    c5: 160,
    dif: 0 ,
    showDetails : false
  },
  {
    id: 2,
    tema: "Desafios para a valorização de comunidades e povos tradicionais no Brasil",
    data: "2023-10-15",
    nota: 760,
    c1: 160,
    c2: 160,
    c3: 120,
    c4: 160,
    c5: 160,
    dif: 40 ,
    showDetails : false
  },
  {
    id: 3,
    tema: "Manipulação do comportamento do usuário pelo controle de dados na internet",
    data: "2023-11-01",
    nota: 840,
    c1: 160,
    c2: 200,
    c3: 120,
    c4: 160,
    c5: 200,
    dif: 80 ,
    showDetails : false
  },
  {
    id: 3,
    tema: "Manipulação do comportamento do usuário pelo controle de dados na internet",
    data: "2023-11-01",
    nota: 840,
    c1: 160,
    c2: 200,
    c3: 120,
    c4: 160,
    c5: 200,
    dif: 80 ,
    showDetails : false
  },
  {
    id: 3,
    tema: "Manipulação do comportamento do usuário pelo controle de dados na internet",
    data: "2023-11-01",
    nota: 840,
    c1: 160,
    c2: 200,
    c3: 120,
    c4: 160,
    c5: 200,
    dif: 80 ,
    showDetails : false
  },
  {
    id: 4,
    tema: "Caminhos para combater a intolerância religiosa no Brasil",
    data: "2023-11-15",
    nota: 800,
    c1: 160,
    c2: 160,
    c3: 120,
    c4: 160,
    c5: 200,
    dif: -40 ,
    showDetails : false
  },
  {
    id: 5,
    tema: "Democratização do acesso ao cinema no Brasil",
    data: "2023-12-01",
    nota: 920,
    c1: 160,
    c2: 200,
    c3: 160,
    c4: 200,
    c5: 200,
    dif: 120 ,
    showDetails : false
  }
];