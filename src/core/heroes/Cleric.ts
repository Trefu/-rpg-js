import { Hero } from '../Hero'
import {
  createClericBasicAttackAbility,
  createClericHealAbility,
  createClericSmiteAbility
} from '../abilities/Abilities'
import clericSprite from '@/assets/sprites/heroes/cleric.png'

export class Cleric extends Hero {
  constructor(level: number = 1) {
    super(
      `cleric-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      'Elara',
      level,
      100,
      10,
      12,
      10,
      clericSprite
    )
  }

  static createStarter(): Cleric {
    const cleric = new Cleric(1)
    cleric.learnAbility(createClericBasicAttackAbility())
    cleric.learnAbility(createClericSmiteAbility())
    cleric.learnAbility(createClericHealAbility())
    cleric.addItem('healing-flask')
    return cleric
  }
}
