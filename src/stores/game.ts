import { defineStore } from 'pinia'
import type { Hero } from '../core/Hero'

export type GameLocation = 'expedition-map' | 'combat' | 'shop' | 'city' | 'training'

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
    currentLocation: 'city',
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
      if (index < 0 || index >= MAX_HEROES) return
      if (this.heroes[index] === null) return
      this.activeHeroIndex = index
    },

    navigateTo(location: GameLocation) {
      this.currentLocation = location
    },

    resetGame() {
      this.heroes = Array.from({ length: MAX_HEROES }, () => null)
      this.activeHeroIndex = 0
      this.isGameStarted = false
      this.currentLocation = 'city'
      this.gold = 0
      this.experience = 0
    }
  }
})