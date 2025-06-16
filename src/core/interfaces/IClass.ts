export interface IClass {
  name: string
  description: string
  baseStats: {
    health: number
    attack: number
    defense: number
    magic: number
  }
  levelUpStats: {
    health: number
    attack: number
    defense: number
    magic: number
  }
  specialAbility: {
    name: string
    description: string
    cooldown: number
  }
} 