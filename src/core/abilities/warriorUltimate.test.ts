import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Warrior } from '../heroes/Warrior'
import { Enemy } from '../enemies/Enemy'
import { StatusEffects } from '../StatusEffects'
import { WarriorUltimate, getAbilityHitCount } from './Abilities'
import type { AbilityContext } from '../interfaces/IAbility'

class Target extends Enemy {
  readonly sprite = ''
  constructor() {
    super({ id: 'target', name: 'Objetivo', level: 1, maxHealth: 100000,
      experienceReward: 0, goldReward: { min: 0, max: 0 } })
  }
}

describe('Quemadura de Tormenta de Acero', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it.each([1, 4, 8])('cada impacto suma el nivel del guerrero (%s) a las cargas existentes', async level => {
    const caster = new Warrior(level)
    const target = new Target()
    target.addStatusEffect({ ...StatusEffects.BURN, stacks: 2 })
    const addEffect = vi.spyOn(target, 'addStatusEffect')
    const context = { caster, target, ability: WarriorUltimate, animationDelay: 0,
      energySpent: 0, log: vi.fn(), showEnemyHit: vi.fn(), playEnemyVfx: vi.fn(),
      showPlayerHit: vi.fn(), showAnnouncement: vi.fn(),
      audioManager: { playAttackSound: vi.fn(), playHitSound: vi.fn() } } as unknown as AbilityContext
    const result = WarriorUltimate.execute(context)
    await vi.runAllTimersAsync()
    await result
    const hits = getAbilityHitCount(WarriorUltimate, level)!
    expect(addEffect).toHaveBeenCalledTimes(hits)
    for (const [effect] of addEffect.mock.calls) expect(effect).toMatchObject({ type: 'burn', stacks: level })
    expect(target.statusEffects.find(effect => effect.type === 'burn')?.stacks).toBe(2 + hits * level)
    expect(target.health).toBeLessThan(target.maxHealth)
    expect(WarriorUltimate.damageType).toBe('physical')
  })
})
