import type { ChoiceOutcome } from '../events/curiosityEvents'
import type { IExpeditionConfig } from './types'
import { resolveEncounterById } from './encounters'
import { resolveEnemyGroup } from '../zones/EnemyPools'

/** A narrative ambush must declare its faction or a specific coherent formation. */
export function resolveAmbushEnemies(config: IExpeditionConfig, outcome: Extract<ChoiceOutcome, { kind: 'ambush' }>, floor: number) {
  if (outcome.group) return resolveEnemyGroup(config, outcome.group, Math.max(2, Math.min(config.totalFloors - 1, floor)))
  if (outcome.encounter) return resolveEncounterById(config, outcome.encounter)
  throw new Error('[ambushes] An ambush requires a group or an encounter')
}
