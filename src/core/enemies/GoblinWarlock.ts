import { Enemy } from './Enemy'
import goblinWarlockSprite from '@/assets/sprites/enemies/goblin-warlock.png'
import type { ICharacter, EnemyAction } from '../interfaces/ICharacter'
import { EMBER, WarlockHex } from '../abilities/EnemyAttacks'

export class GoblinWarlock extends Enemy {
  public readonly sprite = goblinWarlockSprite
  public attackPatterns: EnemyAction[] = [EMBER, WarlockHex]

  constructor(level: number = 1) {
    super({
      id: `goblin-warlock-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Goblin Warlock',
      level,
      maxHealth: 30 + (level * 9),
      experienceReward: 24 + (level * 5),
      goldReward: { min: 14 + (level * 2), max: 20 + (level * 3) },
      baseStats: {
        mind: { value: 22, growthPerLevel: 0.5 }
      },
      classMultipliers: { agility: 1.1 }
    })
  }

  public override selectAttackPattern(player: ICharacter | null): EnemyAction {
    const curseStacks = player?.statusEffects?.find(e => e.type === 'curse')?.stacks ?? 0
    if (curseStacks < 5 && Math.random() < 0.35) {
      return WarlockHex
    }
    return super.selectAttackPattern(player)
  }
}