import { describe, it, expect } from 'vitest'
import {
  rollCritFromChance,
  computeAgilityCritBonus,
  AGILITY_NEUTRAL,
  AGILITY_CRIT_SCALE,
  CRIT_MULTIPLIER,
  OVERCRIT_MULTIPLIER
} from '@/core/crit'

describe('computeAgilityCritBonus', () => {
  it('en la neutral (agility=10) no aporta bonus', () => {
    expect(computeAgilityCritBonus(AGILITY_NEUTRAL)).toBe(0)
  })

  it('agility por debajo de la neutral NO aporta bonus (clamp a 0)', () => {
    expect(computeAgilityCritBonus(5)).toBe(0)
    expect(computeAgilityCritBonus(0)).toBe(0)
    expect(computeAgilityCritBonus(-10)).toBe(0)
  })

  it('agility alta aporta bonus positivo', () => {
    const bonus = computeAgilityCritBonus(20)
    // log(1 + 10) * 2 = log(11) * 2 ≈ 4.796
    expect(bonus).toBeGreaterThan(0)
    expect(bonus).toBeCloseTo(Math.log(11) * AGILITY_CRIT_SCALE, 3)
  })

  it('es monotona creciente (mas agility = mas bonus)', () => {
    expect(computeAgilityCritBonus(20)).toBeGreaterThan(computeAgilityCritBonus(15))
    expect(computeAgilityCritBonus(50)).toBeGreaterThan(computeAgilityCritBonus(20))
  })
})

describe('rollCritFromChance', () => {
  // rng stub: devuelve siempre el mismo valor en [0,1]
  const stubRng = (value: number) => () => value

  it('chance 0 → siempre no-crit', () => {
    for (let i = 0; i < 20; i++) {
      const r = rollCritFromChance(0, stubRng(i / 20))
      expect(r.multiplier).toBe(1)
      expect(r.isCrit).toBe(false)
      expect(r.isOvercrit).toBe(false)
    }
  })

  it('chance 100 con rng=0.5 → crit normal (multiplier 2)', () => {
    // roll = 50, chance = 100 → roll < 100, NO es over (roll < 100)
    const r = rollCritFromChance(100, stubRng(0.5))
    expect(r.isCrit).toBe(true)
    expect(r.isOvercrit).toBe(false)
    expect(r.multiplier).toBe(CRIT_MULTIPLIER)
  })

  it('chance 100 con rng=0.99 → crit normal (roll=99, <100)', () => {
    const r = rollCritFromChance(100, stubRng(0.99))
    expect(r.isCrit).toBe(true)
    expect(r.isOvercrit).toBe(false)
    expect(r.multiplier).toBe(2)
  })

  it('chance 150 con rng=0.99 → OVERCRIT (roll=99 < 100, pero chance>100? no, condition roll >= 100 es false)', () => {
    // Edge case: con chance=150, roll=99 (< 100) → crit normal porque
    // `roll >= 100` es false. Para overcrit se necesita roll >= 100, que
    // requiere chance > 100 Y rng que devuelva >= 1.0 (imposible con rng
    // normal salvo multiplicadores).
    const r = rollCritFromChance(150, stubRng(0.99))
    expect(r.isCrit).toBe(true)
    expect(r.isOvercrit).toBe(false)
  })

  it('chance 150 con roll exacto de 100% (rng stub que devuelve 1.0) → OVERCRIT', () => {
    // roll = 100 * 1.0 = 100, NO >= 150 (chance), entonces crit. Y roll >= 100 → overcrit.
    const r = rollCritFromChance(150, stubRng(1.0))
    expect(r.isCrit).toBe(true)
    expect(r.isOvercrit).toBe(true)
    expect(r.multiplier).toBe(OVERCRIT_MULTIPLIER)
  })

  it('chance 50 con rng=0.5 → no crit (roll=50 >= chance=50)', () => {
    const r = rollCritFromChance(50, stubRng(0.5))
    expect(r.multiplier).toBe(1)
    expect(r.isCrit).toBe(false)
  })

  it('chance 50 con rng=0.4 → crit normal (roll=40 < 50)', () => {
    const r = rollCritFromChance(50, stubRng(0.4))
    expect(r.isCrit).toBe(true)
    expect(r.multiplier).toBe(2)
  })

  it('chance negativa se trata como 0 (no crit)', () => {
    const r = rollCritFromChance(-50, stubRng(0))
    expect(r.multiplier).toBe(1)
    expect(r.isCrit).toBe(false)
  })

  it('chance > 200 satura (siempre crit, eventualmente overcrit)', () => {
    // chance = 250, roll=100*0.99=99 < 250 → crit (pero no over porque roll<100)
    const r = rollCritFromChance(250, stubRng(0.99))
    expect(r.isCrit).toBe(true)
  })

  it('distribucion estadistica: con chance 30% y 1000 trials, ~30% son crits', () => {
    let crits = 0
    const trials = 1000
    for (let i = 0; i < trials; i++) {
      const r = rollCritFromChance(30)
      if (r.isCrit) crits++
    }
    const ratio = crits / trials
    // Margen generoso (±5%) para flake de Monte Carlo
    expect(ratio).toBeGreaterThan(0.25)
    expect(ratio).toBeLessThan(0.35)
  })
})
