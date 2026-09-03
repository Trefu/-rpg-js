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
 * - A diferencia de un sort estatico, aqui se simula la progresion de turnos:
 *   se elige al actor con menor cost, se marca, y se avanza el estado igual
 *   que haria `advanceAfterTurn`. Asi un mismo actor puede aparecer varias
 *   veces en la cola, igual que ocurre en la batalla real.
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
  if (alive.length === 0) return []

  let costs: Record<string, number> = { ...state.costs }
  const out: TurnQueueEntry[] = []

  for (let i = 0; i < n; i++) {
    const aliveNow = alive.filter(a => typeof costs[a.id] === 'number')
    if (aliveNow.length === 0) break

    let best: TurnActor | null = null
    let bestCost = Infinity
    let bestIdx = Infinity
    for (let j = 0; j < aliveNow.length; j++) {
      const a = aliveNow[j]
      const c = costs[a.id]
      if (c < bestCost || (c === bestCost && j < bestIdx)) {
        best = a
        bestCost = c
        bestIdx = j
      }
    }
    if (!best) break

    out.push({
      actorId: best.id,
      kind: best.activeEffectTypes.has(STUN_EFFECT_TYPE) ? 'skip' : 'act'
    })

    const elapsed = turnCostBase(best)
    for (const a of alive) {
      const previous = costs[a.id] ?? elapsed
      if (a.id === best.id) {
        const overflow = previous - elapsed
        costs[a.id] = elapsed + overflow
      } else {
        costs[a.id] = previous - elapsed
      }
    }
  }

  return out
}