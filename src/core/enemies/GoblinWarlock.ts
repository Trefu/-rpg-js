import { Enemy } from './Enemy'
import goblinWarlockSprite from '@/assets/sprites/enemies/goblin-warlock.png'
import type { DefensePatternConfig } from '../defense/types'
import { GOBLIN_ASCUA } from '../abilities/EnemyAttacks'

export class GoblinWarlock extends Enemy {
  public readonly sprite = goblinWarlockSprite
  public attackPatterns: DefensePatternConfig[] = [GOBLIN_ASCUA]

  constructor(level: number = 1) {
    super(
      `goblin-warlock-${Math.random().toString(36).substr(2, 9)}`,
      'Goblin Warlock',
      level,
      45 + (level * 9),
      11 + (level * 1),
      24 + (level * 5),
      { min: 14 + (level * 2), max: 20 + (level * 3) }
    )
  }
}
