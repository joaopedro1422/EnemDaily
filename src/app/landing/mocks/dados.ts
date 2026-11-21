import { AREAS } from '../../shared/dia';
import { COMPETENCIAS } from '../../home-redacoes/competencias';

/** Dados de exemplo das landings: uma estudante com 6 simulados e 5 redações entre agosto e novembro. */

const area = (chave: string) => AREAS.find(a => a.chave === chave)!;

export const SIM = {
  projecao: 111,
  notaGeral: 641,
  dias: [
    { dia: 1, nome: '1º dia', media: 64, melhor: 69, qtd: 3, delta: 5 },
    { dia: 2, nome: '2º dia', media: 47, melhor: 53, qtd: 3, delta: 5 }
  ],
  areas: [
    { info: area('linguagens'), media: 31, pct: 69, melhor: 33, delta: 2 },
    { info: area('humanas'), media: 33, pct: 73, melhor: 36, delta: 3 },
    { info: area('naturezas'), media: 25, pct: 56, melhor: 27, delta: 2 },
    { info: area('exatas'), media: 23, pct: 51, melhor: 26, delta: 3 }
  ],
  insights: [
    { icone: 'trophy', tom: 'info', titulo: 'Nota estimada: ~641 pontos', texto: 'Média das 5 notas, como no boletim do ENEM: as 4 provas objetivas estimadas pela TRI e a média das suas redações (760).' },
    { icone: 'trending-up', tom: 'bom', titulo: '1º dia: +6 acertos de média desde o início', texto: 'Você começou com 58 e hoje sua média é 64 em Linguagens e Humanas.' },
    { icone: 'flame', tom: 'bom', titulo: '2º dia: 2 melhoras seguidas', texto: 'Seus últimos 3 simulados do 2º dia foram melhorando um atrás do outro.' },
    { icone: 'target', tom: 'alerta', titulo: 'Foco em Matemática', texto: 'É a sua menor média: 23 de 45. Priorizar essa área tende a render mais pontos na projeção.' }
  ],
  // ordem cronológica (#1 a #6); 1º dia = LC + CH, 2º dia = CN + MT
  lista: [
    { n: 1, dia: 1, data: '10 ago', lc: 28, ch: 30, total: 58, dif: 0, nome: '' },
    { n: 2, dia: 2, data: '17 ago', cn: 22, mt: 19, total: 41, dif: 0, nome: '' },
    { n: 3, dia: 1, data: '14 set', lc: 31, ch: 33, total: 64, dif: 6, nome: 'Simulado do cursinho' },
    { n: 4, dia: 2, data: '21 set', cn: 25, mt: 23, total: 48, dif: 7, nome: '' },
    { n: 5, dia: 1, data: '19 out', lc: 33, ch: 36, total: 69, dif: 5, nome: 'ENEM 2023 · prova azul' },
    { n: 6, dia: 2, data: '26 out', cn: 27, mt: 26, total: 53, dif: 5, nome: 'ENEM 2023 · prova azul', anotacoes: 'Errei 4 de geometria espacial por desatenção na leitura do enunciado.\nRevisar: prismas e cilindros.' }
  ] as { n: number; dia: 1 | 2; data: string; lc?: number; ch?: number; cn?: number; mt?: number; total: number; dif: number; nome: string; anotacoes?: string }[]
};

export const RED = {
  media: 760,
  melhor: { nota: 840, data: '9 nov' },
  ultima: { nota: 840, delta: 40 },
  comps: [
    { info: COMPETENCIAS[0], media: 160, delta: 20, nivel: 4 },
    { info: COMPETENCIAS[1], media: 152, delta: 0, nivel: 4 },
    { info: COMPETENCIAS[2], media: 144, delta: 0, nivel: 4 },
    { info: COMPETENCIAS[3], media: 168, delta: 0, nivel: 4 },
    { info: COMPETENCIAS[4], media: 136, delta: 20, nivel: 3 }
  ],
  insights: [
    { icone: 'target', tom: 'info', titulo: 'Projeção: entre 760 e 800 pontos', texto: 'Com base na média das suas 5 redações. Cada nível a mais em uma competência vale 40 pontos.' },
    { icone: 'flame', tom: 'bom', titulo: '4 redações seguidas subindo a nota', texto: 'Da 1ª para a 5ª você ganhou 160 pontos.' },
    { icone: 'target', tom: 'alerta', titulo: 'Foco em C5 · Intervenção', texto: 'É a sua menor média (136/200). ' + COMPETENCIAS[4].dica },
    { icone: 'arrow-up', tom: 'bom', titulo: 'Última redação: subiu em C1, C5', texto: 'C1 +20 · C5 +20 em relação à anterior.' }
  ],
  lista: [
    { n: 1, data: '24 ago', tema: 'Democratização do acesso ao cinema no Brasil', nota: 680, dif: 0, c: [140, 140, 120, 160, 120] },
    { n: 2, data: '14 set', tema: 'Manipulação do comportamento do usuário pelo controle de dados na internet', nota: 720, dif: 40, c: [160, 140, 140, 160, 120] },
    { n: 3, data: '28 set', tema: 'Caminhos para combater a intolerância religiosa no Brasil', nota: 760, dif: 40, c: [160, 160, 140, 160, 140] },
    { n: 4, data: '19 out', tema: 'Desafios para a valorização de comunidades e povos tradicionais no Brasil', nota: 800, dif: 40, c: [160, 160, 160, 180, 140] },
    { n: 5, data: '9 nov', tema: 'Invisibilidade do trabalho de cuidado realizado pela mulher no Brasil', nota: 840, dif: 40, c: [180, 160, 160, 180, 160] }
  ]
};
