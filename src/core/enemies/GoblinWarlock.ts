import { Enemy } from './Enemy'
import goblinWarlockSprite from '@/assets/sprites/enemies/goblin-warlock.png'
import type { DefensePatternConfig } from '../defense/types'
import { EMBER } from '../abilities/EnemyAttacks'

export class GoblinWarlock extends Enemy {
  public readonly sprite = goblinWarlockSprite
  public attackPatterns: DefensePatternConfig[] = [EMBER]

  constructor(level: number = 1) {
    super({
      id: `goblin-warlock-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Goblin Warlock',
      level,
      maxHealth: 30 + (level * 9),
      experienceReward: 24 + (level * 5),
      goldReward: { min: 14 + (level * 2), max: 20 + (level * 3) },
      // `mind` se setea en baseStats (no via classMultipliers) porque el default
      // es 10 y el multiplier 1.4 -> 14 daba un statBonus magico demasiado bajo:
      // con EMBER (damageMultiplier 0.7) resultaba en finalDamage 0-1 y,
      // bloqueado, siempre 0. Alineamos con el body baseline fisico (22).
      baseStats: {
        mind: { value: 22, growthPerLevel: 0.5 }
      },
      classMultipliers: { agility: 1.1 }
    })
  }
}
