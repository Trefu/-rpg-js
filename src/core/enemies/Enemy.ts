import { Character } from '../Character'
import { ICharacter, ICombatant, type IEnemyStats, type IStat } from '../interfaces/ICharacter'
import type { IStatusEffect } from '../interfaces/IStatusEffect'
import type { DefensePatternConfig } from '../defense/types'
import type { Hero } from '../Hero'
import { getScalingStat, getScalingCoefficient, type UnifiedDamageType } from '../combat/damageTypes'
import { computeDefense } from '../defense/computeDefense'
import { computeAgilityCritBonus, rollCritFromChance, type CritResult } from '../crit'

export interface TargetScoreWeights {
  hpLow: number
  friendlyDebuffs: number
  lowDefense: number
}

const FRIENDLY_DEBUFF_TYPES: ReadonlySet<string> = new Set([
  'injured', 'freeze', 'slow', 'weakness', 'poison', 'burn'
])

export interface EnemyOptions {
  id: string
  name: string
  level?: number
  maxHealth: number
  baseAttack: number
  experienceReward: number
  goldReward: { min: number; max: number }
  critChance?: number
  /** Velocidad base para el motor de turnos. Default 10. */
  agility?: number
  baseStats?: Partial<IEnemyStats>
}

export abstract class Enemy extends Character implements ICombatant {
  public baseAttack: number
  public readonly experienceReward: number
  public readonly goldReward: { min: number; max: number }
  public readonly critChance: number
  public agility: number
  public statusEffects: IStatusEffect[] = [];
  public attackPatterns: DefensePatternConfig[] = [];
  public baseStats: IEnemyStats

  constructor(opts: EnemyOptions) {
    super(opts.id, opts.name, opts.level ?? 1, opts.maxHealth)
    this.baseAttack = opts.baseAttack
    this.experienceReward = opts.experienceReward
    this.goldReward = opts.goldReward
    this.critChance = opts.critChance ?? 5
    this.agility = opts.agility ?? 10
    const stats = opts.baseStats ?? {}
    const defaultStat = (value: number = 10): IStat => ({ value, growthPerLevel: 0, description: '' })
    this.baseStats = {
      agility: stats.agility ?? defaultStat(opts.agility ?? 10),
      constitution: stats.constitution ?? defaultStat(),
      mind: stats.mind ?? defaultStat(),
      body: stats.body ?? defaultStat()
    }
  }

  public attack(): number {
    if (!this.isAlive) return 0
    return this.baseAttack
  }

  public defense(): number {
    return computeDefense(this.baseStats.body, this.baseStats.constitution)
  }

  public calculatePhaseDamage(pattern: DefensePatternConfig, multiplier: number = 1): number {
    if (!this.isAlive) return 0
    const damageType = (pattern.damageType ?? 'physical') as UnifiedDamageType
    const scalingStat = getScalingStat(damageType)
    const coefficient = getScalingCoefficient(scalingStat)
    const statValue = scalingStat === 'body'
      ? this.baseStats.body.value
      : this.baseStats.mind.value
    const statBonus = (statValue - 10) * coefficient
    const levelBonus = this.level * 1
    const baseDamage = this.baseAttack + statBonus + levelBonus
    const finalDamage = Math.floor(baseDamage * pattern.damageMultiplier)
    return Math.floor(finalDamage * multiplier)
  }

  public rollCrit(): CritResult {
    const chance = this.getEffectiveCritChance()
    if (chance <= 0) {
      return { multiplier: 1, isCrit: false, isOvercrit: false }
    }
    return rollCritFromChance(chance)
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

  public readonly scoreWeights: TargetScoreWeights = {
    hpLow: 1.0,
    friendlyDebuffs: 0.5,
    lowDefense: 0.3
  }

  public selectTarget(heroes: Hero[]): Hero | null {
    const alive = heroes.filter(h => h.isAlive)
    if (alive.length === 0) return null
    let best: Hero | null = null
    let bestScore = -Infinity
    for (const hero of alive) {
      const score = this.scoreTarget(hero, this.scoreWeights)
      if (score > bestScore) { bestScore = score; best = hero }
    }
    return best ?? alive.reduce((a, b) => (a.health > b.health ? a : b))
  }

  protected scoreTarget(hero: Hero, w: TargetScoreWeights): number {
    const hpRatio = hero.health / hero.maxHealth
    const hpScore = (1 - hpRatio) * w.hpLow
    const debuffScore = this.countFriendlyDebuffs(hero) * w.friendlyDebuffs
    const defScore = (1 - this.normalizeDefense(hero)) * w.lowDefense
    return hpScore + debuffScore + defScore
  }

  protected countFriendlyDebuffs(hero: Hero): number {
    return hero.statusEffects.filter(e => e.turns > 0 && FRIENDLY_DEBUFF_TYPES.has(e.type)).length
  }

  protected normalizeDefense(hero: Hero): number {
    return Math.min(1, hero.defense() / 30)
  }
}
