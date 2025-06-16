export interface GameState {
  isPlaying: boolean
}

export interface CombatState {
  playerHealth: number
  enemyHealth: number
  isInCombat: boolean
}

export interface MapNode {
  id: string
  position: {
    x: number
    y: number
  }
  type: 'combat' | 'shop' | 'rest'
  connections: string[] // IDs of connected nodes
} 