import sabersChoc from '@/assets/icons/sabers-choc.png'
import swordSlice from '@/assets/icons/sword-slice.png'
import swordBrandish from '@/assets/icons/sword-brandish.png'
import swordArray from '@/assets/icons/sword-array.png'
import swordSpin from '@/assets/icons/sword-spin.png'
import swordClash from '@/assets/icons/sword-clash.png'
import sharpAxe from '@/assets/icons/sharp-axe.png'
import warAxe from '@/assets/icons/war-axe.png'
import spikedMace from '@/assets/icons/spiked-mace.png'
import thunderBlade from '@/assets/icons/thunder-blade.png'
import twoHandedSword from '@/assets/icons/two-handed-sword.png'
import heartDrop from '@/assets/icons/heart-drop.png'
import regeneration from '@/assets/icons/regeneration.png'
import stunGrenade from '@/assets/icons/stun-grenade.png'
import thrownKnife from '@/assets/icons/thrown-knife.png'
import thrownDaggers from '@/assets/icons/thrown-daggers.png'
import ninjaStance from '@/assets/icons/ninja-heroic-stance.png'
import smallFire from '@/assets/icons/small-fire.png'
import fire from '@/assets/icons/fire.png'
import waveStrike from '@/assets/icons/wave-strike.png'

export type AbilityIconType =
  | 'attack'
  | 'warriorAttack'
  | 'warriorVerticalSlash'
  | 'warriorDevastatingStrike'
  | 'secondWind'
  | 'stunStrike'
  | 'stealthStrike'
  | 'fireball'

const ABILITY_ICONS: Record<string, string> = {
  attack: sabersChoc,
  warriorAttack: sabersChoc,
  warriorVerticalSlash: swordSlice,
  warriorDevastatingStrike: thunderBlade,
  secondWind: heartDrop,
  stunStrike: stunGrenade,
  stealthStrike: thrownKnife,
  fireball: smallFire
}

export const ABILITY_ICONS_BY_TYPE: Record<string, string> = ABILITY_ICONS

export function getAbilityIcon(type: string): string {
  if (ABILITY_ICONS[type]) return ABILITY_ICONS[type]
  const lower = type.toLowerCase()
  for (const key of Object.keys(ABILITY_ICONS)) {
    if (key.toLowerCase() === lower) return ABILITY_ICONS[key]
  }
  return sabersChoc
}

export const ACTION_ICONS = {
  attack: sabersChoc,
  object: null as string | null
}
