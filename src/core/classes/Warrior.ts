import { IClass } from '../interfaces/IClass'

export class Warrior implements IClass {
  public readonly name = 'Warrior'
  public readonly description = 'Un guerrero experto en combate cuerpo a cuerpo y defensa.'
  
  public readonly baseStats = {
    fuerza: 10,
    destreza: 5,
    inteligencia: 5,
    sabiduria: 10,
    constitucion: 14,
    carisma: 8
  }

  public readonly levelUpStats = {
    fuerza: 4,
    destreza: 1,
    inteligencia: 1,
    sabiduria: 1,
    constitucion: 3,
    carisma: 1
  }

  public readonly specialAbility = {
    name: 'Berserker Rage',
    description: 'Aumenta el ataque y la velocidad durante 3 turnos.',
    cooldown: 5
  }

  public readonly abilities = [
    {
      name: 'Atacar',
      description: 'Un ataque básico con daño completo.',
      type: 'attack',
      cooldown: 0
    },
    {
      name: 'Golpe Aturdidor',
      description: 'Inflige 80% de daño. Si aciertas en bonificado, aturde 2 turnos. Si aciertas en crítico, 50% de aturdir 3 turnos. Si fallas, aturde 1 turno.',
      type: 'stunStrike',
      cooldown: 3
    }
  ];
} 