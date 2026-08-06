import { Enemy } from './Enemy'
import { ICharacter, IEnemy } from '../interfaces/ICharacter'
import dummySprite from '@/assets/sprites/enemies/dummy.png'
import type { DefensePatternConfig } from '../defense/types'

export class Dummy extends Enemy implements IEnemy {
  public readonly sprite = dummySprite
  public attackPatterns: DefensePatternConfig[] = [
    {
      name: 'Golpe Suave',
      phaseCount: 1,
      waveSpeed: 25,
      baseSuccessZoneSize: 0.18,
      baseMaxBlockReduction: 0.8,
      damageMultiplier: 1.0
    },
    {
      name: 'Golpe Rápido',
      phaseCount: 1,
      waveSpeed: 55,
      baseSuccessZoneSize: 0.08,
      baseMaxBlockReduction: 0.5,
      damageMultiplier: 0.7
    },
    {
      name: 'Combo Doble',
      phaseCount: 2,
      waveSpeed: 35,
      baseSuccessZoneSize: 0.12,
      baseMaxBlockReduction: 0.5,
      damageMultiplier: 1.2
    },
    {
      name: 'Combo Triple',
      phaseCount: 3,
      waveSpeed: 45,
      baseSuccessZoneSize: 0.10,
      baseMaxBlockReduction: 0.4,
      damageMultiplier: 1.4
    },
    {
      name: 'Mordida Tóxica',
      phaseCount: 1,
      waveSpeed: 40,
      baseSuccessZoneSize: 0.12,
      baseMaxBlockReduction: 0.5,
      damageMultiplier: 0.6,
      onFailureEffect: {
        statusType: 'poison',
        duration: 3,
        damagePerTurn: 2,
        stacks: 1
      }
    },
    {
      name: 'Aliento de Fuego',
      phaseCount: 10,
      waveSpeed: 80,
      baseSuccessZoneSize: 0.12,
      baseMaxBlockReduction: 0.5,
      damageMultiplier: 2.0,
      onFailureEffect: {
        statusType: 'burn',
        duration: 3,
        damagePerTurn: 2,
        stacks: 1
      }
    }
  ]

  public forcedPattern: DefensePatternConfig | null = null
  public damageOverride: number | null = null

  constructor(level: number = 1) {
    super(
      `dummy-${Date.now()}-${Math.random()}`,
      'Dummy de Entrenamiento',
      level,
      1000,
      8,
      0,
      { min: 0, max: 0 }
    )
  }

  public override attack(): number {
    if (this.damageOverride !== null) {
      return Math.max(0, this.damageOverride)
    }
    return this.baseAttack + (this.level * 1)
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

  public reset(): void {
    this.health = this.maxHealth
    this.isAlive = true
    this.forcedPattern = null
    this.damageOverride = null
    this.statusEffects = []
  }

  public setForcedPattern(pattern: DefensePatternConfig | null): void {
    this.forcedPattern = pattern
  }

  public setDamageOverride(value: number | null): void {
    this.damageOverride = value
  }
}
