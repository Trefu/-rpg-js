import { Enemy } from './Enemy'
import { IEnemy } from '../interfaces/ICharacter'
import wolfSprite from '@/assets/sprites/enemies/wolf.png'
import type { DefensePatternConfig } from '../defense/types'

export class Wolf extends Enemy implements IEnemy {
  public readonly sprite = wolfSprite
  public defensePattern: DefensePatternConfig = {
    phaseCount: 3,
    waveSpeed: 16,
    barWidth: 20,
    baseSuccessZoneSize: 0.25,
    baseMaxBlockReduction: 0.5,
    phaseTimeoutMs: 5000
  }

  constructor(level: number = 1) {
    super(
      `wolf-${Date.now()}-${Math.random()}`,
      'Lobo',
      level,
      90 + (level * 15),  // Menos vida que orco, similar a goblin
      12 + (level * 2),   // Ataque medio
      6 + (level * 1),    // Poca defensa
      3 + (level * 1),    // Muy poca magia
      20 + (level * 4),   // Experiencia media
      { min: 5 + level, max: 10 + (level * 1.5) }  // Oro medio
    )
  }

  public attack(): number {
    const baseDamage = this.baseAttack
    const variation = Math.floor(Math.random() * 8) - 3 // -3 a +4 (más variación)
    return Math.max(1, baseDamage + variation)
  }

  public defense(): number {
    return this.baseDefense
  }

  public magic(): number {
    return this.baseMagic
  }

  public getRewards(): { experience: number; gold: number } {
    return {
      experience: this.experienceReward,
      gold: Math.floor(Math.random() * (this.goldReward.max - this.goldReward.min + 1)) + this.goldReward.min
    }
  }
}
