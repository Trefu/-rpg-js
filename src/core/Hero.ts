import { Character } from './Character'
import type { IAbility } from './interfaces/IAbility'
import type { IStatusEffect } from './interfaces/IStatusEffect'
import type { ICombatant, IInventory, ILevelable, IPlayerStats, IStat } from './interfaces/ICharacter'
import { BasicAttack } from './abilities/Abilities'
import { DOT_STATUS_TYPES } from './StatusEffects'

/**
 * Descripciones por defecto de cada stat. Viven en Hero porque son
 * informacion del dominio (no de la subclase): cualquier clase que tenga
 * `mind` lo describe igual. Las subclases solo pasan `value` y
 * `growthPerLevel`; el constructor completa la `description`.
 */
const STAT_DESCRIPTIONS: Record<keyof IPlayerStats, string> = {
  agility: 'Determina cuándo actúa el héroe en combate.',
  constitution: 'Resistencia física y vitalidad.',
  mind: 'Poder mágico y hechizos.',
  body: 'Fuerza bruta y capacidad física.'
}

/**
 * Toda stat crece al menos `STAT_BASE_GROWTH` por nivel. El
 * `growthPerLevel` de la stat es un modificador extra sobre esa base
 * (0 = crecimiento estándar, 1 = un punto más rápido, etc.).
 */
const STAT_BASE_GROWTH = 1

/** Input de stat que pasan las subclases (sin description, lo completa Hero). */
export type IStatInput = Omit<IStat, 'description'>

export interface HeroOptions {
  id: string
  name: string
  level?: number
  maxHealth: number
  defenseValue: number
  baseAttack: number
  maxEnergy?: number
  startingEnergy?: number
  agility: IStatInput
  constitution: IStatInput
  mind: IStatInput
  body: IStatInput
  sprite?: string
}

export class Hero extends Character implements ICombatant, ILevelable, IInventory {
  public experience: number
  public experienceToNextLevel: number
  public gold: number
  public items: string[]
  public abilities: IAbility[]
  public statusEffects: IStatusEffect[] = []
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

  constructor(opts: HeroOptions) {
    super(opts.id, opts.name, opts.level ?? 1, opts.maxHealth)
    this.experience = 0
    this.experienceToNextLevel = 100
    this.gold = 0
    this.items = []
    this.abilities = []
    this.defenseValue = opts.defenseValue
    this.maxEnergy = opts.maxEnergy ?? 50
    this.energy = opts.startingEnergy ?? this.maxEnergy
    this.baseAttack = opts.baseAttack
    this.critChance = 0.05
    this.critDamageMultiplier = 2.0
    this.sprite = opts.sprite ?? ''
    this.baseStats = {
      agility: { ...opts.agility, description: STAT_DESCRIPTIONS.agility },
      constitution: { ...opts.constitution, description: STAT_DESCRIPTIONS.constitution },
      mind: { ...opts.mind, description: STAT_DESCRIPTIONS.mind },
      body: { ...opts.body, description: STAT_DESCRIPTIONS.body }
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
    return this.baseAttack + (this.baseStats.body.value - 10) * 0.5 + this.level * 1
  }

  public defense(): number {
    const bodyBonus = Math.log(1 + Math.max(0, this.baseStats.body.value - 10)) * 4
    return Math.round(this.defenseValue + bodyBonus + this.level)
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
    this.baseStats.agility.value += STAT_BASE_GROWTH + this.baseStats.agility.growthPerLevel
    this.baseStats.constitution.value += STAT_BASE_GROWTH + this.baseStats.constitution.growthPerLevel
    this.baseStats.mind.value += STAT_BASE_GROWTH + this.baseStats.mind.growthPerLevel
    this.baseStats.body.value += STAT_BASE_GROWTH + this.baseStats.body.growthPerLevel
    this.maxHealth += 20
    this.health = this.maxHealth
    this.maxEnergy += 10
    this.energy = this.maxEnergy
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
