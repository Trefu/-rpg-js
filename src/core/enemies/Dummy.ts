import { Enemy } from './Enemy'
import { IEnemy } from '../interfaces/ICharacter'

export class Dummy extends Enemy implements IEnemy {
  constructor(level: number = 1) {
    super(
      `dummy-${Date.now()}-${Math.random()}`,
      'Dummy de Entrenamiento',
      level,
      1000, // Mucha vida
      0,    // No ataca
      0,    // No defiende
      0,    // No magia
      0,    // No experiencia
      0     // No oro
    )
  }

  public attack(): number {
    // El dummy no ataca
    return 0
  }

  public defense(): number {
    // El dummy no defiende
    return 0
  }

  public magic(): number {
    return 0
  }

  public getRewards(): { experience: number; gold: number } {
    // El dummy no da recompensas
    return {
      experience: 0,
      gold: 0
    }
  }

  public takeDamage(amount: number): void {
    // El dummy puede recibir daño pero no muere
    this.health = Math.max(1, this.health - amount)
    // Nunca muere, siempre mantiene al menos 1 de vida
    this.isAlive = true
  }
} 