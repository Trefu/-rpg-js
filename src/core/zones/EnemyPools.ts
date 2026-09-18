import type { IEnemy } from '../interfaces/ICharacter'
import type {
  EnemyCountRange,
  EnemyFactory,
  EnemyPool,
  EnemyTier,
  IExpeditionConfig
} from '../expeditions/types'

/**
 * Helpers re-exportados para mantener backwards-compat en callers
 * existentes. La fuente de verdad ahora vive en `core/expeditions/`.
 */
export type {
  EnemyCountRange,
  EnemyFactory,
  EnemyPool,
  EnemyTier,
  IExpeditionConfig
}

/**
 * Marca una factory como "elite unica": durante el muestreo de enemigos,
 * si ya hay un enemigo con el mismo `uniqueKey`, esa factory no se
 * vuelve a elegir. Usado para minibosses (max 1 por combate/encounter).
 */
export function elite(key: string, factory: () => IEnemy): EnemyFactory {
  const f = factory as EnemyFactory
  f.unique = true
  f.uniqueKey = key
  return f
}

/**
 * Mapea un piso (1..totalFloors) a un tier de dificultad. La logica
 * exacta se conserva del sistema previo para no alterar balance.
 */
export function determineEnemyTier(floor: number, totalFloors: number): EnemyTier {
  if (floor <= 1) return 'intro'
  if (floor >= totalFloors) return 'boss'
  if (floor >= totalFloors - 3) return 'late'
  if (floor <= 2) return 'early'
  return 'mid'
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Elige una factory del pool respetando la restriccion de "elite unica":
 * si una factory tiene `unique === true` y su `uniqueKey` ya aparece en
 * `spawnedUniques`, se re-elige otra (hasta un limite de intentos).
 */
function pickFactory(pool: EnemyFactory[], spawnedUniques: Set<string>): EnemyFactory {
  const maxAttempts = pool.length * 4
  let attempts = 0
  let factory = pool[Math.floor(Math.random() * pool.length)]
  while (
    attempts < maxAttempts &&
    factory.unique &&
    factory.uniqueKey &&
    spawnedUniques.has(factory.uniqueKey)
  ) {
    factory = pool[Math.floor(Math.random() * pool.length)]
    attempts++
  }
  return factory
}

/**
 * Resuelve un pool aleatorio segun el tier correspondiente al piso.
 * Devuelve una lista fresca de `IEnemy`. Usado por el generador de mapa
 * para nodos `combat`/`boss`/`start` que NO declaran un encounter fijo.
 */
export function getEnemiesForConfig(
  config: IExpeditionConfig,
  floor: number
): IEnemy[] {
  const totalFloors = config.totalFloors
  const tier = determineEnemyTier(floor, totalFloors)
  const pool = config.enemyPools[tier]
  const [min, max] = config.enemyCountPerTier[tier]
  const count = randomInt(min, max)

  const selected: IEnemy[] = []
  const spawnedUniques = new Set<string>()

  for (let i = 0; i < count; i++) {
    const factory = pickFactory(pool, spawnedUniques)
    const enemy = factory()
    if (factory.unique && factory.uniqueKey) {
      spawnedUniques.add(factory.uniqueKey)
    }
    selected.push(enemy)
  }
  return selected
}
