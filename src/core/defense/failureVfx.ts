import type { VfxEffect } from '../interfaces/IAbility'
import type { DefensePatternConfig } from './types'

/**
 * VFX por defecto que se muestra sobre el heroe cuando recibe dano sin
 * haber bloqueado durante un desafio de defensa.
 *
 * - `impact`: dano normal (no critico). 15 frames a 30fps = 500ms.
 * - `bigHit`: dano critico. 12 frames a 30fps = 400ms.
 *
 * Centralizados aqui para que HeroCard / MobileCombatHud / futuros
 * overrides apunten al mismo asset/duracion.
 */
export const DEFAULT_IMPACT_VFX: VfxEffect = { asset: 'impact', durationMs: 500 }
export const DEFAULT_BIG_HIT_VFX: VfxEffect = { asset: 'big-hit', durationMs: 400 }

/**
 * Resuelve el VFX a mostrar para una fase fallida del desafio de defensa.
 * - Si el patron define `onFailureVfx.bigHit` o `onFailureVfx.impact` se usa ese.
 * - Si no, cae al default (impact no critico, big-hit critico).
 * - Si el patron no define overrides ni se indica crit, devuelve `impact`.
 *
 * Si el override es un array, devuelve el primer elemento (un solo gif por
 * fase, consistente con `resolveVfxForHit` en abilities/Abilities.ts).
 */
export function resolveFailureVfx(
  pattern: Pick<DefensePatternConfig, 'onFailureVfx'> | null | undefined,
  isCrit: boolean
): VfxEffect {
  const overrides = pattern?.onFailureVfx
  const slot = isCrit ? overrides?.bigHit : overrides?.impact
  const resolved = pickFirst(slot)
  if (resolved) return resolved
  return isCrit ? DEFAULT_BIG_HIT_VFX : DEFAULT_IMPACT_VFX
}

function pickFirst(value: VfxEffect | VfxEffect[] | undefined): VfxEffect | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value.length > 0 ? value[0] : undefined
  return value
}
