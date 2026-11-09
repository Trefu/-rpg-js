import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { SAVE_KEY, useGameStore } from './game'
import { useExpeditionStore } from './expedition'
import { Warrior } from '@/core/heroes/Warrior'
import { Cleric } from '@/core/heroes/Cleric'
import { Rogue } from '@/core/heroes/Rogue'
import { consumeItem } from '@/core/items/inventory'
import { restoreItemsToMax } from '@/core/items/items'
import { resolveCuriosityChoice } from '@/core/events/curiosityEvents'
import { Hero } from '@/core/Hero'
import { RECRUITABLE_HEROES } from '@/core/heroes/recruitment'

const originalRecruitCount = RECRUITABLE_HEROES.length

beforeEach(() => {
  setActivePinia(createPinia())
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) })
})
afterEach(() => { vi.unstubAllGlobals(); RECRUITABLE_HEROES.splice(originalRecruitCount) })

function addFutureHero() {
  const choice = { id: 'ranger', displayName: 'Exploradora', description: '', sprite: '', factory: () => new Hero({
    id: 'ranger-1', heroClassId: 'ranger', name: 'Exploradora', maxHealth: 100,
    body: { value: 12, growthPerLevel: 2 }, mind: { value: 10, growthPerLevel: 1 },
    agility: { value: 14, growthPerLevel: 3 }, constitution: { value: 10, growthPerLevel: 1 }
  }) }
  RECRUITABLE_HEROES.push(choice)
  return choice.factory()
}

describe('Selección de grupo desde el campamento', () => {
  it('la partida nueva selecciona los tres héroes y respeta posteriores selecciones vacías', () => {
    const game = useGameStore()
    game.initializeCompany()
    expect(game.currentLocation).toBe('city')
    expect(game.companyHeroes).toHaveLength(3)
    expect(game.activeHeroes).toHaveLength(3)
    expect(game.activeHeroes).toEqual(game.companyHeroes)
    expect(game.setPartyHeroes([])).toBe(true)
    game.initializeCompany()
    expect(game.activeHeroes).toHaveLength(0)
    expect(game.beginRun()).toBe(false)
    expect(game.attempts).toBe(0)
    expect(game.togglePartyHero('rogue')).toBe(true)
    expect(game.beginRun()).toBe(true)
    expect(game.activeHeroes.map(hero => hero.heroClassId)).toEqual(['rogue'])
    expect(game.togglePartyHero('cleric')).toBe(false)
    expect(game.beginRun()).toBe(false)
    expect(game.attempts).toBe(1)
  })

  it('el límite de tres afecta al grupo, no al tamaño de la compañía', () => {
    const ranger = addFutureHero()
    const game = useGameStore()
    game.startGame([Warrior.createStarter(), Cleric.createStarter(), Rogue.createStarter(), ranger])
    expect(game.companyHeroes).toHaveLength(4)
    expect(game.activeHeroes).toHaveLength(3)
    expect(game.togglePartyHero('ranger')).toBe(false)
    expect(game.setPartyHeroes(['warrior', 'warrior'])).toBe(false)
    expect(game.setPartyHeroes(['does-not-exist'])).toBe(false)
    expect(game.setPartyHeroes(['ranger', 'cleric'])).toBe(true)
    expect(game.activeHeroes.map(hero => hero.heroClassId)).toEqual(['ranger', 'cleric'])
    expect(game.companyHeroes).toHaveLength(4)
  })

  it('iniciar con una selección explícita usa el héroe persistente en vez de reiniciar su nivel', () => {
    const game = useGameStore()
    game.initializeCompany()
    const rogue = game.companyHeroes.find(hero => hero.heroClassId === 'rogue')!
    rogue.gainExperience(100)
    expect(game.beginRun({ heroes: [Rogue.createStarter()] })).toBe(true)
    expect(game.activeHeroes[0]).toBe(rogue)
    expect(game.activeHeroes[0].level).toBe(2)
    expect(game.companyHeroes).toHaveLength(3)
  })

  it('solo el grupo recibe XP y el equipo también beneficia a la reserva sin duplicarse', () => {
    const game = useGameStore()
    game.startGame([Warrior.createStarter(), Cleric.createStarter(), Rogue.createStarter()])
    const cleric = game.companyHeroes.find(hero => hero.heroClassId === 'cleric')!
    const baseConstitution = cleric.baseStats.constitution.value
    game.setPartyHeroes(['warrior'])
    game.awardCombat('battle', 100, 100, 1)
    expect(game.activeHeroes[0].level).toBe(2)
    expect(cleric.level).toBe(1)
    game.buyItem('vigor-banner')
    game.setPartyHeroes(['cleric'])
    game.setPartyHeroes(['warrior'])
    game.setPartyHeroes(['cleric'])
    expect(cleric.baseStats.constitution.value).toBe(baseConstitution + 2)
    expect(game.activeHeroes[0]).toBe(cleric)
  })

  it('el guardado conserva más de tres héroes, la reserva y el orden seleccionado', () => {
    const ranger = addFutureHero()
    const game = useGameStore()
    game.startGame([Warrior.createStarter(), Cleric.createStarter(), Rogue.createStarter(), ranger])
    game.companyHeroes.find(hero => hero.heroClassId === 'warrior')!.gainExperience(310)
    game.setPartyHeroes(['ranger', 'cleric'])
    setActivePinia(createPinia())
    const loaded = useGameStore()
    expect(loaded.loadProgress()).toBe(true)
    expect(loaded.companyHeroes).toHaveLength(4)
    expect(loaded.activeHeroes.map(hero => hero.heroClassId)).toEqual(['ranger', 'cleric'])
    expect(loaded.companyHeroes.find(hero => hero.heroClassId === 'warrior')!.level).toBe(3)
    loaded.setPartyHeroes([])
    setActivePinia(createPinia())
    const emptySelection = useGameStore()
    expect(emptySelection.loadProgress()).toBe(true)
    expect(emptySelection.companyHeroes).toHaveLength(4)
    expect(emptySelection.activeHeroes).toHaveLength(0)
    expect(emptySelection.beginRun()).toBe(false)
  })

  it('un recluta se conserva en reserva cuando los tres puestos están ocupados', () => {
    const ranger = addFutureHero()
    const game = useGameStore()
    game.startGame([Warrior.createStarter(), Cleric.createStarter(), Rogue.createStarter()])
    game.beginRun()
    expect(game.recruitHero(ranger)).toBe(true)
    expect(game.activeHeroes).toHaveLength(3)
    expect(game.companyHeroes).toHaveLength(4)
    game.finishRun(false)
    expect(game.setPartyHeroes(['ranger'])).toBe(true)
  })

  it('migra el guardado anterior sin perder niveles ni la compañía', () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1,
      heroes: [{ classId: 'warrior', level: 3, experience: 25 }, { classId: 'cleric', level: 2, experience: 10 }],
      gold: 77, equipment: ['vigor-banner'], teamItems: ['healing-potion'], attempts: 2, bestDepth: 5,
      completedExpeditions: [], lastRun: { victory: false, combats: 3, xp: 120, gold: 70, recruits: [] }
    }))
    const game = useGameStore()
    expect(game.loadProgress()).toBe(true)
    expect(game.companyHeroes).toHaveLength(2)
    expect(game.activeHeroes.map(hero => hero.heroClassId)).toEqual(['warrior', 'cleric'])
    expect(game.activeHeroes[0].level).toBe(3)
    expect(game.gold).toBe(77)
    expect(game.lastRun?.combats).toBe(3)
    game.saveProgress()
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).version).toBe(2)
  })
})

