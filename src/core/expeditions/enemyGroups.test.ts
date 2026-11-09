import { afterEach, describe, expect, it, vi } from 'vitest'
import { MOUNTAIN_PEAK } from './mountainPeak'
import { ENEMY_GROUPS, type EnemyGroupId } from '../enemies/groups'
import { MountainEnemy, MOUNTAIN_ROLES } from '../enemies/MountainEnemy'
import { getEnemiesForConfig, resolveEnemyGroup } from '../zones/EnemyPools'
import { mob, resolveEncounter, resolveEncounterById } from './encounters'
import { resolveAmbushEnemies } from './ambushes'
import { SHARED_CURIOSITY_EVENTS } from './sharedCuriosityEvents'

afterEach(() => vi.restoreAllMocks())

describe('Grupos coherentes de enemigos', () => {
  it('cada variante tiene una facción y al menos cuatro ataques ofensivos', () => {
    for (const role of MOUNTAIN_ROLES) {
      const enemy = new MountainEnemy(role)
      expect(ENEMY_GROUPS[enemy.enemyGroup]).toBeDefined()
      const offensive = enemy.attackPatterns.filter(action => !('execute' in action) || action.targetType !== 'allies-only')
      expect(new Set(offensive.map(action => action.name)).size).toBeGreaterThanOrEqual(4)
    }
  })

  it('todos los encuentros, incluidos jefes y eventos, pertenecen a un único grupo', () => {
    for (const encounter of Object.values(MOUNTAIN_PEAK.encounters)) {
      const enemies = resolveEncounterById(MOUNTAIN_PEAK, encounter.id)
      expect(enemies.length).toBeGreaterThan(0)
      expect(new Set(enemies.map(enemy => enemy.enemyGroup)), encounter.id).toEqual(new Set([encounter.group]))
    }
  })

  it('cada grupo ofrece distintas formaciones en cada tramo, sin cambiar de facción', () => {
    const floors = { intro: 1, early: 2, mid: 4, late: 8, boss: 10 } as const
    for (const [tier, floor] of Object.entries(floors) as [keyof typeof floors, number][]) {
      for (const group of MOUNTAIN_PEAK.groupPools[tier]) {
        const candidates = MOUNTAIN_PEAK.enemyGroups[group]![tier]!
        if (tier !== 'intro' && tier !== 'boss') expect(candidates.length).toBeGreaterThanOrEqual(2)
        for (let index = 0; index < candidates.length; index++) {
          vi.spyOn(Math, 'random').mockReturnValue((index + 0.5) / candidates.length)
          const formation = resolveEnemyGroup(MOUNTAIN_PEAK, group, floor)
          expect(formation.map(enemy => enemy.name)).toEqual(resolveEncounterById(MOUNTAIN_PEAK, candidates[index]).map(enemy => enemy.name))
          expect(formation.every(enemy => enemy.enemyGroup === group)).toBe(true)
        }
      }
    }
  })

  it('rechaza una composición mezclada en lugar de servirla al jugador', () => {
    expect(() => resolveEncounter({ id: 'bad-orcs', group: 'orcs', mobs: [mob(() => new MountainEnemy('orc')), mob(() => new MountainEnemy('scout'))] })).toThrow(/belongs to goblins/)
  })

  it('no recupera una pool individual ni otra facción si faltan formaciones', () => {
    const empty = { ...MOUNTAIN_PEAK, enemyGroups: {} }
    expect(() => getEnemiesForConfig(empty, 2)).toThrow(/no formations/)
    expect(() => resolveEnemyGroup(MOUNTAIN_PEAK, 'dragons', 2)).toThrow(/no formations/)
    expect(() => resolveEnemyGroup({ ...MOUNTAIN_PEAK, enemyGroups: { bandits: { early: ['orc-outriders'] } } }, 'bandits', 2)).toThrow(/does not belong/)
  })

  it('todos los resultados aleatorios de nodos son formaciones coherentes y frescas', () => {
    for (let floor = 1; floor <= 10; floor++) {
      for (let roll = 0; roll < 10; roll++) {
        vi.spyOn(Math, 'random').mockReturnValue(roll / 10)
        const first = getEnemiesForConfig(MOUNTAIN_PEAK, floor)
        const next = getEnemiesForConfig(MOUNTAIN_PEAK, floor)
        expect(new Set(first.map(enemy => enemy.enemyGroup)).size).toBe(1)
        expect(first[0]).not.toBe(next[0])
        first[0].health = 0
        expect(next[0].health).toBeGreaterThan(0)
      }
    }
  })

  it('los eventos narrativos mantienen su facción en todos los tramos', () => {
    for (const event of [...SHARED_CURIOSITY_EVENTS, ...MOUNTAIN_PEAK.curiosityEvents!]) {
      for (const choice of event.choices) {
        if (choice.outcome.kind !== 'ambush') continue
        const outcome = choice.outcome
        const expected: EnemyGroupId = outcome.group ?? MOUNTAIN_PEAK.encounters[outcome.encounter!].group
        for (const floor of [1, 2, 4, 8, 10]) {
          const enemies = resolveAmbushEnemies(MOUNTAIN_PEAK, outcome, floor)
          expect(new Set(enemies.map(enemy => enemy.enemyGroup)), event.id).toEqual(new Set([expected]))
        }
      }
    }
  })
})
