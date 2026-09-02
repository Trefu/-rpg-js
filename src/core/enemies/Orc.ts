import { Enemy } from './Enemy'
import orcSprite from '@/assets/sprites/enemies/orc.png'
import type { DefensePatternConfig } from '../defense/types'
import { MULTIPLE_AXE_STRIKES, CRUSHING_BLOW } from '../abilities/EnemyAttacks'

export class Orc extends Enemy {
  public readonly sprite = orcSprite
  public attackPatterns: DefensePatternConfig[] = [MULTIPLE_AXE_STRIKES, CRUSHING_BLOW]

  constructor(level: number = 1) {
    super({
      id: `orc-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Orc',
      level,
      maxHealth: 80 + (level * 15),
      experienceReward: 25 + (level * 4),
      goldReward: { min: 14 + (level * 2), max: 22 + (level * 3) },
      classMultipliers: { body: 1.2, agility: 0.6 }
    })
  }
}
