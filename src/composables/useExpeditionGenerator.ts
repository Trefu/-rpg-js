import type { INode } from '@/core/interfaces/IExpedition'
import { DEFAULT_ZONE, getEnemiesForNode, type ZoneId } from '@/core/zones/EnemyPools'

interface GeneratorConfig {
  minNodesBeforeBoss: number
  shopChance: number
  curiosityChance: number
  maxRetries: number
  maxParentsPerNode: number
  proximityThreshold: number
  forcedSingleRows: number[]
  forcedCombatRows: number[]
  forcedNodeTypes: Record<number, 'combat' | 'shop' | 'curiosity' | 'recruit-hero'>
  /**
   * Mapa de zoneId -> fila del mapa en la que se fuerza un nodo
   * "recruit-hero". Pensado para zonas tutoriales (mountain-peak) donde
   * el jugador consigue un segundo heroe a mitad de camino.
   */
  recruitHeroRowByZone: Partial<Record<ZoneId, number>>
  minCuriosityNodes: number
  maxCuriosityNodes: number
  maxConsecutiveCuriosity: number
  minShopNodes: number
  maxShopNodes: number
  maxConsecutiveShop: number
}

const CONFIG: GeneratorConfig = {
  minNodesBeforeBoss: 8,
  shopChance: 0.15,
  curiosityChance: 0.1,
  maxRetries: 50,
  maxParentsPerNode: 2,
  proximityThreshold: 40,
  forcedSingleRows: [5],
  forcedCombatRows: [0, 1],
  forcedNodeTypes: {},
  recruitHeroRowByZone: { 'mountain-peak': 2 },
  minCuriosityNodes: 2,
  maxCuriosityNodes: 4,
  maxConsecutiveCuriosity: 2,
  minShopNodes: 1,
  maxShopNodes: 2,
  maxConsecutiveShop: 1
}

function createNode(id: string, type: INode['type'], position: { x: number; y: number }, enemies: any[] = []): INode {
  return { id, type, position, connections: [], completed: false, enemies }
}

function pickNodeType(): INode['type'] {
  const roll = Math.random()
  if (roll < CONFIG.shopChance) return 'shop'
  if (roll < CONFIG.shopChance + CONFIG.curiosityChance) return 'curiosity'
  return 'combat'
}

function buildRows(zoneId: ZoneId): INode[][] {
  const rows: INode[][] = []
  const totalNodes = CONFIG.minNodesBeforeBoss + 2

  const startNode = createNode('start', 'combat', { x: 50, y: 5 }, getEnemiesForNode(zoneId, 1, totalNodes))
  rows.push([startNode])

  let prevPathsCount = 1
  for (let row = 0; row < CONFIG.minNodesBeforeBoss; row++) {
    const y = 15 + (row * 80) / CONFIG.minNodesBeforeBoss

    const inRange = row >= 0 && row < CONFIG.minNodesBeforeBoss
    const recruitRow = CONFIG.recruitHeroRowByZone[zoneId]
    const isRecruitRow = inRange && recruitRow === row
    const isForcedSingle = inRange && (CONFIG.forcedSingleRows.includes(row) || isRecruitRow)
    const isForcedCombat = inRange && CONFIG.forcedCombatRows.includes(row)
    const forcedType = inRange ? CONFIG.forcedNodeTypes[row] : undefined
    const validForcedType =
      forcedType === 'combat' || forcedType === 'shop' || forcedType === 'curiosity'
        ? forcedType
        : undefined

    if (CONFIG.forcedSingleRows.includes(row) && !inRange) {
      console.warn(`[useExpeditionGenerator] forcedSingleRows contains out-of-range index ${row}; ignoring`)
    }
    if (CONFIG.forcedCombatRows.includes(row) && !inRange) {
      console.warn(`[useExpeditionGenerator] forcedCombatRows contains out-of-range index ${row}; ignoring`)
    }
    if (forcedType !== undefined && !validForcedType) {
      console.warn(`[useExpeditionGenerator] forcedNodeTypes[${row}] is invalid: ${forcedType}; ignoring`)
    }

    let pathsCount = isForcedSingle ? 1 : Math.floor(Math.random() * 3) + 1

    if (!isForcedSingle && prevPathsCount === 1 && pathsCount === 1) {
      pathsCount = Math.floor(Math.random() * 2) + 2
    }

    const rowNodes: INode[] = []

    for (let p = 0; p < pathsCount; p++) {
      const baseX = pathsCount === 1 ? 50 : 15 + (p * 70 / (pathsCount - 1))
      const x = baseX + (Math.random() * 6 - 3)
      const type: INode['type'] = isRecruitRow
        ? 'recruit-hero'
        : (validForcedType ?? (isForcedCombat ? 'combat' : pickNodeType()))
      const enemies = type === 'combat' ? getEnemiesForNode(zoneId, row + 2, totalNodes) : []
      const nodeId = pathsCount > 1 ? `node-${row}-${p}` : `node-${row}`
      const node = createNode(nodeId, type, { x, y }, enemies)
      rowNodes.push(node)
    }

    rows.push(rowNodes)
    prevPathsCount = pathsCount
  }

  const bossNode = createNode('boss', 'boss', { x: 50, y: 95 }, getEnemiesForNode(zoneId, totalNodes, totalNodes))
  rows.push([bossNode])

  return rows
}

