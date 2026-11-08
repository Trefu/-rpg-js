import healthPotionIcon from '@/assets/icons/potions/healing-flask.png'
import healingIcon from '@/assets/icons/healing.png'
import magicPotionIcon from '@/assets/icons/potions/energy-flask.png'
import healingPotionIcon from '@/assets/icons/items/healing-potion.png'
import energyTonicIcon from '@/assets/icons/items/energy-tonic.png'
import antidoteIcon from '@/assets/icons/items/antidote.png'
import bandagesIcon from '@/assets/icons/items/bandages.png'

export type ItemIconType = 'healing-flask' | 'health-potion' | 'energy-potion'

const ITEM_ICONS: Record<string, string> = {
  'healing-flask': healthPotionIcon,
  'health-potion': healingIcon,
  'energy-potion': magicPotionIcon,
  'healing-potion': healingPotionIcon,
  'energy-tonic': energyTonicIcon,
  'antidote': antidoteIcon,
  'bandages': bandagesIcon
}

export function getItemIcon(id: string): string {
  if (ITEM_ICONS[id]) return ITEM_ICONS[id]
  const lower = id.toLowerCase()
  for (const key of Object.keys(ITEM_ICONS)) {
    if (key.toLowerCase() === lower) return ITEM_ICONS[key]
  }
  return healthPotionIcon
}
