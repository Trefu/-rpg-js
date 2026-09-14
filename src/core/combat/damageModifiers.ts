import type { DamageTypeId } from './damageTypes'
import type { IStatusEffect } from '../interfaces/IStatusEffect'
import type { DefenseEffectSide, DefenseContribution } from '../interfaces/IStatusEffect'
import { MAX_PER_TYPE_RESISTANCE } from '../defense/modifiers'

/**
 * Suma los deltas `attackDamageMultiplier` de cada efecto activo del caster
 * sobre el base `1.0`. Se invoca en `rollAndApplyDamage` (abilities) y
 * `calculatePhaseDamage` (enemigos) para multiplicar el daño saliente.
 *
 * Cualquier buff que suba el dano infligido debe devolver
 * `{ attackDamageMultiplier: <delta> }` desde su `defenseContribution`,
 * igual que `STRENGTH_BOOST` ya hace.
 */
export function getOutgoingDamageMultiplier(
  effects: IStatusEffect[] | undefined
): number {
  let mult = 1.0
  for (const effect of effects ?? []) {
    if (effect.turns <= 0) continue
    const contribution: DefenseContribution | undefined = effect.defenseContribution?.(
      effect,
      'player' as DefenseEffectSide
    )
    if (!contribution) continue
    if (typeof contribution.attackDamageMultiplier === 'number') {
      mult += contribution.attackDamageMultiplier
    }
  }
  // Cap inferior: evita daño 0 (o negativo) por stacking buggy de debuffs
  // que en el futuro puedan reducir `attackDamageMultiplier`.
  return Math.max(0.25, mult)
}

/**
 * Resuelve el multiplicador TOTAL de daño entrante del target, compuesto por:
 *  1. `damageTakenMultiplier` (aditivo sobre 1.0; `weakness` lo sube).
 *  2. `damageTypeResistances` (reductivo por tipo elemental, con cap).
 *
 * El resultado final = `(1.0 + sumDeltaTaken) * (1 - resistance)`.
 *
 * Se invoca desde `Character.takeDamage` cuando se conoce el `damageType`
 * entrante. Si `damageType` es `undefined`, no se aplica la resistencia
 * elemental (solo el damageTakenMultiplier).
 */
export function getIncomingDamageMultiplier(
  effects: IStatusEffect[] | undefined,
  damageType?: DamageTypeId | string | null
): number {
  let taken = 1.0
  let resistance = 0
  for (const effect of effects ?? []) {
    if (effect.turns <= 0) continue
    const contribution: DefenseContribution | undefined = effect.defenseContribution?.(
      effect,
      'player' as DefenseEffectSide
    )
    if (!contribution) continue
    if (typeof contribution.damageTakenMultiplier === 'number') {
      taken += contribution.damageTakenMultiplier
    }
    if (damageType && contribution.damageTypeResistances) {
      const id = damageType as DamageTypeId
      const frac = contribution.damageTypeResistances[id]
      if (typeof frac === 'number' && frac > 0) {
        resistance = Math.min(MAX_PER_TYPE_RESISTANCE, resistance + frac)
      }
    }
  }
  // Cap inferior: evita que el target sea 100% invulnerable por stacking
  // accidental de debuffs que reduzcan `damageTakenMultiplier` en el futuro.
  const takenCapped = Math.max(0.25, taken)
  return takenCapped * (1 - resistance)
}
