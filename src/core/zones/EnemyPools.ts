import type { IEnemy } from '../interfaces/ICharacter'
import type { EnemyGroupId } from '../enemies/groups'
import { resolveEncounterById } from '../expeditions/encounters'
import type { EnemyCountRange, EnemyFactory, EnemyPool, EnemyTier, IExpeditionConfig } from '../expeditions/types'

// Compatibility exports for the encounter DSL, not a random individual-enemy pool.
export type { EnemyCountRange, EnemyFactory, EnemyPool, EnemyTier, IExpeditionConfig }

export function elite(key: string, factory: () => IEnemy): EnemyFactory {
  const f = factory as EnemyFactory
  f.unique = true
  f.uniqueKey = key
  return f
}

export function determineEnemyTier(floor: number, totalFloors: number): EnemyTier {
  if (floor <= 1) return 'intro'
  if (floor >= totalFloors) return 'boss'
  if (floor >= totalFloors - 3) return 'late'
  if (floor <= 2) return 'early'
  return 'mid'
}

function pick<T>(items: readonly T[], context: string): T {
  if (!items.length) throw new Error(`[enemyGroups] ${context} has no formations`)
  return items[Math.floor(Math.random() * items.length)]
}

/** Used by both map nodes and contextual '?' ambushes. Never changes factions. */
export function resolveEnemyGroup(config: IExpeditionConfig, group: EnemyGroupId, floor: number): IEnemy[] {
  const tier = determineEnemyTier(floor, config.totalFloors)
  const candidates = config.enemyGroups[group]?.[tier] ?? []
  const encounterId = pick(candidates, `${config.id}/${group}/${tier}`)
  if (config.encounters[encounterId]?.group !== group) {
    throw new Error(`[enemyGroups] formation "${encounterId}" does not belong to ${group}`)
  }
  return resolveEncounterById(config, encounterId)
}

/** The only randomness is faction + complete formation, never individual enemies. */
export function getEnemiesForConfig(config: IExpeditionConfig, floor: number): IEnemy[] {
  const tier = determineEnemyTier(floor, config.totalFloors)
  const group = pick(config.groupPools[tier], `${config.id}/${tier}`)
  return resolveEnemyGroup(config, group, floor)
}
