import type {
  DefenseChallengeResult,
  DefensePatternConfig,
  DefensePhaseResult,
  DefensePhaseZone
} from './types'
import {
  clampSuccessZoneSize,
  DEFENSE_BAR_WIDTH,
  DEFAULT_SUCCESS_ZONE_SIZE,
  DEFAULT_WAVE_SPEED
} from './types'
import type { DefenseModifiers } from './modifiers'

export function applyModifiersToPattern(
  pattern: DefensePatternConfig,
  modifiers: DefenseModifiers
): DefensePatternConfig {
  const phaseCount = Math.max(1, pattern.phaseCount - Math.floor(modifiers.phaseCountReduction))
  const baseSuccessZoneSize = pattern.baseSuccessZoneSize ?? DEFAULT_SUCCESS_ZONE_SIZE
  const successZoneSize = clampSuccessZoneSize(baseSuccessZoneSize + modifiers.successZoneSizeBonus)
  const baseWaveSpeed = pattern.waveSpeed ?? DEFAULT_WAVE_SPEED
  const waveSpeed = baseWaveSpeed * modifiers.waveSpeedMultiplier

  return {
    ...pattern,
    phaseCount,
    baseSuccessZoneSize: successZoneSize,
    waveSpeed
  }
}

export function pickZonesForPhases(
  pattern: DefensePatternConfig,
  rng: () => number = Math.random
): DefensePhaseZone[] {
  const zones: DefensePhaseZone[] = []
  const zoneSize = clampSuccessZoneSize(pattern.baseSuccessZoneSize ?? DEFAULT_SUCCESS_ZONE_SIZE)
  const margin = 0.1
  const range = 1 - zoneSize - margin * 2
  for (let i = 0; i < pattern.phaseCount; i++) {
    const start = margin + rng() * range
    zones.push({
      successZoneStart: start,
      successZoneEnd: start + zoneSize
    })
  }
  return zones
}

export function calculateDefenseDamage(
  pattern: DefensePatternConfig,
  phaseResults: DefensePhaseResult[],
  modifiers: DefenseModifiers,
  attackDamage: number
): number {
  const phaseCount = pattern.phaseCount
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
  const wavePos = waveColumn / DEFENSE_BAR_WIDTH
  return wavePos >= zone.successZoneStart && wavePos <= zone.successZoneEnd
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
