import type { ICharacter } from '../interfaces/ICharacter'

/** Matches the first active absorption shield consumed by Character.takeDamage. */
export function getShieldAmount(character: ICharacter | null | undefined): number {
  if (!character?.isAlive) return 0
  return character.statusEffects.find(effect => effect.turns > 0
    && typeof effect.absorbRemaining === 'number' && effect.absorbRemaining > 0)?.absorbRemaining ?? 0
}

export function healthWithShield(character: ICharacter | null | undefined): string {
  if (!character) return ''
  const shield = getShieldAmount(character)
  return `${character.health}/${character.maxHealth}${shield > 0 ? ` +${shield} escudo` : ''}`
}
