import merchantAnimation from '@/assets/sprites/npcs/forest-merchant.gif'
import merchantStill from '@/assets/sprites/npcs/forest-merchant.png'
import wandererAnimation from '@/assets/sprites/npcs/forest-wanderer.gif'
import wandererStill from '@/assets/sprites/npcs/forest-wanderer.png'

export const NPCS = {
  'forest-merchant': {
    name: 'Bram', title: 'Mercader del paso', role: 'merchant',
    animation: merchantAnimation, still: merchantStill
  },
  'forest-wanderer': {
    name: 'Caminante del bosque', title: 'Un encuentro por descubrir', role: null,
    animation: wandererAnimation, still: wandererStill
  }
} as const

export type NpcId = keyof typeof NPCS
