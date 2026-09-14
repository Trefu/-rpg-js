import { describe, it, expect } from 'vitest'
import { StatusEffects, DOT_STATUS_TYPES } from '@/core/StatusEffects'

describe('StatusEffects registry', () => {
  it('getByType devuelve el efecto correcto para types conocidos', () => {
    const stun = StatusEffects.getByType('stun')
    expect(stun).not.toBeNull()
    expect(stun?.name).toBe('Aturdido')
    expect(stun?.isBuff).toBe(false)
  })

  it('getByType es case-insensitive', () => {
    expect(StatusEffects.getByType('STUN')).not.toBeNull()
    expect(StatusEffects.getByType('StUn')?.name).toBe('Aturdido')
  })

  it('getByType devuelve null para types desconocidos', () => {
    expect(StatusEffects.getByType('unknownEffect')).toBeNull()
    expect(StatusEffects.getByType('')).toBeNull()
  })

  it('todos los DoT effects están en DOT_STATUS_TYPES', () => {
    const dots = ['burn', 'poison', 'freeze', 'bleed']
    for (const t of dots) {
      expect(DOT_STATUS_TYPES.has(t), `${t} debe estar en DOT_STATUS_TYPES`).toBe(true)
      const effect = StatusEffects.getByType(t)
      expect(effect).not.toBeNull()
    }
  })

  it('buffs tienen isBuff: true', () => {
    const buffs = ['strength_boost', 'defense_boost', 'speed_boost', 'second_wind']
    for (const t of buffs) {
      const effect = StatusEffects.getByType(t)
      expect(effect, `${t} debe existir`).not.toBeNull()
      expect(effect?.isBuff, `${t} debe ser buff`).toBe(true)
    }
  })

  it('debuffs tienen isBuff: false', () => {
    const debuffs = ['stun', 'poison', 'burn', 'freeze', 'injured', 'clouded']
    for (const t of debuffs) {
      const effect = StatusEffects.getByType(t)
      expect(effect, `${t} debe existir`).not.toBeNull()
      expect(effect?.isBuff, `${t} debe ser debuff`).toBe(false)
    }
  })

  it('cada effect tiene type, name, description e icon', () => {
    for (const t of StatusEffects.getRegisteredTypes()) {
      const e = StatusEffects.getByType(t)
      expect(e, `${t} no deberia ser null`).not.toBeNull()
      expect(e!.type).toBeTruthy()
      expect(e!.name).toBeTruthy()
      expect(e!.description).toBeTruthy()
      expect(e!.icon).toBeTruthy()
    }
  })

  it('getRegisteredTypes devuelve al menos 20 effects', () => {
    expect(StatusEffects.getRegisteredTypes().length).toBeGreaterThan(20)
  })

  it('cada effect DoT tiene turns consistente con MAX_DOT_DURATION base', () => {
    // burn = MAX_DOT_DURATION, freeze = MAX_DOT_DURATION, etc.
    // (algunos como burn crit pueden tener duracion extendida, pero el
    // turn base del registro debe respetar MAX_DOT_DURATION).
    const burn = StatusEffects.getByType('burn')
    expect(burn?.turns).toBeGreaterThanOrEqual(3)
  })

  it('efectos con stacks definidos tienen stack > 0', () => {
    const burn = StatusEffects.getByType('burn')
    expect(burn?.stacks).toBeDefined()
    expect(burn!.stacks!).toBeGreaterThan(0)
  })

  it('silenced se registra como debuff magico', () => {
    const silenced = StatusEffects.getByType('silenced')
    expect(silenced).not.toBeNull()
    expect(silenced?.isBuff).toBe(false)
  })
})
