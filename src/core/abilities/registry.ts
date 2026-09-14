import type { IAbility } from '../interfaces/IAbility'
import type { DefensePatternConfig } from '../defense/types'

/**
 * Tags categorizan abilities y enemy attacks para auto-poblar UIs (training,
 * filtros, recomendaciones) sin tener que mantener listas hardcodeadas.
 * - `warrior` / `cleric`: clase de heroe dueña (enemies pueden ser ambos).
 * - `physical` / `fire` / `holy` / etc.: tipo de daño.
 * - `damage` / `heal` / `buff`: mecánica principal.
 * - `aoe`: golpea a multiples objetivos.
 */
export type AbilityTag =
  | 'warrior' | 'cleric'
  | 'physical' | 'fire' | 'holy'
  | 'damage' | 'heal' | 'buff' | 'aoe'
  | 'ultimate'

const abilityRegistry = new Map<string, IAbility>()
const enemyAttackRegistry = new Map<string, DefensePatternConfig>()

/**
 * Registra una ability en el registry global. Llamar al final del archivo
 * de cada ability (después del `export const X: IAbility = {...}`) para
 * auto-registrarla al importarse el módulo.
 *
 * Si dos abilities declaran el mismo `type`, gana la última y se loguea
 * un warning — suele indicar copy/paste mal hecho.
 */
export function registerAbility(a: IAbility): void {
  if (abilityRegistry.has(a.type)) {
    console.warn(`[abilities] duplicate type "${a.type}" — overwriting previous registration`)
  }
  abilityRegistry.set(a.type, a)
}

export function getAbility(type: string): IAbility | undefined {
  return abilityRegistry.get(type)
}

export function getAllAbilities(): IAbility[] {
  return [...abilityRegistry.values()]
}

export function getAbilitiesByTag(tag: AbilityTag | string): IAbility[] {
  return [...abilityRegistry.values()].filter(a => a.tags?.includes(tag as AbilityTag))
}

export function getRegisteredAbilityTypes(): string[] {
  return [...abilityRegistry.keys()]
}

export function registerEnemyAttack(p: DefensePatternConfig): void {
  if (!p.name) {
    console.warn('[enemyAttacks] tried to register a pattern without name')
    return
  }
  enemyAttackRegistry.set(p.name, p)
}

export function getEnemyAttack(name: string): DefensePatternConfig | undefined {
  return enemyAttackRegistry.get(name)
}

export function getAllEnemyAttacks(): DefensePatternConfig[] {
  return [...enemyAttackRegistry.values()]
}

export function getRegisteredEnemyAttackNames(): string[] {
  return [...enemyAttackRegistry.keys()]
}
