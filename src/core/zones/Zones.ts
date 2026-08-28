import type { IZone } from '@/core/interfaces/IExpedition'
import type { ZoneId } from './EnemyPools'

export const ZONES: Record<ZoneId, IZone> = {
  'mountain-peak': {
    id: 'mountain-peak',
    name: 'Monte Pico',
    description: 'Una montana escarpada con ruinas antiguas en la cima. Ideal para una primera expedicion.',
    background: '',
    difficulty: 'medium',
    minLevel: 1,
    enemies: [],
    rewards: { experience: 50, gold: 25 }
  },
  'forgotten-castle': {
    id: 'forgotten-castle',
    name: 'Castillo Olvidado',
    description: 'Ruinas cubiertas de maleza donde moran bandas y bestias.',
    background: '',
    difficulty: 'hard',
    minLevel: 3,
    enabled: false,
    enemies: [],
    rewards: { experience: 80, gold: 40 }
  },
  'crystal-caves': {
    id: 'crystal-caves',
    name: 'Cavernas de Cristal',
    description: 'Cavernas resplandecientes con criaturas de cristal.',
    background: '',
    difficulty: 'hard',
    minLevel: 5,
    enabled: false,
    enemies: [],
    rewards: { experience: 120, gold: 60 }
  }
}

export function getZone(id: ZoneId): IZone {
  const zone = ZONES[id]
  if (!zone) {
    throw new Error(`[zones] unknown zone id: ${id}`)
  }
  return zone
}

export function listZones(): IZone[] {
  return Object.values(ZONES)
}

export function isZoneEnabled(zone: IZone): boolean {
  return zone.enabled !== false
}