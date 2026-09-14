import { describe, it, expect } from 'vitest'
import {
  applyDamageVariance,
  computeRawDamage,
  damageStep,
  previewFromPipeline,
  describePipeline,
  dealDamage,
  DAMAGE_VARIANCE_MIN,
  DAMAGE_VARIANCE_MAX
} from '@/core/abilities/damagePipeline'
import type { IAbility } from '@/core/interfaces/IAbility'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import type { CritResult } from '@/core/crit'

/**
 * Helpers para construir combatientes fake con la estructura mínima que
 * necesitan `computeRawDamage` y `dealDamage`. Sin tocar Hero/Enemy reales
 * para mantener los tests aislados y rapidos.
 */
function fakeStatBearer(body: number, mind: number, level: number = 1) {
  return {
    level,
    baseStats: {
      body: { value: body, growthPerLevel: 0 },
      mind: { value: mind, growthPerLevel: 0 },
      agility: { value: 10, growthPerLevel: 0 },
      constitution: { value: 10, growthPerLevel: 0 }
    }
  }
}

function fakeCaster(body: number, mind: number, level: number = 1) {
  return {
    ...fakeStatBearer(body, mind, level),
    statusEffects: [] as IStatusEffect[],
    name: 'TestCaster',
    rollCrit: (): CritResult => ({ multiplier: 1 as const, isCrit: false, isOvercrit: false })
  }
}

function fakeTarget() {
  return {
    id: 'target-1',
    name: 'TestTarget',
    isAlive: true,
    health: 100,
    maxHealth: 100,
    takeDamage: () => {}
  }
}

describe('applyDamageVariance', () => {
  it('devuelve 0 si amount <= 0', () => {
    expect(applyDamageVariance(0)).toBe(0)
    expect(applyDamageVariance(-5)).toBe(0)
  })

  it('siempre cae dentro del rango [min*amount, max*amount] (floored)', () => {
    // Muestreo amplio para evitar flake por randomness
    for (let i = 0; i < 200; i++) {
      const raw = 100
      const result = applyDamageVariance(raw)
      expect(result).toBeGreaterThanOrEqual(Math.floor(raw * DAMAGE_VARIANCE_MIN))
      expect(result).toBeLessThanOrEqual(Math.floor(raw * DAMAGE_VARIANCE_MAX))
    }
  })

  it('acepta un range custom', () => {
    const result = applyDamageVariance(100, { min: 0.5, max: 0.5 })
    expect(result).toBe(50)
  })

  it('es determinista si min === max', () => {
    for (let i = 0; i < 20; i++) {
      expect(applyDamageVariance(40, { min: 1.5, max: 1.5 })).toBe(60)
    }
  })
})

describe('computeRawDamage', () => {
  it('step simple body: body*coef + level*levelCoef', () => {
    const step = damageStep({ stat: 'body', coef: 0.7, levelCoef: 1 })
    const caster = fakeStatBearer(10, 10, 3)
    // (10 * 0.7) + (3 * 1) = 7 + 3 = 10
    expect(computeRawDamage(step, caster)).toBeCloseTo(10, 5)
  })

  it('step simple mind: mind*coef + level*levelCoef', () => {
    const step = damageStep({ stat: 'mind', coef: 2.0, levelCoef: 1.5 })
    const caster = fakeStatBearer(10, 15, 4)
    // (15 * 2) + (4 * 1.5) = 30 + 6 = 36
    expect(computeRawDamage(step, caster)).toBe(36)
  })

  it('aplica el multiplier del step', () => {
    const step = damageStep({ stat: 'body', coef: 1, levelCoef: 0, multiplier: 0.8 })
    const caster = fakeStatBearer(10, 10, 1)
    // (10 * 1 + 0) * 0.8 = 8
    expect(computeRawDamage(step, caster)).toBeCloseTo(8, 5)
  })

  it('un pipeline de varios steps suma los aportes', () => {
    const pipeline = [
      damageStep({ stat: 'body', coef: 0.5, levelCoef: 0 }),
      damageStep({ stat: 'mind', coef: 1.0, levelCoef: 0 })
    ]
    const caster = fakeStatBearer(20, 10, 1)
    // (20 * 0.5) + (10 * 1.0) = 10 + 10 = 20
    expect(computeRawDamage(pipeline, caster)).toBe(20)
  })

  it('acepta pipeline como array o como step unico', () => {
    const step = damageStep({ stat: 'body', coef: 1, levelCoef: 0 })
    const caster = fakeStatBearer(7, 0, 1)
    expect(computeRawDamage(step, caster)).toBe(computeRawDamage([step], caster))
  })

  it('multiplier default es 1 (identity)', () => {
    const without = damageStep({ stat: 'body', coef: 1, levelCoef: 0 })
    const withExplicit = damageStep({ stat: 'body', coef: 1, levelCoef: 0, multiplier: 1 })
    const caster = fakeStatBearer(10, 0, 1)
    expect(computeRawDamage(without, caster)).toBe(computeRawDamage(withExplicit, caster))
  })
})

