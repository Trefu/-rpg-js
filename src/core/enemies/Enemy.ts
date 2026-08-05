import { Character } from '../Character'
import { ICharacter, ICombatant } from '../interfaces/ICharacter'
import type { IStatusEffect } from '../interfaces/IStatusEffect'
import type { DefensePatternConfig } from '../defense/types'

export abstract class Enemy extends Character implements ICombatant {
  public baseAttack: number
  public readonly experienceReward: number
  public readonly goldReward: { min: number; max: number }
  public stunTurns: number = 0;
  public statusEffects: IStatusEffect[] = [];
  public attackPatterns: DefensePatternConfig[] = [];

  constructor(
    id: string,
    name: string,
    level: number,
    maxHealth: number,
    baseAttack: number,
    experienceReward: number,
    goldReward: { min: number; max: number }
  ) {
    super(id, name, level, maxHealth)
    this.baseAttack = baseAttack
    this.experienceReward = experienceReward
    this.goldReward = goldReward
  }

  public attack(): number {
    if (!this.isAlive) return 0
    return this.baseAttack + (this.level * 1.5)
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

  public addStatusEffect(effect: IStatusEffect) {
    // Si ya existe el mismo tipo, refresca duración
    const existing = this.statusEffects.find(e => e.type === effect.type)
    if (existing) {
      existing.turns = effect.turns
    } else {
      this.statusEffects.push({ ...effect })
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

  public reduceStun(): void {
    if (this.stunTurns > 0) {
      this.stunTurns--;
    }
  }
}
