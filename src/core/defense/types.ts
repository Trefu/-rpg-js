export interface DefensePhaseZone {
  /**
   * Índices de columna (0-indexed, en [0, DEFENSE_BAR_WIDTH)) que cuentan
   * como éxito para esta fase. Modelo discreto que coincide con la grilla
   * visual de la barra de defensa.
   */
  successColumns: number[]
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
 * Tipo elemental del ataque (mock por ahora). Reservado para resistencias
 * y daño elemental futuro. Mantener alineado con los tipos registrados
 * en StatusEffects.
 */
export type AttackType =
  | 'physical'
  | 'fire'
  | 'frost'
  | 'poison'
  | 'shadow'
  | 'arcane'
  | 'holy'

/**
 * Especificación declarativa de UNA fase del patrón.
 * El motor (pickZonesForPhases) la resuelve a DefensePhaseZone.
 */
export interface DefensePhaseSpec {
  /**
   * Cantidad de columnas a sortear dentro del margen.
   * Excluyente con `successColumns`.
   */
  columnCount?: number
  /**
   * Columnas exactas (0-indexed). Si se define, ignora `columnCount`
   * y se sortean/empatan cero columnas: el patrón es determinístico.
   */
  successColumns?: number[]
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
  /** Tipo elemental del ataque (mock por ahora). */
  type?: AttackType
  phaseCount: number
  waveSpeed?: number
  /**
   * Tamaño por defecto de la zona de éxito en floats [0..1].
   * Si `phases` está definido, se ignora.
   */
  baseSuccessZoneSize?: number
  baseMaxBlockReduction: number
  damageMultiplier: number
  seed?: number
  /**
   * Specs de zona por fase. Si está definido y tiene `phaseCount`
   * entradas, tiene prioridad sobre `baseSuccessZoneSize`.
   * Si se omite, se sortea con `baseSuccessZoneSize` redondeado
   * a columnas enteras (modo retrocompatible).
   */
  phases?: DefensePhaseSpec[]
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
