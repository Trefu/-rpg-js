import { Enemy } from './Enemy'
import banditArcherSprite from '@/assets/sprites/enemies/bandit-archer.png'
import type { DefensePatternConfig } from '../defense/types'
import { POISON_ARROW } from '../abilities/EnemyAttacks'

export class BanditArcher extends Enemy {
  public readonly sprite = banditArcherSprite
  public attackPatterns: DefensePatternConfig[] = [POISON_ARROW]

  constructor(level: number = 1) {
    super({
      id: `bandit-archer-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Bandido Arquero',
      level,
      maxHealth: 45 + (level * 7),
      experienceReward: 20 + (level * 4),
      goldReward: { min: 16 + (level * 3), max: 26 + (level * 4) },
      classMultipliers: { agility: 1.2, mind: 1.1 }
    })
  }
}
