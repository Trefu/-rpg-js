import { Enemy } from './Enemy'
import { IEnemy } from '../interfaces/ICharacter'
import orcSprite from '@/assets/sprites/enemies/orc.png'

export class Orc extends Enemy implements IEnemy {
  public readonly sprite = orcSprite

  constructor(level: number = 1) {
    super(
      `orc-${Date.now()}-${Math.random()}`,
      'Orco',
      level,
      120 + (level * 20), 
      15 + (level * 3),   
      8 + (level * 2),    
      5 + (level * 1),    
      25 + (level * 5),  
      { min: 8 + level, max: 15 + (level * 2) }  
    )
  }

  public attack(): number {
    const baseDamage = this.baseAttack
    const variation = Math.floor(Math.random() * 6) - 2 // -2 a +3
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