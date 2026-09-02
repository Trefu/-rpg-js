import { Enemy } from './Enemy'
import orcArcherSprite from '@/assets/sprites/enemies/orc-archer.png'
import type { DefensePatternConfig } from '../defense/types'
import { POISON_ARROW } from '../abilities/EnemyAttacks'

export class OrcArcher extends Enemy {
  public readonly sprite = orcArcherSprite
  public attackPatterns: DefensePatternConfig[] = [POISON_ARROW]

  constructor(level: number = 1) {
    super({
      id: `orc-archer-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Orco Arquero',
      level,
      maxHealth: 65 + (level * 10),
      baseAttack: 14 + (level * 2),
      experienceReward: 28 + (level * 5),
      goldReward: { min: 16 + (level * 3), max: 26 + (level * 4) },
      critChance: 7
    })
  }
}
