import { describe, it, expect } from 'vitest'
import { mob, resolveEncounter, resolveEncounterById } from './encounters'
import type { Encounter, EnemyFactory, IExpeditionConfig } from './types'

function fakeEnemyFactory(name: string): EnemyFactory {
  const f = (() => ({ name })) as EnemyFactory
  return f
}

describe('mob()', () => {
  it('count por defecto es 1', () => {
    const m = mob(fakeEnemyFactory('a'))
    expect(m.count).toBe(1)
  })
  it('acepta count explicito positivo', () => {
    const m = mob(fakeEnemyFactory('a'), 4)
    expect(m.count).toBe(4)
  })
  it('lanza con count invalido', () => {
    expect(() => mob(fakeEnemyFactory('a'), 0)).toThrow()
    expect(() => mob(fakeEnemyFactory('a'), -2)).toThrow()
    expect(() => mob(fakeEnemyFactory('a'), 1.5)).toThrow()
  })
})

describe('resolveEncounter()', () => {
  it('resuelve un encounter de un solo mob', () => {
    const enc: Encounter = { id: 'x', mobs: [mob(fakeEnemyFactory('goblin'))] }
    expect(resolveEncounter(enc)).toEqual([{ name: 'goblin' }])
  })

  it('respeta count > 1', () => {
    const enc: Encounter = { id: 'x', mobs: [mob(fakeEnemyFactory('goblin'), 3)] }
    const out = resolveEncounter(enc)
    expect(out).toHaveLength(3)
    expect(out.every(e => e.name === 'goblin')).toBe(true)
  })

  it('combina multiples mobs en orden', () => {
    const enc: Encounter = {
      id: 'x',
      mobs: [
        mob(fakeEnemyFactory('wolf')),
        mob(fakeEnemyFactory('orc'), 2)
      ]
    }
    const out = resolveEncounter(enc)
    expect(out.map(e => e.name)).toEqual(['wolf', 'orc', 'orc'])
  })

  it('respeta unique/uniquKey: solo 1 instancia por key', () => {
    const eliteF = (() => ({ name: 'captain' })) as EnemyFactory
    eliteF.unique = true
    eliteF.uniqueKey = 'bandit-captain'
    const enc: Encounter = {
      id: 'x',
      mobs: [
        mob(eliteF, 3),
        mob(fakeEnemyFactory('orc'), 2)
      ]
    }
    const out = resolveEncounter(enc)
    expect(out.filter(e => e.name === 'captain')).toHaveLength(1)
    expect(out.filter(e => e.name === 'orc')).toHaveLength(2)
    expect(out).toHaveLength(3)
  })
})

describe('resolveEncounterById()', () => {
  const config: IExpeditionConfig = {
    id: 'test',
    displayName: 'Test',
    description: '',
    totalFloors: 5,
    unlockCriteria: { kind: 'always' },
    presentation: { difficulty: 'easy', background: '', rewards: { experience: 0, gold: 0 } },
    enemyPools: { intro: [], early: [], mid: [], late: [], boss: [] },
    enemyCountPerTier: { intro: [0, 0], early: [0, 0], mid: [0, 0], late: [0, 0], boss: [0, 0] },
    encounters: {
      a: { id: 'a', mobs: [mob(fakeEnemyFactory('alpha'))] },
      b: { id: 'b', mobs: [mob(fakeEnemyFactory('beta'), 2)] }
    },
    generator: {
      minNodesBeforeBoss: 3,
      shopChance: 0,
      curiosityChance: 0,
      maxRetries: 1,
      maxParentsPerNode: 1,
      proximityThreshold: 40,
      forcedSingleRows: [],
      forcedCombatRows: [],
      forcedNodes: [],
      minCuriosityNodes: 0,
      maxCuriosityNodes: 0,
      maxConsecutiveCuriosity: 0,
      minShopNodes: 0,
      maxShopNodes: 0,
      maxConsecutiveShop: 0
    }
  }

  it('resuelve por id dentro de la config', () => {
    expect(resolveEncounterById(config, 'a')).toEqual([{ name: 'alpha' }])
    expect(resolveEncounterById(config, 'b')).toEqual([{ name: 'beta' }, { name: 'beta' }])
  })

  it('lanza si el id no existe', () => {
    expect(() => resolveEncounterById(config, 'missing')).toThrow(/has no encounter "missing"/)
  })
})
