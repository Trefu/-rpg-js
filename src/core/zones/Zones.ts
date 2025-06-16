import type { IZone } from '../interfaces/IExpedition'

export const zones: IZone[] = [
  {
    id: 'mountain-peak',
    name: 'Pico de la Montaña',
    description: 'Una peligrosa montaña donde los vientos helados y las criaturas salvajes acechan a cada paso.',
    background: '/assets/backgrounds/mountain-peak.jpg',
    difficulty: 'medium',
    minLevel: 1,
    enemies: ['goblin', 'wolf', 'troll'],
    rewards: {
      experience: 100,
      gold: 50
    }
  },
  {
    id: 'forgotten-castle',
    name: 'Castillo Olvidado',
    description: 'Las ruinas de un antiguo castillo, habitado por fantasmas y criaturas no muertas.',
    background: '/assets/backgrounds/forgotten-castle.jpg',
    difficulty: 'hard',
    minLevel: 3,
    enemies: ['skeleton', 'ghost', 'vampire'],
    rewards: {
      experience: 150,
      gold: 75
    }
  },
  {
    id: 'crystal-caves',
    name: 'Cuevas de Cristal',
    description: 'Un laberinto de cuevas brillantes, donde los cristales mágicos atraen a extrañas criaturas.',
    background: '/assets/backgrounds/crystal-caves.jpg',
    difficulty: 'easy',
    minLevel: 1,
    enemies: ['goblin', 'crystal-golem', 'bat'],
    rewards: {
      experience: 80,
      gold: 40
    }
  }
] 