function closestNode(target: INode, candidates: INode[]): INode {
  return candidates.reduce((best, n) =>
    Math.abs(n.position.x - target.position.x) < Math.abs(best.position.x - target.position.x) ? n : best
  )
}

function connectByReverseBFS(rows: INode[][]): Map<string, Set<string>> {
  const childrenOf = new Map<string, Set<string>>()
  for (const row of rows) {
    for (const n of row) childrenOf.set(n.id, new Set())
  }

  let layer: INode[] = [rows[rows.length - 1][0]]

  for (let rowIdx = rows.length - 2; rowIdx >= 0; rowIdx--) {
    const candidates = rows[rowIdx]
    const nextLayer: INode[] = []
    const seen = new Set<string>()

    for (const child of layer) {
      const within = candidates.filter(p => Math.abs(p.position.x - child.position.x) < CONFIG.proximityThreshold)
      const pool = within.length > 0 ? within : [closestNode(child, candidates)]
      const pickCount = Math.min(CONFIG.maxParentsPerNode, pool.length)
      const picks: INode[] = []
      const used = new Set<string>()

      while (picks.length < pickCount && used.size < pool.length) {
        const idx = Math.floor(Math.random() * pool.length)
        const candidate = pool[idx]
        if (used.has(candidate.id)) continue
        used.add(candidate.id)
        picks.push(candidate)
      }

      for (const parent of picks) {
        childrenOf.get(parent.id)!.add(child.id)
        if (!seen.has(parent.id)) {
          nextLayer.push(parent)
          seen.add(parent.id)
        }
      }
    }

    layer = nextLayer
  }

  return childrenOf
}

function getReachableFrom(start: INode, childrenOf: Map<string, Set<string>>): Set<string> {
  const reached = new Set<string>([start.id])
  const stack: string[] = [start.id]
  while (stack.length > 0) {
    const id = stack.pop()!
    const children = childrenOf.get(id)
    if (!children) continue
    for (const childId of children) {
      if (!reached.has(childId)) {
        reached.add(childId)
        stack.push(childId)
      }
    }
  }
  return reached
}

function getNodesReachingBoss(rows: INode[][], bossId: string): Set<string> {
  const parentsOf = new Map<string, Set<string>>()
  for (const row of rows) {
    for (const n of row) parentsOf.set(n.id, new Set())
  }
  for (let i = 0; i < rows.length - 1; i++) {
    for (const n of rows[i]) {
      for (const child of n.connections) {
        parentsOf.get(child)?.add(n.id)
      }
    }
  }

  const reaches = new Set<string>([bossId])
  const stack: string[] = [bossId]
  while (stack.length > 0) {
    const id = stack.pop()!
    const parents = parentsOf.get(id)
    if (!parents) continue
    for (const pid of parents) {
      if (!reaches.has(pid)) {
        reaches.add(pid)
        stack.push(pid)
      }
    }
  }
  return reaches
}

function validateConnectivity(rows: INode[][], childrenOf: Map<string, Set<string>>): { ok: boolean; reason?: string } {
  const allNodes = rows.flat()
  const start = rows[0][0]
  const boss = rows[rows.length - 1][0]

  const reachable = getReachableFrom(start, childrenOf)
  if (reachable.size !== allNodes.length) {
    return { ok: false, reason: `unreachable nodes: ${allNodes.length - reachable.size}` }
  }

  for (const n of allNodes) {
    if (n.id === boss.id) continue
    if (!childrenOf.get(n.id) || childrenOf.get(n.id)!.size === 0) {
      return { ok: false, reason: `dead end: ${n.id}` }
    }
  }

  for (const child of childrenOf.get(boss.id)!) {
    if (!reachable.has(child)) {
      return { ok: false, reason: `boss parent not reachable: ${child}` }
    }
  }

  return { ok: true }
}

