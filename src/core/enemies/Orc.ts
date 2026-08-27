import { Enemy } from './Enemy'
import orcSprite from '@/assets/sprites/enemies/orc.png'
import type { DefensePatternConfig } from '../defense/types'
import { ORC_ATTACKS } from '../abilities/EnemyAttacks'

export class Orc extends Enemy {
  public readonly sprite = orcSprite
  public attackPatterns: DefensePatternConfig[] = ORC_ATTACKS

  constructor(level: number = 1) {
    super(
      `orc-${Math.random().toString(36).substr(2, 9)}`,
      'Orc',
      level,
      80 + (level * 15),
      16 + (level * 1),
      25 + (level * 4),
      { min: 14 + (level * 2), max: 22 + (level * 3) }
    )
  }
}
