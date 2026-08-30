import { Enemy } from './Enemy'
import orcSprite from '@/assets/sprites/enemies/orc.png'
import type { DefensePatternConfig } from '../defense/types'
import { HACHAZOS_MULTIPLES, GOLPE_APLASTANTE } from '../abilities/EnemyAttacks'

export class Orc extends Enemy {
  public readonly sprite = orcSprite
  public attackPatterns: DefensePatternConfig[] = [HACHAZOS_MULTIPLES, GOLPE_APLASTANTE]

  constructor(level: number = 1) {
    super({
      id: `orc-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Orc',
      level,
      maxHealth: 80 + (level * 15),
      baseAttack: 16 + (level * 1),
      experienceReward: 25 + (level * 4),
      goldReward: { min: 14 + (level * 2), max: 22 + (level * 3) },
      critChance: 0.08
    })
  }
}
