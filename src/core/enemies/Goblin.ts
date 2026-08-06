import { Enemy } from './Enemy'
import goblinSprite from '@/assets/sprites/enemies/goblin2.png'
import type { ICharacter } from '../interfaces/ICharacter'
import type { DefensePatternConfig } from '../defense/types'

export class Goblin extends Enemy {
  public delayMs = 1500 // Delay de ataque en milisegundos para el minijuego de combate
  public readonly sprite = goblinSprite
  public attackPatterns: DefensePatternConfig[] = [
    {
      name: 'Mordida',
      phaseCount: 2,
      baseMaxBlockReduction: 0.5,
      damageMultiplier: 1.0
    },
    {
      name: 'Mordida venenosa',
      phaseCount: 1,
      baseMaxBlockReduction: 0.5,
      damageMultiplier: 0.6,
      onFailureEffect: {
        statusType: 'poison',
        duration: 3,
        damagePerTurn: 4,
        stacks: 1
      }
    }
  ]

  constructor(level: number = 1) {
    super(
      `goblin-${Math.random().toString(36).substr(2, 9)}`,
      'Goblin',
      level,
      50 + (level * 10), // Vida base + bonus por nivel
      3 + (level * 1),   // Ataque base + bonus por nivel
      20 + (level * 5),  // Experiencia base + bonus por nivel
      { min: 10 + (level * 2), max: 15 + (level * 3) }  // Oro base + bonus por nivel
    )
  }

  // Sobrescribir el método de ataque para darle un comportamiento específico
  public attack(): number {
    const baseAttack = super.attack()
    // 20% de probabilidad de hacer un ataque crítico
    return Math.random() < 0.2 ? baseAttack * 1.5 : baseAttack
  }

  public selectAttackPattern(player: ICharacter | null): DefensePatternConfig {

    const [normalBite, poisonBite] = this.attackPatterns
    const fallback = normalBite ?? this.attackPatterns[0]
    if (!poisonBite) return fallback
    if (player?.hasStatusEffect?.('poison')) {
      return normalBite ?? fallback
    }
    return Math.random() < 0.35 ? poisonBite : (normalBite ?? fallback)
  }
}

