export interface IZone {
  id: string
  name: string
  description: string
  background: string
  difficulty: 'easy' | 'medium' | 'hard'
  minLevel: number
  enemies: string[] // IDs de enemigos que pueden aparecer
  rewards: {
    experience: number
    gold: number
  }
}

export interface INode {
  id: string
  type: 'combat' | 'shop' | 'rest' | 'treasure' | 'boss' | 'event' | 'city'
  position: {
    x: number
    y: number
  }
  connections: string[] // IDs de nodos conectados
  completed: boolean
  enemies?: any[] // Array de enemigos para nodos de tipo combat y boss
}

export interface IExpedition {
  zone: IZone
  nodes: INode[]
  currentNode: INode | null
  completed: boolean
} 