describe('Compañía, economía y guardado', () => {
  it('el siguiente intento retira el reclutamiento inicial al completar la compañía', () => {
    const game = useGameStore()
    game.beginRun({ heroes: [Warrior.createStarter()] })
    expect(useExpeditionStore().currentExpedition?.nodes.some(node => node.type === 'recruit-hero')).toBe(true)
    game.addHeroToFirstFreeSlot(Cleric.createStarter())
    game.addHeroToFirstFreeSlot(Rogue.createStarter())
    game.finishRun(false)
    game.beginRun()
    expect(useExpeditionStore().currentExpedition?.nodes.some(node => node.type === 'recruit-hero')).toBe(false)
  })

  it('la derrota conserva reclutas, nivel, XP, equipo, oro y unidades compradas', () => {
    const game = useGameStore()
    game.beginRun({ heroes: [Warrior.createStarter()] })
    game.addHeroToFirstFreeSlot(Cleric.createStarter())
    game.awardCombat('battle', 130, 180, 4)
    game.openShop('merchant')
    expect(game.buyItem('vigor-banner')).toBe(true)
    expect(game.buyItem('healing-potion')).toBe(true)
    game.activeHeroes[0].takeDamage(9999)
    game.finishRun(false)
    const gold = game.gold
    const experience = game.activeHeroes[0].experience
    game.beginRun()
    expect(game.attempts).toBe(2)
    expect(game.activeHeroes.map(h => h.heroClassId)).toEqual(['warrior', 'cleric'])
    expect(game.activeHeroes[0].level).toBe(2)
    expect(game.activeHeroes[0].experience).toBe(experience)
    expect(game.activeHeroes.every(h => h.isAlive && h.health === h.maxHealth)).toBe(true)
    expect(game.gold).toBe(gold)
    expect(game.equipment).toContain('vigor-banner')
    expect(game.teamItems).toContain('healing-potion')
    expect(game.bestDepth).toBe(4)
  })

  it('las recompensas se cobran una vez y el oro no se multiplica por héroe', () => {
    const game = useGameStore()
    game.startGame([Warrior.createStarter(), Cleric.createStarter(), Rogue.createStarter()])
    expect(game.awardCombat('one', 100, 30, 2)).toBe(true)
    expect(game.awardCombat('one', 100, 30, 2)).toBe(false)
    expect(game.gold).toBe(30)
    expect(game.activeHeroes.every(h => h.level === 2 && h.experience === 0)).toBe(true)
    resolveCuriosityChoice({ id: 'gold', label: '', outcome: { kind: 'reward', flavor: '', effects: [{ kind: 'gold', amount: 20 }] } },
      { heroes: game.activeHeroes, teamItems: game.teamItems, wallet: game })
    expect(game.gold).toBe(50)
  })

  it('compras atómicas, objetos únicos y stock estable al reabrir la tienda', () => {
    const game = useGameStore()
    game.startGame([Warrior.createStarter()])
    game.openShop('merchant')
    const original = [...game.teamItems]
    expect(game.buyItem('healing-potion')).toBe(false)
    expect(game.teamItems).toEqual(original)
    game.gold = 300
    expect(game.buyItem('vigor-banner')).toBe(true)
    const gold = game.gold
    expect(game.buyItem('vigor-banner')).toBe(false)
    expect(game.gold).toBe(gold)
    for (let i = 0; i < 3; i++) expect(game.buyItem('healing-potion')).toBe(true)
    expect(game.buyItem('healing-potion')).toBe(false)
    game.openShop('merchant')
    expect(game.shopStock['healing-potion']).toBe(0)
  })

  it('el equipo es idempotente, crece con el nivel y afecta también a nuevos reclutas', () => {
    const game = useGameStore()
    game.startGame([Warrior.createStarter()])
    const hero = game.activeHeroes[0]
    const base = hero.baseStats.constitution.value
    const hp = hero.maxHealth
    game.gold = 200
    game.buyItem('vigor-banner')
    game.applyEquipment()
    game.applyEquipment()
    expect(hero.baseStats.constitution.value).toBe(base + 2)
    expect(hero.maxHealth).toBe(hp + 8)
    game.addHeroToFirstFreeSlot(Cleric.createStarter())
    expect(game.activeHeroes[1].baseStats.constitution.value).toBe(new Cleric().baseStats.constitution.value + 2)
    hero.gainExperience(100)
    game.applyEquipment()
    expect(hero.baseStats.constitution.value).toBe(base + 2 + 6)
  })

  it('los frascos se recargan sin recuperar consumibles comprados gastados', () => {
    const game = useGameStore()
    game.startGame([Warrior.createStarter()])
    game.teamItems.push('healing-potion')
    consumeItem(game.teamItems, 'healing-potion')
    consumeItem(game.teamItems, 'healing-flask')
    restoreItemsToMax(game.teamItems)
    expect(game.teamItems).not.toContain('healing-potion')
    expect(game.teamItems.filter(id => id === 'healing-flask')).toHaveLength(1)
  })

  it('recarga una compañía con métodos de clase y sin duplicar estadísticas', () => {
    const game = useGameStore()
    game.startGame([Warrior.createStarter()])
    game.gold = 200
    game.buyItem('whetstone')
    game.activeHeroes[0].gainExperience(310)
    game.saveProgress()
    const stats = game.activeHeroes[0].baseStats.body.value
    setActivePinia(createPinia())
    const loaded = useGameStore()
    expect(loaded.loadProgress()).toBe(true)
    expect(loaded.currentLocation).toBe('city')
    expect(loaded.activeHeroes[0]).toBeInstanceOf(Warrior)
    expect(loaded.activeHeroes[0].baseStats.body.value).toBe(stats)
    loaded.applyEquipment()
    expect(loaded.activeHeroes[0].baseStats.body.value).toBe(stats)
    expect(loaded.activeHeroes[0].abilities).toHaveLength(5)
    loaded.resetGame()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })

  it('una victoria guarda el hito de expedición y devuelve al campamento', () => {
    const game = useGameStore()
    game.beginRun({ heroes: [Rogue.createStarter()] })
    game.finishRun(true)
    expect(game.completedExpeditions).toContain('mountain-peak')
    expect(game.lastRun?.victory).toBe(true)
    expect(useExpeditionStore().currentExpedition).toBeNull()
  })
})
