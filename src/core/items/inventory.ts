import { getItem } from './items'

export interface InventoryEntry {
  id: string
  count: number
}

/**
 * Devuelve las entradas del inventario (una bolsa `string[]` de ids de objeto),
 * agrupando por id y contando stacks. Conserva el orden de primera aparicion.
 */
export function getInventoryEntries(items: string[]): InventoryEntry[] {
  const counts = new Map<string, number>()
  const order: string[] = []
  for (const id of items) {
    if (!counts.has(id)) order.push(id)
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return order.map((id) => ({ id, count: counts.get(id) ?? 0 }))
}

export function countItem(items: string[], id: string): number {
  let c = 0
  for (const entry of items) if (entry === id) c++
  return c
}

/**
 * Elimina una unidad del stack con id `id` dentro de la bolsa dada.
 * Devuelve true si lo encontro. Solo decrementa si el id esta registrado
 * en el catalogo de items (defensivo).
 */
export function consumeItem(items: string[], id: string): boolean {
  const idx = items.indexOf(id)
  if (idx === -1) return false
  if (!getItem(id)) return false
  items.splice(idx, 1)
  return true
}
