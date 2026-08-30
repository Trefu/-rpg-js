import type { IStatusEffect } from '../interfaces/IStatusEffect'
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

export function getDefenseModifiers(
  player: PlayerLikeForDefense,
  enemy?: EnemyLikeForDefense | null
): DefenseModifiers {
  const modifiers: DefenseModifiers = { ...DEFAULT_DEFENSE_MODIFIERS }

  // TODO: mapear más stats del jugador a modifiers (fuerza → blockReductionBonus?,
  // destreza → successZoneSizeBonus?, etc.). Por ahora solo status effects + defenseValue.

  for (const effect of player.statusEffects || []) {
    if (effect.type === 'defense_boost' && typeof effect.defenseBonus === 'number') {
      modifiers.blockReductionBonus += effect.defenseBonus * 0.05
    }
    if (effect.type === 'speed_boost' && typeof effect.speedBonus === 'number') {
      // Buff de velocidad → la onda se mueve más lento (más fácil bloquear)
      modifiers.waveSpeedMultiplier -= effect.speedBonus * 0.08
    }
    if (typeof effect.speedPenalty === 'number' && effect.speedPenalty < 0) {
      // Penalty de velocidad (slow, freeze, etc.) → la onda se mueve más rápido (más difícil)
      modifiers.waveSpeedMultiplier += Math.abs(effect.speedPenalty) * 0.08
    }
    // "Lesionado" en el jugador → se invierte: la onda se mueve más rápido (más difícil bloquear).
    if (effect.type === 'injured' && effect.turns > 0 && effect.defenseWaveSpeedImpact) {
      modifiers.waveSpeedMultiplier += effect.defenseWaveSpeedImpact
    }
  }

  // "Lesionado" en el enemigo → la onda se mueve más lento (más fácil defender).
  // El efecto se cuenta por turnos restantes > 0 para que solo afecte mientras está activo.
  if (enemy?.statusEffects) {
    for (const effect of enemy.statusEffects) {
      if (effect.type === 'injured' && effect.turns > 0 && effect.defenseWaveSpeedImpact) {
        modifiers.waveSpeedMultiplier -= effect.defenseWaveSpeedImpact
      }
    }
  }

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
