import { defineStore } from 'pinia'
import type { Hero } from '../core/Hero'
import { Warrior } from '@/core/heroes/Warrior'
import { useExpeditionStore } from './expedition'
import { DEFAULT_ZONE, type ZoneId } from '@/core/zones/EnemyPools'

export type GameLocation = 'pre-game' | 'expedition-map' | 'combat' | 'shop' | 'city' | 'training'

export const MAX_HEROES = 3

interface GameState {
  heroes: Array<Hero | null>
  activeHeroIndex: number
  isGameStarted: boolean
  currentLocation: GameLocation
  gold: number
  experience: number
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    heroes: Array.from({ length: MAX_HEROES }, () => null),
    activeHeroIndex: 0,
    isGameStarted: false,
    currentLocation: 'pre-game',
    gold: 0,
    experience: 0
  }),

  getters: {
    activeHero(state): Hero | null {
      return (state.heroes[state.activeHeroIndex] ?? null) as Hero | null
    },
    activeHeroes(state): Hero[] {
      return state.heroes.filter((h): h is Hero => h !== null) as Hero[]
    }
  },

  actions: {
    startGame(heroes: Hero[]) {
      const slots: (Hero | null)[] = []
      for (let i = 0; i < MAX_HEROES; i++) {
        slots.push(heroes[i] ?? null)
      }
      this.heroes = slots
      this.activeHeroIndex = 0
      this.isGameStarted = true
      this.currentLocation = 'city'
    },

    setActiveHero(index: number) {
      if (index < -1 || index >= MAX_HEROES) return
      if (index >= 0 && this.heroes[index] === null) return
      this.activeHeroIndex = index
    },

    addHeroToFirstFreeSlot(hero: Hero): boolean {
      const idx = this.heroes.findIndex(h => h === null)
      if (idx === -1) return false
      this.heroes[idx] = hero
      return true
    },

    navigateTo(location: GameLocation) {
      this.currentLocation = location
    },

    beginRun({ zoneId = DEFAULT_ZONE, heroes }: { zoneId?: ZoneId, heroes?: Hero[] } = {}) {
      this.startGame(heroes ?? [Warrior.createStarter()])
      const expeditionStore = useExpeditionStore()
      expeditionStore.startExpedition(zoneId)
      this.navigateTo('expedition-map')
    },

    resetGame() {
      this.heroes = Array.from({ length: MAX_HEROES }, () => null)
      this.activeHeroIndex = 0
      this.isGameStarted = false
      this.currentLocation = 'pre-game'
      this.gold = 0
      this.experience = 0
    }
  }
})