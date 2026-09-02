import { Enemy } from './Enemy'
import { ICharacter, IEnemy } from '../interfaces/ICharacter'
import dummySprite from '@/assets/sprites/enemies/dummy.png'
import type { DefensePatternConfig } from '../defense/types'
import {
  SLASH,
  DEEP_SLASH,
  POISON_ARROW,
  EMBER,
  FEROCIOUS_BITE,
  QUICK_CLAWS,
  MULTIPLE_AXE_STRIKES,
  CRUSHING_BLOW,
  GENTLE_STRIKE,
  QUICK_STRIKE,
  DOUBLE_COMBO,
  TRIPLE_COMBO,
  FIRE_BREATH,
  GLACIAL_BREATH
} from '../abilities/EnemyAttacks'

export class Dummy extends Enemy implements IEnemy {
  public readonly sprite = dummySprite
  public attackPatterns: DefensePatternConfig[] = [
    SLASH,
    DEEP_SLASH,
    POISON_ARROW,
    EMBER,
    FEROCIOUS_BITE,
    QUICK_CLAWS,
    MULTIPLE_AXE_STRIKES,
    CRUSHING_BLOW,
    GENTLE_STRIKE,
    QUICK_STRIKE,
    DOUBLE_COMBO,
    TRIPLE_COMBO,
    FIRE_BREATH,
    GLACIAL_BREATH
  ]

  public forcedPattern: DefensePatternConfig | null = null
  public damageOverride: number | null = null
  public critChanceOverride: number | null = null

  constructor(level: number = 1) {
    super({
      id: `dummy-${Date.now()}-${Math.random()}`,
      name: 'Dummy de Entrenamiento',
      level,
      maxHealth: 1000,
      experienceReward: 0,
      goldReward: { min: 0, max: 0 },
      critChance: 0
    })
  }

  public override selectAttackPattern(_player: ICharacter | null): DefensePatternConfig {
    if (this.forcedPattern) {
      return this.forcedPattern
    }
    return super.selectAttackPattern(_player)
  }

  public override getRewards(): { experience: number; gold: number } {
    return {
      experience: 0,
      gold: 0
    }
  }

  public override takeDamage(amount: number): void {
    this.health = Math.max(1, this.health - amount)
    this.isAlive = true
  }

  public override getEffectiveCritChance(): number {
    return this.critChanceOverride ?? this.critChance
  }

  public reset(): void {
    this.health = this.maxHealth
    this.isAlive = true
    this.forcedPattern = null
    this.damageOverride = null
    this.critChanceOverride = null
    this.statusEffects = []
  }

  public setForcedPattern(pattern: DefensePatternConfig | null): void {
    this.forcedPattern = pattern
  }

  public setDamageOverride(value: number | null): void {
    this.damageOverride = value
  }

  public setCritChanceOverride(value: number | null): void {
    if (value === null) {
      this.critChanceOverride = null
      return
    }
    const clamped = Math.max(0, Math.min(200, value))
    this.critChanceOverride = clamped
  }
}
