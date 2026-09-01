export type UnifiedDamageType =
  | 'physical'
  | 'fire'
  | 'frost'
  | 'poison'
  | 'shadow'
  | 'arcane'
  | 'holy'
  | 'radiant'
  | 'magical'

export type ScalingStat = 'body' | 'mind'

export const DAMAGE_SCALING: Record<UnifiedDamageType, ScalingStat> = {
  physical: 'body',
  fire: 'mind',
  frost: 'mind',
  poison: 'mind',
  shadow: 'mind',
  arcane: 'mind',
  holy: 'mind',
  radiant: 'mind',
  magical: 'mind'
}

export const SCALING_COEFFICIENTS: Record<ScalingStat, number> = {
  body: 0.5,
  mind: 0.4
}

export function getScalingStat(damageType: UnifiedDamageType): ScalingStat {
  return DAMAGE_SCALING[damageType] ?? 'body'
}

export function getScalingCoefficient(stat: ScalingStat): number {
  return SCALING_COEFFICIENTS[stat] ?? 0.5
}
