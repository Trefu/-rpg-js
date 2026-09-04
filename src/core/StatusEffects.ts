import type { IStatusEffect } from './interfaces/IStatusEffect'
import { speedPenaltyDefenseContribution } from './interfaces/IStatusEffect'
import type { Hero } from './Hero'
import stunIcon from '@/assets/icons/ball-glow.png'
import burnIcon from '@/assets/icons/fire.png'
import poisonIcon from '@/assets/icons/poison-gas.png'
import freezeIcon from '@/assets/icons/frostfire.png'
import strengthIcon from '@/assets/icons/muscle-up.png'
import defenseIcon from '@/assets/icons/shield.png'
import speedIcon from '@/assets/icons/footprint.png'
import weaknessIcon from '@/assets/icons/anatomy.png'
import slowIcon from '@/assets/icons/snail.png'
import secondWindIcon from '@/assets/icons/wind-slap.png'
import swordWoundIcon from '@/assets/icons/open-wound.png'

export const MAX_DOT_DURATION = 3
export const CRIT_DOT_DURATION = 5
export const DEFAULT_MAX_STACKS = 999

export const DOT_STATUS_TYPES: ReadonlySet<string> = new Set([
  'burn',
  'poison',
  'freeze'
])

export interface FailureEffectSpec {
  statusType: string
  stacks?: number
  /**
   * Override explicito de la duracion maxima (turnos) cuando se aplica el
   * efecto via `onFailureEffect`. Si esta presente, tiene prioridad sobre
   * `template.maxDuration` y sobre el default DoT.
   *
   * Util para efectos no-DoT (ej. INJURED, STUN) cuya duracion no debe
   * seguir la regla de DoTs (3 base / 5 crit).
   */
  maxDuration?: number
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
    turnLabel: '¡Está aturdido y pierde su turno!',
    announceOnTurn: true
  }

  // Efectos de daño por tiempo (DoTs): todos comparten maxDuration + maxStacks
  // Cada stack = 1 de daño fijo por turno. Las reaplicaciones suman stacks, nunca turnos.
  static readonly BURN: IStatusEffect = {
    type: 'burn',
    name: 'Quemado',
    description: 'El personaje recibe daño por quemadura cada turno (1 por stack). Las reaplicaciones suman stacks.',
    turns: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: burnIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por quemadura!',
    announceOnTurn: true
  }

  static readonly POISON: IStatusEffect = {
    type: 'poison',
    name: 'Envenenado',
    description: 'El personaje recibe daño por veneno cada turno (1 por stack). Las reaplicaciones suman stacks, nunca turnos.',
    turns: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: poisonIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por veneno!',
    announceOnTurn: true
  }

  static readonly FREEZE: IStatusEffect = {
    type: 'freeze',
    name: 'Congelado',
    description: 'El personaje recibe daño por frío cada turno (1 por stack). Las reaplicaciones suman stacks, nunca turnos.',
    turns: MAX_DOT_DURATION,
    stacks: 1,
    maxStacks: DEFAULT_MAX_STACKS,
    icon: freezeIcon,
    isBuff: false,
    turnLabel: '¡Recibe daño por frío!',
    speedPenalty: -2,
    defenseContribution: speedPenaltyDefenseContribution,
    announceOnTurn: true
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
    defenseBonus: 3,
    defenseContribution: (effect) => (
      typeof effect.defenseBonus === 'number'
        ? { blockReductionBonus: effect.defenseBonus * 0.05 }
        : undefined
    )
  }

  static readonly SPEED_BOOST: IStatusEffect = {
    type: 'speed_boost',
    name: 'Velocidad Aumentada',
    description: 'Aumenta la velocidad del personaje.',
    turns: 2,
    icon: speedIcon,
    isBuff: true,
    turnLabel: '¡Su velocidad está aumentada!',
    speedBonus: 2,
    defenseContribution: (effect) => (
      typeof effect.speedBonus === 'number'
        // Buff de velocidad → la onda se mueve más lento (más fácil bloquear)
        ? { waveSpeedMultiplier: -effect.speedBonus * 0.08 }
        : undefined
    )
  }

  static readonly SECOND_WIND: IStatusEffect = (() => {
    const energyRestorePct = 0.1
    const charges = 3
    const restorePctLabel = Math.round(energyRestorePct * 100)
    const threatModifier = 1.5
    return {
      type: 'second_wind',
      name: 'Segundo Aliento',
      turns: Infinity,
      charges,
      maxCharges: charges,
      description: `Cada bloqueo restaura ${restorePctLabel}% de la energia maxima. Se consume tras ${charges} bloqueos.`,
      icon: secondWindIcon,
      isBuff: true,
      turnLabel: '¡Su segundo aliento lo mantiene en pie!',
      threatModifier,
      onBlock: (target, _blockedFraction, hooks) => {
        const hero = target as Hero
        const before = hero.energy
        const restore = Math.floor(hero.maxEnergy * energyRestorePct)
        hero.restoreEnergy(restore)
        const restored = hero.energy - before
        if (restored > 0) hooks?.showPlayerHit(restored, { heroId: hero.id, variant: 'energy', suffix: ' EN' })
      }
    } satisfies IStatusEffect
  })()

  // Ejemplo: bloquea y se cura HP en funcion del daño bloqueado. Sin cargos
  // (mientras dure `turns`, se mantiene). Solo se activa si `blockedFraction >= 1`.
  static readonly VAMPIRE_SHIELD: IStatusEffect = {
    type: 'vampire_shield',
    name: 'Escudo Vampírico',
    description: 'Cada bloqueo completo absorbe 30% del daño bloqueado como vida.',
    turns: 3,
    icon: secondWindIcon,
    isBuff: true,
    turnLabel: '¡Su escudo vampírico le roba vida al enemigo!',
    onBlock: (target, blockedFraction, hooks) => {
      if (blockedFraction < 1) return
      const hero = target as Hero
      // El daño bloqueado exacto no llega al hook; estimamos con maxHealth * factor.
      // Si necesitas el valor exacto, hay que extender el hook para recibirlo.
      const before = hero.health
      const heal = Math.floor(hero.maxHealth * 0.05 * blockedFraction)
      hero.heal(heal)
      const restored = hero.health - before
      if (restored > 0) hooks?.showPlayerHit(restored, { heroId: hero.id, variant: 'heal', suffix: ' HP' })
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
    turnLabel: '¡Está debilitado!',
    announceOnTurn: true
  }

  static readonly SLOW: IStatusEffect = {
    type: 'slow',
    name: 'Ralentizado',
    description: 'Reduce la velocidad del personaje.',
    turns: 2,
    icon: slowIcon,
    isBuff: false,
    turnLabel: '¡Está ralentizado!',
    speedPenalty: -1,
    defenseContribution: speedPenaltyDefenseContribution,
    announceOnTurn: true
  }

  /**
   * "Lesionado": debufo que altera la velocidad de la onda en la barra
   * de defensa del portador durante 1 turno. La dirección del efecto
   * depende de quien lo tenga:
   *  - Sobre un enemigo: la onda se mueve más lento (más fácil defender).
   *  - Sobre el jugador: el efecto se invierte (la onda se acelera, más difícil bloquear).
   *
   * El impacto se define inline en `defenseWaveSpeedImpact` y se aplica
   * en `getDefenseModifiers` (modifiers.ts).
   *
   * Duración base: 1 turno. La ability Golpe Lesionador puede sobreescribir
   * `turns` al aplicar el efecto para escalar con el nivel del caster.
   *
   * Las descripciones se muestran distintas segun el bando del portador
   * (ver `getEffectDescription` en IStatusEffect).
   */
  static readonly INJURED: IStatusEffect = {
    type: 'injured',
    name: 'Lesionado',
    description: 'Altera la velocidad de la onda en la barra de defensa.',
    descriptionOnEnemy: 'La onda en la barra de defensa se mueve más lento (más fácil defender).',
    descriptionOnPlayer: 'La onda en la barra de defensa se acelera (más difícil bloquear).',
    turns: 1,
    icon: swordWoundIcon,
    isBuff: false,
    turnLabel: '¡Está lesionado!',
    defenseWaveSpeedImpact: 0.4,
    // Lesionado en enemigo: la onda se desacelera (más fácil defender).
    // Lesionado en jugador: la onda se acelera (más difícil bloquear).
    // El signo lo decide `side` (pasado por `getDefenseModifiers`).
    defenseContribution: (effect, side) => (
      typeof effect.defenseWaveSpeedImpact === 'number'
        ? { waveSpeedMultiplier: (side === 'player' ? 1 : -1) * effect.defenseWaveSpeedImpact }
        : undefined
    )
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
      this.VAMPIRE_SHIELD,
      this.INJURED
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
      this.VAMPIRE_SHIELD.type,
      this.INJURED.type
    ]
  }
}

export function applyFailureEffect(
  target: { addStatusEffect: (effect: IStatusEffect) => void; statusEffects: IStatusEffect[] },
  spec: FailureEffectSpec,
  opts: { isCrit?: boolean } = {}
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

  const defaultDotDuration = opts.isCrit && DOT_STATUS_TYPES.has(statusType)
    ? CRIT_DOT_DURATION
    : MAX_DOT_DURATION
  const maxDuration = spec.maxDuration ?? template.maxDuration ?? defaultDotDuration

  const instance: IStatusEffect = {
    ...template,
    turns: maxDuration,
    stacks,
    maxStacks,
    maxDuration
  }
  target.addStatusEffect(instance)
}
