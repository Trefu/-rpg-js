import { Character } from '../Character'
import { ICharacter, ICombatant, type IEnemyStats, type IStat } from '../interfaces/ICharacter'
import type { IStatusEffect } from '../interfaces/IStatusEffect'
import type { DefensePatternConfig } from '../defense/types'
import type { Hero } from '../Hero'
import { getScalingStat, getScalingCoefficient, type UnifiedDamageType } from '../combat/damageTypes'
import { computeDefense } from '../defense/computeDefense'
import { computeAgilityCritBonus, rollCritFromChance, type CritResult } from '../crit'
import { applyDamageVariance } from '../abilities/Abilities'

export interface TargetScoreWeights {
  hpLow: number
  friendlyDebuffs: number
  lowDefense: number
  threatModifier: number
}

/**
 * Crecimiento por nivel por defecto de cada stat de enemigo. Se aplica sobre
 * el valor inicial en el constructor — un enemigo de nivel N arranca con
 * `base + (N-1) * ENEMY_STAT_GROWTH_PER_LEVEL` en cada stat.
 * Heroes crecen a `STAT_BASE_GROWTH + growthPerLevel` por nivel, asi que este
 * valor es deliberadamente menor para que los enemigos sientan "mobs".
 */
export const ENEMY_STAT_GROWTH_PER_LEVEL = 0.5

const FRIENDLY_DEBUFF_TYPES: ReadonlySet<string> = new Set([
  'injured', 'freeze', 'slow', 'weakness', 'poison', 'burn'
])

/**
 * Multiplicadores por stat que dan "sabor" a cada clase de enemigo. Se
 * aplican al FINAL del calculo (despues del growth uniforme), asi modifican
 * el valor efectivo de cada stat sin tocar el crecimiento base. `1.0` = sin
 * cambio. Pensado para tunear la identidad de cada subclase:
 * `Goblin = { agility: 0.9 }`, `Orc = { body: 1.2 }`, etc.
 */
export type EnemyClassMultipliers = Partial<Record<keyof IEnemyStats, number>>

/**
 * Baseline por defecto de la stat `body` para enemigos. Antes el daño base
 * provenía de un campo `baseAttack` separado; ahora se calcula desde `body`
 * (mismo rol estructural que `Hero.attack()` usa para el heroe), por eso el
 * default sube a 22 para preservar el balance pre-cambio. `mind`, `agility` y
 * `constitution` siguen en 10 para no buffear magic scaling indiscriminadamente;
 * las subclases magicas los sobreescriben via `baseStats` o `classMultipliers`.
 */
const ENEMY_BODY_BASELINE = 22

export interface EnemyOptions {
  id: string
  name: string
  level?: number
  maxHealth: number
  experienceReward: number
  goldReward: { min: number; max: number }
  critChance?: number
  baseStats?: Partial<IEnemyStats>
  /** Multiplicadores por stat que se aplican al final del calculo. */
  classMultipliers?: EnemyClassMultipliers
}

export abstract class Enemy extends Character implements ICombatant {
  public readonly experienceReward: number
  public readonly goldReward: { min: number; max: number }
  public readonly critChance: number
  public statusEffects: IStatusEffect[] = [];
  public attackPatterns: DefensePatternConfig[] = [];
  public baseStats: IEnemyStats

  constructor(opts: EnemyOptions) {
    super(opts.id, opts.name, opts.level ?? 1, opts.maxHealth)
    this.experienceReward = opts.experienceReward
    this.goldReward = opts.goldReward
    this.critChance = opts.critChance ?? 5
    const stats = opts.baseStats ?? {}
    const defaultStat = (value: number): IStat => ({
      value,
      growthPerLevel: ENEMY_STAT_GROWTH_PER_LEVEL
    })
    this.baseStats = {
      agility: stats.agility ?? defaultStat(10),
      constitution: stats.constitution ?? defaultStat(10),
      mind: stats.mind ?? defaultStat(10),
      body: stats.body ?? defaultStat(ENEMY_BODY_BASELINE)
    }
    this.applyLevelScalingToBaseStats()
    this.applyClassMultipliers(opts.classMultipliers)
  }

  /**
   * Aplica el crecimiento acumulado por nivel al valor inicial de cada stat.
   * Asi un enemigo de nivel N ya arranca con sus stats escaladas, en vez de
   * tener que hardcodear valores por nivel en cada subclase. Las subclases
   * siguen pudiendo tunear `growthPerLevel` por stat en `opts.baseStats`.
   */
  private applyLevelScalingToBaseStats(): void {
    const levelsAboveBase = this.level - 1
    if (levelsAboveBase <= 0) return
    for (const stat of Object.values(this.baseStats)) {
      stat.value += levelsAboveBase * stat.growthPerLevel
    }
  }

  /**
   * Aplica multiplicadores por stat al final del calculo. Sirve para dar
   * identidad a cada subclase sin tocar la formula de crecimiento uniforme.
   * `1.0` (o ausente) es identidad. Si un multiplicador es `<= 0` se ignora.
   */
  private applyClassMultipliers(multipliers?: EnemyClassMultipliers): void {
    if (!multipliers) return
    for (const key of Object.keys(multipliers) as Array<keyof IEnemyStats>) {
      const mult = multipliers[key]
      if (typeof mult !== 'number' || mult <= 0) continue
      if (mult === 1) continue
      const stat = this.baseStats[key]
      if (stat) stat.value *= mult
    }
  }

  /**
   * Daño base del enemigo cuando no hay patron de ataque en juego. Escala por
   * `body` (la stat de daño fisico por defecto) mas el bonus de nivel, sin
   * termino `baseAttack` aparte — mismo coeficiente que
   * `calculatePhaseDamage` para daño fisico, por consistencia con que el
   * splash multi-hero (`useCombat.applyEnemyMultiHeroSplash`) tambien es fisico.
   *
   * Aplica varianza ±10% para que cada golpe fluctúe (consistente con heroes).
   */
  public attack(): number {
    if (!this.isAlive) return 0
    const raw = (this.baseStats.body.value - 10) * 0.5 + this.level * 1
    return applyDamageVariance(raw)
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
    const baseDamage = statBonus + levelBonus
    const finalDamage = Math.floor(baseDamage * pattern.damageMultiplier)
    // Varianza se aplica ANTES del multiplicador de critico para que el crit
    // escale un valor ya fluctuante (mismo criterio que en heroes).
    const variable = applyDamageVariance(finalDamage)
    return Math.floor(variable * multiplier)
  }

  public rollCrit(): CritResult {
    const chance = this.getEffectiveCritChance()
    if (chance <= 0) {
      return { multiplier: 1, isCrit: false, isOvercrit: false }
    }
    return rollCritFromChance(chance)
  }

  public getEffectiveCritChance(): number {
    return this.critChance + computeAgilityCritBonus(this.baseStats.agility.value)
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
    lowDefense: 0.3,
    threatModifier: 1.0
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
    const threatScore = this.sumThreatModifiers(hero) * w.threatModifier
    return hpScore + debuffScore + defScore + threatScore
  }

  protected countFriendlyDebuffs(hero: Hero): number {
    return hero.statusEffects.filter(e => e.turns > 0 && FRIENDLY_DEBUFF_TYPES.has(e.type)).length
  }

  protected sumThreatModifiers(hero: Hero): number {
    return hero.statusEffects.reduce((sum, e) => {
      if (e.turns <= 0) return sum
      if (typeof e.threatModifier !== 'number') return sum
      return sum + e.threatModifier
    }, 0)
  }

  protected normalizeDefense(hero: Hero): number {
    return Math.min(1, hero.defense() / 30)
  }
}
