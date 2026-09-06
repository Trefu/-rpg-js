import type { Hero } from '../Hero'
import { Cleric } from './Cleric'
import { Warrior } from './Warrior'
import clericSprite from '@/assets/sprites/heroes/cleric.png'
import warriorSprite from '@/assets/sprites/heroes/warrior.png'

export interface RecruitableHero {
  id: string
  displayName: string
  description: string
  sprite: string
  factory: () => Hero
}

export const RECRUITABLE_HEROES: RecruitableHero[] = [
  {
    id: 'cleric',
    displayName: 'Elara',
    description: 'Cleriga devota. Sana aliados y purifica amenazas con luz radiante.',
    sprite: clericSprite,
    factory: () => Cleric.createStarter()
  },
  {
    id: 'warrior',
    displayName: 'Bjorn',
    description: 'Guerrero fornido. Aguanta el golpe y descarga golpes devastadores.',
    sprite: warriorSprite,
    factory: () => Warrior.createStarter()
  }
]
