import { ICharacter } from './interfaces/ICharacter'
import type { IStatusEffect } from './interfaces/IStatusEffect'
import { DOT_STATUS_TYPES } from './StatusEffects'

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
    if (existingEffect) {
      if (isDot) {
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
      if (isDot) {
        instance.stacks = effect.stacks ?? 1
        instance.maxStacks = effect.maxStacks ?? 99
      }
      this.statusEffects.push(instance)
    }
  }

  public removeStatusEffect(effectType: string) {
    this.statusEffects = this.statusEffects.filter(e => e.type !== effectType)
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
    return this.maxHealth > 0 ? (this.health / this.maxHealth) * 100 : 0
  }
} 