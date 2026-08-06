<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Player } from '@/core/Player'
import PlayerStatsPanel from './PlayerStatsPanel.vue'

const props = defineProps<{
  player: Player | null
}>()

const showStats = ref(false)

const hpPercent = computed(() => {
  if (!props.player || props.player.maxHealth <= 0) return 0
  return Math.max(0, Math.min(100, (props.player.health / props.player.maxHealth) * 100))
})

const energyPercent = computed(() => {
  if (!props.player || !props.player.maxEnergy) return 0
  return Math.max(0, Math.min(100, (props.player.energy / props.player.maxEnergy) * 100))
})

const hpDisplay = computed(() => {
  if (!props.player) return '0/0'
  return `${props.player.health}/${props.player.maxHealth}`
})

const energyDisplay = computed(() => {
  if (!props.player) return '0/0'
  return `${props.player.energy ?? 0}/${props.player.maxEnergy ?? 0}`
})

const playerName = computed(() => props.player?.name ?? 'Héroe')
const playerLevel = computed(() => props.player?.level ?? 1)

const hasEffects = computed(() => (props.player?.statusEffects?.length ?? 0) > 0)

const toggleStats = () => { showStats.value = !showStats.value }
</script>

<template>
  <div class="player-hud">
    <div class="hud-orbit" :class="{ 'is-open': showStats }">
      <svg class="hud-ring" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="hudRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffe066" />
            <stop offset="100%" stop-color="#ff8a00" />
          </linearGradient>
          <linearGradient id="hudRingEnergy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#40c4ff" />
            <stop offset="100%" stop-color="#82b1ff" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
        <circle cx="100" cy="100" r="92" fill="none" stroke="url(#hudRingGrad)" stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="`${(hpPercent / 100) * 578} 578`"
                transform="rotate(-90 100 100)"
                class="hud-arc hud-arc-hp" />

        <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="url(#hudRingEnergy)" stroke-width="2.5"
                stroke-linecap="round"
                :stroke-dasharray="`${(energyPercent / 100) * 491} 491`"
                transform="rotate(-90 100 100)"
                class="hud-arc hud-arc-energy" />
      </svg>

      <div class="hud-core">
        <div class="hud-name">{{ playerName }}</div>
        <div class="hud-level">Nivel {{ playerLevel }}</div>
        <div class="hud-resources">
          <div class="resource-line hp-line">
            <span class="resource-icon">❤</span>
            <span class="resource-value">{{ hpDisplay }}</span>
          </div>
          <div class="resource-line energy-line">
            <span class="resource-icon">⚡</span>
            <span class="resource-value">{{ energyDisplay }}</span>
          </div>
        </div>
        <div v-if="hasEffects" class="hud-effects-dot" title="Efectos de estado activos" />
      </div>
    </div>

    <button
      class="hud-toggle"
      :class="{ active: showStats }"
      :aria-pressed="showStats"
      :title="showStats ? 'Ocultar stats' : 'Ver stats'"
      @click="toggleStats"
    >
      <span class="hud-toggle-glyph">{{ showStats ? '✕' : '☰' }}</span>
      <span class="hud-toggle-label">Stats</span>
    </button>

    <transition name="hud-panel">
      <PlayerStatsPanel
        v-if="showStats"
        :player="player"
        class="hud-stats-panel"
        @close="showStats = false"
      >
        <template #extra>
          <slot name="extra" />
        </template>
      </PlayerStatsPanel>
    </transition>
  </div>
</template>

<style scoped>
.player-hud {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hud-orbit {
  position: relative;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  transition: transform 0.3s ease;
}
.hud-orbit.is-open { transform: scale(0.94); }

.hud-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.6));
}

.hud-arc {
  transition: stroke-dasharray 0.4s ease;
}

.hud-arc-hp {
  filter: drop-shadow(0 0 6px rgba(255, 138, 0, 0.55));
}
.hud-arc-energy {
  filter: drop-shadow(0 0 6px rgba(64, 196, 255, 0.45));
}

.hud-core {
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 25%, rgba(255, 230, 102, 0.18) 0%, rgba(0, 0, 0, 0) 55%),
    linear-gradient(160deg, rgba(35, 25, 0, 0.92) 0%, rgba(15, 10, 0, 0.96) 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.65);
  box-shadow:
    0 0 0 2px rgba(0, 0, 0, 0.4) inset,
    0 0 18px rgba(255, 200, 60, 0.35),
    0 4px 14px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  text-align: center;
  padding: 0.25rem;
}

.hud-name {
  font-family: 'Georgia', serif;
  font-size: 0.85rem;
  color: #ffe066;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-shadow: 0 1px 2px #000;
}

.hud-level {
  font-size: 0.62rem;
  color: #b6f5b6;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hud-resources {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-top: 0.2rem;
}

.resource-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px #000;
}

.resource-line.hp-line .resource-icon { color: #ff8a80; }
.resource-line.energy-line .resource-icon { color: #82b1ff; }

.hud-effects-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffe066;
  box-shadow: 0 0 8px #ffe066;
  animation: hud-dot-pulse 1.4s ease-in-out infinite;
}

@keyframes hud-dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
}

.hud-toggle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.05rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 230, 102, 0.75);
  background: linear-gradient(160deg, rgba(35, 25, 0, 0.9), rgba(15, 10, 0, 0.95));
  color: #ffe066;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: transform 0.15s, border-color 0.15s, background 0.15s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
  margin-left: 0.25rem;
}

.hud-toggle:hover {
  transform: translateY(-1px);
  border-color: #ffe066;
}
.hud-toggle.active {
  background: linear-gradient(160deg, #ffe066 0%, #ff8a00 100%);
  color: #1a1a2e;
  border-color: #fff;
}

.hud-toggle-glyph {
  font-size: 1.1rem;
  line-height: 1;
}
.hud-toggle-label {
  font-size: 0.55rem;
  line-height: 1;
}

.hud-stats-panel {
  position: absolute;
  left: calc(100% + 0.75rem);
  top: 50%;
  transform: translateY(-50%);
  width: 260px;
  z-index: 20;
}

.hud-panel-enter-active,
.hud-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.22s cubic-bezier(.34, 1.56, .64, 1);
}
.hud-panel-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(-10px) scale(0.95);
}
.hud-panel-enter-to {
  opacity: 1;
  transform: translateY(-50%) translateX(0) scale(1);
}
.hud-panel-leave-from {
  opacity: 1;
  transform: translateY(-50%) translateX(0) scale(1);
}
.hud-panel-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-10px) scale(0.95);
}
</style>