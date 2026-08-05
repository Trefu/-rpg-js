import { Enemy } from './Enemy'
import { IEnemy } from '../interfaces/ICharacter'
import orcSprite from '@/assets/sprites/enemies/orc.png'
import type { DefensePatternConfig } from '../defense/types'

export class Orc extends Enemy implements IEnemy {
  public readonly sprite = orcSprite
  public attackPatterns: DefensePatternConfig[] = [
    {
      name: 'Hachazos múltiples',
      phaseCount: 4,
      baseMaxBlockReduction: 0.5
    },
    {
      name: 'Golpe aplastante',
      phaseCount: 2,
      baseMaxBlockReduction: 0.5
    }
  ]

  constructor(level: number = 1) {
    super(
      `orc-${Date.now()}-${Math.random()}`,
      'Orco',
      level,
      120 + (level * 20),
      15 + (level * 3),
      25 + (level * 5),
      { min: 8 + level, max: 15 + (level * 2) }
    )
  }

  public attack(): number {
    const baseDamage = this.baseAttack
    const variation = Math.floor(Math.random() * 6) - 2 // -2 a +3
    return Math.max(1, baseDamage + variation)
  }

  public getRewards(): { experience: number; gold: number } {
    return {
      experience: this.experienceReward,
      gold: Math.floor(Math.random() * (this.goldReward.max - this.goldReward.min + 1)) + this.goldReward.min
    }
  }
}
