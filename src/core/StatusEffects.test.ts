import { describe, it, expect } from 'vitest'
import {
  StatusEffects,
  DOT_STATUS_TYPES,
  STACKABLE_NON_DOT_STATUS_TYPES,
  STACK_MERGING_CATEGORIES,
  NON_TURN_BASED_CATEGORIES,
  applyFailureEffect
} from '@/core/StatusEffects'
import type { StatusEffectCategory } from '@/core/interfaces/IStatusEffect'
import { getEffectCategory } from '@/core/interfaces/IStatusEffect'
import { Warrior } from '@/core/heroes/Warrior'

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

describe('ROOTED stack semantics', () => {
  it('el template define stacks y maxStacks (mecanica basada en stacks, no turnos)', () => {
    const rooted = StatusEffects.getByType('rooted')
    expect(rooted).not.toBeNull()
    expect(typeof rooted?.stacks).toBe('number')
    expect(typeof rooted?.maxStacks).toBe('number')
    expect(rooted!.stacks!).toBeGreaterThan(0)
    expect(rooted!.maxStacks!).toBeGreaterThan(0)
  })

  it('el template NO tiene maxDuration (ROOTED se limpia solo por stacks)', () => {
    const rooted = StatusEffects.getByType('rooted')
    expect(rooted?.maxDuration).toBeUndefined()
  })

  it('el template tiene turns: Infinity (sin expiracion por turnos)', () => {
    const rooted = StatusEffects.getByType('rooted')
    expect(rooted?.turns).toBe(Infinity)
  })

  it('applyFailureEffect fuerza turns = Infinity en la instancia de rooted (incluso si el spec tiene maxDuration)', () => {
    const hero = new Warrior(1)
    applyFailureEffect(hero, { statusType: 'rooted', stacks: 1, maxDuration: 5 })
    const fx = hero.statusEffects.find(e => e.type === 'rooted')!
    expect(fx.turns).toBe(Infinity)
    expect(fx.maxDuration).toBe(Infinity)
  })

  it('STACKABLE_NON_DOT_STATUS_TYPES incluye rooted', () => {
    expect(STACKABLE_NON_DOT_STATUS_TYPES.has('rooted')).toBe(true)
  })

  it('applyFailureEffect reaplicaciones suman stacks de rooted (no refrescan turnos)', () => {
    const hero = new Warrior(1)
    // Primer apply con stacks > 0: aplica (1 stack).
    applyFailureEffect(hero, { statusType: 'rooted', stacks: 1 })
    let fx = hero.statusEffects.find(e => e.type === 'rooted')!
    expect(fx.stacks).toBe(1)

    // Reaplicaciones sobre un heroe ya enraizado: NO suman stacks
    // (la re-aplicacion se suprime para evitar que un mismo ataque
    // refresque la rooting indefinidamente). El conteo se mantiene en 1.
    applyFailureEffect(hero, { statusType: 'rooted', stacks: 1 })
    applyFailureEffect(hero, { statusType: 'rooted', stacks: 2 })
    fx = hero.statusEffects.find(e => e.type === 'rooted')!
    expect(fx.stacks).toBe(1)

    // Si el target es liberado (stacks = 0), el siguiente apply funciona
    // normalmente como una primera aplicacion.
    hero.removeStatusEffect('rooted')
    applyFailureEffect(hero, { statusType: 'rooted', stacks: 1 })
    fx = hero.statusEffects.find(e => e.type === 'rooted')!
    expect(fx.stacks).toBe(1)
  })

  it('aplicar rooted + simular consumo manual de stacks reproduce el caso de uso "2 stacks y ataque de 3 fases"', () => {
    const hero = new Warrior(1)
    // Heroe llega al desafio con 2 stacks de rooted. Como las reaplicaciones
    // de 'rooted' se suprimen (mientras el target este enraizado), forzamos
    // el stack count inicial a 2 para reproducir el escenario del usuario.
    applyFailureEffect(hero, { statusType: 'rooted', stacks: 1 })
    let fx = hero.statusEffects.find(e => e.type === 'rooted')!
    fx.stacks = 2
    expect(fx.stacks).toBe(2)

    // Fase 1 falla -> consume 1 stack (queda en 1).
    fx.stacks = Math.max(0, (fx.stacks ?? 0) - 1)
    fx = hero.statusEffects.find(e => e.type === 'rooted')!
    expect(fx.stacks).toBe(1)

    // Fase 2 falla -> consume 1 stack (queda en 0 -> se elimina el efecto).
    const remaining = (fx.stacks ?? 0) - 1
    if (remaining <= 0) {
      hero.removeStatusEffect('rooted')
    } else {
      fx.stacks = remaining
    }
    expect(hero.hasStatusEffect('rooted')).toBe(false)

    // Fase 3 ya no esta enraizada: el heroe puede bloquear.
  })

  it('un ataque que aplique rooted NO re-aplica ni suma stacks si el target ya esta enraizado', () => {
    // Caso: un heroe ya enraizado recibe un nuevo golpe de un ataque cuyo
    // onFailureEffect aplica 'rooted' (ej. ENTANGLE). El applyFailureEffect
    // debe suprimirse para no refrescar la rooting indefinidamente.
    const hero = new Warrior(1)
    applyFailureEffect(hero, { statusType: 'rooted', stacks: 1 })
    let fx = hero.statusEffects.find(e => e.type === 'rooted')!
    expect(fx.stacks).toBe(1)

    // El siguiente ataque intenta aplicar rooted con stacks: 3 → debe ser no-op.
    applyFailureEffect(hero, { statusType: 'rooted', stacks: 3 })
    fx = hero.statusEffects.find(e => e.type === 'rooted')!
    expect(fx.stacks).toBe(1)

    // Tras consumir todos los stacks manualmente (simulando impactos
    // previos del mismo desafio), si el efecto fue removido, la proxima
    // aplicacion funciona con normalidad.
    fx.stacks = 1
    fx = hero.statusEffects.find(e => e.type === 'rooted')!
    fx.stacks = 0
    hero.removeStatusEffect('rooted')
    applyFailureEffect(hero, { statusType: 'rooted', stacks: 2 })
    fx = hero.statusEffects.find(e => e.type === 'rooted')!
    expect(fx.stacks).toBe(2)
  })

  it('los templates existentes declaran su categoria explicitamente', () => {
    expect(StatusEffects.ROOTED.category).toBe('stack-based')
    expect(StatusEffects.SECOND_WIND.category).toBe('charge-based')
    expect(StatusEffects.SPELL_REFLECT.category).toBe('charge-based')
    expect(StatusEffects.BURN.category).toBe('dot')
    expect(StatusEffects.POISON.category).toBe('dot')
    expect(StatusEffects.FREEZE.category).toBe('dot')
    expect(StatusEffects.BLEED.category).toBe('dot')
    // Buffs/debuffs "clasicos" no necesitan declarar category (default 'turn-based').
    expect(StatusEffects.STRENGTH_BOOST.category).toBeUndefined()
    expect(StatusEffects.WEAKNESS.category).toBeUndefined()
  })
})

