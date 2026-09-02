import { Enemy } from './Enemy'
import banditRogueSprite from '@/assets/sprites/enemies/bandit-rogue.png'
import type { DefensePatternConfig } from '../defense/types'
import { QUICK_STRIKE, DOUBLE_COMBO } from '../abilities/EnemyAttacks'

export class BanditRogue extends Enemy {
  public readonly sprite = banditRogueSprite
  public attackPatterns: DefensePatternConfig[] = [QUICK_STRIKE, DOUBLE_COMBO]

  constructor(level: number = 1) {
    super({
      id: `bandit-rogue-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Bandido Pícaro',
      level,
      maxHealth: 50 + (level * 8),
      baseAttack: 15 + (level * 1),
      experienceReward: 22 + (level * 4),
      goldReward: { min: 20 + (level * 3), max: 30 + (level * 4) },
      critChance: 10
    })
  }
}
