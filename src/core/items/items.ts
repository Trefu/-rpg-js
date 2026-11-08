import type { IItem } from './types'
import { getItemIcon } from './itemIcons'
import type { Hero } from '@/core/Hero'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Frasco de curacion: restaura el 40% de la vida maxima
 * del heroe objetivo (aliado o a si mismo).
 */
export const createHealingFlask = (name = 'Frasco de curacion'): IItem => ({
  id: 'healing-flask',
  name,
  description: 'Restaura el 40% de la vida maxima de un heroe aliado seleccionado. Se repone al maximo de usos tras cada combate.',
  icon: getItemIcon('healing-flask'),
  requiresTarget: true,
  targetType: 'allies-only',
  animationDurationMs: 900,
  execute: async (context) => {
    const target = context.target as Hero
    if (!target || !target.isAlive) {
      context.addToLog('No puedes usar un Frasco de curacion sobre un heroe inconsciente.')
      return
    }
    const healAmount = Math.floor(target.maxHealth * 0.4)
    const before = target.health
    target.heal(healAmount)
    const restored = target.health - before
    if (restored > 0) context.showPlayerHit(restored, { heroId: target.id, variant: 'heal' })
    context.addToLog(
      `${context.caster.name} usa ${name} sobre ${target.name}: +${restored} HP (${target.health}/${target.maxHealth}).`
    )
    context.showAnnouncement(`+${restored} HP`, 'info', 1200)
    await sleep(context.animationDelay)
  }
})

/**
 * Pocion de energia: recarga TODA la energia del heroe objetivo.
 * Util para resetear cooldowns / repostar skills en mitad del combate.
 */
export const createEnergyPotion = (name = 'Pocion de energia'): IItem => ({
  id: 'energy-potion',
  name,
  description: 'Recupera toda la energia de un heroe aliado seleccionado. Se repone al maximo de usos tras cada combate.',
  icon: getItemIcon('energy-potion'),
  requiresTarget: true,
  targetType: 'allies-only',
  animationDurationMs: 900,
  execute: async (context) => {
    const target = context.target as Hero
    if (!target || !target.isAlive) {
      context.addToLog('No puedes usar una Pocion de energia sobre un heroe inconsciente.')
      return
    }
    const before = target.energy
    target.restoreEnergy(target.maxEnergy)
    const restored = target.energy - before
    context.addToLog(
      `${context.caster.name} usa ${name} sobre ${target.name}: +${restored} EN (${target.energy}/${target.maxEnergy}).`
    )
    context.showAnnouncement(`+${restored} EN`, 'info', 1200)
    await sleep(context.animationDelay)
  }
})

const ITEMS: Record<string, IItem> = {
  'healing-flask': createHealingFlask(),
  'energy-potion': createEnergyPotion(),
  'healing-potion': {
    ...createHealingFlask('Poción de curación'), id: 'healing-potion', icon: getItemIcon('healing-potion'),
    description: 'Recupera el 40% de la vida de un aliado. Un solo uso; no se recarga.'
  },
  'energy-tonic': {
    ...createEnergyPotion('Tónico de energía'), id: 'energy-tonic', icon: getItemIcon('energy-tonic'),
    description: 'Recupera toda la energía de un aliado. Un solo uso; no se recarga.'
  },
  'antidote': {
    id: 'antidote', name: 'Antídoto', icon: getItemIcon('antidote'),
    description: 'Elimina todas las cargas de veneno de un aliado. Un solo uso.',
    targetType: 'allies-only', requiresTarget: true,
    execute: async ctx => {
      if (!ctx.target?.isAlive) return
      ctx.target.removeStatusEffect('poison')
      ctx.addToLog(`${ctx.target.name} bebe un antídoto y elimina el veneno.`)
      await sleep(ctx.animationDelay)
    }
  },
  'bandages': {
    id: 'bandages', name: 'Vendas', icon: getItemIcon('bandages'),
    description: 'Eliminan Hemorragia y Herida abierta; recuperan 15% de vida. Un solo uso.',
    targetType: 'allies-only', requiresTarget: true,
    execute: async ctx => {
      const target = ctx.target as Hero
      if (!target?.isAlive) return
      target.removeStatusEffect('bleed')
      target.removeStatusEffect('open_wound')
      const before = target.health
      target.heal(Math.floor(target.maxHealth * 0.15))
      ctx.showPlayerHit(target.health - before, { heroId: target.id, variant: 'heal' })
      ctx.addToLog(`${target.name} venda sus heridas.`)
      await sleep(ctx.animationDelay)
    }
  }
}

export const ALL_ITEMS: IItem[] = Object.values(ITEMS)

export function getItem(id: string): IItem | undefined {
  return ITEMS[id]
}

export function getItemOrThrow(id: string): IItem {
  const item = ITEMS[id]
  if (!item) {
    throw new Error(
      `[items] Item desconocido "${id}". Registrados: ${Object.keys(ITEMS).join(', ')}`
    )
  }
  return item
}

/**
 * Usos maximos por combate para cada objeto recargable.
 * Tras una victoria, los heroes vuelven a tener exactamente estas
 * cantidades en su inventario (los stacks consumidos se rellenan).
 *
 * Escalar a futuro: subir los numeros aqui o por-hereo en su starter.
 */
export const ITEM_MAX_USES: Record<string, number> = {
  'healing-flask': 1,
  'energy-potion': 1
}

/**
 * Repone los usos de todos los objetos recargables de la bolsa compartida
 * del equipo hasta su maximo. Solo afecta a ids presentes en
 * ITEM_MAX_USES. Mantiene cualquier objeto no registrado intacto
 * (defensivo).
 */
export function restoreItemsToMax(items: string[]): void {
  for (const id of Object.keys(ITEM_MAX_USES)) {
    const target = ITEM_MAX_USES[id]
    let count = 0
    for (const entry of items) if (entry === id) count++
    if (count >= target) continue
    const missing = target - count
    for (let i = 0; i < missing; i++) items.push(id)
  }
}
