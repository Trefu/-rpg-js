import type { Hero } from '@/core/Hero'
import { getItem } from './items'

export interface InventoryEntry {
  id: string
  count: number
}

/**
 * Devuelve las entradas del inventario del heroe, agrupando
 * por id y contando stacks. Conserva el orden de primera aparicion.
 */
export function getInventoryEntries(hero: Hero): InventoryEntry[] {
  const counts = new Map<string, number>()
  const order: string[] = []
  for (const id of hero.items) {
    if (!counts.has(id)) order.push(id)
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return order.map((id) => ({ id, count: counts.get(id) ?? 0 }))
}

export function countItem(hero: Hero, id: string): number {
  let c = 0
  for (const entry of hero.items) if (entry === id) c++
  return c
}

/**
 * Elimina una unidad del stack con id `id`. Devuelve true si lo encontro.
 * Solo decrementa si existe el item en el registro (defensivo).
 */
export function consumeItem(hero: Hero, id: string): boolean {
  const idx = hero.items.indexOf(id)
  if (idx === -1) return false
  if (!getItem(id)) return false
  hero.items.splice(idx, 1)
  return true
}
