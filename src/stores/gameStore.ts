import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameState } from '@/types/game'

export const useGameStore = defineStore('game', () => {
  const state = ref<GameState>({

    isPlaying: false
  })

  const isGameActive = computed(() => state.value.isPlaying)

  function startGame() {
    state.value.isPlaying = true
  }

  function endGame() {
    state.value.isPlaying = false
  }


  return {
    state,
    isGameActive,
    startGame,
    endGame,
  }
}) 