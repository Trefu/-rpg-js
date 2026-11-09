import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Rogue } from './Rogue'
import { RECRUITABLE_HEROES } from './recruitment'
import { Enemy } from '../enemies/Enemy'
import { StatusEffects } from '../StatusEffects'
import { getAbility } from '../abilities/registry'
import { getAbilityHitCount, isBasicAttack, RogueBasicAttack, RoguePoisonBomb, RogueHaste, RogueUltimate } from '../abilities/Abilities'
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
    log: vi.fn(), showEnemyHit: vi.fn(), playEnemyVfx: vi.fn(), playHeroVfx: vi.fn(),
    showPlayerHit: vi.fn(), showAnnouncement: vi.fn(),
    audioManager: { playAttackSound: vi.fn(), playHitSound: vi.fn(), playDotPoisonSound: vi.fn() } as unknown as AudioManager
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
    expect(ctx.target!.statusEffects.find(e => e.type === 'poison')?.stacks).toBe(8)
    expect(caster.energy).toBe(10)
    expect(ctx.playEnemyVfx).toHaveBeenCalledTimes(getAbilityHitCount(RogueBasicAttack, 4)!)
  })

  it('Bomba Venenosa aplica triple de nivel más bonus logarítmico de agilidad y suma cargas', async () => {
    const ctx = context(RoguePoisonBomb, 3)
    ctx.target!.addStatusEffect({ ...StatusEffects.POISON, stacks: 2, turns: 2 })
    const healthBefore = ctx.target!.health
    expect(RoguePoisonBomb.previewDamage).toBeUndefined()
    expect(RoguePoisonBomb.previewEffect?.(ctx.caster as Rogue)).toMatchObject({ label: 'Cargas', kind: 'poison' })
    await execute(ctx)
    expect(ctx.playEnemyVfx).toHaveBeenCalledWith(ctx.target!.id, { asset: 'poison-bomb', durationMs: 900 })
    expect(ctx.audioManager.playDotPoisonSound).toHaveBeenCalledOnce()
    const poison = ctx.target!.statusEffects.find(e => e.type === 'poison')!
    expect(poison.stacks).toBe(2 + 3 * 3 + Math.floor(Math.log1p((ctx.caster as Rogue).baseStats.agility.value) * 2))
    expect(poison.turns).toBe(2)
    expect(ctx.target!.health).toBe(healthBefore)
  })

  it('la definitiva ejecuta el combo y detona todas las cargas de veneno por 5 de daño cada una', async () => {
    const ctx = context(RogueUltimate, 4)
    ctx.target!.addStatusEffect({ ...StatusEffects.POISON, stacks: 3 })
    await execute(ctx)
    const comboHits = getAbilityHitCount(RogueUltimate, 4)!
    expect(ctx.showEnemyHit).toHaveBeenCalledTimes(comboHits + 1)
    expect(ctx.target!.statusEffects.find(e => e.type === 'poison')).toBeUndefined()
    expect(ctx.target!.health).toBeLessThan(10000 - 3 * 5)
    expect(ctx.log).toHaveBeenCalledWith(expect.stringContaining('19 cargas causan 95 de daño'))
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
    expect(ctx.playHeroVfx).toHaveBeenCalledWith(ctx.caster.id, { asset: 'haste-aura', durationMs: 900 })
    expect(ctx.caster.statusEffects.find(e => e.type === 'haste')).toMatchObject({ turns: 2, agilityPercentBonus: 25 })
    expect(RogueHaste.cooldown).toBe(4)
    expect(RogueHaste.energyCost).toBe(40)
  })
})
