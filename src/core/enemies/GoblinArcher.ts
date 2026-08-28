import { Enemy } from './Enemy'
import goblinArcherSprite from '@/assets/sprites/enemies/goblin-archer.png'
import type { DefensePatternConfig } from '../defense/types'
import { GOBLIN_FLECHA_VENENOSA } from '../abilities/EnemyAttacks'

export class GoblinArcher extends Enemy {
  public readonly sprite = goblinArcherSprite
  public attackPatterns: DefensePatternConfig[] = [GOBLIN_FLECHA_VENENOSA]

  constructor(level: number = 1) {
    super(
      `goblin-archer-${Math.random().toString(36).substr(2, 9)}`,
      'Goblin Arquero',
      level,
      40 + (level * 8),
      10 + (level * 2),
      22 + (level * 5),
      { min: 12 + (level * 2), max: 18 + (level * 3) }
    )
  }
}
