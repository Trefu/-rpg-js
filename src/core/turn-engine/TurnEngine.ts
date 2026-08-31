export interface TurnActor {
  id: string
  name: string
  kind: 'hero' | 'enemy'
  agility: number
  isAlive: boolean
  /** Tipos de status effect activos (para detectar stun/skip). */
  activeEffectTypes: ReadonlySet<string>
  icon: string
}

export interface TurnCostState {
  costs: Record<string, number>
}

export interface TurnQueueEntry {
  actorId: string
  kind: 'act' | 'skip'
}

export const STUN_EFFECT_TYPE = 'stun'

export function turnCostBase(actor: TurnActor): number {
  return 100 / Math.max(1, actor.agility)
}

/**
 * Inicializa el estado de turnos para una lista de combatientes.
 * Cada cost arranca en su `turnCostBase`.
 */
export function initTurnState(actors: TurnActor[]): TurnCostState {
  const costs: Record<string, number> = {}
  for (const actor of actors) {
    costs[actor.id] = turnCostBase(actor)
  }
  return { costs }
}

/**
 * Devuelve el id del proximo actor: el vivo con menor `cost` acumulado.
 * Si hay empate, gana el que aparece antes en `actors`.
 * Devuelve `null` si no hay actores vivos.
 */
export function nextActorId(
  state: TurnCostState,
  actors: TurnActor[]
): string | null {
  let best: TurnActor | null = null
  let bestCost = Infinity
  for (const actor of actors) {
    if (!actor.isAlive) continue
    const cost = state.costs[actor.id]
    if (typeof cost !== 'number') continue
    if (cost < bestCost) {
      bestCost = cost
      best = actor
    }
  }
  return best?.id ?? null
}

/**
 * Avanza el estado DESPUES de que `actorId` haya terminado su turno.
 *
 * Mecanica FF/Persona:
 * - El actor que acaba de actuar "consume" un ciclo de tiempo igual a su
 *   `turnCostBase`. Su cost se resetea a `turnCostBase + overflow` (donde
 *   overflow = cost anterior - turnCostBase, sin clampear, para mantener
 *   precision si su cost estaba por debajo del base).
 * - TODOS los demas combatientes tambien avanzan en el tiempo: su cost
 *   se reduce en `elapsed = turnCostBase(actor)`. Esto permite que
 *   combatientes mas lentos (mayor turnCostBase) avancen su cola en
 *   proporcion. Los costs pueden ser negativos (= "le toca ya").
 *
 * No muta el estado recibido: devuelve uno nuevo.
 */
export function advanceAfterTurn(
  state: TurnCostState,
  actors: TurnActor[],
  actorId: string
): TurnCostState {
  const acting = actors.find(a => a.id === actorId)
  if (!acting) return state
  const elapsed = turnCostBase(acting)
  const costs: Record<string, number> = {}
  for (const a of actors) {
    const previous = state.costs[a.id] ?? elapsed
    if (a.id === actorId) {
      const overflow = previous - elapsed
      costs[a.id] = elapsed + overflow
    } else {
      costs[a.id] = previous - elapsed
    }
  }
  return { costs }
}

/**
 * Devuelve los proximos N turnos en orden como una cola discreta.
 * - Muertos se filtran.
 * - Si el combatiente esta stunned/disabled, su entrada se marca como 'skip'.
 * El primer slot NO necesariamente es el actor actual; el caller decide
 * quien marca como "current" en la UI.
 */
export function predictNextTurns(
  state: TurnCostState,
  actors: TurnActor[],
  n: number
): TurnQueueEntry[] {
  if (n <= 0) return []
  const alive = actors.filter(a => a.isAlive)
  const sorted = alive.slice().sort((a, b) => {
    const ca = state.costs[a.id] ?? Infinity
    const cb = state.costs[b.id] ?? Infinity
    if (ca !== cb) return ca - cb
    return alive.indexOf(a) - alive.indexOf(b)
  })
  return sorted.slice(0, n).map<TurnQueueEntry>(a => ({
    actorId: a.id,
    kind: a.activeEffectTypes.has(STUN_EFFECT_TYPE) ? 'skip' : 'act'
  }))
}