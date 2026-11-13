import { describe, expect, it } from 'vitest'
import { getShieldLayers } from './shields'
import { Hero } from '../Hero'
import { StatusEffects } from '../StatusEffects'

const STAT_INPUT = { value: 10, growthPerLevel: 0 }

function shieldedHero(shield: number): { hero: Hero, healthBefore: number } {
  const hero = new Hero({
    id: 'hero-shield-test', name: 'Probe', maxHealth: 100,
    agility: STAT_INPUT, constitution: STAT_INPUT, mind: STAT_INPUT, body: STAT_INPUT
  })
  hero.addStatusEffect({ ...StatusEffects.ARCANE_SHIELD, absorbRemaining: shield, maxAbsorb: shield })
  return { hero, healthBefore: hero.health }
}

describe('takeDamage devuelve el desglose HP/absorbido', () => {
  it('un golpe totalmente absorbido no reduce HP y lo reporta como absorbido', () => {
    const { hero, healthBefore } = shieldedHero(30)
    expect(hero.takeDamage(10)).toEqual({ hpDamage: 0, absorbed: 10 })
    expect(hero.health).toBe(healthBefore)
  })

  it('una absorción parcial reparte el golpe entre escudo y HP', () => {
    const { hero, healthBefore } = shieldedHero(30)
    expect(hero.takeDamage(50)).toEqual({ hpDamage: 20, absorbed: 30 })
    expect(hero.health).toBe(healthBefore - 20)
  })

  it('sin escudo todo el daño va a HP y absorbed es 0', () => {
    const hero = new Hero({
      id: 'hero-plain-test', name: 'Probe', maxHealth: 100,
      agility: STAT_INPUT, constitution: STAT_INPUT, mind: STAT_INPUT, body: STAT_INPUT
    })
    const healthBefore = hero.health
    expect(hero.takeDamage(7)).toEqual({ hpDamage: 7, absorbed: 0 })
    expect(hero.health).toBe(healthBefore - 7)
  })
})

describe('Capas de vida temporal sobre la barra de HP', () => {
  it('50 de escudo sobre 100 HP ocupa exactamente la mitad', () => {
    expect(getShieldLayers(50, 100)).toEqual([{ percent: 50, units: 1 }])
  })
  it('200 sobre 100 HP se representa con dos capas completas', () => {
    expect(getShieldLayers(200, 100)).toEqual([{ percent: 100, units: 1 }, { percent: 100, units: 1 }])
  })
  it('la última capa conserva la proporción del sobrante', () => {
    expect(getShieldLayers(250, 100).map(layer => layer.percent)).toEqual([100, 100, 50])
    expect(getShieldLayers(138, 351)[0].percent).toBeCloseTo(39.316)
  })
  it('agrupa escudos extremos sin añadir filas fuera de la barra', () => {
    expect(getShieldLayers(1000, 100)).toHaveLength(4)
    expect(getShieldLayers(1000, 100)[3]).toEqual({ percent: 100, units: 7 })
  })
  it('no muestra capas sin escudo o sin vida máxima', () => {
    expect(getShieldLayers(0, 100)).toEqual([])
    expect(getShieldLayers(50, 0)).toEqual([])
  })
})
