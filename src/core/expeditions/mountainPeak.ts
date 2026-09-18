import {
  bandit,
  banditCaptain,
  dragon,
  goblin,
  goblinArcher,
  goblinWarlock,
  orc,
  wolf
} from './factories'
import { each, eliteMob, mob, roster } from './encounters'
import type { IExpeditionConfig } from './types'

/**
 * Primera expedicion jugable: "Montanas Rocosas". Migracion directa de
 * lo que antes vivia en `ZONE_ENEMY_POOLS['mountain-peak']` + `ZONES['mountain-peak']`
 * + el `CONFIG` del generador + los 5 ambush encounters nombrados en el
 * plan (bandit-ambush-3, stone-guardians-2, dragon-mother-arrives,
 * goblin-cousins, bandits-debt).
 *
 * Notas sobre las sustituciones:
 * - `stone-guardians-2` usa `Orc` como placeholder visual hasta que
 *   exista una clase `Golem`. La cantidad (2) y el nivel son los que
 *   tendria un guardian de piedra de runa media.
 */
export const MOUNTAIN_PEAK: IExpeditionConfig = {
  id: 'mountain-peak',
  displayName: 'Montañas Rocosas',
  description:
    'Una montana escarpada con ruinas antiguas en la cima. Ideal para una primera expedicion.',
  totalFloors: 10,
  unlockCriteria: { kind: 'always' },
  presentation: {
    difficulty: 'easy',
    background: '',
    rewards: { experience: 50, gold: 25 }
  },

  enemyPools: roster({
    intro: [
      mob(goblin(1), 2)
    ],
    early: each(2, goblin(3), goblinArcher(3), goblinWarlock(3)),
    mid: [
      mob(wolf(5), 3),
      mob(bandit(5), 3),
      mob(orc(5), 3),
      eliteMob('bandit-captain', banditCaptain(5))
    ],
    late: [
      mob(wolf(5), 3),
      mob(bandit(5), 3),
      mob(orc(5), 4),
      eliteMob('bandit-captain', banditCaptain(6))
    ],
    boss: [
      mob(dragon(8))
    ]
  }),

  enemyCountPerTier: {
    intro: [2, 2],
    early: [2, 2],
    mid: [3, 3],
    late: [3, 5],
    boss: [1, 1]
  },

  /**
   * Encounters fijos referenciables desde outcomes `ambush` de
   * `SHARED_CURIOSITY_EVENTS` y (eventualmente) desde `forcedNodes`
   * del generador. Mantener este catalogo junto a la expedicion
   * facilita ver, de un vistazo, que encuentros narrativos dispara
   * este dungeon.
   */
  encounters: {
    'bandit-ambush-3': {
      id: 'bandit-ambush-3',
      flavor: 'Tres bandidos salen de entre los arbustos con los cuchillos desenvainados.',
      mobs: [mob(bandit(4), 3)]
    },
    'stone-guardians-2': {
      id: 'stone-guardians-2',
      flavor: 'Dos guardianes de piedra avanzan hacia ti desde la camara.',
      mobs: [mob(orc(6), 2)]
    },
    'dragon-mother-arrives': {
      id: 'dragon-mother-arrives',
      flavor: 'La madre dragon aterriza frente a la cria con un rugido que sacude las paredes.',
      mobs: [mob(dragon(7))]
    },
    'goblin-cousins': {
      id: 'goblin-cousins',
      flavor: 'Tres goblins del mercader caen sobre ti con cuchillos oxidados.',
      mobs: [mob(goblin(4), 3)]
    },
    'bandits-debt': {
      id: 'bandits-debt',
      flavor: 'Dos bandidos salen de entre el publico para cobrar la deuda del bardo.',
      mobs: [mob(bandit(5), 2)]
    }
  },

  generator: {
    minNodesBeforeBoss: 8,
    shopChance: 0.15,
    curiosityChance: 0.1,
    maxRetries: 50,
    maxParentsPerNode: 2,
    proximityThreshold: 40,
    forcedSingleRows: [5],
    forcedCombatRows: [0, 1],
    forcedNodes: [],
    recruitHeroRow: 2,
    minCuriosityNodes: 2,
    maxCuriosityNodes: 4,
    maxConsecutiveCuriosity: 2,
    minShopNodes: 1,
    maxShopNodes: 2,
    maxConsecutiveShop: 1
  }
}
