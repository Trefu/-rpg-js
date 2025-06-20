import type { INode, IZone } from '@/core/interfaces/IExpedition'
import { Goblin } from '@/core/enemies/Goblin'

interface NodePosition {
  x: number
  y: number
}

interface GeneratorConfig {
  floors: number
  initialPaths: number
  roomTypeWeights: {
    shop: number
    rest: number
    event: number
    combat: number
  }
}

// Configuraciones por dificultad
const DIFFICULTY_CONFIGS: Record<IZone['difficulty'], GeneratorConfig> = {
  easy: {
    floors: 5,
    initialPaths: 2,
    roomTypeWeights: {
      shop: 0.2,
      rest: 0.2,
      event: 0.3,
      combat: 0.3
    }
  },
  medium: {
    floors: 6,
    initialPaths: 3,
    roomTypeWeights: {
      shop: 0.15,
      rest: 0.15,
      event: 0.3,
      combat: 0.4
    }
  },
  hard: {
    floors: 7,
    initialPaths: 3,
    roomTypeWeights: {
      shop: 0.1,
      rest: 0.1,
      event: 0.3,
      combat: 0.5
    }
  }
}

function generateRandomPosition(floor: number, index: number, totalInFloor: number, floors: number): NodePosition {
  const y = (floor * 100) / (floors - 1) // Normalizar a porcentaje
  let x: number

  if (totalInFloor === 1) {
    x = 50 // Centrado si es único nodo
  } else if (floor === 1) {
    // Distribuir los caminos iniciales uniformemente
    const segment = 100 / (totalInFloor + 1)
    x = segment * (index + 1)
  } else {
    // Para otros casos, distribuir con algo de aleatoriedad pero manteniendo orden
    const segment = 100 / (totalInFloor + 1)
    x = segment * (index + 1) + (Math.random() * 10 - 5)
  }

  return { x, y }
}

function createNode(id: string, type: INode['type'], position: NodePosition, enemies: any[] = []): INode {
  return {
    id,
    type,
    position,
    connections: [],
    completed: false,
    enemies
  }
}

function canConnect(node1: INode, node2: INode): boolean {
  const xDiff = Math.abs(node1.position.x - node2.position.x)
  const yDiff = Math.abs(node1.position.y - node2.position.y)

  // Permitir conexiones si están en el mismo piso (o casi) y cerca en X
  if (yDiff < 5) {
    return xDiff > 0 && xDiff < 40
  }

  // Permitir conexiones si están en pisos adyacentes y no muy separados en X
  // y_dist entre pisos: easy=25, medium=20, hard=16.67
  const isAdjacentFloor = yDiff > 15 && yDiff < 26

  return isAdjacentFloor && xDiff < 40
}

function generateNodeType(floor: number, config: GeneratorConfig): INode['type'] {
  if (floor < 2) return 'combat'
  
  const roll = Math.random()
  let sum = 0

  // No generar tiendas o descansos en los primeros pisos
  if (floor >= 3) {
    sum += config.roomTypeWeights.shop
    if (roll < sum) return 'shop'
    
    sum += config.roomTypeWeights.rest
    if (roll < sum) return 'rest'
  }

  sum += config.roomTypeWeights.event
  if (roll < sum) return 'event'
  
  return 'combat'
}

function generateRandomNodes(zone: IZone): INode[] {
  const config = DIFFICULTY_CONFIGS[zone.difficulty]
  const nodes: INode[][] = Array(config.floors).fill(null).map(() => [])
  
  // Nodo inicial (ciudad)
  nodes[0] = [createNode('start', 'city', { x: 50, y: 0 })]

  // Generar los caminos iniciales
  nodes[1] = Array(config.initialPaths).fill(null).map((_, index) => 
    createNode(
      `path${index + 1}`,
      'combat',
      generateRandomPosition(1, index, config.initialPaths, config.floors),
      [new Goblin(1), new Goblin(1)]
    )
  )

  // Conectar nodo inicial con los caminos iniciales
  nodes[0][0].connections = nodes[1].map(n => n.id)

  // Generar y conectar todos los pisos intermedios
  for (let floor = 1; floor < config.floors - 2; floor++) {
    const currentNodes = nodes[floor]
    const nodesInNextFloor = Math.min(Math.floor(Math.random() * 2) + 2, 3)

    // Crear nodos del siguiente piso
    for (let i = 0; i < nodesInNextFloor; i++) {
      const nodeType = generateNodeType(floor + 1, config)
      const nodeId = `${nodeType}${floor + 1}-${i}`
      const position = generateRandomPosition(floor + 1, i, nodesInNextFloor, config.floors)
      const enemies = nodeType === 'combat' ? [new Goblin(1)] : []
      nodes[floor + 1].push(createNode(nodeId, nodeType, position, enemies))
    }

    const nextFloorNodes = nodes[floor + 1]

    // --- Lógica de Conexión Robusta ---
    // 1. Cada nodo actual DEBE conectarse al menos a uno de abajo.
    currentNodes.forEach(currentNode => {
      const connectableLowerNodes = nextFloorNodes.filter(lowerNode => canConnect(currentNode, lowerNode))
      if (connectableLowerNodes.length > 0) {
        // Conectar al más cercano
        const closestNode = connectableLowerNodes.reduce((best, current) => {
          const bestDist = Math.abs(best.position.x - currentNode.position.x)
          const currentDist = Math.abs(current.position.x - currentNode.position.x)
          return currentDist < bestDist ? current : best
        })
        currentNode.connections.push(closestNode.id)
      } else {
        // Si no hay ninguno "canConnect", forzar conexión con el más cercano en X.
        const closestNode = nextFloorNodes.reduce((best, current) => {
            const bestDist = Math.abs(best.position.x - currentNode.position.x);
            const currentDist = Math.abs(current.position.x - currentNode.position.x);
            return currentDist < bestDist ? current : best;
        });
        currentNode.connections.push(closestNode.id);
      }
    })

    // 2. Cada nodo de abajo DEBE tener al menos una conexión de arriba.
    nextFloorNodes.forEach(lowerNode => {
      const isConnected = currentNodes.some(upperNode => upperNode.connections.includes(lowerNode.id))
      if (!isConnected) {
        const connectableUpperNodes = currentNodes.filter(upperNode => canConnect(lowerNode, upperNode))
        if (connectableUpperNodes.length > 0) {
          const closestNode = connectableUpperNodes.reduce((best, current) => {
            const bestDist = Math.abs(best.position.x - lowerNode.position.x)
            const currentDist = Math.abs(current.position.x - lowerNode.position.x)
            return currentDist < bestDist ? current : best
          })
          closestNode.connections.push(lowerNode.id)
        } else {
            // Si no, forzar conexión
            const closestNode = currentNodes.reduce((best, current) => {
                const bestDist = Math.abs(best.position.x - lowerNode.position.x);
                const currentDist = Math.abs(current.position.x - lowerNode.position.x);
                return currentDist < bestDist ? current : best;
            });
            closestNode.connections.push(lowerNode.id);
        }
      }
    })
  }

  // Añadir y conectar nodo final (boss)
  const bossNode = createNode('boss', 'boss', { x: 50, y: 100 }, [new Goblin(2)])
  nodes[config.floors - 1] = [bossNode]

  // Conectar penúltimo piso con el boss
  nodes[config.floors - 2].forEach(node => {
    node.connections.push('boss')
  })

  return nodes.flat()
}

export function useExpeditionGenerator() {
  const generateExpeditionNodes = (zone: IZone): INode[] => {
    return generateRandomNodes(zone)
  }

  return {
    generateExpeditionNodes
  }
} 