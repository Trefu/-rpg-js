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

/**
 * Pocion de energia: recarga TODA la energia del heroe objetivo.
 * Util para resetear cooldowns / repostar skills en mitad del combate.
 */
export const createEnergyPotion = (): IItem => ({
  id: 'energy-potion',
  name: 'Pocion de energia',
  description: 'Recupera toda la energia de un heroe aliado seleccionado.',
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
      `${context.caster.name} usa Pocion de energia sobre ${target.name}: +${restored} EN (${target.energy}/${target.maxEnergy}).`
    )
    context.showAnnouncement(`+${restored} EN`, 'info', 1200)
    await sleep(context.animationDelay)
  }
})

const ITEMS: Record<string, IItem> = {
  'healing-flask': createHealingFlask(),
  'energy-potion': createEnergyPotion()
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
 * Repone los usos de todos los objetos recargables del heroe hasta su maximo.
 * Solo afecta a ids presentes en ITEM_MAX_USES. Mantiene cualquier objeto
 * no registrado intacto (defensivo).
 */
export function restoreItemsToMax(hero: Hero): void {
  for (const id of Object.keys(ITEM_MAX_USES)) {
    const target = ITEM_MAX_USES[id]
    let count = 0
    for (const entry of hero.items) if (entry === id) count++
    if (count >= target) continue
    const missing = target - count
    for (let i = 0; i < missing; i++) hero.items.push(id)
  }
}