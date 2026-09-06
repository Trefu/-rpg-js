import { getItem } from '../items/items'
import type { AppliedEffect, ResolveResult } from './curiosityEvents'

export type CuriosityResultKind = 'reward' | 'punishment' | 'noop' | 'ambush'

export interface CuriosityResultSummary {
  kind: CuriosityResultKind
  title: string
  flavor: string
  lines: string[]
}

/**
 * Formatea un `ResolveResult` en lineas legibles para el toast del
 * mapa de expedicion (y para cualquier otra UI que quiera resumir el
 * resultado de un evento). Agrupa efectos equivalentes para no llenar
 * la pantalla con una linea por heroe.
 */
export function summarizeCuriosityResult(
  title: string,
  result: ResolveResult
): CuriosityResultSummary {
  if (result.kind === 'ambush') {
    return {
      kind: 'ambush',
      title,
      flavor: result.flavor,
      lines: ['Combate inminente']
    }
  }
  if (result.kind === 'noop') {
    return {
      kind: 'noop',
      title,
      flavor: result.flavor,
      lines: []
    }
  }

  const lines: string[] = []
  const gold = sumGold(result.effects)
  if (gold !== 0) {
    lines.push(gold > 0 ? `+${gold} oro` : `${gold} oro`)
  }

  const xp = sumXp(result.effects)
  if (xp > 0) {
    lines.push(`+${xp} XP`)
  }

  const fullHeals = result.effects.filter(e => e.kind === 'fullHeal').length
  if (fullHeals > 0) {
    lines.push(fullHeals === 1 ? 'Curacion completa' : `Curacion completa x${fullHeals}`)
  }

  const heals = sumHeal(result.effects)
  if (heals > 0) {
    lines.push(`+${heals} HP curados`)
  }

  const damage = sumDamage(result.effects)
  if (damage > 0) {
    lines.push(`-${damage} HP recibidos`)
  }

  const energyGain = sumEnergyGain(result.effects)
  if (energyGain > 0) {
    lines.push(`+${energyGain} energia`)
  }

  const energyLoss = sumEnergyLoss(result.effects)
  if (energyLoss > 0) {
    lines.push(`-${energyLoss} energia`)
  }

  const items = result.effects.filter(e => e.kind === 'grantItem').map(e => {
    if (e.kind !== 'grantItem') return ''
    const item = getItem(e.itemId)
    return item ? item.name : e.itemId
  }).filter(Boolean)
  if (items.length > 0) {
    lines.push(`Obtuviste: ${items.join(', ')}`)
  }

  const lostItems = result.effects.filter(e => e.kind === 'loseItem').map(e => {
    if (e.kind !== 'loseItem') return ''
    const item = getItem(e.itemId)
    return item ? item.name : e.itemId
  }).filter(Boolean)
  if (lostItems.length > 0) {
    lines.push(`Perdiste: ${lostItems.join(', ')}`)
  }

  // Clasificamos el resultado como reward o punishment segun la
  // naturaleza dominante de los efectos. Esto lo usa el toast para
  // colorear el borde.
  const hasDamage = damage > 0 || energyLoss > 0 || lostItems.length > 0
  const hasReward = gold > 0 || xp > 0 || heals > 0 || fullHeals > 0
    || energyGain > 0 || items.length > 0

  let kind: CuriosityResultKind = 'noop'
  if (hasReward && hasDamage) {
    // Tradeoff: si el neto es positivo lo marcamos como reward, si no,
    // como punishment. Si hay dano + item ganado (sin oro/xp/curacion
    // positivos netos) sigue siendo punishment.
    const net = (gold) + (xp) + (heals) - (damage) - (energyLoss)
    kind = net >= 0 ? 'reward' : 'punishment'
  } else if (hasDamage) {
    kind = 'punishment'
  } else if (hasReward) {
    kind = 'reward'
  }

  return {
    kind,
    title,
    flavor: result.log[0] ?? '',
    lines
  }
}

// ---------------------------------------------------------------------------
// Helpers de agregacion
// ---------------------------------------------------------------------------

function sumGold(effects: AppliedEffect[]): number {
  return effects.reduce((acc, e) => acc + (e.kind === 'gold' ? e.delta : 0), 0)
}

function sumXp(effects: AppliedEffect[]): number {
  // Cada heroe recibe la misma xp, pero solo listamos una vez.
  const firstXp = effects.find(e => e.kind === 'xp')
  return firstXp && firstXp.kind === 'xp' ? firstXp.delta : 0
}

function sumHeal(effects: AppliedEffect[]): number {
  return effects.reduce((acc, e) => acc + (e.kind === 'heal' ? e.delta : 0), 0)
}

function sumDamage(effects: AppliedEffect[]): number {
  return effects.reduce((acc, e) => acc + (e.kind === 'damage' ? e.delta : 0), 0)
}

function sumEnergyGain(effects: AppliedEffect[]): number {
  return effects.reduce((acc, e) => acc + (e.kind === 'restoreEnergy' ? e.delta : 0), 0)
}

function sumEnergyLoss(effects: AppliedEffect[]): number {
  return effects.reduce((acc, e) => acc + (e.kind === 'energyLoss' ? e.delta : 0), 0)
}
