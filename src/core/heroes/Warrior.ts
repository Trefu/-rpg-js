import { Hero } from '../Hero'
import warriorSprite from '@/assets/sprites/heroes/warrior.png'

export class Warrior extends Hero {
  constructor(level: number = 1) {
    super(
      `warrior-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      'Warrior',
      level,
      120,
      12,
      10,
      14,
      warriorSprite
    )
  }
}
