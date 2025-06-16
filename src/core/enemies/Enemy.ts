import { Character } from '../Character'
import { ICombatant } from '../interfaces/ICharacter'

export abstract class Enemy extends Character implements ICombatant {
  protected baseAttack: number
  protected baseDefense: number
  protected baseMagic: number
  public readonly experienceReward: number
  public readonly goldReward: number
  public readonly specialAbility = {
    name: 'Ataque Básico',
    description: 'Ataque normal del enemigo'
  }

  constructor(
    id: string,
    name: string,
    level: number,
    maxHealth: number,
    baseAttack: number,
    baseDefense: number,
    baseMagic: number,
    experienceReward: number,
    goldReward: number
  ) {
    super(id, name, level, maxHealth)
    this.baseAttack = baseAttack
    this.baseDefense = baseDefense
    this.baseMagic = baseMagic
    this.experienceReward = experienceReward
    this.goldReward = goldReward
  }

  public attack(): number {
    if (!this.isAlive) return 0
    return this.baseAttack + (this.level * 1.5)
  }

  public defense(): number {
    return this.baseDefense + (this.level * 1)
  }

  public magic(): number {
    return this.baseMagic + (this.level * 1.2)
  }

  public getRewards(): { experience: number; gold: number } {
    return {
      experience: this.experienceReward,
      gold: this.goldReward
    }
  }
} 