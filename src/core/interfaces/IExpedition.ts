export interface IZone {
  id: string
  name: string
  description: string
  background: string
  difficulty: 'easy' | 'medium' | 'hard'
  minLevel: number
  enabled?: boolean
  /**
   * Marcada como "En desarrollo": la zona aparece listada pero no es
   * jugable todavia. Se muestra con un badge en la UI para distinguir
   * de las zonas bloqueadas por nivel (`enabled: false`).
   */
  inDevelopment?: boolean
  enemies: string[]
  rewards: {
    experience: number
    gold: number
  }
}

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
  zone: IZone
  nodes: INode[]
  currentNode: INode | null
  completed: boolean
} 