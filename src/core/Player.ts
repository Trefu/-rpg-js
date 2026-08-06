import { Character } from './Character'
import { ICombatant, ILevelable, IInventory, IPlayerStats } from './interfaces/ICharacter'
import { IStatusEffect } from './interfaces/IStatusEffect'
import type { IAbility } from './interfaces/IAbility'

export class Player extends Character implements ICombatant, ILevelable, IInventory {
  public experience: number
  public experienceToNextLevel: number
  public gold: number
  public items: string[]
  public abilities: IAbility[]
  public statusEffects: IStatusEffect[] = []
  public speed: number
  public energy: number
  public maxEnergy: number
  public baseStats: IPlayerStats

  constructor(
    id: string,
    name: string,
    level: number = 1,
    maxHealth: number = 100,
    defense: number = 10,
    speed: number = 10
  ) {
    super(id, name, level, maxHealth)
    this.experience = 0
    this.experienceToNextLevel = 100
    this.gold = 0
    this.items = []
    this.abilities = []
    this.defenseValue = defense
    this.speed = speed
    this.maxEnergy = 50
    this.energy = 50
    this.baseStats = {
      fuerza: 10,
      destreza: 10,
      inteligencia: 10,
      sabiduria: 10,
      constitucion: 10,
      carisma: 10
    }
  }

  public defenseValue: number = 10

  public learnAbility(ability: IAbility): void {
    if (!this.abilities.find(a => a.type === ability.type)) {
      this.abilities.push(ability)
    }
  }

  public attack(): number {
    if (!this.isAlive) return 0
    return 10 + (this.level * 2)
  }

  public defense(): number {
    return this.defenseValue + (this.level * 1)
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
    this.defenseValue += 2
    this.speed += 1
    this.maxEnergy += 10
    this.energy = this.maxEnergy
    this.baseStats.fuerza += 2
    this.baseStats.destreza += 2
    this.baseStats.inteligencia += 2
    this.baseStats.sabiduria += 2
    this.baseStats.constitucion += 2
    this.baseStats.carisma += 1
  }

  public spendEnergy(amount: number): boolean {
    if (this.energy < amount) return false
    this.energy -= amount
    return true
  }

  public restoreEnergy(amount: number): void {
    this.energy = Math.min(this.maxEnergy, this.energy + amount)
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

  public addStatusEffect(effect: IStatusEffect) {
    const existing = this.statusEffects.find(e => e.type === effect.type)
    if (existing) {
      // Acumular stacks (si los aporta el efecto entrante) y refrescar duración al máximo entre ambos.
      const incomingStacks = effect.stacks ?? 1
      const maxStacks = existing.maxStacks ?? effect.maxStacks ?? 99
      existing.stacks = Math.min(maxStacks, (existing.stacks ?? 1) + incomingStacks)
      // Sumar daño por turno proporcional a los nuevos stacks (mantiene coherencia con el daño base del template).
      if (typeof effect.damagePerTurn === 'number') {
        const baseDmg = existing.damagePerTurn ?? effect.damagePerTurn
        existing.damagePerTurn = baseDmg + effect.damagePerTurn
      }
      existing.turns = Math.max(existing.turns, effect.turns)
      existing.maxDuration = existing.maxDuration ?? effect.maxDuration
    } else {
      const copy: IStatusEffect = { ...effect }
      copy.stacks = effect.stacks ?? 1
      copy.maxStacks = effect.maxStacks ?? 99
      copy.maxDuration = effect.maxDuration
      this.statusEffects.push(copy)
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