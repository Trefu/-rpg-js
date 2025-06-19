import { IClass } from '../interfaces/IClass'

export class Warrior implements IClass {
  public readonly name = 'Warrior'
  public readonly description = 'Un guerrero experto en combate cuerpo a cuerpo y defensa.'
  
  public readonly baseStats = {
    fuerza: 16,
    destreza: 5,
    inteligencia: 8,
    sabiduria: 10,
    constitucion: 14,
    carisma: 10
  }

  public readonly levelUpStats = {
    fuerza: 2,
    destreza: 1,
    inteligencia: 0,
    sabiduria: 1,
    constitucion: 2,
    carisma: 0
  }

  public readonly specialAbility = {
    name: 'Berserker Rage',
    description: 'Aumenta el ataque y la velocidad durante 3 turnos.',
    cooldown: 5
  }
} 