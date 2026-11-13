/**
 * Presentación compartida de los números flotantes de combate
 * ("hit popups"). HeroCard, EnemyCard, MobileCombatHud y PlayerHud
 * dibujan el mismo dato con animaciones distintas; este módulo centraliza
 * el modelo y el texto para que las cuatro vistas no diverjan.
 *
 * Variantes:
 * - `damage`:  daño a HP (rojo, prefijo `-`).
 * - `crit`:    daño crítico (dorado, prefijo `-`).
 * - `blocked`: daño mitigado por el bloqueo del defense challenge (cobre, prefijo `-`).
 * - `shield`:  daño ABSORBIDO por un escudo (`absorbRemaining`). No tocó HP,
 *              así que lleva prefijo `◇` (el mismo glifo que usa el contador
 *              de escudo en StatusEffectIcons) y se pinta azul.
 * - `heal`:    curación (verde, prefijo `+`).
 * - `energy`:  energía restaurada (cian, prefijo `+`).
 */
export type HitPopupVariant = 'damage' | 'crit' | 'blocked' | 'shield' | 'heal' | 'energy'

/**
 * Sufijo por defecto cuando la variante es autoexplicativa y nadie pasa
 * `suffix` explícito. El de escudo es la pieza clave del fix: un golpe
 * comido por `absorbRemaining` muestra "◇12 Escudo" en azul en lugar de
 * un "-0" rojo.
 */
export const HIT_POPUP_DEFAULT_SUFFIX: Partial<Record<HitPopupVariant, string>> = {
  heal: ' HP',
  energy: ' EN',
  blocked: ' Bloqueo',
  shield: ' Escudo'
}

/** Modelo mínimo que las cuatro vistas necesitan para pintar un floater. */
export interface HitPopup {
  /** Persona golpeada: `heroId` para héroes, `id` para enemigos. */
  heroId?: string | null
  id?: string
  value: number
  key: number
  isCrit?: boolean
  variant?: HitPopupVariant
  suffix?: string
  offsetX?: number
  offsetY?: number
  duration?: number
}

/** Variante efectiva del popup: la explícita o la inferida de `isCrit`. */
export function hitPopupVariant(popup: Pick<HitPopup, 'variant' | 'isCrit'>): HitPopupVariant {
  return popup.variant ?? (popup.isCrit ? 'crit' : 'damage')
}

/** Prefijo de signo: `+` recursos, `◇` escudo (no perdió HP), `-` daño. */
function hitPopupPrefix(variant: HitPopupVariant): string {
  if (variant === 'heal' || variant === 'energy') return '+'
  if (variant === 'shield') return '◇'
  return '-'
}

/** Clases CSS de variante para el popup (crit/blocked/shield/heal/energy). */
export function hitPopupClasses(popup: Pick<HitPopup, 'variant' | 'isCrit'>): Record<string, boolean> {
  const variant = hitPopupVariant(popup)
  return {
    crit: variant === 'crit' || popup.isCrit === true,
    blocked: variant === 'blocked',
    shield: variant === 'shield',
    heal: variant === 'heal',
    energy: variant === 'energy'
  }
}

/** Texto completo del popup: signo + cifra + sufijo (ej. "-12", "◇30 Escudo"). */
export function hitPopupText(popup: Pick<HitPopup, 'value' | 'variant' | 'isCrit' | 'suffix'>): string {
  const variant = hitPopupVariant(popup)
  const suffix = popup.suffix ?? HIT_POPUP_DEFAULT_SUFFIX[variant] ?? ''
  return `${hitPopupPrefix(variant)}${popup.value}${suffix}`
}
