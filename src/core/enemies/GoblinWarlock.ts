import { Enemy } from './Enemy'
import goblinWarlockSprite from '@/assets/sprites/enemies/goblin-warlock.png'
import type { DefensePatternConfig } from '../defense/types'
import { ASCUA } from '../abilities/EnemyAttacks'

export class GoblinWarlock extends Enemy {
  public readonly sprite = goblinWarlockSprite
  public attackPatterns: DefensePatternConfig[] = [ASCUA]

  constructor(level: number = 1) {
    super({
      id: `goblin-warlock-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Goblin Warlock',
      level,
      maxHealth: 60 + (level * 9),
      baseAttack: 11 + (level * 1),
      experienceReward: 24 + (level * 5),
      goldReward: { min: 14 + (level * 2), max: 20 + (level * 3) },
      critChance: 0.05
    })
  }
}
