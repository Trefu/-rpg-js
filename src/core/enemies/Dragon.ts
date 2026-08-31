import { Enemy } from './Enemy'
import dragonSprite from '@/assets/sprites/enemies/dragon.png'
import type { DefensePatternConfig } from '../defense/types'
import { FIRE_BREATH, DEEP_SLASH, TRIPLE_COMBO } from '../abilities/EnemyAttacks'

export class Dragon extends Enemy {
  public readonly sprite = dragonSprite
  public attackPatterns: DefensePatternConfig[] = [FIRE_BREATH, DEEP_SLASH, TRIPLE_COMBO]

  constructor(level: number = 8) {
    super({
      id: `dragon-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Dragón Ancestral',
      level,
      maxHealth: 260 + (level * 22),
      baseAttack: 22 + (level * 2),
      experienceReward: 100 + (level * 12),
      goldReward: { min: 60 + (level * 6), max: 110 + (level * 7) },
      critChance: 0.10,
      agility: 8
    })
  }
}
