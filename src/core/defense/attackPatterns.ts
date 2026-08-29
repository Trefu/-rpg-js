import type { DefensePhaseSpec } from './types'
import { DEFENSE_BAR_WIDTH } from './types'

/**
 * Fase con N columnas aleatorias dentro del margen de la barra.
 * El segundo argumento opcional permite override por fase (ej. `waveSpeed`
 * creciente para combos que se aceleran).
 *
 * @example
 *   phases: [phase(3), phase(5)]                                  // básico
 *   phases: [phase(3, { waveSpeed: 30 }), phase(3, { waveSpeed: 50 })] // acelerado
 */
export function phase(
  columnCount: number,
  overrides?: Pick<DefensePhaseSpec, 'waveSpeed' | 'successColumns'>
): DefensePhaseSpec {
  return { columnCount, ...overrides }
}

/**
 * Fase con columnas exactas. Los índices son **1-indexed** (la columna
 * 1 es la primera, la columna DEFENSE_BAR_WIDTH es la última) para que
 * el dev no tenga que restar 1 mentalmente al escribir el patrón.
 *
 * Pasar 0 lanza error: preferimos fallar rápido a que `fixedPhase(0)`
 * se interprete silenciosamente como "la primera columna".
 *
 * @example
 *   phases: [fixedPhase(2, 3, 4), fixedPhase(10, 11, 12, 13)]
 *   // Fase 1: columnas 2, 3 y 4
 *   // Fase 2: columnas 10, 11, 12 y 13
 */
export function fixedPhase(...columns: number[]): DefensePhaseSpec {
  const invalid = columns.filter(
    c => !Number.isInteger(c) || c < 1 || c > DEFENSE_BAR_WIDTH
  )
  if (invalid.length > 0) {
    throw new Error(
      `[fixedPhase] Column indices must be integers in [1, ${DEFENSE_BAR_WIDTH}]. Got: ${invalid.join(', ')}`
    )
  }
  const set = new Set(columns.map(c => c - 1))
  return { successColumns: [...set].sort((a, b) => a - b) }
}