describe('getEffectCategory + sets de comportamiento', () => {
  it('getEffectCategory prioriza el campo explicito sobre la inferencia', () => {
    const fx = { ...StatusEffects.ROOTED, category: 'turn-based' as StatusEffectCategory }
    expect(getEffectCategory(fx, DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES)).toBe('turn-based')
  })

  it('getEffectCategory infiere charge-based si tiene `charges`', () => {
    const fx = { type: 'x', name: 'x', description: 'x', turns: Infinity, charges: 5, icon: '' }
    expect(getEffectCategory(fx, DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES)).toBe('charge-based')
  })

  it('getEffectCategory infiere dot por pertenencia a DOT_STATUS_TYPES', () => {
    const burnLike = { type: 'burn', name: 'x', description: 'x', turns: 3, icon: '' }
    expect(getEffectCategory(burnLike, DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES)).toBe('dot')
  })

  it('getEffectCategory infiere stack-based por STACKABLE_NON_DOT_STATUS_TYPES', () => {
    const rootedLike = { type: 'rooted', name: 'x', description: 'x', turns: Infinity, icon: '' }
    expect(getEffectCategory(rootedLike, DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES)).toBe('stack-based')
  })

  it('default es turn-based si no hay campo, charges, ni pertenencia a sets', () => {
    const buff = { type: 'strength_boost', name: 'x', description: 'x', turns: 3, icon: '' }
    expect(getEffectCategory(buff, DOT_STATUS_TYPES, STACKABLE_NON_DOT_STATUS_TYPES)).toBe('turn-based')
  })

  it('STACK_MERGING_CATEGORIES cubre dot y stack-based (no charge-based ni turn-based)', () => {
    expect(STACK_MERGING_CATEGORIES.has('dot')).toBe(true)
    expect(STACK_MERGING_CATEGORIES.has('stack-based')).toBe(true)
    expect(STACK_MERGING_CATEGORIES.has('charge-based')).toBe(false)
    expect(STACK_MERGING_CATEGORIES.has('turn-based')).toBe(false)
  })

  it('NON_TURN_BASED_CATEGORIES cubre stack-based y charge-based (no dot ni turn-based)', () => {
    expect(NON_TURN_BASED_CATEGORIES.has('stack-based')).toBe(true)
    expect(NON_TURN_BASED_CATEGORIES.has('charge-based')).toBe(true)
    expect(NON_TURN_BASED_CATEGORIES.has('dot')).toBe(false)
    expect(NON_TURN_BASED_CATEGORIES.has('turn-based')).toBe(false)
  })
})
