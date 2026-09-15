import { ICharacter } from './interfaces/ICharacter'
import type { IStatusEffect } from './interfaces/IStatusEffect'
import { DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES } from './StatusEffects'
import { getIncomingDamageMultiplier } from './combat/damageModifiers'
import type { DamageTypeId } from './combat/damageTypes'

export abstract class Character implements ICharacter {
  public readonly id: string
  public name: string
  public level: number
  public health: number
  public maxHealth: number
  public isAlive: boolean
  public statusEffects: IStatusEffect[] = []

  abstract attack(): number

  public hasStatusEffect(type: string): boolean {
    return this.statusEffects.some(e => e.type === type && e.turns > 0)
  }

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
    this.statusEffects = []
  }

  public addStatusEffect(effect: IStatusEffect) {
    const existingEffect = this.statusEffects.find(e => e.type === effect.type)
    const isDot = DOT_STATUS_TYPES.has(effect.type)
    const isStackableNonDot = STACKABLE_NON_DOT_STATUS_TYPES.has(effect.type)
    const isStackable = isDot || isStackableNonDot
    if (existingEffect) {
      if (isStackable) {
        const incomingStacks = effect.stacks ?? 1
        const maxStacks = existingEffect.maxStacks ?? effect.maxStacks ?? 99
        const currentStacks = existingEffect.stacks ?? 1
        existingEffect.stacks = Math.min(maxStacks, currentStacks + incomingStacks)
      } else {
        const maxDuration = effect.maxDuration ?? effect.turns
        existingEffect.maxDuration = maxDuration
        existingEffect.turns = maxDuration
      }
    } else {
      const maxDuration = effect.maxDuration ?? effect.turns
      const instance: IStatusEffect = {
        ...effect,
        turns: Math.min(maxDuration, effect.turns)
      }
      if (isStackable) {
        instance.stacks = effect.stacks ?? 1
        instance.maxStacks = effect.maxStacks ?? 99
      }
      this.statusEffects.push(instance)
      // Dispara `onApply` solo cuando es una instancia nueva (no en refresh
      // de stacks/duracion sobre una ya existente). Asi los hooks de
      // "primera vez" (ej. "enrage", "escudo se planta") no se disparan
      // dos veces por reaplicaciones.
      try {
        instance.onApply?.(this as unknown as import('./interfaces/ICharacter').ICharacter)
      } catch (err) {
        console.error(`[Character.addStatusEffect] onApply("${instance.type}") lanzo:`, err)
      }
    }
  }

  public removeStatusEffect(effectType: string) {
    const removed = this.statusEffects.filter(e => e.type === effectType)
    if (removed.length === 0) return
    this.statusEffects = this.statusEffects.filter(e => e.type !== effectType)
    for (const effect of removed) {
      try {
        effect.onRemove?.(this as unknown as import('./interfaces/ICharacter').ICharacter)
      } catch (err) {
        console.error(`[Character.removeStatusEffect] onRemove("${effect.type}") lanzo:`, err)
      }
    }
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

  /**
   * Aplica daño al personaje.
   *
   * Si se pasa `opts.damageType`, el `amount` se multiplica por el
   * coeficiente de daño entrante resuelto desde los efectos de estado
   * activos (combina `damageTakenMultiplier` aditivo + reducciones
   * elementales por tipo). Ver `getIncomingDamageMultiplier`.
   *
   * El redondeo es `Math.max(1, floor(amount * mult))` para que un golpe
   * critico o un ataque fuerte nunca se evapore a 0 por reducciones
   * combinadas (cap inferior 1).
   *
   * Si el personaje tiene un escudo con `absorbRemaining > 0` (Bloque D
   * Tier 3: `arcane_shield`), el escudo consume el daño primero y solo
   * el excedente reduce HP. Cuando `absorbRemaining` llega a 0, el
   * efecto se elimina.
   */
  public takeDamage(amount: number, opts?: { damageType?: DamageTypeId | string }): void {
    if (amount <= 0) return
    let finalAmount = amount
    if (opts?.damageType) {
      const mult = getIncomingDamageMultiplier(this.statusEffects, opts.damageType)
      finalAmount = Math.max(1, Math.floor(amount * mult))
    } else {
      // Sin damageType: solo aplicar damageTakenMultiplier (no hay resistencia
      // elemental posible sin tipo). Mult se resuelve igualmente.
      const mult = getIncomingDamageMultiplier(this.statusEffects, undefined)
      finalAmount = Math.max(1, Math.floor(amount * mult))
    }

    // Absorcion por escudos activos. Solo se consume el PRIMER escudo que
    // tenga absorbRemaining > 0 (los escudos no se stackean entre si; si
    // en el futuro se quiere stacking, iterar y consumir en orden).
    const shield = this.statusEffects.find(
      e => e.turns > 0 && typeof e.absorbRemaining === 'number' && e.absorbRemaining > 0
    )
    if (shield) {
      const absorbed = Math.min(shield.absorbRemaining!, finalAmount)
      shield.absorbRemaining! -= absorbed
      finalAmount -= absorbed
      if (shield.absorbRemaining! <= 0) {
        // Escudo agotado: eliminarlo (dispara `onRemove`).
        this.removeStatusEffect(shield.type)
      }
    }

    this.health = Math.max(0, this.health - finalAmount)
    this.checkHealth()
  }

  public heal(amount: number): void {
    if (!this.isAlive) return
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  public getHealthPercentage(): number {
    return this.maxHealth > 0 ? (this.health / this.maxHealth) * 100 : 0
  }
} 