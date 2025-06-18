import { Character } from './Character'
import { ICombatant, ILevelable, IInventory, IPlayerStats } from './interfaces/ICharacter'

export class Player extends Character implements ICombatant, ILevelable, IInventory {
  public experience: number
  public experienceToNextLevel: number
  public gold: number
  public items: string[]
  public stats: IPlayerStats
  public readonly specialAbility = {
    name: 'Ataque Básico',
    description: 'Ataque normal del jugador'
  }
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
    this.stats = {
      fuerza: 10,
      destreza: 10,
      inteligencia: 10,
      sabiduria: 10,
      constitucion: 10,
      carisma: 10
    }
  }

  public setStatsFromClass(stats: IPlayerStats): void {
    this.stats = { ...stats }
    // Recalcular vida basada en constitución
    this.maxHealth = 50 + (this.stats.constitucion * 5)
    this.health = this.maxHealth
    // Recalcular ataque y defensa basados en fuerza y destreza
    this.baseAttack = Math.floor(this.stats.fuerza / 2) + Math.floor(this.stats.destreza / 4)
    this.baseDefense = Math.floor(this.stats.constitucion / 2) + Math.floor(this.stats.destreza / 4)
  }

  public attack(): number {
    if (!this.isAlive) return 0
    // Ataque base + bonus por nivel + bonus por fuerza
    return this.baseAttack + (this.level * 2) + Math.floor(this.stats.fuerza / 3)
  }

  public defense(): number {
    return this.baseDefense + (this.level * 1) + Math.floor(this.stats.constitucion / 3)
  }

  public magic(): number {
    return Math.floor(this.stats.inteligencia / 2) + Math.floor(this.stats.sabiduria / 2)
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
      Defensa: ${this.defense()}
      Magia: ${this.magic()}
      Fuerza: ${this.stats.fuerza}
      Destreza: ${this.stats.destreza}
      Inteligencia: ${this.stats.inteligencia}
      Sabiduría: ${this.stats.sabiduria}
      Constitución: ${this.stats.constitucion}
      Carisma: ${this.stats.carisma}
      Experiencia: ${this.experience}/${this.experienceToNextLevel}
      Oro: ${this.gold}
    `
  }
} 