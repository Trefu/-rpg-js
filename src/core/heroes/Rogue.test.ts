import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Rogue } from './Rogue'
import { RECRUITABLE_HEROES } from './recruitment'
import { Enemy } from '../enemies/Enemy'
import { StatusEffects } from '../StatusEffects'
import { getAbility } from '../abilities/registry'
import { getAbilityHitCount, isBasicAttack, RogueBasicAttack, RoguePoisonStrike, RogueHaste, RogueUltimate } from '../abilities/Abilities'
import type { AbilityContext, IAbility } from '../interfaces/IAbility'
import type { AudioManager } from '../AudioManager'
import { VFX_SOURCES } from '@/components/combat/vfxSources'

class Target extends Enemy {
  readonly sprite = ''
  constructor() {
    super({ id: 'target', name: 'Objetivo', level: 1, maxHealth: 10000,
      experienceReward: 0, goldReward: { min: 0, max: 0 } })
  }
}

function context(ability: IAbility, level = 1): AbilityContext {
  return {
    caster: new Rogue(level), target: new Target(), ability,
    animationDelay: 0, energySpent: 0,
    log: vi.fn(), showEnemyHit: vi.fn(), playEnemyVfx: vi.fn(),
    showPlayerHit: vi.fn(), showAnnouncement: vi.fn(),
    audioManager: { playAttackSound: vi.fn(), playHitSound: vi.fn() } as unknown as AudioManager
  }
}

async function execute(ctx: AbilityContext) {
  const result = ctx.ability.execute(ctx)
  await vi.runAllTimersAsync()
  await result
}

describe('Pícaro jugable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('se recluta con cinco habilidades registradas y un GIF de veneno disponible', () => {
    const hero = RECRUITABLE_HEROES.find(h => h.id === 'rogue')!.factory()
    expect(hero).toBeInstanceOf(Rogue)
    expect(hero.abilities).toHaveLength(5)
    for (const ability of hero.abilities) expect(getAbility(ability.type)).toBeDefined()
    expect(isBasicAttack(hero.abilities[0])).toBe(true)
    expect(isBasicAttack(RogueUltimate)).toBe(false)
    expect(VFX_SOURCES['poison-slash']).toContain('poison-slash.gif')
  })

  it('el básico multigolpe daña, acumula veneno y recupera energía por impacto', async () => {
    const ctx = context(RogueBasicAttack, 4)
    const caster = ctx.caster as Rogue
    caster.energy = 0
    const before = ctx.target!.health
    await execute(ctx)
    expect(ctx.target!.health).toBeLessThan(before)
    expect(ctx.target!.statusEffects.find(e => e.type === 'poison')?.stacks).toBe(2)
    expect(caster.energy).toBe(10)
    expect(ctx.playEnemyVfx).toHaveBeenCalledTimes(getAbilityHitCount(RogueBasicAttack, 4)!)
  })

  it('Golpe Tóxico suma cargas sobre el veneno existente sin alargar su duración', async () => {
    const ctx = context(RoguePoisonStrike, 3)
    ctx.target!.addStatusEffect({ ...StatusEffects.POISON, stacks: 2, turns: 2 })
    await execute(ctx)
    const poison = ctx.target!.statusEffects.find(e => e.type === 'poison')!
    expect(poison.stacks).toBe(7)
    expect(poison.turns).toBe(2)
  })

  it('la definitiva ejecuta los golpes anunciados y aplica veneno por impacto', async () => {
    const ctx = context(RogueUltimate, 4)
    await execute(ctx)
    expect(ctx.showEnemyHit).toHaveBeenCalledTimes(getAbilityHitCount(RogueUltimate, 4)!)
    expect(ctx.target!.statusEffects.find(e => e.type === 'poison')?.stacks).toBe(16)
  })

  it('interrumpe la ráfaga al morir el objetivo y no envenena cadáveres', async () => {
    const ctx = context(RogueUltimate)
    ctx.target!.health = 1
    await execute(ctx)
    expect(ctx.target!.isAlive).toBe(false)
    expect(ctx.showEnemyHit).toHaveBeenCalledTimes(1)
    expect(ctx.target!.statusEffects).toHaveLength(0)
  })

  it('Paso Ligero se aplica al propio héroe sin necesitar objetivo', async () => {
    const ctx = context(RogueHaste)
    ctx.target = null
    await execute(ctx)
    expect(ctx.caster.statusEffects.find(e => e.type === 'haste')).toMatchObject({ turns: 3, speedBonus: 3 })
  })
})
