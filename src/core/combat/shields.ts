import type { ICharacter } from '../interfaces/ICharacter'

/** Total temporary HP, matching the shields consumed by Character.takeDamage. */
export function getShieldAmount(character: ICharacter | null | undefined): number {
  if (!character?.isAlive) return 0
  return character.statusEffects.reduce((total, effect) => total + (effect.turns > 0
    && typeof effect.absorbRemaining === 'number' && effect.absorbRemaining > 0 ? effect.absorbRemaining : 0), 0)
}

export function healthWithShield(character: ICharacter | null | undefined): string {
  if (!character) return ''
  const shield = getShieldAmount(character)
  return `${character.health}/${character.maxHealth}${shield > 0 ? ` +${shield} escudo` : ''}`
}

/** Each lane uses maximum HP as its scale, never current HP or HP + shield. */
export function getShieldLayers(amount: number, maxHealth: number): { percent: number; units: number }[] {
  if (amount <= 0 || maxHealth <= 0) return []
  const count = Math.ceil(amount / maxHealth)
  // Keep even unusually large shields legible in the existing health track.
  return Array.from({ length: Math.min(count, 4) }, (_, index) => {
    const remaining = amount - index * maxHealth
    return { percent: Math.min(100, remaining / maxHealth * 100),
      units: index === 3 ? Math.ceil(remaining / maxHealth) : 1 }
  })
}
