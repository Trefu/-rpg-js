import type { IItem } from './types'
import { getItemIcon } from './itemIcons'
import type { Hero } from '@/core/Hero'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Frasco de curacion: restaura el 40% de la vida maxima
 * del heroe objetivo (aliado o a si mismo).
 */
export const createHealingFlask = (): IItem => ({
  id: 'healing-flask',
  name: 'Frasco de curacion',
  description: 'Restaura el 40% de la vida maxima de un heroe aliado seleccionado.',
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
    context.addToLog(
      `${context.caster.name} usa Frasco de curacion sobre ${target.name}: +${restored} HP (${target.health}/${target.maxHealth}).`
    )
    context.showAnnouncement(`+${restored} HP`, 'info', 1200)
    await sleep(context.animationDelay)
  }
})

const ITEMS: Record<string, IItem> = {
  'healing-flask': createHealingFlask()
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
