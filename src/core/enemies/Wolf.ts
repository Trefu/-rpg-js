import { Enemy } from './Enemy'
import wolfSprite from '@/assets/sprites/enemies/wolf.png'
import type { DefensePatternConfig } from '../defense/types'
import { WOLF_MORDIDA_FEROZ, WOLF_ZARPAZOS_RAPIDOS } from '../abilities/EnemyAttacks'

export class Wolf extends Enemy {
  public readonly sprite = wolfSprite
  public attackPatterns: DefensePatternConfig[] = [WOLF_MORDIDA_FEROZ, WOLF_ZARPAZOS_RAPIDOS]

  constructor(level: number = 1) {
    super(
      `wolf-${Math.random().toString(36).substr(2, 9)}`,
      'Lobo',
      level,
      45 + (level * 8),
      13 + (level * 1),
      15 + (level * 4),
      { min: 8 + (level * 2), max: 14 + (level * 3) }
    )
  }
}
