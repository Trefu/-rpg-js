import { describe, expect, it } from 'vitest'
import './Abilities'
import './MountainActions'
import './EnemyAttacks'
import { getAllAbilities } from './registry'

describe('Descripciones de habilidades claras', () => {
  it.each(getAllAbilities().map(ability => [ability.name, ability.description]))(
    '%s no incluye cálculos ni cantidades salvo duraciones', (_name, description) => {
      const withoutDurations = description.replace(/\b\d+\s+turnos?\b/g, '')
      expect(withoutDurations).not.toMatch(/[\d%×⌊⌋=+]|\b(?:coeficiente|bono por mente|veces|caster|allies)\b/i)
    }
  )
})
