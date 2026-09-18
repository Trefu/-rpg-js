import type { IEnemy } from '@/core/interfaces/ICharacter'
import { elite } from '@/core/zones/EnemyPools'
import type {
  Encounter,
  EnemyFactory,
  EnemyPool,
  EnemyTier,
  IExpeditionConfig,
  Mob
} from './types'

/**
 * Azucar sintactico para componer encounters.
 *
 *   mob(goblin(3))          // 1 goblin
 *   mob(goblin(3), 3)       // 3 goblins
 *   eliteMob('bandit-captain', banditCaptain(5))  // 1 mini-boss unico
 *
 * Retorna un `Mob` listo para enchufar en un `Encounter.mobs` o en un
 * `pool(...)`/`roster(...)`/`each(...)`.
 */
export function mob(factory: EnemyFactory, count: number = 1): Mob {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`[encounters] mob count must be a positive integer, got ${count}`)
  }
  return { factory, count }
}

/**
 * Azucar para `mob(elite(key, factory))`. Marca la factory como
 * "elite unica" (max 1 instancia por key en el mismo encounter/pool)
 * y la envuelve en un `Mob` de una sola copia.
 */
export function eliteMob(key: string, factory: EnemyFactory): Mob {
  return mob(elite(key, factory))
}

/**
 * Azucar para declarar muchas factories con el mismo `count`. Pensado
 * para el patron "N copias de cada uno de estos enemigos":
 *
 *   each(2, goblin(3), goblinArcher(3), goblinWarlock(3))
 *   // = [mob(goblin(3), 2), mob(goblinArcher(3), 2), mob(goblinWarlock(3), 2)]
 *
 * Combinable con spreads para mezclar patrones:
 *
 *   [
 *     mob(dragon(8), 1),
 *     ...each(2, goblin(5), orc(5))
 *   ]
 */
export function each(count: number, ...factories: EnemyFactory[]): Mob[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`[encounters] each count must be a positive integer, got ${count}`)
  }
  return factories.map(f => mob(f, count))
}

/**
 * Convierte una lista de `Mob`s en la lista plana de `EnemyFactory`
 * que `EnemyPool[tier]` espera. Cada `Mob` aporta `count` copias de su
 * factory. Asi, declarar pesos en el pool es legible:
 *
 *   pool(mob(goblin(1), 2), mob(orc(3), 1))   // 2/3 goblin, 1/3 orc
 *
 * Tambien acepta un solo argumento array para encadenar con un spread:
 *
 *   pool([mob(goblin(1), 2), mob(orc(3), 1)])
 */
export function pool(...mobs: Mob[]): EnemyFactory[]
export function pool(mobs: Mob[]): EnemyFactory[]
export function pool(...args: (Mob | Mob[])[]): EnemyFactory[] {
  const flat: Mob[] = args.flat()
  const out: EnemyFactory[] = []
  for (const m of flat) {
    for (let i = 0; i < m.count; i++) out.push(m.factory)
  }
  return out
}

/**
 * Construye un `EnemyPool` a partir de definiciones por tier. Los tiers
 * no especificados quedan como pool vacio. La forma mas legible de
 * declarar un pool entero:
 *
 *   roster({
 *     intro: [mob(goblin(1), 2)],
 *     early: each(2, goblin(3), goblinArcher(3), goblinWarlock(3)),
 *     boss:  [mob(dragon(8))]
 *   })
 */
export function roster(defs: Partial<Record<EnemyTier, Mob[]>>): EnemyPool {
  const tiers: EnemyTier[] = ['intro', 'early', 'mid', 'late', 'boss']
  const out = {} as EnemyPool
  for (const t of tiers) {
    out[t] = pool(defs[t] ?? [])
  }
  return out
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
