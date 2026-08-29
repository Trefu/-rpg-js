import type {
  DefenseChallengeResult,
  DefensePatternConfig,
  DefensePhaseResult,
  DefensePhaseSpec,
  DefensePhaseZone
} from './types'
import {
  clampSuccessZoneSize,
  DEFENSE_BAR_WIDTH,
  DEFAULT_SUCCESS_ZONE_SIZE,
  DEFAULT_WAVE_SPEED
} from './types'
import type { DefenseModifiers } from './modifiers'

/** Margen (en columnas) a cada lado de la barra donde no se sortea zona. */
const PHASE_MARGIN_COLUMNS = 2

export function applyModifiersToPattern(
  pattern: DefensePatternConfig,
  modifiers: DefenseModifiers
): DefensePatternConfig {
  const baseSuccessZoneSize = pattern.baseSuccessZoneSize ?? DEFAULT_SUCCESS_ZONE_SIZE
  const successZoneSize = clampSuccessZoneSize(baseSuccessZoneSize + modifiers.successZoneSizeBonus)

  const baseWaveSpeed = pattern.waveSpeed ?? DEFAULT_WAVE_SPEED
  const waveSpeed = baseWaveSpeed * modifiers.waveSpeedMultiplier

  const phases = pattern.phases?.map(spec => {
    if (spec.waveSpeed === undefined) return spec
    return { ...spec, waveSpeed: spec.waveSpeed * modifiers.waveSpeedMultiplier }
  })

  return {
    ...pattern,
    baseSuccessZoneSize: successZoneSize,
    waveSpeed,
    phases
  }
}

/**
 * Resuelve las zonas de éxito por fase del patrón.
 *
 * Prioridad:
 *  1. `pattern.phases` (declaración explícita) — gana siempre.
 *  2. `pattern.baseSuccessZoneSize` en floats, redondeado a columnas
 *     enteras (modo retrocompatible).
 */
export function pickZonesForPhases(
  pattern: DefensePatternConfig,
  rng: () => number = Math.random
): DefensePhaseZone[] {
  const patternWaveSpeed = pattern.waveSpeed ?? DEFAULT_WAVE_SPEED

  if (pattern.phases && pattern.phases.length > 0) {
    return pattern.phases.map(spec => {
      const cols = resolveSpecColumns(spec, pattern, rng)
      const waveSpeed = spec.waveSpeed ?? patternWaveSpeed
      return { successColumns: cols, waveSpeed }
    })
  }

  const fallbackColumns = Math.max(
    1,
    Math.round((pattern.baseSuccessZoneSize ?? DEFAULT_SUCCESS_ZONE_SIZE) * DEFENSE_BAR_WIDTH)
  )
  return [{ successColumns: randomZoneOfColumns(fallbackColumns, rng), waveSpeed: patternWaveSpeed }]
}

function resolveSpecColumns(
  spec: DefensePhaseSpec,
  pattern: DefensePatternConfig,
  rng: () => number
): number[] {
  if (spec.successColumns && spec.successColumns.length > 0) {
    return dedupeAndClamp(spec.successColumns)
  }
  const count = spec.columnCount ?? Math.max(
    1,
    Math.round((pattern.baseSuccessZoneSize ?? DEFAULT_SUCCESS_ZONE_SIZE) * DEFENSE_BAR_WIDTH)
  )
  return randomZoneOfColumns(count, rng)
}

function randomZoneOfColumns(count: number, rng: () => number): number[] {
  const safeCount = Math.max(1, Math.min(count, DEFENSE_BAR_WIDTH - PHASE_MARGIN_COLUMNS * 2))
  const minStart = PHASE_MARGIN_COLUMNS
  const maxStart = DEFENSE_BAR_WIDTH - safeCount - PHASE_MARGIN_COLUMNS
  const start = minStart + Math.floor(rng() * (maxStart - minStart + 1))
  return Array.from({ length: safeCount }, (_, i) => start + i)
}

function dedupeAndClamp(cols: number[]): number[] {
  const set = new Set<number>()
  for (const c of cols) {
    if (Number.isInteger(c) && c >= 0 && c < DEFENSE_BAR_WIDTH) set.add(c)
  }
  return [...set].sort((a, b) => a - b)
}

export function calculateDefenseDamage(
  pattern: DefensePatternConfig,
  phaseResults: DefensePhaseResult[],
  modifiers: DefenseModifiers,
  attackDamage: number
): number {
  const phaseCount = pattern.phases?.length ?? 1
  if (phaseCount <= 0) return 0
  const maxBlock = Math.max(0, Math.min(1, pattern.baseMaxBlockReduction + modifiers.blockReductionBonus))
  const perPhaseBlock = maxBlock / phaseCount
  const successfulPhases = phaseResults.filter(r => r.outcome === 'success').length
  const totalBlock = perPhaseBlock * successfulPhases
  const raw = attackDamage * (1 - totalBlock)
  return Math.max(0, Math.floor(raw))
}

export function isWaveInSuccessZone(waveColumn: number, zone: DefensePhaseZone): boolean {
  if (DEFENSE_BAR_WIDTH <= 0) return false
  const clamped = Math.max(0, Math.min(DEFENSE_BAR_WIDTH - 1, waveColumn))
  const columnIndex = Math.floor(clamped)
  return zone.successColumns.includes(columnIndex)
}

export function buildDefenseResult(
  pattern: DefensePatternConfig,
  phaseResults: DefensePhaseResult[],
  modifiers: DefenseModifiers,
  attackDamage: number
): DefenseChallengeResult {
  const totalDamage = calculateDefenseDamage(pattern, phaseResults, modifiers, attackDamage)
  const anyFailure = phaseResults.some(r => r.outcome !== 'success')
  return {
    pattern,
    phaseResults,
    totalDamage,
    appliedOnFailureEffect: anyFailure,
    triggeredCounterAttack: false
  }
}
