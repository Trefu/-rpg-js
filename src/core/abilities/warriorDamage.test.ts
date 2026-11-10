import { describe, expect, it } from 'vitest'
import { Warrior } from '../heroes/Warrior'
import { WarriorInjuringStrike, WarriorDevastatingStrike } from './Abilities'
import { computeRawDamage, type DamageStep } from './damagePipeline'

describe('Daño de los golpes del guerrero', () => {
  it.each([1, 5, 10, 20])('Lesionador supera a Devastador por objetivo en nivel %s', level => {
    const hero = Warrior.createStarter()
    while (hero.level < level) hero.levelUp()
    const body = hero.baseStats.body.value
    expect(computeRawDamage(WarriorInjuringStrike.pipeline as DamageStep, hero)).toBe(body * 1.5 + level * 3)
    expect(computeRawDamage(WarriorDevastatingStrike.pipeline as DamageStep, hero)).toBe(body * 1.2 + level * 0.5)
    const injuring = WarriorInjuringStrike.previewDamage!(hero)
    const devastating = WarriorDevastatingStrike.previewDamage!(hero)
    expect(injuring.min).toBeGreaterThan(devastating.min)
    expect(injuring.max).toBeGreaterThan(devastating.max)
  })

  it('conserva costes y el alcance de Devastador', () => {
    expect(WarriorInjuringStrike.energyCost).toBe(20)
    expect(WarriorDevastatingStrike.energyCost).toBe(35)
    expect(WarriorDevastatingStrike.aoe).toBe(true)
    expect(WarriorDevastatingStrike.requiresTarget).toBe(false)
  })
})
