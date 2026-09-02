/**
 * Modelo de critico estilo Warframe:
 *  - `critChance` se almacena en **puntos de porcentaje** (0-200+), no en [0,1].
 *  - Un solo roll `random(0, 100)`.
 *  - Si `roll >= critChance` → no crit (multiplier 1).
 *  - Si `roll < 100`       → crit normal (multiplier 2).
 *  - Si `roll >= 100`      → OVERCRIT (multiplier 3) — solo posible si
 *                             `critChance > 100`.
 *  - Cualquier valor por encima de 200 satura: todo crit sera overcrit.
 *
 * Por que `rollCritFromChance` recibe `critChancePct` ya efectivo (despues
 * de bonuses como el de agilidad): cada combatiente calcula su propio
 * "effective crit chance" en `getEffectiveCritChance()` y este helper solo
 * resuelve el roll + el multiplicador. Asi evitamos duplicar la formula.
 */
export type CritMultiplier = 1 | 2 | 3

export interface CritResult {
  /** Multiplicador de dano: 1 = no crit, 2 = crit, 3 = overcrit. */
  multiplier: CritMultiplier
  /** `true` cuando hubo crit (normal o over). Mantiene compatibilidad con
   *  call sites que solo necesitan el boolean. */
  isCrit: boolean
  /** `true` solo si el roll paso el umbral de 100%. */
  isOvercrit: boolean
}

export const CRIT_MULTIPLIER: CritMultiplier = 2
export const OVERCRIT_MULTIPLIER: CritMultiplier = 3

/** Stat de agilidad neutral: por debajo de este valor no aporta bonus de crit. */
export const AGILITY_NEUTRAL = 10
/**
 * Multiplicador del bonus logaritmico de agilidad (en puntos de porcentaje).
 * Compartido por Hero y Enemy para que ambos escalen igual.
 */
export const AGILITY_CRIT_SCALE = 2

/**
 * Bonus de crit chance por encima del neutro de agilidad. Mismo shape que
 * la defensa (log sobre 10), pensado para que valores altos no revienten.
 *
 * `critChance = baseCritChance + computeAgilityCritBonus(agility)`.
 */
export function computeAgilityCritBonus(agility: number): number {
  return Math.log(1 + Math.max(0, agility - AGILITY_NEUTRAL)) * AGILITY_CRIT_SCALE
}

/**
 * Resuelve la tirada de critico a partir de una chance en puntos de
 * porcentaje. `rng` es inyectable para tests; por defecto usa `Math.random`.
 */
export function rollCritFromChance(
  critChancePct: number,
  rng: () => number = Math.random
): CritResult {
  const chance = Math.max(0, critChancePct)
  const roll = rng() * 100
  if (roll >= chance) {
    return { multiplier: 1, isCrit: false, isOvercrit: false }
  }
  if (roll >= 100) {
    return { multiplier: OVERCRIT_MULTIPLIER, isCrit: true, isOvercrit: true }
  }
  return { multiplier: CRIT_MULTIPLIER, isCrit: true, isOvercrit: false }
}
