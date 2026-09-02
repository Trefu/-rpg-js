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
      maxHealth: 110 + (level * 18),
      experienceReward: 45 + (level * 8),
      goldReward: { min: 35 + (level * 5), max: 55 + (level * 7) },
      classMultipliers: { body: 1.2, constitution: 1.3, agility: 0.7 }
    })
  }
}
