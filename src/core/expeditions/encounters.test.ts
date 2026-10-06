import { describe, it, expect } from 'vitest'
import {
  each,
  eliteMob,
  mob,
  pool,
  resolveEncounter,
  resolveEncounterById,
  roster
} from './encounters'
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

describe('each()', () => {
  it('produce un Mob por factory con el mismo count', () => {
    const f1 = fakeEnemyFactory('a')
    const f2 = fakeEnemyFactory('b')
    const f3 = fakeEnemyFactory('c')
    const out = each(2, f1, f2, f3)
    expect(out).toHaveLength(3)
    expect(out.map(m => m.count)).toEqual([2, 2, 2])
    expect(out.map(m => m.factory)).toEqual([f1, f2, f3])
  })
  it('lanza con count invalido', () => {
    expect(() => each(0, fakeEnemyFactory('a'))).toThrow()
    expect(() => each(-1, fakeEnemyFactory('a'))).toThrow()
  })
  it('sin factories devuelve []', () => {
    expect(each(2)).toEqual([])
  })
})

describe('eliteMob()', () => {
  it('marca la factory como elite con la key dada', () => {
    const f = fakeEnemyFactory('captain')
    const m = eliteMob('bandit-captain', f)
    expect(m.count).toBe(1)
    expect(m.factory.unique).toBe(true)
    expect(m.factory.uniqueKey).toBe('bandit-captain')
  })
  it('respeta uniqueKey al resolver el encounter (max 1)', () => {
    const captain1 = fakeEnemyFactory('captain')
    const captain2 = fakeEnemyFactory('captain-double')
    const enc: Encounter = {
      id: 'x',
      mobs: [
        eliteMob('bandit-captain', captain1),
        eliteMob('bandit-captain', captain2),
        mob(fakeEnemyFactory('orc'))
      ]
    }
    const out = resolveEncounter(enc)
    // El segundo eliteMob con misma key se omite silenciosamente.
    expect(out.filter(e => e.name.startsWith('captain'))).toHaveLength(1)
    expect(out.find(e => e.name === 'orc')).toBeDefined()
  })
})

describe('pool()', () => {
  it('aplana una lista de Mob en una lista de EnemyFactory', () => {
    const f1 = fakeEnemyFactory('a')
    const f2 = fakeEnemyFactory('b')
    const out = pool(mob(f1, 2), mob(f2, 3))
    expect(out).toHaveLength(5)
    expect(out[0]).toBe(f1)
    expect(out[1]).toBe(f1)
    expect(out[2]).toBe(f2)
    expect(out[3]).toBe(f2)
    expect(out[4]).toBe(f2)
  })
  it('acepta una sola Mob[] como argumento (spread-friendly)', () => {
    const f1 = fakeEnemyFactory('a')
    const f2 = fakeEnemyFactory('b')
    const out = pool([mob(f1, 1), mob(f2, 1)])
    expect(out).toHaveLength(2)
  })
  it('pool vacio es []', () => {
    expect(pool()).toEqual([])
  })
})

describe('roster()', () => {
  it('construye un EnemyPool con los 5 tiers (vacios por defecto)', () => {
    const r = roster({})
    expect(r.intro).toEqual([])
    expect(r.early).toEqual([])
    expect(r.mid).toEqual([])
    expect(r.late).toEqual([])
    expect(r.boss).toEqual([])
  })
  it('acepta Mob[] por tier y los aplana via pool()', () => {
    const r = roster({
      intro: [mob(fakeEnemyFactory('goblin'), 2)],
      boss: [mob(fakeEnemyFactory('dragon'))]
    })
    expect(r.intro).toHaveLength(2)
    expect(r.boss).toHaveLength(1)
    expect(r.early).toEqual([])
  })
  it('integra con each() para definir un tier completo', () => {
    const f1 = fakeEnemyFactory('goblin')
    const f2 = fakeEnemyFactory('archer')
    const r = roster({
      early: each(2, f1, f2)
    })
    expect(r.early).toHaveLength(4)
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