function attachConnections(rows: INode[][], childrenOf: Map<string, Set<string>>): INode[] {
  const allNodes = rows.flat()
  for (const n of allNodes) {
    n.connections = Array.from(childrenOf.get(n.id) ?? [])
  }
  return allNodes
}

function enforceSpecialNodeRules(rows: INode[][], zoneId: ZoneId): void {
  const totalNodes = CONFIG.minNodesBeforeBoss + 2
  if (rows.length < 3) return

  const byId = new Map<string, INode>()
  const rowOf = new Map<string, number>()
  for (let r = 0; r < rows.length; r++) {
    for (const n of rows[r]) {
      byId.set(n.id, n)
      rowOf.set(n.id, r)
    }
  }

  const parentsOf = new Map<string, string[]>()
  for (const n of byId.values()) parentsOf.set(n.id, [])
  for (const n of byId.values()) {
    for (const cid of n.connections) {
      const arr = parentsOf.get(cid)
      if (arr) arr.push(n.id)
    }
  }

  const noCuriosityRows = new Set<number>([0, rows.length - 1])
  const noShopRows = new Set<number>([0, rows.length - 1])
  for (let i = 1; i < rows.length - 1; i++) {
    const loopRow = i - 1
    const isForcedCombat = CONFIG.forcedCombatRows.includes(loopRow)
    const isRecruitRow = CONFIG.recruitHeroRowByZone[zoneId] === loopRow
    const ft = CONFIG.forcedNodeTypes[loopRow]
    const curiosityBlocked = isForcedCombat || isRecruitRow || ft === 'combat' || ft === 'shop'
    const shopBlocked = isForcedCombat || isRecruitRow || ft === 'combat' || ft === 'curiosity'
    if (curiosityBlocked) noCuriosityRows.add(i)
    if (shopBlocked) noShopRows.add(i)
  }

  for (let i = 1; i < rows.length - 1; i++) {
    const loopRow = i - 1
    if (!CONFIG.forcedCombatRows.includes(loopRow)) continue
    for (const node of rows[i]) {
      if (node.type !== 'combat') {
        node.type = 'combat'
        node.enemies = getEnemiesForNode(zoneId, i + 2, totalNodes)
      }
    }
  }

  function getNodesOfType(type: 'curiosity' | 'shop', excludeRows: Set<number>): INode[] {
    const out: INode[] = []
    for (let i = 1; i < rows.length - 1; i++) {
      if (excludeRows.has(i)) continue
      for (const node of rows[i]) if (node.type === type) out.push(node)
    }
    return out
  }

  function getPromotableCandidates(excludeRows: Set<number>): INode[] {
    const out: INode[] = []
    for (let i = 1; i < rows.length - 1; i++) {
      if (excludeRows.has(i)) continue
      for (const node of rows[i]) if (node.type === 'combat') out.push(node)
    }
    return out
  }

  function setAs(n: INode, type: 'combat' | 'curiosity' | 'shop'): void {
    if (type === 'combat') {
      const i = rowOf.get(n.id)!
      n.type = 'combat'
      n.enemies = getEnemiesForNode(zoneId, i + 2, totalNodes)
    } else {
      n.type = type
      n.enemies = []
    }
  }

  function clampCount(type: 'curiosity' | 'shop', min: number, max: number, excludeRows: Set<number>): boolean {
    let changed = false
    let nodes = getNodesOfType(type, excludeRows)
    let safety = 200
    while (nodes.length < min && safety-- > 0) {
      const candidates = getPromotableCandidates(excludeRows)
      if (candidates.length === 0) {
        console.error(`[useExpeditionGenerator] cannot reach min ${type} nodes; insufficient candidates`)
        break
      }
      setAs(candidates[Math.floor(Math.random() * candidates.length)], type)
      changed = true
      nodes = getNodesOfType(type, excludeRows)
    }
    safety = 200
    nodes = getNodesOfType(type, excludeRows)
    while (nodes.length > max && safety-- > 0) {
      setAs(nodes[Math.floor(Math.random() * nodes.length)], 'combat')
      changed = true
      nodes = getNodesOfType(type, excludeRows)
    }
    return changed
  }

  function hasTypeNeighbor(n: INode, type: 'curiosity' | 'shop'): { parent: boolean; child: boolean } {
    let parent = false
    for (const pid of parentsOf.get(n.id) ?? []) {
      const p = byId.get(pid)
      if (p && p.type === type) { parent = true; break }
    }
    let child = false
    for (const cid of n.connections) {
      const c = byId.get(cid)
      if (c && c.type === type) { child = true; break }
    }
    return { parent, child }
  }

  function fixChains(type: 'curiosity' | 'shop', excludeRows: Set<number>, maxConsecutive: number): boolean {
    let changed = false
    let safety = 200
    let localChanged = true
    while (localChanged && safety-- > 0) {
      localChanged = false
      const nodes = getNodesOfType(type, excludeRows)
      for (const node of nodes) {
        const { parent, child } = hasTypeNeighbor(node, type)
        const violation = maxConsecutive <= 1 ? (parent || child) : (parent && child)
        if (violation) {
          setAs(node, 'combat')
          localChanged = true
          changed = true
          break
        }
      }
    }
    return changed
  }

  let globalSafety = 50
  let globalChanged = true
  while (globalChanged && globalSafety-- > 0) {
    globalChanged = false
    globalChanged = clampCount('curiosity', CONFIG.minCuriosityNodes, CONFIG.maxCuriosityNodes, noCuriosityRows) || globalChanged
    globalChanged = clampCount('shop', CONFIG.minShopNodes, CONFIG.maxShopNodes, noShopRows) || globalChanged
    globalChanged = fixChains('curiosity', noCuriosityRows, CONFIG.maxConsecutiveCuriosity) || globalChanged
    globalChanged = fixChains('shop', noShopRows, CONFIG.maxConsecutiveShop) || globalChanged
  }
}

