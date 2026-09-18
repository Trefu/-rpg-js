import type { IEnemy } from '@/core/interfaces/ICharacter'
import type { INode } from '@/core/interfaces/IExpedition'
import type { CuriosityEvent } from '@/core/events/curiosityEvents'

/**
 * Identificador de una expedicion. Es un `string` (no un union literal)
 * para que cada expedicion pueda definirse en su propio archivo y para
 * evitar que haya que tocar este modulo cada vez que se agrega un dungeon.
 */
export type ExpeditionId = string

/**
 * Funcion que produce una instancia fresca de un enemigo. Es la unidad
 * minima del DSL de encounters. Si la factory lleva `unique` + `uniqueKey`
 * (ver `elite()` en `core/zones/EnemyPools.ts`), el resolver garantiza
 * maximo 1 instancia por `uniqueKey` dentro del mismo encounter.
 */
export type EnemyFactory = (() => IEnemy) & {
  unique?: boolean
  uniqueKey?: string
}

/** Rango inclusivo `[min, max]` de enemigos por tier. */
export type EnemyCountRange = readonly [number, number]

export type EnemyTier = 'intro' | 'early' | 'mid' | 'late' | 'boss'

/**
 * Pools de enemigos por tier de dificultad. Cada posicion del array
 * representa una "bola" en la urna: duplicar una factory aumenta su peso
 * relativo en el muestreo.
 */
export interface EnemyPool {
  intro: EnemyFactory[]
  early: EnemyFactory[]
  mid: EnemyFactory[]
  late: EnemyFactory[]
  boss: EnemyFactory[]
}

/**
 * Bloque basico del DSL de encounters. `mob(factory, count)` produce uno
 * de estos; el `count` por defecto es 1.
 */
export interface Mob {
  count: number
  factory: EnemyFactory
}

/**
 * Encounter fijo: composicion determinista de enemigos. Se usa como
 * referencia desde outcomes `ambush` de curiosity events y desde
 * `forcedNodes` del generador de mapa.
 */
export interface Encounter {
  id: string
  /** Texto narrativo opcional para flavor (ej: "La madre dragon baja del cielo"). */
  flavor?: string
  mobs: Mob[]
}

/**
 * Criterio de desbloqueo de una expedicion. Hoy solo dos variantes:
 * - `always`: siempre jugable.
 * - `requires`: requiere haber completado todas las expediciones listadas.
 */
export type ExpeditionUnlockCriteria =
  | { kind: 'always' }
  | { kind: 'requires'; expeditions: ExpeditionId[] }

/**
 * Forzados que el generador de mapa debe respetar fila-a-fila.
 * `row` esta indexado desde 0 (siendo row 0 = 'start', la ultima fila = 'boss').
 */
export interface ForcedNode {
  row: number
  type: INode['type']
  /** Si esta definido y type es combat/boss, el nodo usa este encounter en vez del pool. */
  encounter?: string
}

/**
 * Configuracion del layout del mapa. Antes vivia como constantes en
 * `useExpeditionGenerator.ts`. Ahora cada expedicion puede ajustar las
 * probabilidades y los nodos forzados sin tocar codigo compartido.
 */
export interface ExpeditionGeneratorConfig {
  minNodesBeforeBoss: number
  shopChance: number
  curiosityChance: number
  maxRetries: number
  maxParentsPerNode: number
  proximityThreshold: number
  forcedSingleRows: number[]
  forcedCombatRows: number[]
  forcedNodes: ForcedNode[]
  /** Fila (0-indexed) en la que se fuerza un nodo `recruit-hero`. Opcional. */
  recruitHeroRow?: number
  minCuriosityNodes: number
  maxCuriosityNodes: number
  maxConsecutiveCuriosity: number
  minShopNodes: number
  maxShopNodes: number
  maxConsecutiveShop: number
}

/**
 * Dificultad / flavor metadata para la UI (pre-game y mapa). Es
 * informacional: el gating real vive en `unlockCriteria`.
 */
export interface ExpeditionPresentation {
  difficulty: 'easy' | 'medium' | 'hard'
  background: string
  rewards: { experience: number, gold: number }
  /** Marcada como "En desarrollo": aparece listada pero no es jugable. */
  inDevelopment?: boolean
}

/**
 * Entidad primaria de una run. Reemplaza la dupla `IZone` +
 * `ZoneEnemyConfig`. Contiene:
 * - identidad, flavor y reglas de unlock,
 * - pools de enemigos por tier y rango de cantidad,
 * - encounters fijos (referenciables desde events y nodos),
 * - catalogo de curiosity events (o hereda el compartido),
 * - reglas del generador de mapa.
 */
export interface IExpeditionConfig {
  id: ExpeditionId
  displayName: string
  description: string
  totalFloors: number
  unlockCriteria: ExpeditionUnlockCriteria
  presentation: ExpeditionPresentation

  /** Pools por tier (lo que antes era `ZoneEnemyConfig.pools`). */
  enemyPools: EnemyPool
  /** Cantidad de enemigos por tier (lo que antes era `ZoneEnemyConfig.enemyCountPerTier`). */
  enemyCountPerTier: Record<EnemyTier, EnemyCountRange>

  /** Encounters fijos (id -> Encounter). Referenciables desde events y nodos. */
  encounters: Record<string, Encounter>

  /**
   * Catalogo de curiosity events de esta expedicion. Si se omite, se
   * hereda `SHARED_CURIOSITY_EVENTS` desde `sharedCuriosityEvents.ts`.
   */
  curiosityEvents?: CuriosityEvent[]

  /** Reglas del generador de mapa. */
  generator: ExpeditionGeneratorConfig
}
