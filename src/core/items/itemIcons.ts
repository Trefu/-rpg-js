import healthPotionIcon from '@/assets/icons/health-potion.png'
import healingIcon from '@/assets/icons/healing.png'

export type ItemIconType = 'healing-flask' | 'health-potion'

const ITEM_ICONS: Record<string, string> = {
  'healing-flask': healthPotionIcon,
  'health-potion': healingIcon
}

export function getItemIcon(id: string): string {
  if (ITEM_ICONS[id]) return ITEM_ICONS[id]
  const lower = id.toLowerCase()
  for (const key of Object.keys(ITEM_ICONS)) {
    if (key.toLowerCase() === lower) return ITEM_ICONS[key]
  }
  return healthPotionIcon
}
