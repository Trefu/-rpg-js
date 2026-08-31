<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useGameStore } from '@/stores/game'
import { AudioManager } from '@/core/AudioManager'
import AudioControls from './AudioControls.vue'
import cogIcon from '@/assets/icons/cog.png'

const emit = defineEmits<{
  (e: 'resetGame'): void
}>()

const gameStore = useGameStore()

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const isDev = import.meta.env.DEV

const audioManager = AudioManager.getInstance()
const isMuted = ref(false)

onMounted(() => {
  isMuted.value = audioManager.isAudioMuted()
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const goToTraining = () => {
  gameStore.navigateTo('training')
  menuOpen.value = false
}

const resetGame = () => {
  if (confirm('Estas seguro de que quieres reiniciar el juego? Se perdera todo el progreso.')) {
    gameStore.resetGame()
    emit('resetGame')
  }
  menuOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (!menuOpen.value) return
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    menuOpen.value = false
  }
}
</script>

<template>
  <div class="game-ui">
    <div class="settings" ref="menuRef">
      <button class="gear-btn" @click="toggleMenu" :class="{ open: menuOpen }" title="Ajustes">
        <img :src="cogIcon" alt="Ajustes" class="gear-icon" />
      </button>

      <div v-if="menuOpen" class="settings-menu">
        <div class="menu-section">
          <AudioControls />
        </div>

        <button v-if="isDev" class="menu-item" @click="goToTraining">
          Sala de Pruebas
        </button>

        <button class="menu-item" @click="resetGame">
          Reiniciar Juego
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-ui {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  padding: 0.75rem 1rem;
  background: transparent;
}

@media (max-width: 720px) {
  .game-ui {
    padding: 0.4rem 0.5rem;
    /* Offset below the turn-order bar (≈46px) so the gear no longer overlaps it */
    top: 144px;
  }
  .gear-btn {
    width: 32px;
    height: 32px;
  }
  .gear-icon {
    width: 18px;
    height: 18px;
  }
}

.settings {
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.gear-btn {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  backdrop-filter: blur(4px);
}

.gear-btn:hover {
  background: rgba(0, 0, 0, 0.55);
  transform: rotate(45deg);
}

.gear-btn.open {
  background: rgba(76, 175, 80, 0.25);
  border-color: rgba(76, 175, 80, 0.6);
}

.gear-icon {
  width: 22px;
  height: 22px;
  filter: brightness(0) invert(1);
}

.settings-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  background-color: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 0.4rem;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}

.menu-section {
  padding: 0.25rem 0.5rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 0.25rem;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 400;
  text-align: left;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: white;
}

.menu-icon {
  width: 1.05em;
  height: 1.05em;
  filter: brightness(0) invert(1);
}
</style>