describe('describePipeline (formula coloreada)', () => {
  it('incluye el label del stat (CUE o MEN) y el nivel', () => {
    const step = damageStep({ stat: 'body', coef: 0.7, levelCoef: 1, statLabel: 'CUE' })
    const caster = fakeStatBearer(10, 0, 3)
    const formula = describePipeline(step, caster)
    expect(formula).toContain('CUE')
    expect(formula).toContain('nivel')
    expect(formula).toContain('3')
  })

  it('muestra el multiplier si difiere de 1', () => {
    const step = damageStep({ stat: 'body', coef: 0.7, levelCoef: 0.5, multiplier: 0.8 })
    const formula = describePipeline(step, fakeStatBearer(10, 0, 1))
    expect(formula).toContain('× 0.8')
  })

  it('omite el multiplier cuando es 1 (no envuelve la expresion en parentesis × multiplier)', () => {
    const stepWithout = damageStep({ stat: 'body', coef: 0.7, levelCoef: 1 })
    const stepWithOne = damageStep({ stat: 'body', coef: 0.7, levelCoef: 1, multiplier: 1 })
    const caster = fakeStatBearer(10, 0, 3)
    // Misma formula en ambos casos (multiplier 1 = identity, no debe envolverse)
    expect(describePipeline(stepWithout, caster)).toBe(describePipeline(stepWithOne, caster))
  })

  it('une multiples steps con +', () => {
    const pipeline = [
      damageStep({ stat: 'body', coef: 0.5, levelCoef: 0 }),
      damageStep({ stat: 'mind', coef: 1.0, levelCoef: 0 })
    ]
    const formula = describePipeline(pipeline, fakeStatBearer(10, 10, 1))
    expect(formula).toContain(' + ')
  })
})

describe('previewFromPipeline', () => {
  it('genera un previewDamage con min/max consistentes con la varianza', () => {
    const pipeline = damageStep({ stat: 'body', coef: 1, levelCoef: 0 })
    const previewFn = previewFromPipeline(pipeline, 'physical')
    const preview = previewFn(fakeStatBearer(100, 0, 1) as never)
    // raw = 100, range = [90, 110]
    expect(preview.min).toBe(90)
    expect(preview.max).toBe(110)
    expect(preview.damageTypeLabel).toBeDefined()
    expect(preview.formula).toContain('CUE')
  })

  it('preview para raw chico (1) muestra el rango con varianza', () => {
    const pipeline = damageStep({ stat: 'body', coef: 1, levelCoef: 0 })
    const previewFn = previewFromPipeline(pipeline, 'physical')
    const preview = previewFn(fakeStatBearer(1, 0, 1) as never)
    // raw = 1, range = [floor(0.9), floor(1.1)] = [0, 1]
    expect(preview.min).toBe(0)
    expect(preview.max).toBe(1)
  })

  it('raw = 0 produce un preview con min/max en 0', () => {
    const pipeline = damageStep({ stat: 'body', coef: 0, levelCoef: 0 })
    const previewFn = previewFromPipeline(pipeline, 'fire')
    const preview = previewFn(fakeStatBearer(0, 0, 1) as never)
    expect(preview.min).toBe(0)
    expect(preview.max).toBe(0)
  })
})

