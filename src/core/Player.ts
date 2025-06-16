import { Character } from './Character'
import { ICombatant, ILevelable, IInventory } from './interfaces/ICharacter'

export class Player extends Character implements ICombatant, ILevelable, IInventory {
  public experience: number
  public experienceToNextLevel: number
  public gold: number
  public items: string[]
  private baseAttack: number
  private baseDefense: number

  constructor(
    id: string,
    name: string,
    level: number = 1,
    maxHealth: number = 100,
    baseAttack: number = 10,
    baseDefense: number = 5
  ) {
    super(id, name, level, maxHealth)
    this.experience = 0
    this.experienceToNextLevel = 100
    this.gold = 0
    this.items = []
    this.baseAttack = baseAttack
    this.baseDefense = baseDefense
  }

  public attack(): number {
    if (!this.isAlive) return 0
    // Ataque base + bonus por nivel
    return this.baseAttack + (this.level * 2)
  }

  public gainExperience(amount: number): void {
    this.experience += amount
    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp()
    }
  }

  public levelUp(): void {
    this.level++
    this.experience -= this.experienceToNextLevel
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5)
    
    // Mejoras al subir de nivel
    this.maxHealth += 20
    this.health = this.maxHealth
    this.baseAttack += 5
    this.baseDefense += 3
  }

  public addItem(item: string): void {
    this.items.push(item)
  }

  public removeItem(item: string): void {
    const index = this.items.indexOf(item)
    if (index > -1) {
      this.items.splice(index, 1)
    }
  }

  public addGold(amount: number): void {
    this.gold += amount
  }

  public spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount
      return true
    }
    return false
  }

  public getStats(): string {
    return `
      Nivel: ${this.level}
      Vida: ${this.health}/${this.maxHealth}
      Ataque: ${this.attack()}
      Defensa: ${this.baseDefense}
      Experiencia: ${this.experience}/${this.experienceToNextLevel}
      Oro: ${this.gold}
    `
  }
} 