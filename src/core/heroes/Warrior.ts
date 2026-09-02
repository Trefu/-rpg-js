import { Hero } from '../Hero'
import {
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
      heroClassId: 'warrior',
      maxHealth: 140,
      maxEnergy: 60,
      baseAttack: 8,
      agility:    { value: 11, growthPerLevel: 2 },
      constitution: { value: 14, growthPerLevel: 5 },
      mind:       { value: 8,  growthPerLevel: 0 },
      body:       { value: 16, growthPerLevel: 4 },
      sprite: warriorSprite
    })
  }

  static createStarter(): Warrior {
    const warrior = new Warrior(1)
    warrior.learnAbility(WarriorInjuringStrike)
    warrior.learnAbility(SecondWind)
    warrior.learnAbility(WarriorDevastatingStrike)
    return warrior
  }
}
