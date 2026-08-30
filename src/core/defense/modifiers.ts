import type { IStatusEffect, DefenseEffectSide, DefenseContribution } from '../interfaces/IStatusEffect'
import type { DefenseBlockEffect } from './types'

export interface DefenseModifiers {
  waveSpeedMultiplier: number
  successZoneSizeBonus: number
  phaseCountReduction: number
  blockReductionBonus: number
  counterAttackFraction: number
  /**
   * Efecto de bloqueo sobreescrito por perks/equipo/clase.
   * Si esta presente, reemplaza al `onBlockEffect` del patron.
   */
  blockEffectOverride?: DefenseBlockEffect
  /**
   * Efectos de bloqueo extra que se suman al efecto del patron
   * (ej. "parry" sobre "damage_reduction").
   */
  additionalBlockEffects?: DefenseBlockEffect[]
}

export const DEFAULT_DEFENSE_MODIFIERS: DefenseModifiers = {
  waveSpeedMultiplier: 1.0,
  successZoneSizeBonus: 0,
  phaseCountReduction: 0,
  blockReductionBonus: 0,
  counterAttackFraction: 0
}

export interface PlayerLikeForDefense {
  statusEffects: IStatusEffect[]
  defenseValue: number
}

export interface EnemyLikeForDefense {
  statusEffects: IStatusEffect[]
}

/**
 * Acumula en `modifiers` las contribuciones declarativas (`defenseContribution`)
 * de cada efecto activo de `effects`. Cada efecto decide su propio delta;
 * este helper solo itera, suma y filtra los inactivos.
 *
 * Centralizar el bucle aca evita repetir el `if (turns > 0)` y el casteo
 * del retorno en cada call site.
 */
function applyDefenseContributions(
  effects: IStatusEffect[] | undefined,
  modifiers: DefenseModifiers,
  side: DefenseEffectSide
): void {
  for (const effect of effects ?? []) {
    if (effect.turns <= 0) continue
    const contribution: DefenseContribution | undefined = effect.defenseContribution?.(effect, side)
    if (!contribution) continue
    if (typeof contribution.waveSpeedMultiplier === 'number') {
      modifiers.waveSpeedMultiplier += contribution.waveSpeedMultiplier
    }
    if (typeof contribution.blockReductionBonus === 'number') {
      modifiers.blockReductionBonus += contribution.blockReductionBonus
    }
  }
}

export function getDefenseModifiers(
  player: PlayerLikeForDefense,
  enemy?: EnemyLikeForDefense | null
): DefenseModifiers {
  const modifiers: DefenseModifiers = { ...DEFAULT_DEFENSE_MODIFIERS }

  // TODO: mapear más stats del jugador a modifiers (fuerza → blockReductionBonus?,
  // destreza → successZoneSizeBonus?, etc.). Por ahora solo status effects + defenseValue.

  applyDefenseContributions(player.statusEffects, modifiers, 'player')
  applyDefenseContributions(enemy?.statusEffects, modifiers, 'enemy')

  if (typeof player.defenseValue === 'number') {
    const extra = Math.max(0, player.defenseValue - 10)
    modifiers.blockReductionBonus += extra * 0.005
  }

  if (modifiers.waveSpeedMultiplier < 0.3) modifiers.waveSpeedMultiplier = 0.3
  if (modifiers.waveSpeedMultiplier > 2.0) modifiers.waveSpeedMultiplier = 2.0
  if (modifiers.successZoneSizeBonus < 0) modifiers.successZoneSizeBonus = 0
  if (modifiers.phaseCountReduction < 0) modifiers.phaseCountReduction = 0

  return modifiers
}
