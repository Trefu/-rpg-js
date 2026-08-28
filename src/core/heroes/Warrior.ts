import { Hero } from '../Hero'
import { createWarriorAttackAbility, createSecondWindAbility } from '../abilities/Abilities'
import warriorSprite from '@/assets/sprites/heroes/warrior.png'

export class Warrior extends Hero {
  constructor(level: number = 1) {
    super(
      `warrior-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      'Bjorn',
      level,
      120,
      12,
      10,
      14,
      warriorSprite
    )
  }

  static createStarter(): Warrior {
    const warrior = new Warrior(1)
    warrior.learnAbility(createWarriorAttackAbility())
    warrior.learnAbility(createSecondWindAbility())
    return warrior
  }
}