describe('dealDamage (pipeline completo)', () => {
  const baseAbility: IAbility = {
    name: 'Test Strike',
    description: 'test',
    type: 'test',
    cooldown: 0,
    damageType: 'physical',
    targetType: 'enemies-only',
    pipeline: damageStep({ stat: 'body', coef: 1, levelCoef: 0 }),
    execute: async () => {}
  }

  function makeEffects() {
    return {
      log: () => {},
      showEnemyHit: () => {},
      playEnemyVfx: () => {},
      showPlayerHit: () => {},
      showAnnouncement: () => {},
      audioManager: { playCustomSound: () => {}, playAttackSound: () => {}, playHitSound: () => {} } as never
    }
  }

  it('aplica takeDamage, hit popup, log y SFX', () => {
    const effects = makeEffects()
    let tookDamage = 0
    let damageTypeArg: string | undefined
    let hitValue = 0
    let loggedMessage = ''
    const target = {
      id: 't1',
      name: 'T',
      isAlive: true,
      takeDamage: (amount: number, opts?: { damageType?: string }) => {
        tookDamage = amount
        damageTypeArg = opts?.damageType
      }
    }
    const caster = fakeCaster(100, 0, 1)
    const result = dealDamage({
      caster,
      target: target as never,
      ability: baseAbility,
      rawDamage: 50,
      effects: {
        ...effects,
        showEnemyHit: (_id, v) => { hitValue = v },
        log: (m) => { loggedMessage = m }
      }
    })
    expect(result.finalDamage).toBeGreaterThan(0)
    expect(tookDamage).toBe(result.finalDamage)
    expect(damageTypeArg).toBe('physical')
    expect(hitValue).toBe(result.finalDamage)
    expect(loggedMessage).toContain('Test Strike')
  })

  it('raw 0 → no aplica daño y devuelve finalDamage 0', () => {
    const effects = makeEffects()
    let tookDamage = -1
    const target = {
      id: 't1',
      takeDamage: (amount: number) => { tookDamage = amount }
    }
    const result = dealDamage({
      caster: fakeCaster(0, 0, 1),
      target: target as never,
      ability: baseAbility,
      rawDamage: 0,
      effects
    })
    expect(result.finalDamage).toBe(0)
    expect(tookDamage).toBe(-1) // no se llamo
  })

  it('sigue funcionando cuando el caster es un Enemy (no Hero)', () => {
    // Esto valida que `dealDamage` no acopla al tipo Hero — Fase 3 lo
    // necesitaba para que enemigos pudieran ejecutar abilities.
    const enemyCaster = {
      level: 5,
      baseStats: fakeStatBearer(50, 50, 5).baseStats,
      statusEffects: [] as IStatusEffect[],
      rollCrit: (): CritResult => ({ multiplier: 1 as const, isCrit: false, isOvercrit: false })
    }
    const effects = makeEffects()
    const result = dealDamage({
      caster: enemyCaster,
      target: fakeTarget() as never,
      ability: { ...baseAbility, name: 'Enemy Attack' },
      rawDamage: 100,
      effects
    })
    expect(result.finalDamage).toBeGreaterThan(0)
  })

  it('el log menciona "Crítico" o "Overcrit" cuando hay crit', () => {
    const critCaster = {
      ...fakeCaster(100, 0, 1),
      rollCrit: (): CritResult => ({ multiplier: 2, isCrit: true, isOvercrit: false })
    }
    let logged = ''
    const effects = { ...makeEffects(), log: (m: string) => { logged = m } }
    dealDamage({
      caster: critCaster,
      target: fakeTarget() as never,
      ability: baseAbility,
      rawDamage: 50,
      effects
    })
    expect(logged).toContain('Crítico')
  })

  it('escalado por outgoingMult del caster cuando un effect aporta attackDamageMultiplier — promedio sobre N trials', () => {
    // Construimos un effect FAKE con defenseContribution que devuelve
    // attackDamageMultiplier: +0.25 (igual a STRENGTH_BOOST real). Asi
    // testeamos que `dealDamage` aplica correctamente el outgoingMult
    // del caster sin acoplarnos al STRENGTH_BOOST real (que testeamos
    // por separado via getOutgoingDamageMultiplier en otro archivo).
    const TRIALS = 200
    let boostedSum = 0
    let baseSum = 0
    const effects = makeEffects()
    const boostEffect: IStatusEffect = {
      type: 'test_strength_boost',
      isBuff: true,
      turns: 5,
      defenseContribution: () => ({ attackDamageMultiplier: 0.25 })
    } as unknown as IStatusEffect
    for (let i = 0; i < TRIALS; i++) {
      const boostedCaster = {
        ...fakeCaster(100, 0, 1),
        statusEffects: [boostEffect]
      }
      const baseCaster = fakeCaster(100, 0, 1)
      boostedSum += dealDamage({
        caster: boostedCaster,
        target: fakeTarget() as never,
        ability: baseAbility,
        rawDamage: 100,
        effects
      }).finalDamage
      baseSum += dealDamage({
        caster: baseCaster,
        target: fakeTarget() as never,
        ability: baseAbility,
        rawDamage: 100,
        effects
      }).finalDamage
    }
    const boostedAvg = boostedSum / TRIALS
    const baseAvg = baseSum / TRIALS
    // +25% outgoingMult → boosted deberia ser claramente mayor (~1.25x).
    // Margen del 5% para flake de Monte Carlo + floor.
    expect(boostedAvg).toBeGreaterThan(baseAvg * 1.18)
  })
})
