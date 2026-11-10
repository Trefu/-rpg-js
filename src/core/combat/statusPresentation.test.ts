import { describe, expect, it } from 'vitest'
import { StatusEffects } from '../StatusEffects'
import { presentStatus, isActiveStatus, statusChanges } from './statusPresentation'

describe('Presentación compartida de estados', () => {
  it.each([StatusEffects.BURN, StatusEffects.POISON, StatusEffects.FREEZE, StatusEffects.BLEED])(
    '$name muestra la primera acumulación y su daño', effect => {
      const status = presentStatus({ ...effect, stacks: 1, turns: 2 })
      expect(status.isDot).toBe(true)
      expect(status.stacks).toBe(1)
      expect(status.damage).toBe(1)
      expect(status.label).toContain('1 acumulación')
      expect(status.counters).toContain('2 turnos del portador')
    })
  it('no confunde cargas ni acumulaciones consumibles con turnos infinitos', () => {
    const charges = presentStatus({ ...StatusEffects.SECOND_WIND, charges: 3 })
    expect(charges.turns).toBeNull()
    expect(charges.counters).toContain('3 cargas')
    expect(charges.label).not.toMatch(/Infinity|permanente/)
    expect(presentStatus(StatusEffects.ROOTED).turns).toBeNull()
  })
  it('utiliza la descripción del bando correcto', () => {
    const effect = { ...StatusEffects.POISON, descriptionOnPlayer: 'Aliado', descriptionOnEnemy: 'Enemigo' }
    expect(presentStatus(effect, 'player').description).toBe('Aliado')
    expect(presentStatus(effect, 'enemy').description).toBe('Enemigo')
  })
  it('no inventa acumulaciones para buffs y filtra estados consumidos', () => {
    expect(presentStatus(StatusEffects.STRENGTH_BOOST).stacks).toBeNull()
    expect(presentStatus({ ...StatusEffects.WEAKNESS, stacks: 1, maxStacks: 999 }).stacks).toBeNull()
    expect(isActiveStatus({ ...StatusEffects.SECOND_WIND, charges: 0 })).toBe(false)
    expect(isActiveStatus({ ...StatusEffects.POISON, turns: 0 })).toBe(false)
  })
  it('describe aplicación, acumulaciones y retirada sin ruido por cada decremento de turno', () => {
    const first = { ...StatusEffects.POISON, stacks: 1 }
    expect(statusChanges([], [first])).toEqual(['Envenenado ×1'])
    expect(statusChanges([first], [{ ...first, stacks: 3 }])).toEqual(['Envenenado ×1 → ×3'])
    expect(statusChanges([first], [{ ...first, turns: first.turns - 1 }])).toEqual([])
    expect(statusChanges([first], [])).toEqual(['Envenenado termina'])
  })
})
