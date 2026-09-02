import type { IStatusEffect } from './IStatusEffect'
import type { IAbility } from './IAbility'
import type { DefensePatternConfig } from '../defense/types'
import type { Hero } from '../Hero'
import type { CritResult } from '../crit'

export type AttackPatternSelector = (player: ICharacter | null) => DefensePatternConfig

export interface ICharacter {
  readonly id: string
  name: string
  level: number
  health: number
  maxHealth: number
  energy?: number
  maxEnergy?: number
  isAlive: boolean
  statusEffects: IStatusEffect[]
  addStatusEffect(effect: IStatusEffect): void
  removeStatusEffect(effectType: string): void
  hasStatusEffect(type: string): boolean
  attack(): number
  takeDamage(amount: number): void
  heal(amount: number): void
  getHealthPercentage(): number
}

export interface IStat {
  value: number
  growthPerLevel: number
  /** Tooltip/descripcion del stat. Opcional — solo Heroes lo setean para UI. */
  description?: string
}

export interface IPlayerStats {
  agility: IStat
  constitution: IStat
  mind: IStat
  body: IStat
}

export interface IEnemyStats {
  agility: IStat
  constitution: IStat
  mind: IStat
  body: IStat
}

export interface ICombatant extends ICharacter {
  attack: () => number
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
  experienceReward: number
  goldReward: { min: number; max: number }
  critChance: number
  baseStats: IEnemyStats
  abilities?: IAbility[]
  statusEffects: IStatusEffect[]
  addStatusEffect(effect: IStatusEffect): void
  removeStatusEffect(effectType: string): void
  reduceStatusEffects?: () => void
  sprite?: string
  attackPatterns: DefensePatternConfig[]
  selectAttackPattern(player: ICharacter | null): DefensePatternConfig
  selectTarget(heroes: Hero[]): Hero | null
  rollCrit?(): CritResult
  calculatePhaseDamage(pattern: DefensePatternConfig, multiplier?: number): number
}