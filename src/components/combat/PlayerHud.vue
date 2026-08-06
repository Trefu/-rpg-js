<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Player } from '@/core/Player'
import PlayerStatsPanel from './PlayerStatsPanel.vue'

export interface HudOrbitItem {
  id: string
  label: string
  glyph: string
  badge?: number | string
  active: boolean
  onClick: () => void
}

const props = defineProps<{
  player: Player | null
  orbitItems: HudOrbitItem[]
  hitPopups: { value: number, key: number }[]
}>()

const expandedItemId = ref<string | null>(null)

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

function toggleItem(id: string) {
  expandedItemId.value = expandedItemId.value === id ? null : id
}

function closePanel() {
  expandedItemId.value = null
}
</script>

<template>
  <div class="player-hud">
    <div class="hud-orbit" :class="{ 'is-open': expandedItemId !== null }">
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
        <transition-group name="hud-hit" tag="div" class="hud-hit-container">
          <div v-for="popup in hitPopups" :key="popup.key" class="hud-hit-popup">
            -{{ popup.value }}
          </div>
        </transition-group>
      </div>

      <button
        v-for="(item, idx) in orbitItems"
        :key="item.id"
        type="button"
        class="hud-orbit-btn"
        :class="[item.id, { active: expandedItemId === item.id, inactive: !item.active }]"
        :style="{ '--idx': idx }"
        :title="item.label"
        :disabled="!item.active"
        @click="item.active && toggleItem(item.id)"
      >
        <span class="hud-orbit-glyph">{{ item.glyph }}</span>
        <span v-if="item.badge !== undefined && item.badge !== null && item.badge !== ''" class="hud-orbit-badge">
          {{ item.badge }}
        </span>
      </button>
    </div>

    <transition name="hud-panel">
      <div v-if="expandedItemId === 'stats'" class="hud-panel-wrap">
        <PlayerStatsPanel :player="player" @close="closePanel" />
      </div>
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
  pointer-events: none;
}

.hud-arc { transition: stroke-dasharray 0.4s ease; }
.hud-arc-hp { filter: drop-shadow(0 0 6px rgba(255, 138, 0, 0.55)); }
.hud-arc-energy { filter: drop-shadow(0 0 6px rgba(64, 196, 255, 0.45)); }

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
  pointer-events: none;
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

.hud-hit-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hud-hit-popup {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #ff3333;
  font-size: 1.3rem;
  font-weight: 800;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.85), 0 2px 8px rgba(0, 0, 0, 0.85);
  pointer-events: none;
  font-family: 'Courier New', monospace;
}

.hud-orbit-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 38px;
  height: 38px;
  margin: -19px 0 0 -19px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 230, 102, 0.6);
  background: linear-gradient(160deg, rgba(35, 25, 0, 0.92), rgba(15, 10, 0, 0.96));
  color: #ffe066;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, border-color 0.15s, background 0.15s, box-shadow 0.18s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
  z-index: 2;
  padding: 0;
  pointer-events: auto;
  transform: rotate(calc(var(--idx) * -60deg)) translate(82px) rotate(calc(var(--idx) * 60deg));
}

.hud-orbit-btn:hover:not(:disabled) {
  transform: rotate(calc(var(--idx) * -60deg)) translate(86px) rotate(calc(var(--idx) * 60deg)) scale(1.06);
  border-color: #ffe066;
  box-shadow: 0 0 12px rgba(255, 230, 102, 0.45);
}

.hud-orbit-btn.active {
  background: linear-gradient(160deg, #ffe066 0%, #ff8a00 100%);
  color: #1a1a2e;
  border-color: #fff;
  box-shadow: 0 0 14px rgba(255, 230, 102, 0.7);
}

.hud-orbit-btn.inactive {
  opacity: 0.4;
  cursor: not-allowed;
}

.hud-orbit-glyph {
  font-size: 1.05rem;
  line-height: 1;
  display: block;
}

.hud-orbit-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #ff5252;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  border: 1.5px solid #1a1a2e;
}

.hud-panel-wrap {
  position: absolute;
  left: calc(100% + 0.75rem);
  top: 50%;
  transform: translateY(-50%);
  width: 260px;
  z-index: 20;
}

@media (max-width: 720px) {
  .hud-orbit { width: 110px; height: 110px; }
  .hud-orbit-btn {
    width: 32px;
    height: 32px;
    margin: -16px 0 0 -16px;
    transform: rotate(calc(var(--idx) * -60deg)) translate(70px) rotate(calc(var(--idx) * 60deg));
  }
  .hud-orbit-btn:hover:not(:disabled) {
    transform: rotate(calc(var(--idx) * -60deg)) translate(73px) rotate(calc(var(--idx) * 60deg)) scale(1.06);
  }
  .hud-panel-wrap {
    left: 50%;
    top: calc(100% + 0.5rem);
    transform: translateX(-50%);
    width: min(280px, calc(100vw - 32px));
  }
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

@media (max-width: 720px) {
  .hud-panel-enter-from { transform: translateX(-50%) translateY(-10px) scale(0.95); }
  .hud-panel-enter-to   { transform: translateX(-50%) translateY(0) scale(1); }
  .hud-panel-leave-from { transform: translateX(-50%) translateY(0) scale(1); }
  .hud-panel-leave-to   { transform: translateX(-50%) translateY(-10px) scale(0.95); }
}

.hud-hit-enter-active {
  transition: transform 0.5s ease-out, opacity 0.4s ease-out;
}
.hud-hit-leave-active {
  transition: opacity 0.3s ease-in;
}
.hud-hit-enter-from {
  opacity: 0;
  transform: translate(-50%, -30%) scale(0.7);
}
.hud-hit-enter-to {
  opacity: 1;
  transform: translate(-50%, -90%) scale(1.15);
}
.hud-hit-leave-from {
  opacity: 1;
  transform: translate(-50%, -90%) scale(1);
}
.hud-hit-leave-to {
  opacity: 0;
  transform: translate(-50%, -160%) scale(0.85);
}
</style>