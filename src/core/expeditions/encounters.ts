import type { IEnemy } from '@/core/interfaces/ICharacter'
import type {
  Encounter,
  EnemyFactory,
  IExpeditionConfig,
  Mob
} from './types'

/**
 * Azucar sintactico para componer encounters.
 *
 *   mob(() => new Goblin(3))          // 1 goblin
 *   mob(() => new Goblin(3), 3)       // 3 goblins
 *   mob(elite('bandit-captain', () => new BanditCaptain(5)))  // 1 mini-boss unico
 *
 * Retorna un `Mob` listo para enchufar en un `Encounter.mobs`.
 */
export function mob(factory: EnemyFactory, count: number = 1): Mob {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`[encounters] mob count must be a positive integer, got ${count}`)
  }
  return { factory, count }
}

/**
 * Resuelve un encounter a una lista viva de enemigos. Respeta la
 * restriccion de "elite unica" (`uniqueKey`): si dos `Mob`s del encounter
 * comparten `uniqueKey`, solo el primero se instancia. Los siguientes
 * slots de ese mob se omiten silenciosamente.
 */
export function resolveEncounter(enc: Encounter): IEnemy[] {
  const spawnedUniques = new Set<string>()
  const out: IEnemy[] = []

  for (const m of enc.mobs) {
    for (let i = 0; i < m.count; i++) {
      if (
        m.factory.unique &&
        m.factory.uniqueKey &&
        spawnedUniques.has(m.factory.uniqueKey)
      ) {
        continue
      }
      const enemy = m.factory()
      if (m.factory.unique && m.factory.uniqueKey) {
        spawnedUniques.add(m.factory.uniqueKey)
      }
      out.push(enemy)
    }
  }
  return out
}

/**
 * Atajo: busca un encounter por id dentro de la config de una expedicion
 * y lo resuelve. Lanza si el id no existe.
 */
export function resolveEncounterById(
  config: IExpeditionConfig,
  encounterId: string
): IEnemy[] {
  const enc = config.encounters[encounterId]
  if (!enc) {
    throw new Error(
      `[encounters] expedition "${config.id}" has no encounter "${encounterId}"`
    )
  }
  return resolveEncounter(enc)
}
