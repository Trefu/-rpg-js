import type { INode } from '@/core/interfaces/IExpedition'
import type { IExpeditionConfig } from '@/core/expeditions/types'
import { resolveEncounterById } from '@/core/expeditions/encounters'
import { getEnemiesForConfig } from '@/core/zones/EnemyPools'

function createNode(
  id: string,
  type: INode['type'],
  position: { x: number; y: number },
  enemies: any[] = []
): INode {
  return { id, type, position, connections: [], completed: false, enemies }
}

/**
 * Construye los enemigos de un nodo `combat`/`boss`/`start`. Si la
 * fila del nodo esta marcada como `forcedNode` con un `encounter`
 * especifico en la config, ese encounter se resuelve; si no, se
 * muestrea el pool aleatorio del tier correspondiente.
 *
 * Convencion de `row` en `IExpeditionConfig.generator.forcedNodes`:
 *   row 0              = nodo 'start'
 *   row 1..minNodes    = filas intermedias (mismas que `recruitHeroRow`,
 *                        `forcedCombatRows` y `forcedSingleRows`)
 *   row minNodes+1     = nodo 'boss'
 */
function buildEnemiesForRow(config: IExpeditionConfig, row: number, floor: number): any[] {
  const forced = config.generator.forcedNodes.find(fn => fn.row === row)
  if (forced && forced.encounter && (forced.type === 'combat' || forced.type === 'boss' || forced.type === 'recruit-hero')) {
    return resolveEncounterById(config, forced.encounter)
  }
  return getEnemiesForConfig(config, floor)
}

function pickNodeType(config: IExpeditionConfig): INode['type'] {
  const roll = Math.random()
  if (roll < config.generator.shopChance) return 'shop'
  if (roll < config.generator.shopChance + config.generator.curiosityChance) return 'curiosity'
  return 'combat'
}

function buildRows(config: IExpeditionConfig): INode[][] {
  const gen = config.generator
  const rows: INode[][] = []
  const totalNodes = gen.minNodesBeforeBoss + 2

  const startEnemies = buildEnemiesForRow(config, 0, 1)
  const startNode = createNode('start', 'combat', { x: 50, y: 5 }, startEnemies)
  rows.push([startNode])

  let prevPathsCount = 1
  for (let row = 0; row < gen.minNodesBeforeBoss; row++) {
    const y = 15 + (row * 80) / gen.minNodesBeforeBoss
    const userRow = row + 1

    const inRange = userRow >= 1 && userRow <= gen.minNodesBeforeBoss
    const recruitRow = gen.recruitHeroRow
    const isRecruitRow = inRange && recruitRow === userRow
    const isForcedSingle = inRange && (gen.forcedSingleRows.includes(userRow) || isRecruitRow)
    const isForcedCombat = inRange && gen.forcedCombatRows.includes(userRow)
    const forcedNode = inRange ? gen.forcedNodes.find(fn => fn.row === userRow) : undefined
    const validForcedType =
      forcedNode && (forcedNode.type === 'combat' || forcedNode.type === 'shop' || forcedNode.type === 'curiosity')
        ? forcedNode.type
        : undefined

    if (gen.forcedSingleRows.includes(userRow) && !inRange) {
      console.warn(`[useExpeditionGenerator] forcedSingleRows contains out-of-range index ${userRow}; ignoring`)
    }
    if (gen.forcedCombatRows.includes(userRow) && !inRange) {
      console.warn(`[useExpeditionGenerator] forcedCombatRows contains out-of-range index ${userRow}; ignoring`)
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
        : (validForcedType ?? (isForcedCombat ? 'combat' : pickNodeType(config)))
      const enemies = type === 'combat' ? buildEnemiesForRow(config, userRow, userRow + 1) : []
      const nodeId = pathsCount > 1 ? `node-${userRow}-${p}` : `node-${userRow}`
      const node = createNode(nodeId, type, { x, y }, enemies)
      rowNodes.push(node)
    }

    rows.push(rowNodes)
    prevPathsCount = pathsCount
  }

  const bossEnemies = buildEnemiesForRow(config, gen.minNodesBeforeBoss + 1, totalNodes)
  const bossNode = createNode('boss', 'boss', { x: 50, y: 95 }, bossEnemies)
  rows.push([bossNode])

  return rows
}

