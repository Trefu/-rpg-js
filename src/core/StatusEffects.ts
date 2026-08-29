import type { IStatusEffect } from './interfaces/IStatusEffect'
import type { Hero } from './Hero'
import stunIcon from '@/assets/icons/ball-glow.png'
import burnIcon from '@/assets/icons/fire.png'
import poisonIcon from '@/assets/icons/poison-gas.png'
import freezeIcon from '@/assets/icons/snowflake-1.png'
import strengthIcon from '@/assets/icons/muscle-up.png'
import defenseIcon from '@/assets/icons/shield.png'
import speedIcon from '@/assets/icons/footprint.png'
import weaknessIcon from '@/assets/icons/anatomy.png'
import slowIcon from '@/assets/icons/snail.png'
import secondWindIcon from '@/assets/icons/wind-slap.png'

// Duración base por defecto para cualquier efecto de daño por tiempo (DoT).
export const MAX_DOT_DURATION = 3
// Turnos extra que se suman cuando el efecto se aplica con un golpe crítico.
export const CRITICAL_HIT_BONUS_TURNS = 2
export const DEFAULT_MAX_STACKS = 999

export interface FailureEffectSpec {
  statusType: string
  critical?: boolean
  stacks?: number
}

export class StatusEffects {
  // Efectos de aturdimiento
  static readonly STUN: IStatusEffect = {
    type: 'stun',
    name: 'Aturdido',
    description: 'El personaje no puede realizar acciones.',
    turns: 1,
    icon: stunIcon,
    isBuff: false,
    turnLabel: '¡Está aturdido y pierde su turno!'
  }

  // Efectos de daño por tiempo (DoTs): todos comparten maxDuration + maxStacks
  // Cada stack = 1 de daño fijo por turno. Las reaplicaciones suman stacks, nunca turnos.
  static readonly BURN: IStatusEffect = {
    type: 'burn',
    name: 'Quemado',
    description: 'El personaje recibe daño por quemadura cada turno (1 por stack). Las reaplicaciones suman stacks.',
    turns: MAX_DOT_DURATION,
    maxDuration: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: burnIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por quemadura!'
  }

  static readonly POISON: IStatusEffect = {
    type: 'poison',
    name: 'Envenenado',
    description: 'El personaje recibe daño por veneno cada turno (1 por stack). Las reaplicaciones suman stacks, nunca turnos.',
    turns: MAX_DOT_DURATION,
    maxDuration: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: poisonIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por veneno!'
  }

  static readonly FREEZE: IStatusEffect = {
    type: 'freeze',
    name: 'Congelado',
    description: 'El personaje recibe daño por frío cada turno (1 por stack). Las reaplicaciones suman stacks, nunca turnos.',
    turns: MAX_DOT_DURATION,
    maxDuration: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: freezeIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por frío!',
    speedPenalty: -2
  }

  // Efectos de buff
  static readonly STRENGTH_BOOST: IStatusEffect = {
    type: 'strength_boost',
    name: 'Fuerza Aumentada',
    description: 'Aumenta el ataque del personaje.',
    turns: 3,
    icon: strengthIcon,
    isBuff: true,
    turnLabel: '¡Su fuerza está aumentada!',
  }

  static readonly DEFENSE_BOOST: IStatusEffect = {
    type: 'defense_boost',
    name: 'Defensa Aumentada',
    description: 'Aumenta la defensa del personaje.',
    turns: 3,
    icon: defenseIcon,
    isBuff: true,
    turnLabel: '¡Su defensa está aumentada!',
    defenseBonus: 3
  }

  static readonly SPEED_BOOST: IStatusEffect = {
    type: 'speed_boost',
    name: 'Velocidad Aumentada',
    description: 'Aumenta la velocidad del personaje.',
    turns: 2,
    icon: speedIcon,
    isBuff: true,
    turnLabel: '¡Su velocidad está aumentada!',
    speedBonus: 2
  }

  static readonly SECOND_WIND: IStatusEffect = {
    type: 'second_wind',
    name: 'Segundo Aliento',
    description: 'Cada bloqueo restaura 10% de la energia maxima. Se consume tras 5 bloqueos.',
    turns: Infinity,
    charges: 5,
    maxCharges: 5,
    icon: secondWindIcon,
    isBuff: true,
    turnLabel: '¡Su segundo aliento lo mantiene en pie!',
    onBlock: (target, _blockedFraction) => {
      const hero = target as Hero
      const restore = Math.floor(hero.maxEnergy * 0.1)
      hero.restoreEnergy(restore)
    }
  }

