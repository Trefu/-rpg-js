import { Enemy } from './Enemy'
import { IEnemy } from '../interfaces/ICharacter'
import wolfSprite from '@/assets/sprites/enemies/wolf.png'
import type { DefensePatternConfig } from '../defense/types'

export class Wolf extends Enemy implements IEnemy {
  public readonly sprite = wolfSprite
  public attackPatterns: DefensePatternConfig[] = [
    {
      name: 'Mordida feroz',
      phaseCount: 5,
      waveSpeed: 40,
      baseMaxBlockReduction: 0.5
    },
    {
      name: 'Zarpazos rápidos',
      phaseCount: 3,
      waveSpeed: 40,
      baseMaxBlockReduction: 0.5
    }
  ]

  constructor(level: number = 1) {
    super(
      `wolf-${Date.now()}-${Math.random()}`,
      'Lobo',
      level,
      90 + (level * 15),  // Menos vida que orco, similar a goblin
      12 + (level * 2),   // Ataque medio
      20 + (level * 4),   // Experiencia media
      { min: 5 + level, max: 10 + (level * 1.5) }  // Oro medio
    )
  }

  public attack(): number {
    const baseDamage = this.baseAttack
    const variation = Math.floor(Math.random() * 8) - 3 // -3 a +4 (más variación)
    return Math.max(1, baseDamage + variation)
  }

  public getRewards(): { experience: number; gold: number } {
    return {
      experience: this.experienceReward,
      gold: Math.floor(Math.random() * (this.goldReward.max - this.goldReward.min + 1)) + this.goldReward.min
    }
  }
}
