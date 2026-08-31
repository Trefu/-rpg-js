import healthPotionIcon from '@/assets/icons/health-potion.png'
import healingIcon from '@/assets/icons/healing.png'
import magicPotionIcon from '@/assets/icons/magic-potion.png'

export type ItemIconType = 'healing-flask' | 'health-potion' | 'energy-potion'

const ITEM_ICONS: Record<string, string> = {
  'healing-flask': healthPotionIcon,
  'health-potion': healingIcon,
  'energy-potion': magicPotionIcon
}

export function getItemIcon(id: string): string {
  if (ITEM_ICONS[id]) return ITEM_ICONS[id]
  const lower = id.toLowerCase()
  for (const key of Object.keys(ITEM_ICONS)) {
    if (key.toLowerCase() === lower) return ITEM_ICONS[key]
  }
  return healthPotionIcon
}
