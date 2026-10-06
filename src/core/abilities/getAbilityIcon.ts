import { getAbility, getAllAbilities } from './registry'
import sabersChoc from '@/assets/icons/sabers-choc.png'

/**
 * Resuelve el ícono PNG de una ability a partir de su `type`.
 * Lee del registry central — cada ability declara su propio `icon` en su
 * definición, así que añadir una ability nueva no requiere tocar nada acá.
 *
 * Búsqueda case-insensitive: si el caller pasa 'warriorattack' y la ability
 * se registró como 'warriorAttack', igual resuelve.
 *
 * Fallback: `sabersChoc` (sabers cruzados), que ya era el fallback del
 * antiguo `abilityIcons.ts` antes del refactor.
 */
export function getAbilityIcon(type: string): string {
  const lower = type.toLowerCase()
  const direct = getAbility(lower)
  if (direct?.icon) return direct.icon
  for (const a of getAllAbilities()) {
    if (a.type.toLowerCase() === lower && a.icon) return a.icon
  }
  return sabersChoc
}
