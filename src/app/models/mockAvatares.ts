export interface Avatar {
  id: number;
  nome: string;
  url: string;
  desbloqueado: boolean;
  custo?: number; 
}

export const AVATARES_MOCK : Avatar[] = 
[
  { id: 17, nome: 'Avatar 17', url: 'avatares/avatar17.png', desbloqueado: false, custo: 0 },
  { id: 18, nome: 'Avatar 18', url: 'avatares/avatar18.png', desbloqueado: false, custo: 0 },
  
  { id: 2, nome: 'Avatar 2', url: 'avatares/avatar2.png', desbloqueado: true, custo: 0 },
  { id: 4, nome: 'Avatar 4', url: 'avatares/avatar4.png', desbloqueado: true, custo: 0 },
  { id: 5, nome: 'Avatar 5', url: 'avatares/avatar5.png', desbloqueado: true, custo: 0 },
  { id: 6, nome: 'Avatar 6', url: 'avatares/avatar6.png', desbloqueado: true, custo: 0 },
  { id: 7, nome: 'Avatar 7', url: 'avatares/avatar7.png', desbloqueado: true, custo: 0 },
  { id: 8, nome: 'Avatar 8', url: 'avatares/avatar8.png', desbloqueado: true, custo: 0 },
  { id: 19, nome: 'Avatar 19', url: 'avatares/avatar19.png', desbloqueado: false, custo: 350 },
  { id: 29, nome: 'Avatar 29', url: 'avatares/avatar29.png', desbloqueado: false, custo: 350 },
  { id: 21, nome: 'Avatar 21', url: 'avatares/avatar21.png', desbloqueado: false, custo: 350 },
    { id: 23, nome: 'Avatar 30', url: 'avatares/avatar30.png', desbloqueado: false, custo: 350 },
  { id: 11, nome: 'Avatar 11', url: 'avatares/avatar11.png', desbloqueado: false, custo: 450 },
  { id: 12, nome: 'Avatar 12', url: 'avatares/avatar12.png', desbloqueado: false, custo: 450 },
  { id: 13, nome: 'Avatar 13', url: 'avatares/avatar13.png', desbloqueado: false, custo: 800 },
  { id: 14, nome: 'Avatar 14', url: 'avatares/avatar14.png', desbloqueado: false, custo: 800 },
  { id: 15, nome: 'Avatar 15', url: 'avatares/avatar15.png', desbloqueado: false, custo: 1100 },
  { id: 16, nome: 'Avatar 16', url: 'avatares/avatar16.png', desbloqueado: false, custo: 1100 },
  { id: 9, nome: 'Avatar 9', url: 'avatares/avatar9.png', desbloqueado: false, custo: 1200 },
  { id: 10, nome: 'Avatar 10', url: 'avatares/avatar10.png', desbloqueado: false, custo: 1200 },
  { id: 24, nome: 'Avatar 23', url: 'avatares/avatar23.png', desbloqueado: false, custo: 1450 },
  { id: 25, nome: 'Avatar 24', url: 'avatares/avatar24.png', desbloqueado: false, custo: 1450 },
  { id: 26, nome: 'Avatar 25', url: 'avatares/avatar25.png', desbloqueado: false, custo: 1450 },
  { id: 27, nome: 'Avatar 26', url: 'avatares/avatar26.png', desbloqueado: false, custo: 1450 },
  { id: 28, nome: 'Avatar 27', url: 'avatares/avatar27.png', desbloqueado: false, custo: 1450 },
  { id: 30, nome: 'Avatar 28', url: 'avatares/avatar28.png', desbloqueado: false, custo: 1450 },
];