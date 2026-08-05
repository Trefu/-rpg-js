import { Goblin } from './Goblin'
import { ICharacter, IEnemy } from '../interfaces/ICharacter'
import goblin2Sprite from '@/assets/sprites/enemies/goblin2.png'
import type { DefensePatternConfig } from '../defense/types'

export class GoblinVenomous extends Goblin implements IEnemy {
  public readonly sprite = goblin2Sprite

  constructor(level: number = 1) {
    super(level)
    this.name = 'Goblin Venenoso'
  }

  public override selectAttackPattern(_player: ICharacter | null): DefensePatternConfig {
    const poisonBite = this.attackPatterns[1]
    const fallback = this.attackPatterns[0]
    return poisonBite ?? fallback!
  }
}
