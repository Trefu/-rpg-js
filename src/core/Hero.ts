import { Character } from './Character'
import type { IAbility } from './interfaces/IAbility'
import type { IStatusEffect } from './interfaces/IStatusEffect'
import type { ICombatant, IInventory, ILevelable, IPlayerStats } from './interfaces/ICharacter'
import { BasicAttack } from './abilities/Abilities'
import { DOT_STATUS_TYPES } from './StatusEffects'

export class Hero extends Character implements ICombatant, ILevelable, IInventory {
  public experience: number
  public experienceToNextLevel: number
  public gold: number
  public items: string[]
  public abilities: IAbility[]
  public statusEffects: IStatusEffect[] = []
  public speed: number
  public energy: number
  public maxEnergy: number
  public defenseValue: number
  public baseStats: IPlayerStats
  public baseAttack: number
  public critChance: number
  public critDamageMultiplier: number
  public sprite: string
  /**
   * Regen pasiva de energia al final del turno del jugador.
   * Por defecto 0; clases, perks o equipo pueden modificarlo.
   */
  public passiveEnergyRegen: number = 0

  constructor(
    id: string,
    name: string,
    level: number = 1,
    maxHealth: number = 100,
    defense: number = 10,
    speed: number = 10,
    baseAttack: number = 10,
    sprite: string = ''
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
    this.baseAttack = baseAttack
    this.critChance = 0.05
    this.critDamageMultiplier = 2.0
    this.sprite = sprite
    this.baseStats = {
      fuerza: 10,
      destreza: 10,
      inteligencia: 10,
      sabiduria: 10,
      constitucion: 10,
      carisma: 10
    }

    this.learnAbility(BasicAttack)
  }

  public learnAbility(ability: IAbility): void {
    if (!this.abilities.find(a => a.type === ability.type)) {
      this.abilities.push(ability)
    }
  }

  public attack(): number {
    if (!this.isAlive) return 0
    return this.baseAttack + (this.level * 2)
  }

  public defense(): number {
    return this.defenseValue + (this.level * 1)
  }

  /**
   * Tirada probabilistica de critico del heroe.
   * `critChance` esta en [0, 1] (default 0.05 = 5%).
   */
  public rollCrit(): boolean {
    if (!this.isAlive) return false
    return Math.random() < this.critChance
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

  public restoreEnergy(amount: number): number {
    const before = this.energy
    this.energy = Math.min(this.maxEnergy, this.energy + amount)
    return this.energy - before
  }

  /**
   * Cuanta energia recupera este heroe al final de su turno.
   * Default: usa `passiveEnergyRegen`. Subclases o perks pueden override
   * para condiciones dinamicas (e.g. "regenera segun HP perdido").
   */
  public getTurnEndEnergyRegen(): number {
    return this.passiveEnergyRegen
  }

  public addGold(amount: number): void {
    this.gold += amount
  }

  public spendGold(amount: number): boolean {
    if (this.gold < amount) return false
    this.gold -= amount
    return true
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

  public addStatusEffect(effect: IStatusEffect) {
    const existing = this.statusEffects.find(e => e.type === effect.type)
    const isDot = DOT_STATUS_TYPES.has(effect.type)
    if (existing) {
      if (isDot) {
        const incomingStacks = effect.stacks ?? 1
        const maxStacks = existing.maxStacks ?? effect.maxStacks ?? 99
        existing.stacks = Math.min(maxStacks, (existing.stacks ?? 1) + incomingStacks)
      } else {
        const maxDuration = effect.maxDuration ?? effect.turns
        existing.maxDuration = maxDuration
        existing.turns = maxDuration
      }
    } else {
      const copy: IStatusEffect = { ...effect }
      if (isDot) {
        copy.stacks = effect.stacks ?? 1
        copy.maxStacks = effect.maxStacks ?? 99
      }
      copy.maxDuration = effect.maxDuration ?? effect.turns
      this.statusEffects.push(copy)
    }
  }

  public hasStatusEffect(type: string): boolean {
    return this.statusEffects.some(e => e.type === type && e.turns > 0)
  }

  public reduceStatusEffects() {
    // Los efectos basados en cargas (charges) se gobiernan por su propio
    // mecanismo de consumo (processPlayerOnBlockHooks), nunca por turnos.
    this.statusEffects.forEach(e => {
      if (typeof e.charges === 'number') return
      e.turns--
    })
    this.removeExpiredStatusEffects()
  }

  public removeExpiredStatusEffects() {
    this.statusEffects = this.statusEffects.filter(e => e.turns > 0)
  }

  public isStunned(): boolean {
    return this.hasStatusEffect('stun')
  }
}
