import { afterEach, describe, expect, it, vi } from 'vitest'
import { useExpeditionGenerator } from './useExpeditionGenerator'
import { EXPEDITIONS } from '@/core/expeditions/registry'
import { MOUNTAIN_PEAK } from '@/core/expeditions/mountainPeak'
import type { IExpeditionConfig } from '@/core/expeditions/types'

afterEach(() => vi.restoreAllMocks())

describe('rutas ampliadas de expedición', () => {
  const generator = useExpeditionGenerator()

  it('duplica cada combate previo al jefe en todas las expediciones y mantiene la conectividad', () => {
    for (const config of Object.values(EXPEDITIONS)) {
      const originalRules = JSON.stringify(config.generator)
      for (let run = 0; run < 15; run++) {
        const nodes = generator.generateExpeditionNodes(config)
        const originals = nodes.filter(node => node.type === 'combat' && !node.id.startsWith('extra-') && !node.id.startsWith('branch-'))
        const extras = nodes.filter(node => node.id.startsWith('extra-'))
        expect(extras).toHaveLength(originals.length)
        expect(nodes.filter(node => node.type === 'boss')).toHaveLength(1)
        expect(generator.validateConnectivity(nodes).ok).toBe(true)
        for (const original of originals) {
          const extra = extras.find(node => node.id === `extra-${original.id}`)!
          expect(original.connections).toContain(extra.id)
          expect(extra.enemies?.length).toBeGreaterThan(0)
          expect(extra.enemies?.[0]).not.toBe(original.enemies?.[0])
          expect(extra.depth).toBe(original.depth! + 1)
        }
        for (const node of nodes) {
          for (const childId of node.connections) {
            expect(nodes.find(n => n.id === childId)!.position.y).toBeGreaterThan(node.position.y)
          }
        }
      }
      expect(JSON.stringify(config.generator)).toBe(originalRules)
    }
  })

  it('crea cuatro caminos alcanzables incluso con un generador aleatorio constante', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const config: IExpeditionConfig = {
      ...MOUNTAIN_PEAK,
      id: 'branching-test',
      totalFloors: 5,
      generator: {
        ...MOUNTAIN_PEAK.generator, minNodesBeforeBoss: 3, maxPathsPerRow: 4,
        forcedSingleRows: [], forcedCombatRows: [], forcedNodes: [], recruitHeroRow: undefined,
        shopChance: 0, curiosityChance: 0, minCuriosityNodes: 0, maxCuriosityNodes: 0,
        minShopNodes: 0, maxShopNodes: 0
      }
    }
    const nodes = generator.generateExpeditionNodes(config)
    expect(nodes.filter(node => node.depth === 3)).toHaveLength(4)
    expect(nodes.find(node => node.id === 'extra-start')!.connections).toHaveLength(4)
    expect(generator.validateConnectivity(nodes).ok).toBe(true)
    // All routes have exactly twice the four original fights, then one boss.
    const byId = new Map(nodes.map(node => [node.id, node]))
    const checkRoute = (id: string, fights: number) => {
      const node = byId.get(id)!
      if (node.type === 'boss') { expect(fights).toBe(8); return }
      for (const child of node.connections) checkRoute(child, fights + 1)
    }
    checkRoute('start', 0)
  })

  it('elimina y puentea el compañero de montaña solo al tener las tres clases iniciales', () => {
    for (const maxRetries of [0, 1]) {
      const config = { ...MOUNTAIN_PEAK, generator: { ...MOUNTAIN_PEAK.generator, maxRetries } }
      const nodes = generator.generateExpeditionNodes(config, { recruitedHeroClassIds: ['warrior', 'cleric', 'rogue'] })
      expect(nodes.some(node => node.type === 'recruit-hero' || node.id === 'node-2')).toBe(false)
      expect(generator.validateConnectivity(nodes).ok).toBe(true)
      expect(nodes.some(node => node.type === 'shop')).toBe(true)
      const incomplete = generator.generateExpeditionNodes(config, { recruitedHeroClassIds: ['warrior', 'cleric', 'future-hero'] })
      expect(incomplete.find(node => node.id === 'node-2')?.type).toBe('recruit-hero')
    }
  })

  it('conserva reclutas de otras expediciones aunque ya se tengan los iniciales', () => {
    const config = { ...MOUNTAIN_PEAK, id: 'another-expedition', recruitableHeroIds: ['future-hero'] }
    const nodes = generator.generateExpeditionNodes(config, { recruitedHeroClassIds: ['warrior', 'cleric', 'rogue'] })
    expect(nodes.some(node => node.type === 'recruit-hero')).toBe(true)
  })

  it('limita las filas únicas salvo el evento espectral obligatorio, incluso en el respaldo', () => {
    for (const config of Object.values(EXPEDITIONS)) {
      for (const maxRetries of [0, 1]) {
        for (const roll of [0, 0.5, 0.99]) {
          vi.spyOn(Math, 'random').mockReturnValue(roll)
          for (const recruitedHeroClassIds of [[], ['warrior', 'cleric', 'rogue']]) {
            const nodes = generator.generateExpeditionNodes({ ...config, generator: { ...config.generator, maxRetries } }, { recruitedHeroClassIds })
            const rows = new Map<number, typeof nodes>()
            for (const node of nodes) rows.set(node.depth!, [...(rows.get(node.depth!) ?? []), node])
            const singles = [...rows.values()].filter(row => row.length === 1).map(row => row[0])
            const spectralRows = singles.filter(node => node.curiosityEventId === 'spectral-pass').length
            expect(singles.length).toBeLessThanOrEqual(3 + spectralRows)
            const singleIds = new Set(singles.map(node => node.id))
            for (const node of singles) expect(node.connections.some(id => singleIds.has(id))).toBe(false)
            expect(generator.validateConnectivity(nodes).ok).toBe(true)
            expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length)
          }
          vi.restoreAllMocks()
        }
      }
    }
  })

  it.each([0, 1, 50])('el Espectro se sortea una vez y fuerza la tercera fila con maxRetries=%s', maxRetries => {
    for (const recruitedHeroClassIds of [[], ['warrior', 'cleric', 'rogue']]) {
      vi.spyOn(Math, 'random').mockReturnValue(0.99).mockReturnValueOnce(0.0999)
      const config = { ...MOUNTAIN_PEAK, generator: { ...MOUNTAIN_PEAK.generator, maxRetries } }
      const rules = JSON.stringify(config)
      const nodes = generator.generateExpeditionNodes(config, { recruitedHeroClassIds })
      const haunted = nodes.filter(node => node.curiosityEventId === 'spectral-pass')
      expect(haunted).toHaveLength(1)
      const event = haunted[0]
      expect(event.type).toBe('curiosity')
      expect(event.depth).toBe(3)
      expect(nodes.filter(node => node.depth === 3)).toEqual([event])
      expect(nodes.filter(node => node.depth === 2).every(node => node.connections.length === 1 && node.connections[0] === event.id)).toBe(true)
      expect(generator.validateConnectivity(nodes).ok).toBe(true)
      // Removing the event must sever every route to the boss.
      expect(generator.validateConnectivity(nodes.filter(node => node.id !== event.id)).ok).toBe(false)
      expect(JSON.stringify(config)).toBe(rules)
      vi.restoreAllMocks()
    }
  })

  it('un sorteo igual al límite de 10% no crea evento ni señal espectral', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99).mockReturnValueOnce(0.1)
    const nodes = generator.generateExpeditionNodes(MOUNTAIN_PEAK)
    expect(nodes.some(node => node.curiosityEventId === 'spectral-pass')).toBe(false)
  })
})
