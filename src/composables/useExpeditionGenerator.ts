import type { INode } from '@/core/interfaces/IExpedition'
import { getEnemiesForNode } from '@/core/zones/EnemyPools'

interface GeneratorConfig {
  minNodesBeforeBoss: number
  shopChance: number
  curiosityChance: number
}

const CONFIG: GeneratorConfig = {
  minNodesBeforeBoss: 8,
  shopChance: 0.15,
  curiosityChance: 0.1
}

function createNode(id: string, type: INode['type'], position: { x: number; y: number }, enemies: any[] = []): INode {
  return { id, type, position, connections: [], completed: false, enemies }
}

export function useExpeditionGenerator() {
  function generateExpeditionNodes(): INode[] {
    const nodes: INode[] = []
    const rows: INode[][] = []
    const totalNodes = CONFIG.minNodesBeforeBoss + 2

    const startNode = createNode('start', 'combat', { x: 50, y: 5 }, getEnemiesForNode('mountain-peak', 1, totalNodes))
    nodes.push(startNode)
    rows.push([startNode])

    for (let row = 0; row < CONFIG.minNodesBeforeBoss; row++) {
      const y = 15 + (row * 80) / CONFIG.minNodesBeforeBoss
      const pathsCount = Math.floor(Math.random() * 3) + 1
      const rowNodes: INode[] = []

      for (let p = 0; p < pathsCount; p++) {
        const baseX = pathsCount === 1 ? 50 : 15 + (p * 70 / (pathsCount - 1))
        const x = baseX + (Math.random() * 10 - 5)
        const roll = Math.random()
        let type: INode['type'] = 'combat'

        if (roll < CONFIG.shopChance) {
          type = 'shop'
        } else if (roll < CONFIG.shopChance + CONFIG.curiosityChance) {
          type = 'curiosity'
        }

        const enemies = type === 'combat' ? getEnemiesForNode('mountain-peak', row + 2, totalNodes) : []
        const nodeId = pathsCount > 1 ? `node-${row}-${p}` : `node-${row}`
        const node = createNode(nodeId, type, { x, y }, enemies)
        nodes.push(node)
        rowNodes.push(node)
      }

      rows.push(rowNodes)
    }

    const bossNode = createNode('boss', 'boss', { x: 50, y: 95 }, getEnemiesForNode('mountain-peak', totalNodes, totalNodes))
    nodes.push(bossNode)
    rows.push([bossNode])

    for (let row = 0; row < rows.length - 1; row++) {
      const currentRow = rows[row]
      const nextRow = rows[row + 1]

      currentRow.forEach(node => {
        const connections: string[] = []

        nextRow.forEach(nextNode => {
          const xDiff = Math.abs(node.position.x - nextNode.position.x)

          if (xDiff < 40) {
            connections.push(nextNode.id)
          }
        })

        if (connections.length === 0) {
          const closest = nextRow.reduce((best, n) => {
            return Math.abs(n.position.x - node.position.x) < Math.abs(best.position.x - node.position.x) ? n : best
          })
          connections.push(closest.id)
        }

        node.connections = connections
      })
    }

    return nodes
  }

  return { generateExpeditionNodes }
}