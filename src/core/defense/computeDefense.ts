import type { IStat } from '../interfaces/ICharacter'

/**
 * Defensa base de cualquier combatiente. Es el "piso" del que parte el cálculo
 * de defensa: sin body ni mente por encima de 10, el personaje sigue
 * teniendo esta cantidad de mitigación solo por existir.
 */
export const DEFENSE_BASE = 10

/**
 * Stat de `body` considerado neutral: por debajo de este valor no resta
 * defensa (penalizaría a personajes magos/ágiles sin justificación).
 */
export const BODY_NEUTRAL = 10

/**
 * Stat de `constitution` neutral: por debajo de este valor no aporta buff.
 */
export const CONSTITUTION_NEUTRAL = 10

/**
 * Multiplicador del bonus de constitución. Pequeño a propósito: la
 * constitución describe "resistencia física y vitalidad", no debería
 * eclipsar al body (que es la stat defensiva principal).
 */
export const CONSTITUTION_DEFENSE_SCALE = 0.5

/**
 * Stat de `mind` neutral: por debajo de este valor no aporta buff mágico.
 * Mismo shape que BODY_NEUTRAL para que las dos defensas se sientan simétricas.
 */
export const MIND_NEUTRAL = 10

/**
 * Calcula la defensa efectiva de un combatiente a partir de sus stats base.
 *
 * Componentes:
 *   - base: constante (DEFENSE_BASE) — el "piso" de mitigación.
 *   - body: escala logarítmica sobre BODY_NEUTRAL (mismo shape que el cálculo
 *     de attack(), evita que body altos revienten la fórmula).
 *   - constitución: bonus lineal pequeño sobre CONSTITUTION_NEUTRAL.
 *
 * No incluye nivel: las stats crecen via `growthPerLevel` y queremos que la
 * defensa sea 100% determinista a partir de los stats puros del personaje.
 *
 * Compartida por Hero y Enemy (mismas IPlayerStats/IEnemyStats con la misma
 * shape: agility, constitution, mind, body).
 */
export function computeDefense(body: IStat, constitution: IStat): number {
  const bodyBonus = Math.log(1 + Math.max(0, body.value - BODY_NEUTRAL)) * 4
  const constiBonus = Math.max(0, constitution.value - CONSTITUTION_NEUTRAL) * CONSTITUTION_DEFENSE_SCALE
  return Math.round(DEFENSE_BASE + bodyBonus + constiBonus)
}

/**
 * Calcula la defensa mágica efectiva de un combatiente a partir de su `mind`.
 *
 * Componentes:
 *   - base: constante (DEFENSE_BASE) — el "piso" de mitigación.
 *   - mind: escala logarítmica sobre MIND_NEUTRAL (mismo shape que body en la
 *     defensa física, evita que mind altos revienten la fórmula).
 *
 * No usa constitución: la constitución describe "resistencia física y
 * vitalidad", por lo que deliberadamente NO aporta a la defensa mágica.
 * Así mind es el stat puro que mejora la mitigación contra hechizos /
 * fuego / frío / veneno / etc.
 *
 * No incluye nivel: mismo criterio que `computeDefense`.
 */
export function computeMagicDefense(mind: IStat): number {
  const mindBonus = Math.log(1 + Math.max(0, mind.value - MIND_NEUTRAL)) * 4
  return Math.round(DEFENSE_BASE + mindBonus)
}