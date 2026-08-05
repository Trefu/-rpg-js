import type { IPlayerStats } from '../interfaces/ICharacter'
import type { IStatusEffect } from '../interfaces/IStatusEffect'

export interface DefenseModifiers {
  waveSpeedMultiplier: number
  successZoneSizeBonus: number
  phaseCountReduction: number
  blockReductionBonus: number
  counterAttackFraction: number
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
  items?: string[]
  stats?: IPlayerStats
}

export function getDefenseModifiers(player: PlayerLikeForDefense): DefenseModifiers {
  const modifiers: DefenseModifiers = { ...DEFAULT_DEFENSE_MODIFIERS }

  for (const effect of player.statusEffects || []) {
    if (effect.type === 'defense_boost' && typeof effect.defenseBonus === 'number') {
      modifiers.blockReductionBonus += effect.defenseBonus * 0.05
    }
    if (effect.type === 'speed_boost' && typeof effect.speedBonus === 'number') {
      modifiers.waveSpeedMultiplier -= effect.speedBonus * 0.08
    }
    if (effect.type === 'speed_penalty' && typeof effect.speedPenalty === 'number') {
      modifiers.waveSpeedMultiplier += Math.abs(effect.speedPenalty) * 0.08
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
