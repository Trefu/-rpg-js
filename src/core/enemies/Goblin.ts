import { Enemy } from './Enemy'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'
import { GOBLIN_ATTACKS, GOBLIN_MORDIDA, GOBLIN_MORDIDA_VENENOSA } from '../abilities/EnemyAttacks'

export class Goblin extends Enemy {
  public readonly sprite = goblinSprite
  public attackPatterns: DefensePatternConfig[] = GOBLIN_ATTACKS

  constructor(level: number = 1) {
    super(
      `goblin-${Math.random().toString(36).substr(2, 9)}`,
      'Goblin',
      level,
      50 + (level * 10),
      12 + (level * 1),
      20 + (level * 5),
      { min: 10 + (level * 2), max: 15 + (level * 3) }
    )
  }

  public attack(): number {
    const baseAttack = super.attack()
    return Math.random() < 0.2 ? baseAttack * 1.5 : baseAttack
  }

  public selectAttackPattern(player: ICharacter | null): DefensePatternConfig {
    if (player?.hasStatusEffect?.('poison')) {
      return GOBLIN_MORDIDA
    }
    return Math.random() < 0.35 ? GOBLIN_MORDIDA_VENENOSA : GOBLIN_MORDIDA
  }
}
