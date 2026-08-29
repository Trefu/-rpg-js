<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import type { Hero } from '@/core/Hero'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import { getEffectDescription } from '@/core/interfaces/IStatusEffect'
import hamburgerIcon from '@/assets/icons/hamburger-menu.png'

interface Props {
  player: Hero | null
  hitPopups: { value: number, key: number }[]
}

const props = defineProps<Props>()

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

const playerName = computed(() => props.player?.name ?? 'Heroe')
const playerLevel = computed(() => props.player?.level ?? 1)

const activeEffects = computed<IStatusEffect[]>(() => {
  if (!props.player) return []
  return props.player.statusEffects.filter(e => (e.turns === undefined) || e.turns > 0)
})

const derivedStats = computed(() => {
  const p = props.player
  if (!p) return []
  return [
    { label: 'Ataque', value: p.attack() },
    { label: 'Defensa', value: p.defense() },
    { label: 'Velocidad', value: p.speed },
    { label: 'Fuerza', value: p.baseStats.fuerza },
    { label: 'Destreza', value: p.baseStats.destreza },
    { label: 'Inteligencia', value: p.baseStats.inteligencia },
    { label: 'Constitucion', value: p.baseStats.constitucion },
    { label: 'Sabiduria', value: p.baseStats.sabiduria },
    { label: 'Carisma', value: p.baseStats.carisma }
  ]
})

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function onDocClick(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as Node
  if (rootEl.value && !rootEl.value.contains(target)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div class="player-hud" ref="rootEl">
    <div class="hud-summary">
      <div class="hud-name-line">
        <span class="hud-name">{{ playerName }}</span>
        <span class="hud-level">Nv {{ playerLevel }}</span>
      </div>
      <div class="hud-resources">
        <div class="resource-line hp-line">
          <span class="resource-bar-track">
            <span class="resource-bar-fill bar-hp" :style="{ width: `${hpPercent}%` }"></span>
          </span>
          <span class="resource-value">{{ hpDisplay }}</span>
        </div>
        <div class="resource-line energy-line">
          <span class="resource-bar-track">
            <span class="resource-bar-fill bar-energy" :style="{ width: `${energyPercent}%` }"></span>
          </span>
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
      v-if="player"
      type="button"
      class="hud-menu-btn"
      :class="{ open: isOpen, 'has-effects': activeEffects.length > 0 }"
      :title="isOpen ? 'Cerrar menu' : 'Abrir menu'"
      @click="toggle"
    >
      <img :src="hamburgerIcon" alt="Menu" class="hud-menu-icon" />
      <span v-if="activeEffects.length > 0" class="hud-menu-badge">{{ activeEffects.length }}</span>
    </button>

    <transition name="hud-dropdown">
      <div v-if="isOpen && player" class="hud-dropdown" @click.stop>
        <header class="hud-dropdown-header">
          <span class="hud-dropdown-title">{{ playerName }}</span>
          <span class="hud-dropdown-subtitle">Nivel {{ playerLevel }}</span>
        </header>

        <section class="hud-dropdown-section">
          <h4 class="hud-dropdown-section-title">Stats</h4>
          <ul class="hud-dropdown-stats">
            <li v-for="stat in derivedStats" :key="stat.label">
              <span class="stat-key">{{ stat.label }}</span>
              <span class="stat-value">{{ stat.value }}</span>
            </li>
          </ul>
        </section>

        <section class="hud-dropdown-section">
          <h4 class="hud-dropdown-section-title">
            Efectos de estado
            <span class="section-badge">{{ activeEffects.length }}</span>
          </h4>
          <ul v-if="activeEffects.length > 0" class="hud-dropdown-effects">
            <li v-for="effect in activeEffects" :key="effect.type" class="hud-effect-row">
              <div class="hud-effect-info">
                <span class="hud-effect-name">{{ effect.name }}</span>
                <span class="hud-effect-desc">{{ getEffectDescription(effect, 'player') }}</span>
              </div>
              <div class="hud-effect-tags">
                <span v-if="effect.stacks && effect.stacks > 1" class="effect-tag stack">x{{ effect.stacks }}</span>
                <span v-if="typeof effect.charges === 'number'" class="effect-tag charges">{{ effect.charges }}/{{ effect.maxCharges ?? effect.charges }}c</span>
                <span v-else-if="effect.turns !== undefined" class="effect-tag turns">{{ effect.turns }}t</span>
              </div>
            </li>
          </ul>
          <p v-else class="hud-dropdown-empty">Sin efectos activos</p>
        </section>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.player-hud {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  min-height: 64px;
}

.hud-summary {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
  background: linear-gradient(160deg, rgba(35, 25, 0, 0.92) 0%, rgba(15, 10, 0, 0.96) 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  min-width: 180px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
}

.hud-name-line {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.hud-name {
  color: #ffe066;
  font-family: 'Georgia', serif;
  font-size: 0.95rem;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
}

.hud-level {
  font-size: 0.7rem;
  color: #b6f5b6;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hud-resources {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.resource-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.resource-bar-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 80px;
}

.resource-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
  display: block;
}

.resource-bar-fill.bar-hp {
  background: linear-gradient(90deg, #ff6b6b, #ff3a3a);
}

.resource-bar-fill.bar-energy {
  background: linear-gradient(90deg, #40c4ff, #82b1ff);
}

.resource-value {
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
  min-width: 56px;
  text-align: right;
}

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
  font-size: 1.2rem;
  font-weight: 800;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.85), 0 2px 8px rgba(0, 0, 0, 0.85);
  pointer-events: none;
  font-family: 'Courier New', monospace;
}

.hud-menu-btn {
  position: relative;
  width: 44px;
  height: 100%;
  min-height: 44px;
  border-radius: 10px;
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  background: linear-gradient(160deg, rgba(35, 25, 0, 0.92), rgba(15, 10, 0, 0.96));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
  padding: 0;
  align-self: stretch;
}

.hud-menu-btn:hover {
  background: linear-gradient(160deg, #ffe066 0%, #ff8a00 100%);
  border-color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 200, 60, 0.5);
}

.hud-menu-btn.open {
  background: linear-gradient(160deg, #ffe066 0%, #ff8a00 100%);
  border-color: #fff;
  box-shadow: 0 0 14px rgba(255, 230, 102, 0.7);
}

.hud-menu-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(20deg);
  pointer-events: none;
}

.hud-menu-btn.open .hud-menu-icon,
.hud-menu-btn:hover .hud-menu-icon {
  filter: brightness(0) invert(1);
}

.hud-menu-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #ff5252;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  border: 1.5px solid #1a1a2e;
  font-family: 'Courier New', monospace;
}

.hud-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  width: 260px;
  max-height: 60vh;
  overflow-y: auto;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  border-radius: 12px;
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 200, 60, 0.25);
  z-index: 100;
  padding: 0.75rem 0.9rem;
}

