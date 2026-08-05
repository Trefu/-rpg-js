import { Goblin } from './Goblin'
import { IEnemy } from '../interfaces/ICharacter'
import goblin2Sprite from '@/assets/sprites/enemies/goblin2.png'
import type { DefensePatternConfig } from '../defense/types'

export class GoblinVenomous extends Goblin implements IEnemy {
  public readonly sprite = goblin2Sprite
  public defensePattern: DefensePatternConfig = {
    phaseCount: 1,
    waveSpeed: 5,
    barWidth: 20,
    baseSuccessZoneSize: 0.20,
    baseMaxBlockReduction: 0.5,
    phaseTimeoutMs: 5000,
    onFailureEffect: {
      statusType: 'poison',
      duration: 4,
      damagePerTurn: 3
    }
  }

  constructor(level: number = 1) {
    super(level)
    this.name = 'Goblin Venenoso'
  }
}
