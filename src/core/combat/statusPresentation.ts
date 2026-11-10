import type { IStatusEffect, StatusEffectSide } from '../interfaces/IStatusEffect'
import { getEffectCategory, getEffectDescription } from '../interfaces/IStatusEffect'
import { DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES, StatusEffects } from '../StatusEffects'

/** Presentation only: never decrements, applies or resolves an effect. */
export function presentStatus(effect: IStatusEffect, side: StatusEffectSide = 'player') {
  const category = getEffectCategory(effect, DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES)
  const isDot = category === 'dot'
  const template = StatusEffects.getByType(effect.type)
  const stacks = isDot || category === 'stack-based' || (typeof effect.stacks === 'number' && (template ? typeof template.stacks === 'number' : category !== 'charge-based'))
    ? effect.stacks ?? 1 : null
  const charges = category === 'charge-based' ? effect.charges ?? 0 : null
  const turns = Number.isFinite(effect.turns) && category !== 'stack-based' && charges === null
    ? effect.turns : null
  const polarity = effect.isBuff ? 'Beneficioso' : 'Perjudicial'
  const counters: string[] = []
  if (stacks !== null) counters.push(`${stacks} ${stacks === 1 ? 'acumulación' : 'acumulaciones'}`)
  if (charges !== null) counters.push(`${charges} carga${charges === 1 ? '' : 's'}`)
  if (turns !== null) counters.push(`${turns} turno${turns === 1 ? '' : 's'} del portador`)
  if (typeof effect.absorbRemaining === 'number') counters.push(`Escudo: ${effect.absorbRemaining} HP`)
  const damage = isDot ? (effect.stacks ?? 1) + Math.max(0, effect.damagePerTurn ?? 0) : null
  const rules: string[] = []
  if (isDot) rules.push(`Daño base: ${damage} al inicio de su turno, antes de resistencias y escudos. Reaplicar suma acumulaciones; no renueva la duración.`)
  if (category === 'stack-based') rules.push('No expira por turnos; se retira al consumir sus acumulaciones.')
  if (charges !== null) rules.push('No expira por turnos; se retira al consumir sus cargas.')
  if (effect.type === 'rooted') rules.push('Cada golpe recibido consume una acumulación e impide bloquear ese golpe.')
  const description = getEffectDescription(effect, side)
  return { category, isDot, stacks, charges, turns, damage, polarity, shield: effect.absorbRemaining ?? null,
    counters: counters.join(' · '), description, rules: rules.join(' '),
    label: `${effect.name} · ${polarity}${counters.length ? ` · ${counters.join(' · ')}` : ''}` }
}

export function isActiveStatus(effect: IStatusEffect) {
  const category = getEffectCategory(effect, DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES)
  return (effect.turns === undefined || effect.turns > 0) &&
    (effect.charges === undefined || effect.charges > 0) &&
    (category !== 'stack-based' || (effect.stacks ?? 1) > 0)
}

/** Compact changes for the local notice and the persistent combat log. */
export function statusChanges(before: IStatusEffect[], after: IStatusEffect[]): string[] {
  const changes: string[] = []
  const previous = new Map(before.filter(isActiveStatus).map(effect => [effect.type, effect]))
  const current = new Map(after.filter(isActiveStatus).map(effect => [effect.type, effect]))
  for (const [type, effect] of current) {
    const old = previous.get(type)
    if (!old) {
      const status = presentStatus(effect)
      changes.push(`${effect.name}${status.stacks !== null ? ` ×${status.stacks}` : ''}${status.charges !== null ? ` · ${status.charges} cargas` : ''}`)
    } else if (presentStatus(effect).stacks !== null && old.stacks !== effect.stacks) {
      changes.push(`${effect.name} ×${old.stacks ?? 1} → ×${effect.stacks ?? 1}`)
    } else if (old.charges !== effect.charges) {
      changes.push(`${effect.name}: ${old.charges} → ${effect.charges} cargas`)
    } else if (effect.turns > old.turns) {
      changes.push(`${effect.name}: duración renovada`)
    }
  }
  for (const [type, effect] of previous) {
    if (!current.has(type)) changes.push(`${effect.name} termina`)
  }
  return changes
}
