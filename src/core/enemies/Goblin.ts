import { Enemy } from './Enemy'

export class Goblin extends Enemy {
  public delayMs = 1500 // Delay de ataque en milisegundos para el minijuego de combate

  constructor(level: number = 1) {
    super(
      `goblin-${Math.random().toString(36).substr(2, 9)}`,
      'Goblin',
      level,
      50 + (level * 10), // Vida base + bonus por nivel
      8 + (level * 1),   // Ataque base + bonus por nivel
      3 + (level * 1),   // Defensa base + bonus por nivel
      2 + (level * 0.5), // Magia base + bonus por nivel
      20 + (level * 5),  // Experiencia base + bonus por nivel
      10 + (level * 2)   // Oro base + bonus por nivel
    )
  }

  // Sobrescribir el método de ataque para darle un comportamiento específico
  public attack(): number {
    const baseAttack = super.attack()
    // 20% de probabilidad de hacer un ataque crítico
    return Math.random() < 0.2 ? baseAttack * 1.5 : baseAttack
  }
} 