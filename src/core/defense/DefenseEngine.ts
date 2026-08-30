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

/** Velocidad fija de la onda (columnas/segundo) cuando el ataque es un critico. */
export const CRIT_WAVE_SPEED = 100

export function applyCritToPattern(
  pattern: DefensePatternConfig,
  modifiers?: DefenseModifiers
): DefensePatternConfig {
  const next: DefensePatternConfig = { ...pattern }

  // El crit respeta el waveSpeedMultiplier (ej. enemigo lesionado desacelera
  // el crit, jugador lesionado lo acelera). Sin modifiers, queda en 100 fijo.
  const waveSpeedMultiplier = modifiers?.waveSpeedMultiplier ?? 1.0
  const critWaveSpeed = CRIT_WAVE_SPEED * waveSpeedMultiplier

  next.waveSpeed = critWaveSpeed

  if (typeof next.baseSuccessZoneSize === 'number') {
    next.baseSuccessZoneSize = next.baseSuccessZoneSize / 2
  }

  if (Array.isArray(next.phases)) {
    next.phases = next.phases.map(spec => {
      const out: DefensePhaseSpec = { ...spec }
      out.waveSpeed = critWaveSpeed
      if (typeof out.columnCount === 'number') {
        out.columnCount = Math.max(1, Math.ceil(out.columnCount / 2))
      }
      if (out.successColumns && out.successColumns.length > 0) {
        const keep = Math.max(1, Math.ceil(out.successColumns.length / 2))
        out.successColumns = out.successColumns.slice(0, keep)
      }
      return out
    })
  }

  return next
}

export function applyModifiersToPattern(
  pattern: DefensePatternConfig,
  modifiers: DefenseModifiers
): DefensePatternConfig {
  const baseSuccessZoneSize = pattern.baseSuccessZoneSize ?? DEFAULT_SUCCESS_ZONE_SIZE
  const successZoneSize = clampSuccessZoneSize(baseSuccessZoneSize + modifiers.successZoneSizeBonus)

  const baseWaveSpeed = pattern.waveSpeed ?? DEFAULT_WAVE_SPEED
  const waveSpeed = baseWaveSpeed * modifiers.waveSpeedMultiplier

  // TODO: cuando las stats del enemigo (speed, etc.) afecten la dificultad,
  // agregar un pipeline paralelo `applyEnemyModifiersToPattern` o extender
  // DefenseModifiers con campos como enemyWaveSpeedMultiplier y aplicarlos acá.
  // TODO: si en el futuro una stat afecta la cantidad de columnas de éxito,
  // sumar `columnCountBonus` a DefenseModifiers y aplicarlo en `resolveSpecColumns`.
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

/**
 * Timeout base por fase (ms). Equivale a ~1.7 cruces completos de la barra
 * a la waveSpeed baseline (`DEFAULT_WAVE_SPEED` = 30 cols/seg).
 */
const BASE_PHASE_TIMEOUT_MS = 5000

/**
 * Extra máximo de timeout (ms) para ondas lentas (lentitud relativa al baseline).
 * Con `DEFAULT_WAVE_SPEED` = 30, una onda al 70% (21 cols/seg, ej. goblin lesionado)
 * suma 3000ms, llegando a 8s de timeout.
 */
const SLOW_WAVE_EXTRA_MS = 10000

/**
 * Extra máximo de timeout (ms) para ondas rápidas (sobre el baseline).
 * Cap para no generar fases eternas con crits/combos extremos.
 */
const FAST_WAVE_EXTRA_MS = 2000

/** Tope duro de timeout por fase (ms) para no bloquear la UI. */
const MAX_PHASE_TIMEOUT_MS = 10000

/**
 * Calcula el timeout por fase a partir de la waveSpeed efectiva
 * (ya con modificadores aplicados).
 *
 * Por qué existe: con el timeout fijo de 5000ms, una onda muy lenta
 * (ej. ESPADAZO del goblin lesionado → 21 cols/seg) hace que el jugador
 * tenga que esperar muchas oscilaciones para encontrar el momento, y
 * puede no alcanzar. Una onda muy rápida tampoco deja reaccionar.
 *
 * Fórmula:
 *  - baseline (30)  → 5000ms (sin extra)
 *  - baseline - 30% → +3000ms (goblin lesionado, caso del usuario)
 *  - baseline + X%  → hasta +2000ms (cap para reflejos)
 *  - tope absoluto: 10000ms
 */
export function calculatePhaseTimeoutMs(waveSpeed: number): number {
  const baseline = DEFAULT_WAVE_SPEED
  let extraMs = 0

  if (waveSpeed < baseline) {
    const slowRatio = (baseline - waveSpeed) / baseline
    extraMs = slowRatio * SLOW_WAVE_EXTRA_MS
  } else if (waveSpeed > baseline) {
    const fastRatio = Math.min((waveSpeed - baseline) / baseline, 1)
    extraMs = fastRatio * FAST_WAVE_EXTRA_MS
  }

  const total = BASE_PHASE_TIMEOUT_MS + Math.round(extraMs)
  return Math.min(total, MAX_PHASE_TIMEOUT_MS)
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
