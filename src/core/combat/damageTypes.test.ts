import { describe, it, expect } from 'vitest'
import {
  DAMAGE_TYPES,
  canonicalDamageType,
  getScalingStat,
  getScalingCoefficient,
  getDamageTypeLabel,
  getDamageTypeInfo,
  MIND_SCALED_TYPES,
  LEGACY_TO_CANONICAL
} from '@/core/combat/damageTypes'

describe('DAMAGE_TYPES registry', () => {
  it('cada tipo canonico tiene id, label, scaling, color y className', () => {
    for (const t of Object.values(DAMAGE_TYPES)) {
      expect(t.id).toBeTruthy()
      expect(t.label).toBeTruthy()
      expect(['body', 'mind']).toContain(t.scaling)
      expect(t.color).toMatch(/^#[0-9a-f]{3,8}$/i)
      expect(t.className).toMatch(/^dmg-/)
    }
  })

  it('physical es el unico que escala con body', () => {
    expect(DAMAGE_TYPES.physical.scaling).toBe('body')
    for (const t of Object.values(DAMAGE_TYPES)) {
      if (t.id === 'physical') continue
      expect(t.scaling).toBe('mind')
    }
  })

  it('MIND_SCALED_TYPES contiene todos los tipos magicos', () => {
    expect(MIND_SCALED_TYPES.has('fire')).toBe(true)
    expect(MIND_SCALED_TYPES.has('holy')).toBe(true)
    expect(MIND_SCALED_TYPES.has('arcane')).toBe(true)
    expect(MIND_SCALED_TYPES.has('electric')).toBe(true)
    expect(MIND_SCALED_TYPES.has('water')).toBe(true)
    expect(MIND_SCALED_TYPES.has('poison')).toBe(true)
    expect(MIND_SCALED_TYPES.has('physical')).toBe(false)
  })
})

describe('canonicalDamageType', () => {
  it('IDs canonicos pasan tal cual', () => {
    expect(canonicalDamageType('physical')).toBe('physical')
    expect(canonicalDamageType('fire')).toBe('fire')
    expect(canonicalDamageType('holy')).toBe('holy')
  })

  it('IDs legacy se mapean al canonico', () => {
    expect(canonicalDamageType('frost')).toBe('water')
    expect(canonicalDamageType('shadow')).toBe('arcane')
    expect(canonicalDamageType('magical')).toBe('arcane')
    expect(canonicalDamageType('radiant')).toBe('holy')
  })

  it('IDs desconocidos devuelven undefined', () => {
    expect(canonicalDamageType('nuclear')).toBeUndefined()
    expect(canonicalDamageType('')).toBeUndefined()
    expect(canonicalDamageType(null)).toBeUndefined()
    expect(canonicalDamageType(undefined)).toBeUndefined()
  })

  it('LEGACY_TO_CANONICAL no tiene huecos (cubrir todos los tipos)', () => {
    // Smoke check: cada legacy deberia apuntar a un tipo canonico valido.
    for (const legacy of Object.keys(LEGACY_TO_CANONICAL)) {
      const canonical = LEGACY_TO_CANONICAL[legacy]
      expect(DAMAGE_TYPES[canonical], `legacy "${legacy}" maps to invalid "${canonical}"`).toBeDefined()
    }
  })
})

describe('getScalingStat', () => {
  it('physical → body', () => {
    expect(getScalingStat('physical')).toBe('body')
  })

  it('todos los demas → mind', () => {
    expect(getScalingStat('fire')).toBe('mind')
    expect(getScalingStat('holy')).toBe('mind')
    expect(getScalingStat('arcane')).toBe('mind')
    expect(getScalingStat('electric')).toBe('mind')
    expect(getScalingStat('water')).toBe('mind')
    expect(getScalingStat('poison')).toBe('mind')
  })

  it('legacy frost → mind (agua)', () => {
    expect(getScalingStat('frost')).toBe('mind')
  })

  it('default a body si es desconocido', () => {
    expect(getScalingStat(undefined)).toBe('body')
    expect(getScalingStat(null)).toBe('body')
    expect(getScalingStat('nope')).toBe('body')
  })
})

describe('getScalingCoefficient', () => {
  it('body = 0.5 (mismo coeficiente que Hero.attack)', () => {
    expect(getScalingCoefficient('body')).toBe(0.5)
  })

  it('mind = 0.4', () => {
    expect(getScalingCoefficient('mind')).toBe(0.4)
  })

  it('default a 0.5 si el stat es desconocido', () => {
    expect(getScalingCoefficient('nope' as never)).toBe(0.5)
  })
})

describe('getDamageTypeLabel', () => {
  it('devuelve el label legible canonico', () => {
    expect(getDamageTypeLabel('physical')).toBe('Físico')
    expect(getDamageTypeLabel('fire')).toBe('Fuego')
    expect(getDamageTypeLabel('holy')).toBe('Sagrado')
    expect(getDamageTypeLabel('water')).toBe('Agua')
  })

  it('legacy → label canonico', () => {
    expect(getDamageTypeLabel('frost')).toBe('Agua')
    expect(getDamageTypeLabel('shadow')).toBe('Arcano')
    expect(getDamageTypeLabel('radiant')).toBe('Sagrado')
  })

  it('unknown → "Físico" (fallback)', () => {
    expect(getDamageTypeLabel('nope')).toBe('Físico')
    expect(getDamageTypeLabel(undefined)).toBe('Físico')
  })
})

describe('getDamageTypeInfo', () => {
  it('devuelve el registro completo', () => {
    const fire = getDamageTypeInfo('fire')
    expect(fire?.label).toBe('Fuego')
    expect(fire?.color).toBe('#ff8a3a')
    expect(fire?.className).toBe('dmg-fire')
  })

  it('unknown → undefined', () => {
    expect(getDamageTypeInfo('nope')).toBeUndefined()
  })
})
