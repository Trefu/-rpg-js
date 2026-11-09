import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { Spectre, SpectralSentence, SpectralFog, SpectralTouch, SpectralRend } from './Spectre'
import { Warrior } from '../../../heroes/Warrior'
import { Cleric } from '../../../heroes/Cleric'
import { Rogue } from '../../../heroes/Rogue'
import { StatusEffects } from '../../../StatusEffects'
import type { AbilityContext, IAbility } from '../../../interfaces/IAbility'
import { MOUNTAIN_PEAK } from '../../../expeditions/mountainPeak'
import { resolveEncounterById } from '../../../expeditions/encounters'
import { useExpeditionStore } from '@/stores/expedition'

beforeEach(() => setActivePinia(createPinia()))

function context(ability: IAbility) {
  const caster = new Spectre(3)
  const opponents = [new Warrior(), new Cleric(), new Rogue()]
  return { caster, opponents, allies: [caster], target: opponents[0], ability, animationDelay: 0,
    energySpent: 0, log: vi.fn(), showAnnouncement: vi.fn(), showPlayerHit: vi.fn(),
    playHeroVfx: vi.fn(), playEnemyVfx: vi.fn() } as unknown as AbilityContext & { opponents: (Warrior | Cleric | Rogue)[]; caster: Spectre }
}

describe('Encuentro único del Espectro', () => {
  it('aparece solo en su evento fijado al mapa, nunca en eventos aleatorios ni patrullas', () => {
    const enemies = resolveEncounterById(MOUNTAIN_PEAK, 'spectral-pass')
    expect(enemies).toHaveLength(1)
    expect(enemies[0]).toBeInstanceOf(Spectre)
    for (const group of Object.values(MOUNTAIN_PEAK.enemyGroups)) {
      expect(Object.values(group).flat()).not.toContain('spectral-pass')
    }
    const store = useExpeditionStore()
    store.beginExpeditionWith(MOUNTAIN_PEAK)
    expect(store.activeCuriosityEvents.some(event => event.id === 'spectral-pass')).toBe(false)
    store.resolvedEventIds.push('spectral-pass')
    expect(store.activeCuriosityEvents.some(event => event.id === 'spectral-pass')).toBe(false)
    store.beginExpeditionWith(MOUNTAIN_PEAK)
    expect(store.activeCuriosityEvents.some(event => event.id === 'spectral-pass')).toBe(false)
    const event = MOUNTAIN_PEAK.curiosityEvents!.find(event => event.id === 'spectral-pass')!
    expect(event.inescapable).toBe(true)
    expect(event.choices.map(choice => choice.label)).toEqual(['CORRER', 'CORRER', 'CORRER'])
    for (const choice of event.choices) expect(choice.outcome).toMatchObject({ kind: 'ambush', encounter: 'spectral-pass' })
  })

  it('marca a un solo héroe y solo cambia de víctima tras su muerte al tercer turno propio', async () => {
    const ctx = context(SpectralSentence)
    for (const hero of ctx.opponents) {
      ctx.target = hero
      await SpectralSentence.execute(ctx)
      expect(ctx.opponents.filter(hero => hero.isAlive && hero.hasStatusEffect('death_sentence'))).toEqual([hero])
      expect(hero.statusEffects.find(effect => effect.type === 'death_sentence')?.turns).toBe(3)
      hero.addStatusEffect({ ...StatusEffects.DIVINE_PROTECTION, absorbRemaining: 9999 })
      hero.reduceStatusEffects()
      expect(hero.isAlive).toBe(true)
      expect(hero.statusEffects.find(effect => effect.type === 'death_sentence')?.turns).toBe(2)
      hero.reduceStatusEffects()
      expect(hero.isAlive).toBe(true)
      hero.reduceStatusEffects()
      expect(hero.isAlive).toBe(false)
      expect(hero.health).toBe(0)
    }
    expect(ctx.playHeroVfx).toHaveBeenCalledTimes(3)
  })

  it('ni reaplicar ni cambiar el objetivo reinicia la cuenta o marca a otro héroe vivo', async () => {
    const ctx = context(SpectralSentence)
    await SpectralSentence.execute(ctx)
    ctx.opponents[0].reduceStatusEffects()
    ctx.target = ctx.opponents[1]
    await SpectralSentence.execute(ctx)
    expect(ctx.opponents[0].statusEffects.find(effect => effect.type === 'death_sentence')?.turns).toBe(2)
    expect(ctx.opponents[1].hasStatusEffect('death_sentence')).toBe(false)
    ctx.opponents[0].removeStatusEffect('death_sentence')
    await SpectralSentence.execute(ctx)
    expect(ctx.opponents.every(hero => !hero.hasStatusEffect('death_sentence'))).toBe(true)
    for (let turn = 0; turn < 4; turn++) ctx.opponents[0].reduceStatusEffects()
    expect(ctx.opponents[0].isAlive).toBe(true)
    ctx.opponents[0].isAlive = false
    ctx.opponents[0].health = 0
    await SpectralSentence.execute(ctx)
    expect(ctx.opponents[1].hasStatusEffect('death_sentence')).toBe(true)
  })

  it('su rotación usa otros ataques mientras la víctima vive y vuelve a permitir la marca tras morir', async () => {
    const ctx = context(SpectralSentence)
    expect(ctx.caster.selectAttackPattern()).toBe(SpectralSentence)
    await SpectralSentence.execute(ctx)
    for (let action = 0; action < 8; action++) {
      expect(ctx.caster.intention).not.toBe(SpectralSentence.name)
      expect(ctx.caster.selectAttackPattern()).not.toBe(SpectralSentence)
    }
    ctx.opponents[0].isAlive = false
    expect(Array.from({ length: 4 }, () => ctx.caster.selectAttackPattern())).toContain(SpectralSentence)
    expect(new Spectre().sentencedHero).toBeNull()
  })

  it('Nublado afecta a todos los vivos sin aplicarse al lanzador ni a los muertos', async () => {
    const ctx = context(SpectralFog)
    ctx.opponents[2].isAlive = false
    await SpectralFog.execute(ctx)
    expect(ctx.opponents.map(hero => hero.hasStatusEffect('clouded'))).toEqual([true, true, false])
    expect(ctx.caster.statusEffects).toHaveLength(0)
    expect(ctx.playHeroVfx).toHaveBeenCalledTimes(2)
  })

  it.each([SpectralTouch, SpectralRend])('$name aplica Lesión y los tres DoT a la vez, escalando con MEN', async ability => {
    const ctx = context(ability)
    const target = ctx.opponents[0]
    const before = target.health
    ctx.caster.baseStats.mind.value = 30
    await ability.execute(ctx)
    expect(target.health).toBeLessThan(before)
    expect(target.hasStatusEffect('injured')).toBe(true)
    for (const type of ['burn', 'poison', 'freeze']) {
      expect(target.statusEffects.find(effect => effect.type === type)?.stacks).toBe(2)
    }
    expect(ctx.opponents[1].statusEffects).toHaveLength(0)
    expect(ctx.playHeroVfx).toHaveBeenCalledWith(target.id, expect.objectContaining({ asset: 'poison-bomb' }))
    const next = context(ability)
    next.caster.baseStats.mind.value = 45
    await ability.execute(next)
    expect(next.opponents[0].statusEffects.find(effect => effect.type === 'burn')?.stacks).toBe(3)
    expect(next.opponents[0].health).toBeLessThan(target.health)
  })
})
