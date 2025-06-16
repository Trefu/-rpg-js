import { IClass } from '../interfaces/IClass'

export class Wizard implements IClass {
  public readonly name = 'Wizard'
  public readonly description = 'Un poderoso hechicero que domina las artes arcanas.'
  
  public readonly baseStats = {
    health: 80,
    attack: 8,
    defense: 5,
    magic: 15
  }

  public readonly levelUpStats = {
    health: 10,
    attack: 3,
    defense: 2,
    magic: 7
  }

  public readonly specialAbility = {
    name: 'Arcane Burst',
    description: 'Libera una explosión de energía mágica que daña a todos los enemigos.',
    cooldown: 6
  }
} 