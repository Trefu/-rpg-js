import { IClass } from '../interfaces/IClass'

export class Rogue implements IClass {
  public readonly name = 'Rogue'
  public readonly description = 'Un maestro del sigilo y los ataques precisos.'
  
  public readonly baseStats = {
    health: 90,
    attack: 12,
    defense: 7,
    magic: 8
  }

  public readonly levelUpStats = {
    health: 15,
    attack: 5,
    defense: 3,
    magic: 3
  }

  public readonly specialAbility = {
    name: 'Shadow Step',
    description: 'Te permite moverte a la posición de un enemigo y realizar un ataque crítico.',
    cooldown: 4
  }
} 