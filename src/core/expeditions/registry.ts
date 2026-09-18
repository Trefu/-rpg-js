import { MOUNTAIN_PEAK } from './mountainPeak'
import type { ExpeditionId, IExpeditionConfig } from './types'

/**
 * Registro de todas las expediciones jugables del juego. La key es el
 * `ExpeditionId` y el value es la config completa.
 *
 * Para agregar una nueva expedicion: importarla aqui y sumarla al objeto.
 */
export const EXPEDITIONS: Record<ExpeditionId, IExpeditionConfig> = {
  'mountain-peak': MOUNTAIN_PEAK
}

/** Expedicion por defecto cuando ninguna otra aplica (siempre jugable). */
export const DEFAULT_EXPEDITION: ExpeditionId = 'mountain-peak'

export function getExpedition(id: ExpeditionId): IExpeditionConfig {
  const cfg = EXPEDITIONS[id]
  if (!cfg) {
    throw new Error(`[expeditions] unknown expedition id: ${id}`)
  }
  return cfg
}

/**
 * Devuelve la lista de expediciones que el jugador puede elegir en el
 * pre-game. Hoy son todas las del registry; en el futuro esto podria
 * filtrar por flags de progresion guardados.
 */
export function listExpeditions(): IExpeditionConfig[] {
  return Object.values(EXPEDITIONS)
}

/**
 * Evalua los `unlockCriteria` de una expedicion contra un set de
 * expediciones ya completadas. Usado por el pre-game y por la store.
 */
export function isExpeditionUnlocked(
  id: ExpeditionId,
  completedExpeditions: ReadonlySet<ExpeditionId>
): boolean {
  const cfg = EXPEDITIONS[id]
  if (!cfg) return false
  if (cfg.unlockCriteria.kind === 'always') return true
  return cfg.unlockCriteria.expeditions.every(req => completedExpeditions.has(req))
}
