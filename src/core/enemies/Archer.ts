import { Enemy } from './Enemy'
import { IEnemy } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'

export class Archer extends Enemy implements IEnemy {
  public attackPatterns: DefensePatternConfig[] = [
    {
      name: 'Disparo preciso',
      phaseCount: 1,
      baseMaxBlockReduction: 0.5
    },
    {
      name: 'Disparo rapidísimo',
      phaseCount: 1,
      baseMaxBlockReduction: 0.5
    }
  ]

  constructor(level: number = 1) {
    super(
      `archer-${Date.now()}-${Math.random()}`,
      'Arquero',
      level,
      60 + (level * 10),
      10 + (level * 2),
      18 + (level * 4),
      { min: 7 + level, max: 12 + (level * 2) }
    )
  }

  public attack(): number {
    const baseDamage = this.baseAttack
    const variation = Math.floor(Math.random() * 4) - 1
    return Math.max(1, baseDamage + variation)
  }

  public getRewards(): { experience: number; gold: number } {
    return {
      experience: this.experienceReward,
      gold: Math.floor(Math.random() * (this.goldReward.max - this.goldReward.min + 1)) + this.goldReward.min
    }
  }
}