.hud-dropdown-header {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(255, 230, 102, 0.25);
  margin-bottom: 0.6rem;
}

.hud-dropdown-title {
  color: #ffe066;
  font-family: 'Georgia', serif;
  font-size: 1rem;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
}

.hud-dropdown-subtitle {
  color: #b6f5b6;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hud-dropdown-section {
  margin-bottom: 0.7rem;
}

.hud-dropdown-section:last-child {
  margin-bottom: 0;
}

.hud-dropdown-section-title {
  margin: 0 0 0.4rem;
  color: #4CAF50;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.section-badge {
  background: rgba(255, 230, 102, 0.2);
  color: #ffe066;
  font-size: 0.65rem;
  padding: 0.05rem 0.4rem;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-weight: 800;
}

.hud-dropdown-stats {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem 0.6rem;
}

.hud-dropdown-stats li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.3rem;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-key {
  color: #aaa;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
}

.stat-value {
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
}

.hud-dropdown-effects {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.hud-effect-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 152, 0, 0.12);
  padding: 0.4rem 0.55rem;
  border-radius: 6px;
  border-left: 3px solid #ff9800;
}

.hud-effect-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.hud-effect-name {
  color: #ffe066;
  font-weight: 700;
  font-size: 0.78rem;
  text-shadow: 0 1px 2px #000;
}

.hud-effect-desc {
  color: #ccc;
  font-size: 0.65rem;
  line-height: 1.2;
}

.hud-effect-tags {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: flex-end;
  flex-shrink: 0;
}

.effect-tag {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
}

.effect-tag.stack {
  background: rgba(255, 152, 0, 0.3);
  color: #ffe066;
}

.effect-tag.turns {
  background: rgba(64, 196, 255, 0.25);
  color: #82b1ff;
}

.effect-tag.charges {
  background: rgba(102, 187, 106, 0.25);
  color: #b6f5b6;
}

.hud-dropdown-empty {
  color: #888;
  font-style: italic;
  font-size: 0.75rem;
  margin: 0;
}

.hud-dropdown::-webkit-scrollbar {
  width: 6px;
}

.hud-dropdown::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.hud-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 230, 102, 0.5);
  border-radius: 3px;
}

.hud-dropdown-enter-active,
.hud-dropdown-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.hud-dropdown-enter-from,
.hud-dropdown-leave-to {
  opacity: 0;
  transform: translateY(6px);
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