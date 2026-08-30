import { Character } from '../Character'
import { ICharacter, ICombatant } from '../interfaces/ICharacter'
import type { IStatusEffect } from '../interfaces/IStatusEffect'
import type { DefensePatternConfig } from '../defense/types'

export interface EnemyOptions {
  id: string
  name: string
  level?: number
  maxHealth: number
  baseAttack: number
  experienceReward: number
  goldReward: { min: number; max: number }
  critChance?: number
}

export abstract class Enemy extends Character implements ICombatant {
  public baseAttack: number
  public readonly experienceReward: number
  public readonly goldReward: { min: number; max: number }
  public readonly critChance: number
  public statusEffects: IStatusEffect[] = [];
  public attackPatterns: DefensePatternConfig[] = [];

  constructor(opts: EnemyOptions) {
    super(opts.id, opts.name, opts.level ?? 1, opts.maxHealth)
    this.baseAttack = opts.baseAttack
    this.experienceReward = opts.experienceReward
    this.goldReward = opts.goldReward
    this.critChance = opts.critChance ?? 0.05
  }

  public attack(): number {
    if (!this.isAlive) return 0
    return this.baseAttack
  }

  public rollCrit(): boolean {
    const chance = this.getEffectiveCritChance()
    if (chance <= 0) return false
    return Math.random() < chance
  }

  public getEffectiveCritChance(): number {
    return this.critChance
  }

  public selectAttackPattern(_player: ICharacter | null): DefensePatternConfig {
    if (this.attackPatterns.length === 0) {
      throw new Error(`${this.name} no tiene attackPatterns definidos`)
    }
    return this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)]
  }

  public getRewards(): { experience: number; gold: number } {
    const goldAmount = Math.floor(Math.random() * (this.goldReward.max - this.goldReward.min + 1)) + this.goldReward.min
    return {
      experience: this.experienceReward,
      gold: goldAmount
    }
  }

  public hasStatusEffect(type: string): boolean {
    return this.statusEffects.some(e => e.type === type && e.turns > 0)
  }

  public reduceStatusEffects() {
    this.statusEffects.forEach(e => e.turns--)
    this.removeExpiredStatusEffects()
  }

  public removeExpiredStatusEffects() {
    this.statusEffects = this.statusEffects.filter(e => e.turns > 0)
  }

  public isStunned(): boolean {
    return this.hasStatusEffect('stun')
  }
}
