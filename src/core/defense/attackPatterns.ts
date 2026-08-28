import type { DefensePhaseSpec } from './types'

/**
 * Fase con N columnas aleatorias dentro del margen de la barra.
 *
 * @example
 *   phases: [phase(3), phase(5)] // 3 columnas en fase 1, 5 en fase 2
 */
export function phase(columnCount: number): DefensePhaseSpec {
  return { columnCount }
}

/**
 * Fase con columnas exactas (0-indexed). Patrón determinístico:
 * no se sortea nada, las zonas siempre son las mismas.
 *
 * @example
 *   phases: [fixedPhase(2, 3, 4), fixedPhase(10, 11, 12, 13)]
 */
export function fixedPhase(...columns: number[]): DefensePhaseSpec {
  return { successColumns: [...columns].sort((a, b) => a - b) }
}
