import type { IExpeditionConfig } from '@/core/expeditions/types'

export interface INode {
  id: string
  type: 'combat' | 'shop' | 'curiosity' | 'recruit-hero' | 'boss'
  position: {
    x: number
    y: number
  }
  connections: string[]
  completed: boolean
  enemies?: any[]
}

export interface IExpedition {
  /** Configuracion completa de la expedicion (pools, encounters, generator, etc). */
  config: IExpeditionConfig
  nodes: INode[]
  currentNode: INode | null
  completed: boolean
}
