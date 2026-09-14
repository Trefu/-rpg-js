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
 * Slashes enemigos usados cuando el jugador falla al bloquear.
 *
 * - El pool `ENEMY_SLASH_POOL` (4 slashes) se cicla por fase: con 1 fase
 *   sale el 1, con 2 el 1,2, con 3+ el 1,2,3,4,1,2,3,4… (`phaseIndex % 4`).
 * - El `ENEMY_SLASH_CRIT` se usa cuando el ataque era critico.
 *
 * Todos van marcados `mirrored: true` porque se renderizan sobre la carta
 * del heroe y deben "venir desde el lado del enemigo" (la UI aplica
 * `scaleX(-1)` al dibujarlos).
 *
 * Duracion uniforme de 1200ms para que cualquier GIF (7-10 frames) se
 * vea entero sin cortarse.
 */
const enemySlash = (asset: VfxEffect['asset']): VfxEffect => ({
  asset,
  durationMs: 1200,
  mirrored: true
})

const ENEMY_SLASH_1: VfxEffect = enemySlash('enemy-slash-1')
const ENEMY_SLASH_2: VfxEffect = enemySlash('enemy-slash-2')
const ENEMY_SLASH_3: VfxEffect = enemySlash('enemy-slash-3')
const ENEMY_SLASH_4: VfxEffect = enemySlash('enemy-slash-4')
const ENEMY_SLASH_CRIT: VfxEffect = enemySlash('enemy-slash-5')

const ENEMY_SLASH_POOL: VfxEffect[] = [ENEMY_SLASH_1, ENEMY_SLASH_2, ENEMY_SLASH_3, ENEMY_SLASH_4]

/**
 * Resuelve el VFX a mostrar cuando el jugador falla al bloquear una fase
 * del desafio de defensa.
 *
 * - Si el patron define `onFailureVfx.bigHit` o `onFailureVfx.impact`
 *   se usa ese (el override manda sobre la logica de crit/ciclo).
 * - Si no, se aplican los slashes enemigos espejados:
 *   - critico  -> `enemy-slash-5` (un solo golpe grande).
 *   - normal   -> ciclo 1,2,3,4 segun `phaseIndex` (repite si hay mas
 *                 fases). Esto replica la logica de `resolveVfxForHit`
 *                 usada en abilities/Abilities.ts para los ataques del
 *                 jugador.
 * - Si `phaseIndex` no se pasa (legacy), se trata como fase 0.
 */
export function resolveFailureVfx(
  pattern: Pick<DefensePatternConfig, 'onFailureVfx'> | null | undefined,
  isCrit: boolean,
  phaseIndex: number = 0
): VfxEffect {
  const overrides = pattern?.onFailureVfx
  const slot = isCrit ? overrides?.bigHit : overrides?.impact
  const resolved = pickFirst(slot)
  if (resolved) return resolved
  if (isCrit) return ENEMY_SLASH_CRIT
  const safeIndex = Math.max(0, Math.floor(phaseIndex))
  return ENEMY_SLASH_POOL[safeIndex % ENEMY_SLASH_POOL.length]
}

function pickFirst(value: VfxEffect | VfxEffect[] | undefined): VfxEffect | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value.length > 0 ? value[0] : undefined
  return value
}
