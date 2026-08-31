import { Hero } from '../Hero'
import {
  BasicAttack,
  WarriorInjuringStrike,
  SecondWind,
  WarriorDevastatingStrike
} from '../abilities/Abilities'
import warriorSprite from '@/assets/sprites/heroes/warrior.png'

export class Warrior extends Hero {
  constructor(level: number = 1) {
    super({
      id: `warrior-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Bjorn',
      level,
      maxHealth: 140,
      maxEnergy: 60,
      defense: 12,
      speed: 10,
      baseAttack: 16,
      sprite: warriorSprite
    })
  }

  static createStarter(): Warrior {
    const warrior = new Warrior(1)
    warrior.learnAbility(BasicAttack)
    warrior.learnAbility(WarriorInjuringStrike)
    warrior.learnAbility(SecondWind)
    warrior.learnAbility(WarriorDevastatingStrike)
    warrior.addItem('healing-flask')
    return warrior
  }
}