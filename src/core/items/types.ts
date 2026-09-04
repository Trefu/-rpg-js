import type { ICharacter } from '@/core/interfaces/ICharacter'
import type { AudioManager } from '@/core/AudioManager'
import type { AnnouncementVariant } from '@/composables/useAnnouncer'

/**
 * Contexto que reciben las funciones `execute` de los objetos.
 * Similar a `AbilityContext` pero orientado a consumibles:
 * no hay `energySpent`, `cooldown`, ni `animationDurationMs` por defecto.
 */
export interface ItemContext {
  /** Heroe que activa el objeto desde su inventario (caster). */
  caster: ICharacter
  /** Heroe seleccionado como beneficiario (cuando el objeto requiere objetivo). */
  target: ICharacter
  addToLog: (message: string) => void
  showPlayerHit: (value: number, options?: { heroId?: string | null, isCrit?: boolean, variant?: 'damage' | 'crit' | 'blocked' | 'heal' }) => void
  showAnnouncement: (text: string, variant?: AnnouncementVariant, duration?: number) => void
  audioManager: AudioManager
  /**
   * Duracion del delay post-uso (ms). Proviene de `IItem.animationDurationMs`
   * con fallback a 900ms para que la UI tenga tiempo de mostrar el resultado.
   */
  animationDelay: number
}

/**
 * Restringe los objetivos que un objeto puede seleccionar.
 * - 'allies-only': solo heroes vivos aliados (incluye al caster).
 * - 'self-only': solo el caster.
 * - 'all': cualquier objetivo.
 */
export type ItemTargetType = 'allies-only' | 'self-only' | 'all'

export interface IItem {
  /** Identificador unico del objeto en el registro (estable entre partidas). */
  id: string
  name: string
  description: string
  icon: string
  /** Si es `false`, el objeto se ejecuta sin pedir objetivo. Default: `true`. */
  requiresTarget?: boolean
  targetType?: ItemTargetType
  /**
   * Tiempo de animacion post-uso (ms). Default: 900ms,
   * suficiente para mostrar el resultado sin retrasar demasiado el turno.
   */
  animationDurationMs?: number
  execute: (context: ItemContext) => Promise<void> | void
}
