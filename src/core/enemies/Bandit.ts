import { Enemy } from './Enemy'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import type { DefensePatternConfig } from '../defense/types'
import { GOBLIN_ESPADAZO, GOBLIN_FLECHA_VENENOSA } from '../abilities/EnemyAttacks'

export class Bandit extends Enemy {
  public readonly sprite = goblinSprite
  public attackPatterns: DefensePatternConfig[] = [GOBLIN_ESPADAZO, GOBLIN_FLECHA_VENENOSA]

  constructor(level: number = 1) {
    super(
      `bandit-${Math.random().toString(36).substr(2, 9)}`,
      'Bandido',
      level,
      55 + (level * 9),
      14 + (level * 1),
      18 + (level * 4),
      { min: 18 + (level * 3), max: 28 + (level * 4) }
    )
  }
}
