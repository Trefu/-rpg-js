import { Hero } from '../Hero'
import {
  ClericRadiantStrike,
  ClericHeal,
  ClericDivineSmite
} from '../abilities/Abilities'
import clericSprite from '@/assets/sprites/heroes/cleric.png'

export class Cleric extends Hero {
  constructor(level: number = 1) {
    super({
      id: `cleric-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Elara',
      level,
      heroClassId: 'cleric',
      maxHealth: 100,
      maxEnergy: 80,
      baseAttack: 6,
      agility:    { value: 10,  growthPerLevel: 1 },
      constitution: { value: 11, growthPerLevel: 2 },
      mind:       { value: 17, growthPerLevel: 7 },
      body:       { value: 10, growthPerLevel: 2 },
      sprite: clericSprite
    })
  }

  static createStarter(): Cleric {
    const cleric = new Cleric(1)
    cleric.learnAbility(ClericRadiantStrike)
    cleric.learnAbility(ClericDivineSmite)
    cleric.learnAbility(ClericHeal)
    return cleric
  }
}
