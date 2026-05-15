import { Character } from './Character'
import { ICombatant, ILevelable, IInventory, IPlayerStats } from './interfaces/ICharacter'
import { IStatusEffect } from './interfaces/IStatusEffect'
import type { IAbility } from './interfaces/IAbility'

export interface TimingContext {
  action?: string
}

export class Player extends Character implements ICombatant, ILevelable, IInventory {
  public experience: number
  public experienceToNextLevel: number
  public gold: number
  public items: string[]
  public stats: IPlayerStats
  public abilities: IAbility[]
  private baseAttack: number
  private baseDefense: number
  public statusEffects: IStatusEffect[] = []

  constructor(
    id: string,
    name: string,
    level: number = 1,
    maxHealth: number = 100,
    baseAttack: number = 100,
    baseDefense: number = 5
  ) {
    super(id, name, level, maxHealth)
    this.experience = 0
    this.experienceToNextLevel = 100
    this.gold = 0
    this.items = []
    this.abilities = []
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

  public learnAbility(ability: IAbility): void {
    if (!this.abilities.find(a => a.type === ability.type)) {
      this.abilities.push(ability)
    }
  }

  public attack(): number {
    if (!this.isAlive) return 0
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
      Sabiduria: ${this.stats.sabiduria}
      Constitucion: ${this.stats.constitucion}
      Carisma: ${this.stats.carisma}
      Experiencia: ${this.experience}/${this.experienceToNextLevel}
      Oro: ${this.gold}
    `
  }

  public getPointerSpeed(_context?: TimingContext): number {
    const minSpeed = 300
    const maxSpeed = 800
    const dex = Math.max(5, Math.min(100, this.stats.destreza))
    return maxSpeed - (Math.log10(dex - 4) / Math.log10(96)) * (maxSpeed - minSpeed)
  }

  public getTimingAreas(_context?: TimingContext): { startAngle: number; endAngle: number; type: 'normal' | 'bonificado' | 'critico'; color: string }[] {
    const bonus1 = { startAngle: 220, endAngle: 232, type: 'bonificado' as const, color: '#a00' }
    const crit = { startAngle: 232, endAngle: 237, type: 'critico' as const, color: '#ffe600' }
    const bonus2 = { startAngle: 237, endAngle: 249, type: 'bonificado' as const, color: '#a00' }
    return [bonus1, crit, bonus2]
  }

  public addStatusEffect(effect: IStatusEffect) {
    const existing = this.statusEffects.find(e => e.type === effect.type)
    if (existing) {
      existing.turns = effect.turns
    } else {
      this.statusEffects.push({ ...effect })
    }
  }

  public hasStatusEffect(type: string): boolean {
    return this.statusEffects.some(e => e.type === type && e.turns > 0)
  }

  public reduceStatusEffects() {
    this.statusEffects.forEach(e => e.turns--)
    this.removeExpiredStatusEffects()
  }

  public removeExpiredStatusEffects() {
    this.statusEffects = this.statusEffects.filter(e => e.turns > 0)
  }

  public isStunned(): boolean {
    return this.hasStatusEffect('stun')
  }
} 