/**
 * Elige un elemento aleatorio de una lista. Lanza si la lista esta
 * vacia (los callers deberian garantizar al menos un elemento).
 */
export function pickRandomFromList<T>(list: readonly T[]): T {
  if (list.length === 0) {
    throw new Error('[pickRandom] cannot pick from an empty list')
  }
  return list[Math.floor(Math.random() * list.length)]!
}
