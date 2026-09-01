import sabersChoc from '@/assets/icons/sabers-choc.png'
import swordSlice from '@/assets/icons/sword-slice.png'
import thunderBlade from '@/assets/icons/thunder-blade.png'
import heartDrop from '@/assets/icons/heart-drop.png'
import stunGrenade from '@/assets/icons/stun-grenade.png'
import thrownKnife from '@/assets/icons/thrown-knife.png'
import smallFire from '@/assets/icons/small-fire.png'

export type AbilityIconType =
  | 'attack'
  | 'warriorAttack'
  | 'warriorInjuringStrike'
  | 'warriorDevastatingStrike'
  | 'secondWind'
  | 'stunStrike'
  | 'stealthStrike'
  | 'fireball'

const ABILITY_ICONS: Record<string, string> = {
  attack: sabersChoc,
  warriorAttack: sabersChoc,
  warriorInjuringStrike: swordSlice,
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
