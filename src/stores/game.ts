import { defineStore } from 'pinia'
import type { Hero } from '../core/Hero'
import { Warrior } from '@/core/heroes/Warrior'
import { RECRUITABLE_HEROES, restoreHero } from '@/core/heroes/recruitment'
import { useExpeditionStore } from './expedition'
import { DEFAULT_EXPEDITION } from '@/core/expeditions/registry'
import type { ExpeditionId } from '@/core/expeditions/types'
import { getPartyBonuses, PARTY_EQUIPMENT } from '@/core/items/equipment'
import { getItem, restoreItemsToMax } from '@/core/items/items'
import { SHOP_CONSUMABLES } from '@/core/items/shop'

export type GameLocation = 'pre-game' | 'expedition-map' | 'combat' | 'shop' | 'city' | 'training'
export const MAX_HEROES = 3
export const SAVE_KEY = 'rpg-company-v1'
interface RunSummary { victory: boolean; combats: number; xp: number; gold: number; recruits: string[] }
interface GameState {
  companyHeroes: Hero[]
  heroes: Array<Hero | null>
  activeHeroIndex: number
  isGameStarted: boolean
  currentLocation: GameLocation
  gold: number
  experience: number
  teamItems: string[]
  equipment: string[]
  attempts: number
  bestDepth: number
  completedExpeditions: string[]
  runRewards: { combats: number; xp: number; gold: number; recruits: string[] }
  lastRun: RunSummary | null
  shopStock: Record<string, number>
  shopVisits: Record<string, Record<string, number>>
  rewardedNodes: string[]
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    companyHeroes: [], heroes: Array.from({ length: MAX_HEROES }, () => null), activeHeroIndex: 0,
    isGameStarted: false, currentLocation: 'city', gold: 0, experience: 0,
    teamItems: [], equipment: [], attempts: 0, bestDepth: 0, completedExpeditions: [],
    runRewards: { combats: 0, xp: 0, gold: 0, recruits: [] }, lastRun: null,
    shopStock: {}, shopVisits: {}, rewardedNodes: []
  }),
  getters: {
    canEditParty(state): boolean { return state.currentLocation === 'city' || state.currentLocation === 'pre-game' },
    activeHero(state): Hero | null { return (state.heroes[state.activeHeroIndex] ?? null) as Hero | null },
    activeHeroes(state): Hero[] { return state.heroes.filter((h): h is Hero => h !== null) as Hero[] }
  },
  actions: {
    initializeCompany() {
      if (this.companyHeroes.length) return
      this.companyHeroes = RECRUITABLE_HEROES.filter(choice => choice.availableAtStart !== false).map(choice => choice.factory())
      this.heroes = Array.from({ length: MAX_HEROES }, () => null)
      this.isGameStarted = true
      this.currentLocation = 'city'
      restoreItemsToMax(this.teamItems)
      this.applyEquipment()
    },
    startGame(heroes: Hero[]) {
      this.companyHeroes = [...heroes]
      this.heroes = Array.from({ length: MAX_HEROES }, (_, i) => heroes[i] ?? null)
      this.activeHeroIndex = 0
      this.isGameStarted = true
      this.currentLocation = 'city'
      restoreItemsToMax(this.teamItems)
      this.applyEquipment()
    },
    setPartyHeroes(classIds: string[]): boolean {
      if (!this.canEditParty || classIds.length > MAX_HEROES || new Set(classIds).size !== classIds.length) return false
      const chosen = classIds.map(id => this.companyHeroes.find(hero => hero.heroClassId === id))
      if (chosen.some(hero => !hero)) return false
      this.heroes = Array.from({ length: MAX_HEROES }, (_, i) => chosen[i] ?? null)
      this.activeHeroIndex = 0
      this.saveProgress()
      return true
    },
    togglePartyHero(classId: string): boolean {
      const selected = this.activeHeroes.map(hero => hero.heroClassId)
      const index = selected.indexOf(classId)
      if (index >= 0) selected.splice(index, 1)
      else selected.push(classId)
      return this.setPartyHeroes(selected)
    },
    setActiveHero(index: number) {
      if (index < -1 || index >= MAX_HEROES || (index >= 0 && !this.heroes[index])) return
      this.activeHeroIndex = index
    },
    addHeroToFirstFreeSlot(hero: Hero): boolean {
      const index = this.heroes.findIndex(h => h === null)
      if (index === -1) return false
      return this.recruitHero(hero)
    },
    recruitHero(hero: Hero): boolean {
      if (this.companyHeroes.some(h => h.heroClassId === hero.heroClassId)) return false
      const index = this.heroes.findIndex(h => h === null)
      const targetLevel = Math.max(1, Math.floor(this.activeHeroes.reduce((sum, h) => sum + h.level, 0) / Math.max(1, this.activeHeroes.length)) - 1)
      while (hero.level < targetLevel) { hero.experience = hero.experienceToNextLevel; hero.levelUp() }
      hero.setPartyBonuses(getPartyBonuses(this.equipment))
      hero.prepareForRun()
      this.companyHeroes.push(hero)
      if (index >= 0) this.heroes[index] = hero
      this.runRewards.recruits.push(hero.name)
      this.saveProgress()
      return true
    },
    setHeroInSlot(index: number, hero: Hero | null, activate = true) {
      if (index < 0 || index >= MAX_HEROES) return
      this.heroes[index] = hero
      hero?.setPartyBonuses(getPartyBonuses(this.equipment))
      this.applyEquipment()
      if (activate && hero) this.activeHeroIndex = index
    },
    navigateTo(location: GameLocation) { this.currentLocation = location },
    beginRun({ expeditionId = DEFAULT_EXPEDITION, heroes }: { expeditionId?: ExpeditionId; heroes?: Hero[] } = {}) {
      if (!this.canEditParty) return false
      if (heroes && (heroes.length < 1 || heroes.length > MAX_HEROES)) return false
      if (!this.companyHeroes.length) this.startGame(heroes ?? [Warrior.createStarter()])
      else if (heroes && !this.setPartyHeroes(heroes.map(hero => hero.heroClassId))) return false
      if (!this.activeHeroes.length || this.activeHeroes.length > MAX_HEROES) return false
      this.applyEquipment()
      for (const hero of this.activeHeroes) hero.prepareForRun()
      restoreItemsToMax(this.teamItems)
      this.attempts++
      this.runRewards = { combats: 0, xp: 0, gold: 0, recruits: [] }
      this.rewardedNodes = []
      this.shopVisits = {}
      this.shopStock = {}
      this.lastRun = null
      const expedition = useExpeditionStore()
      expedition.completedExpeditions = new Set(this.completedExpeditions)
      expedition.startExpedition(expeditionId, this.companyHeroes.map(hero => hero.heroClassId), this.attempts)
      this.navigateTo('expedition-map')
      this.saveProgress()
      return true
    },
    finishRun(victory: boolean) {
      this.lastRun = { victory, ...this.runRewards, recruits: [...this.runRewards.recruits] }
      if (victory) {
        const id = useExpeditionStore().currentExpedition?.config.id
        if (id && !this.completedExpeditions.includes(id)) this.completedExpeditions.push(id)
      }
      for (const hero of this.companyHeroes) hero.prepareForRun()
      restoreItemsToMax(this.teamItems)
      useExpeditionStore().resetExpedition()
      this.navigateTo('city')
      this.saveProgress()
    },
    awardCombat(nodeId: string, xp: number, gold: number, depth: number): boolean {
      if (this.rewardedNodes.includes(nodeId)) return false
      this.rewardedNodes.push(nodeId)
      for (const hero of this.activeHeroes) hero.gainExperience(xp)
      this.gold += gold
      this.runRewards.combats++
      this.runRewards.xp += xp
      this.runRewards.gold += gold
      this.bestDepth = Math.max(this.bestDepth, depth)
      this.saveProgress()
      return true
    },
    applyEquipment() {
      const bonuses = getPartyBonuses(this.equipment)
      for (const hero of this.companyHeroes) hero.setPartyBonuses(bonuses)
    },
    openShop(nodeId: string) {
      if (!this.shopVisits[nodeId]) this.shopVisits[nodeId] = Object.fromEntries(SHOP_CONSUMABLES.map(p => [p.id, p.stock]))
      this.shopStock = this.shopVisits[nodeId]
      this.navigateTo('shop')
    },
    buyItem(id: string): boolean {
      const equipment = PARTY_EQUIPMENT.find(p => p.id === id)
      const potion = SHOP_CONSUMABLES.find(p => p.id === id)
      const price = equipment?.price ?? potion?.price
      if (price === undefined || this.gold < price) return false
      if (equipment) {
        if (this.equipment.includes(id)) return false
        this.equipment.push(id)
        this.applyEquipment()
      } else if (potion && (this.shopStock[id] ?? 0) > 0) {
        this.shopStock[id]--
        this.teamItems.push(id)
      } else return false
      this.gold -= price
      this.saveProgress()
      return true
    },
    saveProgress() {
      if (typeof localStorage === 'undefined' || !this.companyHeroes.length) return
      const data = {
        version: 2, heroes: this.companyHeroes.map(h => ({ classId: h.heroClassId, level: h.level, experience: h.experience })),
        selectedHeroClassIds: this.activeHeroes.map(hero => hero.heroClassId),
        gold: this.gold, teamItems: this.teamItems, equipment: this.equipment, attempts: this.attempts,
        bestDepth: this.bestDepth, completedExpeditions: this.completedExpeditions, lastRun: this.lastRun
      }
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)) } catch (error) { console.warn('No se pudo guardar el progreso', error) }
    },
    loadProgress(): boolean {
      if (typeof localStorage === 'undefined') return false
      try {
        const data = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null')
        if ((data?.version !== 1 && data?.version !== 2) || !Array.isArray(data.heroes) || !data.heroes.length) return false
        const heroes: Hero[] = data.heroes.map((h: { classId: string; level: number; experience: number }) => {
          if (!Number.isInteger(h.level) || h.level < 1 || h.level > 100 || !Number.isFinite(h.experience) || h.experience < 0) throw new Error('Progreso inválido')
          return restoreHero(h.classId, h.level, h.experience)
        })
        this.gold = Math.max(0, Math.floor(Number(data.gold) || 0))
        this.teamItems = Array.isArray(data.teamItems) ? data.teamItems.filter((id: string) => typeof id === 'string' && getItem(id)) : []
        this.equipment = Array.isArray(data.equipment) ? [...new Set<string>(data.equipment.filter((id: string) => PARTY_EQUIPMENT.some(p => p.id === id)))] : []
        this.attempts = Math.max(0, Number(data.attempts) || 0)
        this.bestDepth = Math.max(0, Number(data.bestDepth) || 0)
        this.completedExpeditions = Array.isArray(data.completedExpeditions) ? data.completedExpeditions.filter((id: unknown) => typeof id === 'string') : []
        this.startGame(heroes)
        const selected = data.version === 1 ? heroes.slice(0, MAX_HEROES).map(h => h.heroClassId)
          : Array.isArray(data.selectedHeroClassIds) ? data.selectedHeroClassIds : []
        const validSelected = [...new Set<string>(selected.filter((id: unknown) => typeof id === 'string' && heroes.some(h => h.heroClassId === id)))].slice(0, MAX_HEROES)
        this.heroes = Array.from({ length: MAX_HEROES }, (_, i) => heroes.find(hero => hero.heroClassId === validSelected[i]) ?? null)
        this.activeHeroIndex = 0
        this.lastRun = data.lastRun ?? null
        for (const hero of this.companyHeroes) hero.prepareForRun()
        return true
      } catch (error) { console.warn('No se pudo cargar el progreso', error); return false }
    },
    resetGame() {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(SAVE_KEY)
      this.$reset()
      this.initializeCompany()
    }
  }
})
