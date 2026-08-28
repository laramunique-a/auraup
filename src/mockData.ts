export interface RankingUser {
  id: string
  name: string
  avatar: string
  xp: number
  posicao: number
  streak: number
  level: string
  levelColor?: string
  isCurrentUser?: boolean
}

export const GLOBAL_RANKING_MOCK: RankingUser[] = [
  {
    id: '1',
    name: 'Lucas Andrade',
    avatar: '🦁',
    xp: 2850,
    posicao: 1,
    streak: 14,
    level: 'Mestre',
    levelColor: '#f59e0b',
  },
  {
    id: '2',
    name: 'Beatriz Lima',
    avatar: '🦊',
    xp: 2420,
    posicao: 2,
    streak: 10,
    level: 'Diamante',
    levelColor: '#38bdf8',
  },
  {
    id: '3',
    name: 'Carlos Eduardo',
    avatar: '🦉',
    xp: 2100,
    posicao: 3,
    streak: 7,
    level: 'Ouro',
    levelColor: '#eab308',
  },
  {
    id: 'user-self',
    name: 'Você',
    avatar: '🦊',
    xp: 1500,
    posicao: 4,
    streak: 5,
    level: 'Prata',
    levelColor: '#94a3b8',
    isCurrentUser: true,
  },
  {
    id: '5',
    name: 'Mariana Costa',
    avatar: '🐼',
    xp: 1320,
    posicao: 5,
    streak: 3,
    level: 'Prata',
    levelColor: '#94a3b8',
  },
  {
    id: '6',
    name: 'Gabriel Santos',
    avatar: '🐨',
    xp: 1150,
    posicao: 6,
    streak: 2,
    level: 'Bronze',
    levelColor: '#cd7f32',
  },
  {
    id: '7',
    name: 'Fernanda Oliveira',
    avatar: '🦖',
    xp: 980,
    posicao: 7,
    streak: 4,
    level: 'Bronze',
    levelColor: '#cd7f32',
  },
  {
    id: '8',
    name: 'Rafael Souza',
    avatar: '🦊',
    xp: 850,
    posicao: 8,
    streak: 1,
    level: 'Iniciante',
    levelColor: '#64748b',
  },
]

export const CLASS_RANKING_MOCK: RankingUser[] = [
  {
    id: 'c1',
    name: 'Sofia Martins',
    avatar: '🦉',
    xp: 1950,
    posicao: 1,
    streak: 9,
    level: 'Ouro',
    levelColor: '#eab308',
  },
  {
    id: 'user-self',
    name: 'Você',
    avatar: '🦊',
    xp: 1500,
    posicao: 2,
    streak: 5,
    level: 'Prata',
    levelColor: '#94a3b8',
    isCurrentUser: true,
  },
  {
    id: 'c3',
    name: 'Matheus Pereira',
    avatar: '🦁',
    xp: 1420,
    posicao: 3,
    streak: 6,
    level: 'Prata',
    levelColor: '#94a3b8',
  },
  {
    id: 'c4',
    name: 'Camila Rocha',
    avatar: '🐼',
    xp: 1100,
    posicao: 4,
    streak: 2,
    level: 'Bronze',
    levelColor: '#cd7f32',
  },
  {
    id: 'c5',
    name: 'Enzo Alves',
    avatar: '🐨',
    xp: 920,
    posicao: 5,
    streak: 1,
    level: 'Bronze',
    levelColor: '#cd7f32',
  },
]
