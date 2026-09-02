import { Enemy } from './Enemy'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'
import { SLASH, DEEP_SLASH } from '../abilities/EnemyAttacks'

export class Goblin extends Enemy {
  public readonly sprite = goblinSprite
  public attackPatterns: DefensePatternConfig[] = [SLASH, DEEP_SLASH]

  constructor(level: number = 1) {
    super({
      id: `goblin-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Goblin',
      level,
      maxHealth: 70 + (level * 10),
      experienceReward: 20 + (level * 5),
      goldReward: { min: 10 + (level * 2), max: 15 + (level * 3) },
      classMultipliers: { agility: 0.9 }
    })
  }

  public selectAttackPattern(_player: ICharacter | null): DefensePatternConfig {
    return this.attackPatterns[Math.floor(Math.random() * this.attackPatterns.length)]
  }
}
