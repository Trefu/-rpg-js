export interface DefensePhaseZone {
  successZoneStart: number
  successZoneEnd: number
}

export interface DefenseFailureEffect {
  statusType: string
  duration: number
  damagePerTurn?: number
  /**
   * Stacks que se suman al efecto existente cuando ya está activo.
   * Si se omite, se considera 1 (aplicación normal).
   */
  stacks?: number
}

/**
 * Efecto que se aplica cuando se consigue un bloqueo.
 * Por defecto el bloqueo es una reduccion plana de dano,
 * pero perks/armas pueden cambiarlo a parry, contraataque, reflect, etc.
 */
export type DefenseBlockEffectType =
  | 'damage_reduction'
  | 'parry'
  | 'counter'
  | 'reflect'
  | 'stagger'

export interface DefenseBlockEffect {
  type: DefenseBlockEffectType
  /** Etiqueta legible para logs/UI (ej. "parry", "contraataque", "reduccion de dano"). */
  label: string
  /** Metadata libre (ej. fraccion de contraataque, fraccion reflejada). */
  metadata?: Record<string, number | string>
}

export const DEFENSE_BAR_WIDTH = 30
export const DEFENSE_PHASE_TIMEOUT_MS = 5000
export const DEFAULT_WAVE_SPEED = 30
export const DEFAULT_SUCCESS_ZONE_SIZE = 0.1

export const DEFAULT_BLOCK_EFFECT: DefenseBlockEffect = {
  type: 'damage_reduction',
  label: 'reduccion de dano'
}

export interface DefensePatternConfig {
  name?: string
  phaseCount: number
  waveSpeed?: number
  baseSuccessZoneSize?: number
  baseMaxBlockReduction: number
  damageMultiplier: number
  seed?: number
  onFailureEffect?: DefenseFailureEffect
  /**
   * Efecto de bloqueo por defecto de este patron.
   * Se aplica si ningun modifier lo sobreescribe.
   */
  onBlockEffect?: DefenseBlockEffect
}

export type DefensePhaseOutcome = 'success' | 'fail' | 'timeout'

export interface DefensePhaseResult {
  outcome: DefensePhaseOutcome
  waveColumn: number
  zone: DefensePhaseZone
}

export interface DefenseChallengeResult {
  pattern: DefensePatternConfig
  phaseResults: DefensePhaseResult[]
  totalDamage: number
  appliedOnFailureEffect: boolean
  triggeredCounterAttack: boolean
}

export function clampSuccessZoneSize(size: number): number {
  if (size < 0) return 0
  if (size > 0.5) return 0.5
  return size
}
