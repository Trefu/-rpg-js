import type { IStatusEffect } from './IStatusEffect'
import type { IAbility } from './IAbility'

export interface ICharacter {
  readonly id: string
  name: string
  level: number
  health: number
  maxHealth: number
  isAlive: boolean
  statusEffects: IStatusEffect[]
  addStatusEffect(effect: IStatusEffect): void
  removeStatusEffect(effectType: string): void
  attack(): number
  defense(): number
  magic(): number
  takeDamage(amount: number): void
  heal(amount: number): void
  getHealthPercentage(): number
  specialAbility: {
    name: string
    description: string
  }
}

export interface IPlayerStats {
  fuerza: number
  destreza: number
  inteligencia: number
  sabiduria: number
  constitucion: number
  carisma: number
}

export interface ICombatant extends ICharacter {
  attack: () => number
  defense: () => number
  magic: () => number
  takeDamage(amount: number): void
  heal(amount: number): void
  statusEffects: IStatusEffect[]
}

export interface ILevelable extends ICharacter {
  experience: number
  experienceToNextLevel: number
  levelUp(): void
  gainExperience(amount: number): void
}

export interface IInventory {
  gold: number
  items: string[]
  addItem(item: string): void
  removeItem(item: string): void
  addGold(amount: number): void
  spendGold(amount: number): boolean
}

export interface IEnemy extends ICombatant {
  getRewards: () => { experience: number; gold: number }
  delayMs?: number
  baseAttack: number
  baseDefense: number
  baseMagic: number
  experienceReward: number
  goldReward: { min: number; max: number }
  abilities?: IAbility[]
  statusEffects: IStatusEffect[]
  addStatusEffect(effect: IStatusEffect): void
  removeStatusEffect(effectType: string): void
  reduceStatusEffects?: () => void
} 