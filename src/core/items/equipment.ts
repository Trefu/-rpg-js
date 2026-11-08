import type { IPlayerStats } from '../interfaces/ICharacter'
import bannerIcon from '@/assets/icons/items/vigor-banner.png'
import whetstoneIcon from '@/assets/icons/items/whetstone.png'
import charmIcon from '@/assets/icons/items/clarity-charm.png'
import bootsIcon from '@/assets/icons/items/scout-boots.png'
import badgeIcon from '@/assets/icons/items/veteran-badge.png'

export type PartyBonuses = Partial<Record<keyof IPlayerStats | 'maxHealth', number>>
export interface PartyEquipment {
  id: string
  name: string
  description: string
  price: number
  bonuses: PartyBonuses
  icon: string
}

export const PARTY_EQUIPMENT: PartyEquipment[] = [
  { id: 'vigor-banner', name: 'Estandarte de vigor', description: '+2 Constitución a todos los héroes.', price: 55, bonuses: { constitution: 2 }, icon: bannerIcon },
  { id: 'whetstone', name: 'Piedra de afilar', description: '+2 Cuerpo a todos los héroes.', price: 65, bonuses: { body: 2 }, icon: whetstoneIcon },
  { id: 'clarity-charm', name: 'Amuleto de claridad', description: '+2 Mente a todos los héroes.', price: 65, bonuses: { mind: 2 }, icon: charmIcon },
  { id: 'scout-boots', name: 'Botas de explorador', description: '+1 Agilidad a todos los héroes.', price: 90, bonuses: { agility: 1 }, icon: bootsIcon },
  { id: 'veteran-badge', name: 'Insignia del veterano', description: '+15 de vida máxima a todos los héroes.', price: 75, bonuses: { maxHealth: 15 }, icon: badgeIcon }
]

export function getPartyBonuses(ids: readonly string[]): PartyBonuses {
  const bonuses: PartyBonuses = {}
  for (const id of new Set(ids)) {
    const item = PARTY_EQUIPMENT.find(e => e.id === id)
    if (!item) continue
    for (const key of Object.keys(item.bonuses) as (keyof PartyBonuses)[]) {
      bonuses[key] = (bonuses[key] ?? 0) + (item.bonuses[key] ?? 0)
    }
  }
  return bonuses
}
