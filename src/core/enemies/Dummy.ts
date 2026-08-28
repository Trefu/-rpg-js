import { Enemy } from './Enemy'
import { ICharacter, IEnemy } from '../interfaces/ICharacter'
import dummySprite from '@/assets/sprites/enemies/dummy.png'
import type { DefensePatternConfig } from '../defense/types'
import { phase } from '../defense/attackPatterns'
import { ALL_ENEMY_ATTACKS, GOBLIN_ESPADAZO, GOBLIN_FLECHA_VENENOSA, ORC_GOLPE_APLASTANTE, ORC_HACHAZOS_MULTIPLES, WOLF_MORDIDA_FEROZ, WOLF_ZARPAZOS_RAPIDOS } from '../abilities/EnemyAttacks'

export const DUMMY_ATTACKS: DefensePatternConfig[] = [
  {
    name: 'Golpe Suave',
    type: 'physical',
    phaseCount: 1,
    waveSpeed: 25,
    baseMaxBlockReduction: 0.8,
    damageMultiplier: 1.0,
    phases: [phase(5)]
  },
  {
    name: 'Golpe Rápido',
    type: 'physical',
    phaseCount: 1,
    waveSpeed: 55,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.7,
    phases: [phase(2)]
  },
  {
    name: 'Combo Doble',
    type: 'physical',
    phaseCount: 2,
    waveSpeed: 35,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 1.2,
    phases: [phase(4), phase(4)]
  },
  {
    name: 'Combo Triple',
    type: 'physical',
    phaseCount: 3,
    waveSpeed: 45,
    baseMaxBlockReduction: 0.4,
    damageMultiplier: 1.4,
    phases: [phase(3), phase(3), phase(3)]
  },
  {
    ...GOBLIN_FLECHA_VENENOSA,
    name: 'Mordida Tóxica',
    damageMultiplier: 0.6,
    onFailureEffect: {
      statusType: 'poison',
      duration: 3,
      stacks: 2
    }
  },
  {
    name: 'Aliento de Fuego',
    type: 'fire',
    phaseCount: 10,
    waveSpeed: 80,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 2.0,
    phases: Array.from({ length: 10 }, () => phase(4)),
    onFailureEffect: {
      statusType: 'burn',
      duration: 3,
      stacks: 1
    }
  },
  {
    name: 'Aliento Glacial',
    type: 'frost',
    phaseCount: 1,
    waveSpeed: 50,
    baseMaxBlockReduction: 0.5,
    damageMultiplier: 0.7,
    phases: [phase(3)],
    onFailureEffect: {
      statusType: 'freeze',
      duration: 3,
      stacks: 1
    }
  },
  GOBLIN_ESPADAZO,
  WOLF_MORDIDA_FEROZ,
  WOLF_ZARPAZOS_RAPIDOS,
  ORC_HACHAZOS_MULTIPLES,
  ORC_GOLPE_APLASTANTE,
  ...ALL_ENEMY_ATTACKS
]

export class Dummy extends Enemy implements IEnemy {
  public readonly sprite = dummySprite
  public attackPatterns: DefensePatternConfig[] = DUMMY_ATTACKS

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
