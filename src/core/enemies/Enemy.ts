import { Character } from '../Character'
import { ICombatant } from '../interfaces/ICharacter'

export abstract class Enemy extends Character implements ICombatant {
  protected baseAttack: number
  protected baseDefense: number
  public readonly experienceReward: number
  public readonly goldReward: number

  constructor(
    id: string,
    name: string,
    level: number,
    maxHealth: number,
    baseAttack: number,
    baseDefense: number,
    experienceReward: number,
    goldReward: number
  ) {
    super(id, name, level, maxHealth)
    this.baseAttack = baseAttack
    this.baseDefense = baseDefense
    this.experienceReward = experienceReward
    this.goldReward = goldReward
  }

  public attack(): number {
    if (!this.isAlive) return 0
    return this.baseAttack + (this.level * 1.5)
  }

  public getDefense(): number {
    return this.baseDefense + (this.level * 1)
  }

  public getRewards(): { experience: number; gold: number } {
    return {
      experience: this.experienceReward,
      gold: this.goldReward
    }
  }
} 