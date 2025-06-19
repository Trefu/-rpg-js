export interface IClass {
  name: string
  description: string
  baseStats: {
    fuerza: number
    destreza: number
    inteligencia: number
    sabiduria: number
    constitucion: number
    carisma: number
  }
  levelUpStats: {
    fuerza: number
    destreza: number
    inteligencia: number
    sabiduria: number
    constitucion: number
    carisma: number
  }
  specialAbility: {
    name: string
    description: string
    cooldown: number
  }
  abilities?: Ability[]
}

export type Ability = {
  name: string
  description: string
  type: string
  cooldown: number
} 