  // Ejemplo: bloquea y se cura HP en funcion del dano bloqueado. Sin cargos
  // (mientras dure `turns`, se mantiene). Solo se activa si `blockedFraction >= 1`.
  static readonly VAMPIRE_SHIELD: IStatusEffect = {
    type: 'vampire_shield',
    name: 'Escudo Vampírico',
    description: 'Cada bloqueo completo absorbe 30% del dano bloqueado como vida.',
    turns: 3,
    icon: secondWindIcon,
    isBuff: true,
    turnLabel: '¡Su escudo vampírico le roba vida al enemigo!',
    onBlock: (target, blockedFraction) => {
      if (blockedFraction < 1) return
      const hero = target as Hero
      // El dano bloqueado exacto no llega al hook; estimamos con maxHealth * factor.
      // Si necesitas el valor exacto, hay que extender el hook para recibirlo.
      const heal = Math.floor(hero.maxHealth * 0.05 * blockedFraction)
      hero.heal(heal)
    }
  }

  // Efectos de debuff
  static readonly WEAKNESS: IStatusEffect = {
    type: 'weakness',
    name: 'Debilitado',
    description: 'Reduce el ataque del personaje.',
    turns: 2,
    icon: weaknessIcon,
    isBuff: false,
    turnLabel: '¡Está debilitado!'
  }

  static readonly SLOW: IStatusEffect = {
    type: 'slow',
    name: 'Ralentizado',
    description: 'Reduce la velocidad del personaje.',
    turns: 2,
    icon: slowIcon,
    isBuff: false,
    turnLabel: '¡Está ralentizado!',
    speedPenalty: -1
  }

  // Método para obtener un efecto por tipo (case-insensitive)
  static getByType(type: string): IStatusEffect | null {
    const effects = [
      this.STUN,
      this.BURN,
      this.POISON,
      this.FREEZE,
      this.STRENGTH_BOOST,
      this.DEFENSE_BOOST,
      this.SPEED_BOOST,
      this.WEAKNESS,
      this.SLOW,
      this.SECOND_WIND,
      this.VAMPIRE_SHIELD
    ]
    const target = type.toLowerCase()
    return effects.find(effect => effect.type === target) || null
  }

  static getRegisteredTypes(): string[] {
    return [
      this.STUN.type,
      this.BURN.type,
      this.POISON.type,
      this.FREEZE.type,
      this.STRENGTH_BOOST.type,
      this.DEFENSE_BOOST.type,
      this.SPEED_BOOST.type,
      this.WEAKNESS.type,
      this.SLOW.type,
      this.SECOND_WIND.type,
      this.VAMPIRE_SHIELD.type
    ]
  }
}

export function applyFailureEffect(
  target: { addStatusEffect: (effect: IStatusEffect) => void; statusEffects: IStatusEffect[] },
  spec: FailureEffectSpec
): void {
  const statusType = String(spec.statusType).toLowerCase()
  const template = StatusEffects.getByType(statusType)
  if (!template) {
    throw new Error(
      `[StatusEffects] Unknown status type "${spec.statusType}". Registered types: ${StatusEffects.getRegisteredTypes().join(', ')}`
    )
  }

  const stacks = Math.max(1, spec.stacks ?? 1)
  const maxStacks = template.maxStacks ?? DEFAULT_MAX_STACKS
  if (stacks > maxStacks) {
    throw new Error(
      `[StatusEffects] "${statusType}" cannot stack above ${maxStacks} (got ${stacks}). ` +
      `Increase maxStacks in StatusEffects.${statusType.toUpperCase()} template if needed.`
    )
  }

  const maxDuration = template.maxDuration ?? MAX_DOT_DURATION
  const duration = spec.critical
    ? maxDuration + CRITICAL_HIT_BONUS_TURNS
    : maxDuration

  const instance: IStatusEffect = {
    ...template,
    turns: duration,
    stacks,
    maxStacks,
    maxDuration
  }
  target.addStatusEffect(instance)
}
