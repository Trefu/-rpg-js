import type { Hero } from '../Hero'

// ============================================================================
// Tipos del sistema de eventos "??" (estilo Slay the Spire).
//
// Un evento tiene un titulo, una descripcion narrativa y 2-3 elecciones.
// Cada eleccion produce un outcome que el motor sabe aplicar al estado del
// juego (recompensa, castigo, emboscada o no-op).
//
// `reward` y `punishment` aceptan el mismo set de `Effect` para permitir
// tradeoffs (ej. "te haces dano pero ganas un flask"). La diferencia entre
// ambos esta solo en el texto de flavor.
// ============================================================================

/** Set unificado de efectos aplicables al party. */
export type Effect =
  | { kind: 'gold'; amount: number }
  | { kind: 'xp'; amount: number }
  | { kind: 'xpPercent'; percent: 5 | 10 | 15 }
  | { kind: 'heal'; amount: number }
  | { kind: 'fullHeal' }
  | { kind: 'restoreEnergy'; amount: number }
  | { kind: 'energyLoss'; amount: number }
  | { kind: 'damage'; amount: number }
  | { kind: 'grantItem'; itemId: string }
  | { kind: 'loseItem'; itemId: string }
  | { kind: 'loseRandomItem' }

/** `gold` con `amount > 0` suma, con `amount < 0` resta. */
export type ChoiceOutcome =
  | { kind: 'reward'; effects: Effect[]; flavor: string }
  | { kind: 'punishment'; effects: Effect[]; flavor: string }
  | { kind: 'ambush'; flavor: string; encounter?: string }
  | { kind: 'noop'; flavor: string }

export interface CuriosityChoice {
  id: string
  label: string
  outcome: ChoiceOutcome
}

export interface CuriosityEvent {
  id: string
  title: string
  flavor: string
  choices: CuriosityChoice[]
}

// ============================================================================
// Contexto y resultados de la resolucion.
// ============================================================================

export interface EventContext {
  heroes: Hero[]
  teamItems: string[]
}

export type AppliedEffect =
  | { kind: 'gold'; heroName: string; delta: number }
  | { kind: 'xp'; heroName: string; delta: number }
  | { kind: 'heal'; heroName: string; delta: number }
  | { kind: 'fullHeal'; heroName: string }
  | { kind: 'restoreEnergy'; heroName: string; delta: number }
  | { kind: 'energyLoss'; heroName: string; delta: number }
  | { kind: 'damage'; heroName: string; delta: number }
  | { kind: 'grantItem'; itemId: string }
  | { kind: 'loseItem'; itemId: string }

export type ResolveResult =
  | { kind: 'effects-applied'; log: string[]; effects: AppliedEffect[] }
  | { kind: 'ambush'; flavor: string }
  | { kind: 'noop'; flavor: string }

// ============================================================================
// Motor de resolucion (puro, sin dependencias de Pinia/Vue).
// ============================================================================

export function resolveCuriosityChoice(
  choice: CuriosityChoice,
  ctx: EventContext
): ResolveResult {
  const outcome = choice.outcome

  if (outcome.kind === 'ambush') {
    return { kind: 'ambush', flavor: outcome.flavor }
  }
  if (outcome.kind === 'noop') {
    return { kind: 'noop', flavor: outcome.flavor }
  }

  const effects: AppliedEffect[] = []
  for (const eff of outcome.effects) {
    effects.push(...applyEffect(eff, ctx))
  }

  return { kind: 'effects-applied', log: [outcome.flavor], effects }
}

function applyEffect(eff: Effect, ctx: EventContext): AppliedEffect[] {
  const living = ctx.heroes.filter(h => h.isAlive)
  const out: AppliedEffect[] = []

  switch (eff.kind) {
    case 'gold': {
      if (eff.amount === 0 || living.length === 0) break
      if (eff.amount > 0) {
        const perHero = Math.floor(eff.amount / living.length)
        const remainder = eff.amount - perHero * living.length
        living.forEach((h, i) => {
          const amt = perHero + (i === 0 ? remainder : 0)
          if (amt > 0) {
            h.addGold(amt)
            out.push({ kind: 'gold', heroName: h.name, delta: amt })
          }
        })
      } else {
        const total = Math.abs(eff.amount)
        const perHero = Math.floor(total / living.length)
        const remainder = total - perHero * living.length
        living.forEach((h, i) => {
          const amt = perHero + (i === 0 ? remainder : 0)
          if (amt > 0 && h.spendGold(amt)) {
            out.push({ kind: 'gold', heroName: h.name, delta: -amt })
          }
        })
      }
      break
    }
    case 'xp':
      living.forEach(h => {
        h.gainExperience(eff.amount)
        out.push({ kind: 'xp', heroName: h.name, delta: eff.amount })
      })
      break
    case 'xpPercent':
      living.forEach(h => {
        const amount = Math.floor(h.experienceToNextLevel * eff.percent / 100)
        if (amount > 0) {
          h.gainExperience(amount)
          out.push({ kind: 'xp', heroName: h.name, delta: amount })
        }
      })
      break
    case 'heal':
      living.forEach(h => {
        const before = h.health
        h.heal(eff.amount)
        const delta = h.health - before
        if (delta > 0) out.push({ kind: 'heal', heroName: h.name, delta })
      })
      break
    case 'fullHeal':
      living.forEach(h => {
        if (h.health < h.maxHealth) {
          h.health = h.maxHealth
          out.push({ kind: 'fullHeal', heroName: h.name })
        }
      })
      break
    case 'restoreEnergy':
      living.forEach(h => {
        const delta = h.restoreEnergy(eff.amount)
        if (delta > 0) out.push({ kind: 'restoreEnergy', heroName: h.name, delta })
      })
      break
    case 'energyLoss':
      living.forEach(h => {
        const lost = Math.min(h.energy, eff.amount)
        if (lost > 0) {
          h.spendEnergy(lost)
          out.push({ kind: 'energyLoss', heroName: h.name, delta: lost })
        }
      })
      break
    case 'damage':
      living.forEach(h => {
        const before = h.health
        h.takeDamage(eff.amount)
        const dealt = before - h.health
        if (dealt > 0) out.push({ kind: 'damage', heroName: h.name, delta: dealt })
      })
      break
    case 'grantItem':
      ctx.teamItems.push(eff.itemId)
      out.push({ kind: 'grantItem', itemId: eff.itemId })
      break
    case 'loseItem': {
      const idx = ctx.teamItems.indexOf(eff.itemId)
      if (idx >= 0) {
        ctx.teamItems.splice(idx, 1)
        out.push({ kind: 'loseItem', itemId: eff.itemId })
      }
      break
    }
    case 'loseRandomItem': {
      if (ctx.teamItems.length === 0) break
      const idx = Math.floor(Math.random() * ctx.teamItems.length)
      const removed = ctx.teamItems.splice(idx, 1)[0]
      if (removed) out.push({ kind: 'loseItem', itemId: removed })
      break
    }
  }
  return out
}

// ============================================================================
// Re-exports: el catalogo de eventos ahora vive junto a las expediciones
// (cada expedicion puede sobreescribirlo o heredar el compartido).
// ============================================================================

export { SHARED_CURIOSITY_EVENTS } from '@/core/expeditions/sharedCuriosityEvents'
