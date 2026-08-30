import { Enemy } from './Enemy'
import banditCaptainSprite from '@/assets/sprites/enemies/bandit-captain.png'
import type { DefensePatternConfig } from '../defense/types'
import { CRUSHING_BLOW, SLASH } from '../abilities/EnemyAttacks'

export class BanditCaptain extends Enemy {
  public readonly sprite = banditCaptainSprite
  public attackPatterns: DefensePatternConfig[] = [CRUSHING_BLOW, SLASH]

  constructor(level: number = 1) {
    super({
      id: `bandit-captain-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Capitán Bandido',
      level,
      maxHealth: 75 + (level * 12),
      baseAttack: 16 + (level * 2),
      experienceReward: 30 + (level * 5),
      goldReward: { min: 25 + (level * 4), max: 40 + (level * 5) },
      critChance: 0.08
    })
  }
}
