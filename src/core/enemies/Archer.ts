import { Enemy } from './Enemy'
import { IEnemy } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'

export class Archer extends Enemy implements IEnemy {
  public defensePattern: DefensePatternConfig = {
    phaseCount: 1,
    waveSpeed: 9,
    barWidth: 20,
    baseSuccessZoneSize: 0.15,
    baseMaxBlockReduction: 0.5,
    phaseTimeoutMs: 5000
  }

  constructor(level: number = 1) {
    super(
      `archer-${Date.now()}-${Math.random()}`,
      'Arquero',
      level,
      60 + (level * 10),
      10 + (level * 2),
      4 + (level * 1),
      2 + (level * 0.5),
      18 + (level * 4),
      { min: 7 + level, max: 12 + (level * 2) }
    )
  }

  public attack(): number {
    const baseDamage = this.baseAttack
    const variation = Math.floor(Math.random() * 4) - 1
    return Math.max(1, baseDamage + variation)
  }

  public defense(): number {
    return this.baseDefense
  }

  public magic(): number {
    return this.baseMagic
  }

  public getRewards(): { experience: number; gold: number } {
    return {
      experience: this.experienceReward,
      gold: Math.floor(Math.random() * (this.goldReward.max - this.goldReward.min + 1)) + this.goldReward.min
    }
  }
}
