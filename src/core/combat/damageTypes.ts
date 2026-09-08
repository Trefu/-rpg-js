/**
 * Tipos de daño del juego — única fuente de verdad.
 *
 * Antes los tipos estaban dispersos en 4 sitios (`IAbility.DamageType`,
 * `defense/types.AttackType`, `defense/types.DefensePatternConfig.damageType`
 * y `damageTypes.UnifiedDamageType`) y los labels vivian en `IAbility.DAMAGE_TYPE_LABELS`.
 * Aqui los reunimos todos en un solo registro, con:
 *   - `id`          → identificador canonico
 *   - `label`       → nombre legible en UI
 *   - `scaling`     → stat que escala este tipo de daño (`body` para fisico,
 *                     `mind` para todo lo demás)
 *   - `color`       → color CSS por defecto para badges, tags y fórmulas
 *   - `className`   → clase CSS aplicada a chips/badges de este tipo
 *   - `formulaClass`→ clase usada por spans v-html de fórmulas para
 *                     colorear el nombre del tipo (mismo sistema que
 *                     `hint-base / hint-cue / hint-mind` en hint-colors.css)
 *
 * Los IDs viejos (`frost`, `shadow`, `arcane`, `radiant`, `magical`) se
 * conservan como ALIASES via `LEGACY_TO_CANONICAL` para no romper el
 * código existente durante la migración. Las abilities/enemigos nuevos
 * deberían usar el IDs canónico (`water`, `arcane`, `holy`).
 */

export type DamageTypeId =
  | 'physical'
  | 'fire'
  | 'holy'
  | 'poison'
  | 'arcane'
  | 'electric'
  | 'water'

export type ScalingStat = 'body' | 'mind'

export interface DamageTypeInfo {
  id: DamageTypeId
  label: string
  scaling: ScalingStat
  /** Color CSS principal del tipo (texto en fórmulas y bordes de badges). */
  color: string
  /**
   * Clase CSS aplicada tanto a badges/chips (`<span class="dmg-XXX">`)
   * como a spans de fórmulas v-html. Es la misma clase en ambos casos
   * para tener una sola fuente de verdad.
   *
   * Para evitar colision con los hints de stat-chip (`hint-cue`,
   * `hint-mind`, etc.) usamos el prefijo `dmg-` — asi un span de
   * fórmula puede ser `class="dmg-fire"` sin pisar el coloreo de
   * `hint-cue` que ya usa `fire` semánticamente para ATQ.
   */
  className: string
}

/**
 * Registro canonico. Es la fuente de verdad — cualquier label/color/
 * clase que se muestre al usuario sale de aqui. Para añadir un tipo
 * de daño nuevo, basta con una entrada en este registro.
 */
export const DAMAGE_TYPES: Record<DamageTypeId, DamageTypeInfo> = {
  physical: {
    id: 'physical',
    label: 'Físico',
    scaling: 'body',
    color: '#d7ccc8',
    className: 'dmg-physical'
  },
  fire: {
    id: 'fire',
    label: 'Fuego',
    scaling: 'mind',
    color: '#ff8a3a',
    className: 'dmg-fire'
  },
  holy: {
    id: 'holy',
    label: 'Sagrado',
    scaling: 'mind',
    color: '#ffe066',
    className: 'dmg-holy'
  },
  poison: {
    id: 'poison',
    label: 'Veneno',
    scaling: 'mind',
    color: '#9ccc65',
    className: 'dmg-poison'
  },
  arcane: {
    id: 'arcane',
    label: 'Arcano',
    scaling: 'mind',
    color: '#b388ff',
    className: 'dmg-arcane'
  },
  electric: {
    id: 'electric',
    label: 'Eléctrico',
    scaling: 'mind',
    color: '#ffeb3b',
    className: 'dmg-electric'
  },
  water: {
    id: 'water',
    label: 'Agua',
    scaling: 'mind',
    color: '#64b5f6',
    className: 'dmg-water'
  }
}

/**
 * Aliases de IDs viejos al canonico. Cualquier código que use
 * `frost / shadow / radiant / magical / arcane` se normaliza via
 * `canonicalDamageType()` para evitar tipos duplicados.
 */
export const LEGACY_TO_CANONICAL: Record<string, DamageTypeId> = {
  frost: 'water',
  shadow: 'arcane',
  magical: 'arcane',
  radiant: 'holy',
  arcane: 'arcane'
}

/**
 * Set de tipos que escalan con `mind` (todo lo no físico). Reemplaza
 * al antiguo `MAGIC_DAMAGE_TYPES` en `defense/modifiers.ts`.
 */
export const MIND_SCALED_TYPES: ReadonlySet<DamageTypeId> = new Set(
  (Object.values(DAMAGE_TYPES) as DamageTypeInfo[])
    .filter(t => t.scaling === 'mind')
    .map(t => t.id)
)

/**
 * Dado un string (sea ID canonico o legacy), devuelve el ID canonico
 * o `undefined` si no es un tipo de daño conocido.
 */
export function canonicalDamageType(raw: string | null | undefined): DamageTypeId | undefined {
  if (!raw) return undefined
  if (raw in DAMAGE_TYPES) return raw as DamageTypeId
  const legacy = LEGACY_TO_CANONICAL[raw]
  return legacy
}

/**
 * `ScalingStat` para un `DamageType`. Default `body` si el tipo es
 * desconocido (compatibilidad hacia atras).
 */
export function getScalingStat(damageType: string | null | undefined): ScalingStat {
  const id = canonicalDamageType(damageType)
  if (!id) return 'body'
  return DAMAGE_TYPES[id].scaling
}

export function getDamageTypeInfo(damageType: string | null | undefined): DamageTypeInfo | undefined {
  const id = canonicalDamageType(damageType)
  if (!id) return undefined
  return DAMAGE_TYPES[id]
}

/**
 * Etiqueta legible. Devuelve `'Físico'` como fallback (también es el
 * label que usa la defensa por default).
 */
export function getDamageTypeLabel(damageType: string | null | undefined): string {
  return getDamageTypeInfo(damageType)?.label ?? DAMAGE_TYPES.physical.label
}

/**
 * Coeficiente de escalado por stat. Coincide con el del `Hero`:
 * `body * 0.5 + level` y `mind * 0.4 + level`.
 */
export const SCALING_COEFFICIENTS: Record<ScalingStat, number> = {
  body: 0.5,
  mind: 0.4
}

export function getScalingCoefficient(stat: ScalingStat): number {
  return SCALING_COEFFICIENTS[stat] ?? 0.5
}