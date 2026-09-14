import type { IStatusEffect } from './IStatusEffect'
import type { IAbility } from './IAbility'
import type { DefensePatternConfig } from '../defense/types'
import type { Hero } from '../Hero'
import type { CritResult } from '../crit'
import type { DamageTypeId } from '../combat/damageTypes'

export type AttackPatternSelector = (player: ICharacter | null) => DefensePatternConfig

export interface TakeDamageOptions {
  /**
   * Tipo elemental del daño entrante. Si se define, el `amount` se
   * multiplica por `getIncomingDamageMultiplier(statusEffects, damageType)`
   * (combina `damageTakenMultiplier` aditivo con resistencias elementales).
   */
  damageType?: DamageTypeId | string
}

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
  takeDamage(amount: number, opts?: TakeDamageOptions): void
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
  takeDamage(amount: number, opts?: TakeDamageOptions): void
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
  /**
   * Acciones disponibles para el enemigo en su turno. Cada entrada puede
   * ser:
   * - `DefensePatternConfig`: patrón visual de defensa que el jugador
   *   tiene que bloquear.
   * - `IAbility`: lógica pura (AOE sin defense, self-buff, regen, etc.)
   *   que se ejecuta directamente.
   *
   * `selectAttackPattern` retorna uno de estos al azar; `useCombat` decide
   * en runtime si dispara el defense challenge o `ability.execute(...)`.
   */
  attackPatterns: EnemyAction[]
  selectAttackPattern(player: ICharacter | null): EnemyAction
  selectTarget(heroes: Hero[]): Hero | null
  rollCrit?(): CritResult
  calculatePhaseDamage(pattern: DefensePatternConfig, multiplier?: number): number
}

/**
 * Union de acciones que un enemigo puede elegir en su turno. Ver `IEnemy.attackPatterns`.
 */
export type EnemyAction = DefensePatternConfig | IAbility