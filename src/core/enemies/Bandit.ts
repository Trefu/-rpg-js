import { Enemy } from './Enemy'
import goblinSprite from '@/assets/sprites/enemies/bandit.png'
import type { DefensePatternConfig } from '../defense/types'
import { SLASH, POISON_ARROW } from '../abilities/EnemyAttacks'

export class Bandit extends Enemy {
  public readonly sprite = goblinSprite
  public attackPatterns: DefensePatternConfig[] = [SLASH, POISON_ARROW]

  constructor(level: number = 1) {
    super({
      id: `bandit-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Bandido',
      level,
      maxHealth: 55 + (level * 9),
      baseAttack: 14 + (level * 1),
      experienceReward: 18 + (level * 4),
      goldReward: { min: 18 + (level * 3), max: 28 + (level * 4) },
      critChance: 0.05,
      agility: 12
    })
  }
}
