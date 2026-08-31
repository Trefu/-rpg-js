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
      maxHealth: 100,
      maxEnergy: 80,
      defense: 10,
      speed: 12,
      baseAttack: 10,
      sprite: clericSprite
    })
  }

  static createStarter(): Cleric {
    const cleric = new Cleric(1)
    cleric.learnAbility(ClericRadiantStrike)
    cleric.learnAbility(ClericDivineSmite)
    cleric.learnAbility(ClericHeal)
    cleric.addItem('healing-flask')
    return cleric
  }
}