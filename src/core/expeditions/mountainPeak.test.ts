import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { MOUNTAIN_PEAK } from './mountainPeak'
import { useExpeditionGenerator } from '@/composables/useExpeditionGenerator'
import { resolveEncounterById } from './encounters'
import { MountainEnemy, MOUNTAIN_ROLES } from '../enemies/mountainPeak/MountainEnemy'
import { Warrior } from '../heroes/Warrior'
import { Cleric } from '../heroes/Cleric'
import { StatusEffects } from '../StatusEffects'
import { AncestralGuard, MountainMend, AttackOrder } from '../abilities/MountainActions'
import type { AbilityContext } from '../interfaces/IAbility'
import { useGameStore } from '@/stores/game'
import { useExpeditionStore } from '@/stores/expedition'
import { Enemy } from '../enemies/Enemy'
import { MOUNTAIN_STAB } from '../abilities/MountainActions'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

function seeded(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
}

describe('Montañas Rocosas', () => {
  it('triplica la vida común escalada por nivel sin cambiar la de los jefes', () => {
    expect(new MountainEnemy('scout', 3).maxHealth).toBe((28 + 2 * 10) * 3)
    expect(new MountainEnemy('guardian', 3).maxHealth).toBe((110 + 2 * 25) * 3)
    expect(new MountainEnemy('captain', 3).maxHealth).toBe(300 + 2 * 60)
    expect(new MountainEnemy('dragon', 5).maxHealth).toBe(1800 + 4 * 100)
    for (const role of MOUNTAIN_ROLES) {
      const enemy = new MountainEnemy(role, 3)
      expect(enemy.health).toBe(enemy.maxHealth)
    }
  })

  it('duplica exactamente el daño físico y mágico común, incluidos críticos y buffs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    for (const role of MOUNTAIN_ROLES) {
      const enemy = new MountainEnemy(role, 3)
      const factor = ['captain', 'dragon'].includes(role) ? 1 : 2
      enemy.addStatusEffect({ ...StatusEffects.ATTACK_ORDER })
      expect(enemy.attack()).toBe(Enemy.prototype.attack.call(enemy) * factor)
      for (const damageType of ['physical', 'fire'] as const) {
        const pattern = { ...MOUNTAIN_STAB, damageType }
        expect(enemy.calculatePhaseDamage(pattern, 2)).toBe(Enemy.prototype.calculatePhaseDamage.call(enemy, pattern, 2) * factor)
      }
      enemy.isAlive = false
      expect(enemy.attack()).toBe(0)
      expect(enemy.calculatePhaseDamage(MOUNTAIN_STAB)).toBe(0)
    }
  })
  it('todos los caminos atraviesan reclutamiento, tienda temprana, capitán y guardia final', () => {
    const generator = useExpeditionGenerator()
    for (let seed = 1; seed <= 40; seed++) {
      vi.spyOn(Math, 'random').mockImplementation(seeded(seed))
      const nodes = generator.generateExpeditionNodes(MOUNTAIN_PEAK)
      expect(generator.validateConnectivity(nodes).ok).toBe(true)
      const byId = new Map(nodes.map(n => [n.id, n]))
      const checked = new Set<string>()
      const visit = (id: string, path: string[]) => {
        const node = byId.get(id)!
        const route = [...path, id]
        const milestones = route.map(nodeId => nodeId.replace(/^branch-/, '')).filter(nodeId => ['node-2', 'node-3', 'node-5', 'node-6', 'node-8'].includes(nodeId))
        const state = `${id}:${milestones.join(',')}`
        if (checked.has(state)) return
        checked.add(state)
        if (id === 'boss') {
          expect(milestones).toEqual(expect.arrayContaining(['node-2', 'node-3', 'node-5', 'node-6', 'node-8']))
          expect(byId.get('node-3')!.type).toBe('shop')
          expect(byId.get('node-2')!.type).toBe('recruit-hero')
        }
        for (const child of node.connections) visit(child, route)
      }
      visit('start', [])
    }
  })

  it('el mapa lineal de respaldo también conserva los nodos obligatorios', () => {
    const generator = useExpeditionGenerator()
    const nodes = generator.generateExpeditionNodes({ ...MOUNTAIN_PEAK, generator: { ...MOUNTAIN_PEAK.generator, maxRetries: 0 } })
    expect(nodes.find(n => n.id === 'node-2')?.type).toBe('recruit-hero')
    expect(nodes.find(n => n.id === 'node-3')?.type).toBe('shop')
    expect(generator.validateConnectivity(nodes).ok).toBe(true)
  })

  it('la primera tienda siempre permite comprar una mejora con el oro mínimo previo', () => {
    const gold = ['trail-scouts', 'light-patrol'].flatMap(id => resolveEncounterById(MOUNTAIN_PEAK, id))
      .reduce((sum, enemy) => sum + enemy.goldReward.min, 0)
    expect(gold).toBeGreaterThanOrEqual(55)
  })

  it('la herida abierta reduce curación y no acumula intensidad al reaplicarla', () => {
    const hero = new Warrior()
    hero.health = 10
    hero.addStatusEffect({ ...StatusEffects.OPEN_WOUND })
    hero.addStatusEffect({ ...StatusEffects.OPEN_WOUND })
    hero.heal(100)
    expect(hero.health).toBe(75)
    expect(hero.statusEffects).toHaveLength(1)
  })

  it('el guardián anuncia su preparación y deja una ventana vulnerable tras golpear', () => {
    const enemy = new MountainEnemy('guardian', 3)
    expect(enemy.intention).toContain('Coraza')
    enemy.selectAttackPattern(null)
    enemy.addStatusEffect({ ...StatusEffects.STONE_SHELL })
    enemy.afterAction()
    expect(enemy.intention).toContain('Impacto')
    enemy.selectAttackPattern(null)
    enemy.afterAction()
    expect(enemy.hasStatusEffect('stone_shell')).toBe(false)
    expect(enemy.hasStatusEffect('vulnerable')).toBe(true)
  })

  it('el targeting evita muertos, respeta amenaza y penaliza el foco repetido', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const enemy = new MountainEnemy('archer', 2)
    const warrior = new Warrior()
    const cleric = new Cleric()
    warrior.addStatusEffect({ ...StatusEffects.SECOND_WIND })
    expect(enemy.selectAction([warrior, cleric])?.target).toBe(warrior)
    warrior.removeStatusEffect('second_wind')
    expect(enemy.selectAction([warrior, cleric], new Map([[cleric.id, 3]]))?.target).toBe(warrior)
    warrior.isAlive = false
    expect(enemy.selectAction([warrior, cleric])?.target).toBe(cleric)
  })

  it('las habilidades de apoyo afectan al bando enemigo y el escudo absorbe daño real', async () => {
    vi.useFakeTimers()
    const shaman = new MountainEnemy('shaman', 2)
    const guardian = new MountainEnemy('guardian', 3)
    const hero = new Cleric()
    guardian.health = 30
    hero.health = 10
    const context = { caster: shaman, target: hero, allies: [shaman, guardian], animationDelay: 0, log: vi.fn() } as unknown as AbilityContext
    for (const ability of [AncestralGuard, MountainMend, AttackOrder]) {
      const promise = ability.execute({ ...context, ability })
      await vi.runAllTimersAsync()
      await promise
    }
    // Chamán Nv. 2: MEN 28.5 → 18 HP de cura y 22 de escudo.
    expect(guardian.health).toBe(48)
    expect(hero.health).toBe(10)
    expect(guardian.hasStatusEffect('attack_order')).toBe(true)
    expect(hero.statusEffects).toHaveLength(0)
    guardian.takeDamage(25, { damageType: 'physical' })
    expect(guardian.health).toBe(45)
    expect(guardian.hasStatusEffect('ancestral_guard')).toBe(false)
  })

  it('crear un héroe de nivel alto reproduce el crecimiento acumulado por nivel', () => {
    const leveled = new Warrior()
    for (let i = 1; i < 5; i++) { leveled.experience = leveled.experienceToNextLevel; leveled.levelUp() }
    const direct = new Warrior(5)
    expect(direct.baseStats).toEqual(leveled.baseStats)
    expect(direct.maxHealth).toBe(leveled.maxHealth)
    expect(direct.maxEnergy).toBe(leveled.maxEnergy)
    expect(direct.experienceToNextLevel).toBe(leveled.experienceToNextLevel)
  })

  it('el explorador goblin recorre sus 4 ataques distintos en la rotación', () => {
    const scout = new MountainEnemy('scout', 1)
    const used = new Set<string>()
    for (let turn = 0; turn < 4; turn++) used.add(scout.selectAttackPattern(null).name ?? '')
    expect(used.size).toBe(4)
    expect(scout.intention).toBe(scout.attackPatterns[0].name)
  })

  it('los roles no guionizados abren en un punto aleatorio de su rotación', () => {
    const random = vi.spyOn(Math, 'random')
    random.mockReturnValue(0.0)
    expect(new MountainEnemy('scout', 1).intention).toBe('Estocada oxidada')
    random.mockReturnValue(0.9)
    expect(new MountainEnemy('scout', 1).intention).toBe('Red de caza')
    random.mockRestore()
  })

  it('el guardián mantiene su apertura guionizada pese al azar', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    expect(new MountainEnemy('guardian', 3).intention).toContain('Coraza')
    vi.restoreAllMocks()
  })

  it('las formaciones ofrecen parejas, tríos y grupos mayores con facciones coherentes', () => {
    const encounterIds = Object.keys(MOUNTAIN_PEAK.encounters).filter(id => MOUNTAIN_PEAK.encounters[id].group !== 'dragons' && id !== 'trail-scouts')
    const sizes = new Set<number>()
    for (const id of encounterIds) {
      const enemies = resolveEncounterById(MOUNTAIN_PEAK, id) as MountainEnemy[]
      sizes.add(enemies.length)
      expect(enemies.length, id).toBeGreaterThanOrEqual(2)
      expect(new Set(enemies.map(enemy => enemy.enemyGroup)), id).toEqual(new Set([MOUNTAIN_PEAK.encounters[id].group]))
      for (const enemy of enemies) {
        const attacks = enemy.attackPatterns.map(action => action.name)
        expect(new Set(attacks).size, `${id}: ${enemy.name}`).toBeGreaterThanOrEqual(4)
      }
    }
    expect(sizes.has(2)).toBe(true)
    expect(sizes.has(3)).toBe(true)
  })

  it('todos los roles de montaña aparecen en encuentros accesibles del mapa', () => {
    const ids = new Set([
      ...Object.values(MOUNTAIN_PEAK.enemyGroups).flatMap(group => Object.values(group).flat()),
      ...MOUNTAIN_PEAK.generator.forcedNodes.flatMap(node => node.encounter ? [node.encounter] : [])
    ])
    const roles = new Set([...ids].flatMap(id => (resolveEncounterById(MOUNTAIN_PEAK, id) as MountainEnemy[]).map(enemy => enemy.role)))
    expect(roles).toEqual(new Set(MOUNTAIN_ROLES))
    expect(MOUNTAIN_ROLES.every(role => new MountainEnemy(role).sprite)).toBe(true)
  })

  it('el mapa generado varía la cantidad de enemigos sin mezclar facciones', () => {
    const sizes = new Set<number>()
    for (let seed = 1; seed <= 12; seed++) {
      vi.spyOn(Math, 'random').mockImplementation(seeded(seed))
      const nodes = useExpeditionGenerator().generateExpeditionNodes(MOUNTAIN_PEAK, { recruitedHeroClassIds: ['warrior', 'cleric', 'rogue'] })
      for (const node of nodes.filter(node => node.type === 'combat' && node.id !== 'start')) {
        const enemies = node.enemies as MountainEnemy[]
        sizes.add(enemies.length)
        expect(enemies.length, node.id).toBeGreaterThanOrEqual(2)
        expect(new Set(enemies.map(enemy => enemy.enemyGroup)).size, node.id).toBe(1)
      }
    }
    expect(sizes.has(2)).toBe(true)
    expect(sizes.has(3)).toBe(true)
  })

  it('bloquea el nodo del capitán durante la primera run, incluso si se intenta seleccionar directamente', () => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.startGame([new Warrior(), new Cleric(), new Warrior()])
    expect(game.beginRun()).toBe(true)
    const expedition = useExpeditionStore()
    const captainNode = expedition.currentExpedition!.nodes.find(node => node.id === 'node-5')!
    expedition.currentExpedition!.nodes.find(node => node.id === 'start')!.completed = true
    expedition.selectedNode = { ...captainNode, id: 'node-4', connections: ['node-5'] }
    expect(expedition.availableNodes).not.toContain('node-5')
    expedition.selectNode(captainNode)
    expect(expedition.selectedNode?.id).not.toBe('node-5')

    game.finishRun(false)
    expect(game.beginRun()).toBe(true)
    const nextRun = useExpeditionStore()
    nextRun.currentExpedition!.nodes.find(node => node.id === 'start')!.completed = true
    nextRun.selectedNode = { ...captainNode, id: 'node-4', connections: ['node-5'] }
    expect(nextRun.availableNodes).toContain('node-5')
  })
})
