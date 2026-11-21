export type ChaveC = 'c1' | 'c2' | 'c3' | 'c4' | 'c5';

export interface InfoCompetencia {
  chave: ChaveC;
  sigla: string;
  nome: string;
  resumo: string;
  cor: string;
  avaliado: string;
  estudar: string;
  perde: string;
  dica: string;
}

export const COMPETENCIAS: InfoCompetencia[] = [
  {
    chave: 'c1', sigla: 'C1', nome: 'Norma culta', resumo: 'Domínio da escrita formal', cor: '#2836C6',
    avaliado: 'Domínio da modalidade escrita formal da língua portuguesa: clareza, correção gramatical e adequação ao registro de uma redação dissertativa.',
    estudar: 'Acentuação, concordância verbal e nominal, regência, crase e pontuação. Pratique frases completas e bem estruturadas, sem vícios de linguagem.',
    perde: 'Gírias e marcas de oralidade ("daí", "né"), erros ortográficos recorrentes e frases truncadas ou longas demais.',
    dica: 'Reforce acentuação, concordância e pontuação. Evite marcas de oralidade.'
  },
  {
    chave: 'c2', sigla: 'C2', nome: 'Repertório', resumo: 'Tema e repertório sociocultural', cor: '#C7455A',
    avaliado: 'Compreensão da proposta e uso de conhecimentos de diferentes áreas para desenvolver o tema dentro do tipo dissertativo-argumentativo.',
    estudar: 'Filosofia, Sociologia, História, Literatura e atualidades. Mais importante que citar é ligar o repertório à sua tese de forma produtiva.',
    perde: 'Tangenciar ou fugir do tema, texto só expositivo, repertório decorado sem relação com o argumento ou cópia dos textos motivadores.',
    dica: 'Use repertório legitimado e, principalmente, produtivo: ligado à sua tese.'
  },
  {
    chave: 'c3', sigla: 'C3', nome: 'Projeto de texto', resumo: 'Organização dos argumentos', cor: '#12A5E1',
    avaliado: 'Seleção, relação, organização e interpretação de informações e argumentos em defesa de um ponto de vista claro.',
    estudar: 'Estratégias argumentativas (causa e consequência, comparação, exemplificação) e planejamento: tese, dois argumentos e conclusão antes de escrever.',
    perde: 'Argumentos contraditórios ou soltos, informações sem desenvolvimento e ausência de um posicionamento crítico.',
    dica: 'Planeje antes de escrever: tese clara e argumentos que a comprovem em ordem lógica.'
  },
  {
    chave: 'c4', sigla: 'C4', nome: 'Coesão', resumo: 'Articulação entre as ideias', cor: '#36B37D',
    avaliado: 'Uso dos mecanismos linguísticos que articulam as partes do texto e garantem a progressão das ideias.',
    estudar: 'Operadores argumentativos e conectivos variados, pronomes e sinônimos para retomar termos, e conexão entre parágrafos.',
    perde: 'Repetição de palavras, falta de conectivos entre frases e parágrafos e transições bruscas.',
    dica: 'Varie os conectivos e retome termos com sinônimos e pronomes.'
  },
  {
    chave: 'c5', sigla: 'C5', nome: 'Intervenção', resumo: 'Proposta de solução', cor: '#D08C21',
    avaliado: 'Elaboração de uma proposta de intervenção detalhada e viável para o problema, respeitando os direitos humanos.',
    estudar: 'Os 5 elementos: agente (quem), ação (o quê), meio ou modo (como), efeito (para quê) e detalhamento de um deles.',
    perde: 'Proposta vaga ou genérica, falta de algum dos 5 elementos ou qualquer sugestão que desrespeite os direitos humanos.',
    dica: 'Garanta agente, ação, meio, efeito e detalhamento na proposta.'
  }
];