function closestNode(target: INode, candidates: INode[]): INode {
  return candidates.reduce((best, n) =>
    Math.abs(n.position.x - target.position.x) < Math.abs(best.position.x - target.position.x) ? n : best
  )
}

function connectByReverseBFS(rows: INode[][], proximityThreshold: number, maxParentsPerNode: number): Map<string, Set<string>> {
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
      const within = candidates.filter(p => Math.abs(p.position.x - child.position.x) < proximityThreshold)
      const pool = within.length > 0 ? within : [closestNode(child, candidates)]
      const pickCount = Math.min(maxParentsPerNode, pool.length)
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

function enforceSpecialNodeRules(rows: INode[][], config: IExpeditionConfig): void {
  const gen = config.generator
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
    const userRow = i
    const isForcedCombat = gen.forcedCombatRows.includes(userRow)
    const isRecruitRow = gen.recruitHeroRow === userRow
    const fn = gen.forcedNodes.find(f => f.row === userRow)
    const forcedType = fn?.type
    const curiosityBlocked = isForcedCombat || isRecruitRow || forcedType === 'combat' || forcedType === 'shop'
    const shopBlocked = isForcedCombat || isRecruitRow || forcedType === 'combat' || forcedType === 'curiosity'
    if (curiosityBlocked) noCuriosityRows.add(i)
    if (shopBlocked) noShopRows.add(i)
  }

  for (let i = 1; i < rows.length - 1; i++) {
    const userRow = i
    if (!gen.forcedCombatRows.includes(userRow)) continue
    for (const node of rows[i]) {
      if (node.type !== 'combat') {
        node.type = 'combat'
        node.enemies = buildEnemiesForRow(config, userRow, i + 1)
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
      n.enemies = buildEnemiesForRow(config, i, i + 1)
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
    globalChanged = clampCount('curiosity', gen.minCuriosityNodes, gen.maxCuriosityNodes, noCuriosityRows) || globalChanged
    globalChanged = clampCount('shop', gen.minShopNodes, gen.maxShopNodes, noShopRows) || globalChanged
    globalChanged = fixChains('curiosity', noCuriosityRows, gen.maxConsecutiveCuriosity) || globalChanged
    globalChanged = fixChains('shop', noShopRows, gen.maxConsecutiveShop) || globalChanged
  }
}

function generateLinearFallback(config: IExpeditionConfig): INode[] {
  const rows: INode[][] = []
  const totalNodes = config.generator.minNodesBeforeBoss + 2

  const startNode = createNode('start', 'combat', { x: 50, y: 5 }, buildEnemiesForRow(config, 0, 1))
  rows.push([startNode])

  let prev = startNode
  for (let row = 0; row < config.generator.minNodesBeforeBoss; row++) {
    const y = 15 + (row * 80) / config.generator.minNodesBeforeBoss
    const userRow = row + 1
    const node = createNode(`node-${userRow}`, 'combat', { x: 50, y }, buildEnemiesForRow(config, userRow, userRow + 1))
    rows.push([node])
    prev.connections = [node.id]
    prev = node
  }

  const bossNode = createNode(
    'boss',
    'boss',
    { x: 50, y: 95 },
    buildEnemiesForRow(config, config.generator.minNodesBeforeBoss + 1, totalNodes)
  )
  rows.push([bossNode])
  prev.connections = [bossNode.id]

  enforceSpecialNodeRules(rows, config)
  return rows.flat()
}

export function useExpeditionGenerator() {
  function generateExpeditionNodes(config: IExpeditionConfig): INode[] {
    for (let attempt = 0; attempt < config.generator.maxRetries; attempt++) {
      const rows = buildRows(config)
      const childrenOf = connectByReverseBFS(rows, config.generator.proximityThreshold, config.generator.maxParentsPerNode)
      attachConnections(rows, childrenOf)
      enforceSpecialNodeRules(rows, config)
      const result = validateConnectivity(rows, childrenOf)
      if (result.ok) {
        return rows.flat()
      }
    }

    console.warn('[useExpeditionGenerator] Exhausted retries, falling back to linear layout')
    return generateLinearFallback(config)
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
