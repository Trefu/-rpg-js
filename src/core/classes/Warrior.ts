import { IClass } from '../interfaces/IClass'

export class Warrior implements IClass {
  public readonly name = 'Warrior'
  public readonly description = 'Un guerrero experto en combate cuerpo a cuerpo y defensa.'
  
  public readonly baseStats = {
    health: 120,
    attack: 15,
    defense: 10,
    magic: 5
  }

  public readonly levelUpStats = {
    health: 25,
    attack: 6,
    defense: 4,
    magic: 2
  }

  public readonly specialAbility = {
    name: 'Berserker Rage',
    description: 'Aumenta el ataque y la velocidad durante 3 turnos.',
    cooldown: 5
  }
} 