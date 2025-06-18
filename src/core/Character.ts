import { ICharacter } from './interfaces/ICharacter'

export abstract class Character implements ICharacter {
  public readonly id: string
  public name: string
  public level: number
  public health: number
  public maxHealth: number
  public isAlive: boolean
  public readonly specialAbility = {
    name: 'Basic Ability',
    description: 'Basic character ability'
  }

  // Abstract methods that subclasses must implement
  abstract attack(): number
  abstract defense(): number
  abstract magic(): number

  constructor(
    id: string,
    name: string,
    level: number = 1,
    maxHealth: number = 100
  ) {
    this.id = id
    this.name = name
    this.level = level
    this.maxHealth = maxHealth
    this.health = maxHealth
    this.isAlive = true
  }

  protected die(): void {
    this.isAlive = false
    this.health = 0
  }

  protected checkHealth(): void {
    if (this.health <= 0) {
      this.die()
    }
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount)
    this.checkHealth()
  }

  public heal(amount: number): void {
    if (!this.isAlive) return
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  public getHealthPercentage(): number {
    return (this.health / this.maxHealth) * 100
  }
} 