function generateLinearFallback(zoneId: ZoneId): INode[] {
  const rows: INode[][] = []
  const totalNodes = CONFIG.minNodesBeforeBoss + 2

  const startNode = createNode('start', 'combat', { x: 50, y: 5 }, getEnemiesForNode(zoneId, 1, totalNodes))
  rows.push([startNode])

  let prev = startNode
  for (let row = 0; row < CONFIG.minNodesBeforeBoss; row++) {
    const y = 15 + (row * 80) / CONFIG.minNodesBeforeBoss
    const node = createNode(`node-${row}`, 'combat', { x: 50, y }, getEnemiesForNode(zoneId, row + 2, totalNodes))
    rows.push([node])
    prev.connections = [node.id]
    prev = node
  }

  const bossNode = createNode('boss', 'boss', { x: 50, y: 95 }, getEnemiesForNode(zoneId, totalNodes, totalNodes))
  rows.push([bossNode])
  prev.connections = [bossNode.id]

  enforceSpecialNodeRules(rows, zoneId)
  return rows.flat()
}

export function useExpeditionGenerator() {
  function generateExpeditionNodes(zoneId: ZoneId = DEFAULT_ZONE): INode[] {
    for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
      const rows = buildRows(zoneId)
      const childrenOf = connectByReverseBFS(rows)
      attachConnections(rows, childrenOf)
      enforceSpecialNodeRules(rows, zoneId)
      const result = validateConnectivity(rows, childrenOf)
      if (result.ok) {
        return rows.flat()
      }
    }

    console.warn('[useExpeditionGenerator] Exhausted retries, falling back to linear layout')
    return generateLinearFallback(zoneId)
  }

  return {
    generateExpeditionNodes,
    validateConnectivity: (nodes: INode[]) => {
      const byId = new Map(nodes.map(n => [n.id, n]))
      const childrenOf = new Map<string, Set<string>>()
      for (const n of nodes) childrenOf.set(n.id, new Set(n.connections))
      const start = byId.get('start')
      const boss = byId.get('boss')
      if (!start || !boss) return { ok: false, reason: 'missing start/boss' }
      const reachable = getReachableFrom(start, childrenOf)
      const reachesBoss = getNodesReachingBoss([nodes], boss.id)
      return {
        ok: reachable.size === nodes.length && reachesBoss.size === nodes.length,
        reachableCount: reachable.size,
        reachesBossCount: reachesBoss.size,
        total: nodes.length
      }
    }
  }
}