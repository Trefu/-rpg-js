<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import type { Hero } from '@/core/Hero'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import { getEffectDescription } from '@/core/interfaces/IStatusEffect'
import { DOT_STATUS_TYPES } from '@/core/StatusEffects'
import HeroStatChips from './HeroStatChips.vue'
import HeroDotIcons from './HeroDotIcons.vue'
import hamburgerIcon from '@/assets/icons/hamburger-menu.png'

interface Props {
  hero: Hero | null
  index: number
  isActive: boolean
  isTargetSelectable: boolean
  /** Cuando true, marca visualmente al heroe como objetivo de un ataque enemigo en curso. */
  isBeingAttacked?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', hero: Hero): void
}>()

const hpPercent = computed(() => {
  if (!props.hero || props.hero.maxHealth <= 0) return 0
  return Math.max(0, Math.min(100, (props.hero.health / props.hero.maxHealth) * 100))
})

const energyPercent = computed(() => {
  if (!props.hero || !props.hero.maxEnergy) return 0
  return Math.max(0, Math.min(100, (props.hero.energy / props.hero.maxEnergy) * 100))
})

const hpDisplay = computed(() => {
  if (!props.hero) return ''
  return `${props.hero.health}/${props.hero.maxHealth}`
})

const energyDisplay = computed(() => {
  if (!props.hero) return ''
  return `${props.hero.energy}/${props.hero.maxEnergy}`
})

const activeEffects = computed<IStatusEffect[]>(() => {
  if (!props.hero) return []
  return props.hero.statusEffects.filter(e => (e.turns === undefined) || e.turns > 0)
})

const buffDebuffEffects = computed<IStatusEffect[]>(() => {
  return activeEffects.value.filter(e => !DOT_STATUS_TYPES.has(e.type))
})

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function toggleMenu(e: MouseEvent) {
  e.stopPropagation()
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function onDocClick(e: MouseEvent) {
  const target = e.target as Node
  if (isOpen.value && rootEl.value && !rootEl.value.contains(target)) {
    closeMenu()
  }
}

function onCardClick() {
  if (props.isTargetSelectable && props.hero) {
    emit('select', props.hero)
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
  <div
    class="hero-card"
    :class="{
      empty: !hero,
      active: isActive,
      'target-selectable': isTargetSelectable,
      'menu-open': isOpen,
      'being-attacked': !!hero && !!isBeingAttacked
    }"
    ref="rootEl"
    @click="onCardClick"
  >
    <template v-if="hero">
      <div class="hero-card-badges">
        <div v-if="isActive" class="active-badge">ACTIVO</div>
        <div v-if="isBeingAttacked" class="being-attacked-badge">Defendiendo</div>
      </div>
      <div class="hero-portrait">
        <img :src="hero.sprite" :alt="hero.name" class="hero-sprite" />
      </div>
      <div class="hero-info">
        <div class="hero-name">{{ hero.name }}</div>
        <div class="hero-level">Nivel {{ hero.level }}</div>
        <div class="hero-bars">
          <div class="bar-line">
            <div class="bar-track">
              <div class="bar-fill bar-hp" :style="{ width: `${hpPercent}%` }"></div>
            </div>
            <span class="bar-value">{{ hpDisplay }}</span>
          </div>
          <div class="bar-line">
            <div class="bar-track">
              <div class="bar-fill bar-energy" :style="{ width: `${energyPercent}%` }"></div>
            </div>
            <span class="bar-value">{{ energyDisplay }}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="hero-menu-btn"
        :class="{ open: isOpen, 'has-effects': buffDebuffEffects.length > 0 }"
        @click="toggleMenu"
      >
        <img :src="hamburgerIcon" alt="Menu" class="hero-menu-icon" />
        <span v-if="buffDebuffEffects.length > 0" class="hero-menu-badge">{{ buffDebuffEffects.length }}</span>
      </button>

      <HeroDotIcons :effects="activeEffects" />

      <div v-if="isTargetSelectable" class="hero-shortcut-badge">
        <span class="key-cap">{{ index + 1 }}</span>
      </div>

      <transition name="hero-dropdown">
        <div v-if="isOpen" class="hero-dropdown" @click.stop>
          <header class="hero-dropdown-header">
            <span class="hero-dropdown-title">{{ hero.name }}</span>
            <span class="hero-dropdown-subtitle">Nivel {{ hero.level }}</span>
          </header>

          <section class="hero-dropdown-section">
            <h4 class="hero-dropdown-section-title">Stats</h4>
            <div class="hero-dropdown-stats">
              <HeroStatChips :hero="hero" show-all only="stats" tooltip-position="above" />
            </div>
          </section>

          <section class="hero-dropdown-section">
            <h4 class="hero-dropdown-section-title">Defensa</h4>
            <div class="hero-dropdown-stats">
              <HeroStatChips :hero="hero" show-all only="defense" tooltip-position="above" />
            </div>
          </section>

          <section class="hero-dropdown-section">
            <h4 class="hero-dropdown-section-title">
              Buffs / Debuffs
              <span class="section-badge">{{ buffDebuffEffects.length }}</span>
            </h4>
            <ul v-if="buffDebuffEffects.length > 0" class="hero-dropdown-effects">
              <li v-for="effect in buffDebuffEffects" :key="effect.type" class="hero-effect-row">
                <div class="hero-effect-info">
                  <span class="hero-effect-name">{{ effect.name }}</span> 
                  <span class="hero-effect-desc">{{ getEffectDescription(effect, 'player') }}</span>
                </div>
                <div class="hero-effect-tags">
                  <span v-if="effect.stacks && effect.stacks > 1" class="effect-tag stack">x{{ effect.stacks }}</span>
                  <span v-if="typeof effect.charges === 'number'" class="effect-tag charges">{{ effect.charges }}/{{ effect.maxCharges ?? effect.charges }}c</span>
                  <span v-else-if="effect.turns !== undefined" class="effect-tag turns">{{ effect.turns }}t</span>
                </div>
              </li>
            </ul>
            <p v-else class="hero-dropdown-empty">Sin buffs ni debuffs activos</p>
          </section>
        </div>
      </transition>
    </template>
    <template v-else>
      <div class="empty-slot"></div>
    </template>
  </div>
</template>

<style scoped>
.hero-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: linear-gradient(135deg, rgba(40, 30, 60, 0.85) 0%, rgba(25, 15, 45, 0.95) 100%);
  border: 2px solid rgba(180, 160, 220, 0.25);
  border-radius: 14px;
  padding: 0.75rem 1rem;
  padding-top: 2rem;
  min-height: 132px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.hero-card.active {
  border-color: #ffe066;
  box-shadow: 0 0 14px rgba(255, 230, 102, 0.55), 0 2px 8px rgba(0, 0, 0, 0.45);
}

.hero-card.being-attacked {
  border-color: #ff3344;
  box-shadow: 0 0 18px rgba(255, 51, 68, 0.85), 0 2px 8px rgba(0, 0, 0, 0.45);
  animation: hero-being-attacked-pulse 0.8s ease-in-out infinite;
}

@keyframes hero-being-attacked-pulse {
  0%, 100% {
    box-shadow: 0 0 12px rgba(255, 51, 68, 0.55), 0 2px 8px rgba(0, 0, 0, 0.45);
    transform: translateX(0);
  }
  50% {
    box-shadow: 0 0 24px rgba(255, 51, 68, 0.95), 0 2px 8px rgba(0, 0, 0, 0.45);
    transform: translateX(-3px);
  }
}

.hero-card-badges {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  z-index: 5;
  pointer-events: none;
}

.being-attacked-badge {
  background: #ff3344;
  color: #fff;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  box-shadow: 0 0 6px rgba(255, 51, 68, 0.8);
}

.hero-card.empty {
  background: rgba(20, 15, 30, 0.4);
  border-style: dashed;
  border-color: rgba(180, 160, 220, 0.18);
  opacity: 0.7;
}

.hero-card.target-selectable {
  cursor: pointer;
  background-color: rgba(120, 200, 255, 0.18);
  border-color: #82b1ff;
  border-style: solid;
  animation: hero-pulse 1.5s infinite;
}

.hero-card.target-selectable:hover {
  transform: scale(1.02);
  box-shadow: 0 0 18px rgba(130, 177, 255, 0.7);
}

.hero-card.menu-open {
  z-index: 50;
}

.hero-shortcut-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 10;
}

.hero-shortcut-badge .key-cap {
  background: linear-gradient(180deg, #cce8ff 0%, #82b1ff 100%);
  color: #1a1a2e;
  font-weight: 900;
  font-size: 1.05rem;
  padding: 0.15rem 0.55rem;
  border-radius: 6px;
  border: 2px solid #1a1a2e;
  border-bottom-width: 3px;
  box-shadow: 0 2px 0 #4a76b8, 0 2px 4px #000a;
  min-width: 28px;
  text-align: center;
  font-family: 'Courier New', monospace;
  line-height: 1.1;
}

@keyframes hero-pulse {
  0% { box-shadow: 0 0 12px rgba(130, 177, 255, 0.5); }
  50% { box-shadow: 0 0 22px rgba(130, 177, 255, 0.9); }
  100% { box-shadow: 0 0 12px rgba(130, 177, 255, 0.5); }
}

.hero-portrait {
  position: relative;
  width: 92px;
  height: 92px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-sprite {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.active-badge {
  background: #ffe066;
  color: #1a1a2e;
  font-size: 0.66rem;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.hero-name {
  color: #fff;
  font-weight: 700;
  font-size: 1.18rem;
  text-shadow: 0 1px 2px #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-level {
  color: #b6f5b6;
  font-size: 0.86rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero-bars {
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
}

.bar-line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.bar-track {
  flex: 1;
  height: 11px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 60px;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-fill.bar-hp {
  background: linear-gradient(90deg, #ff6b6b, #ff3a3a);
}

.bar-fill.bar-energy {
  background: linear-gradient(90deg, #40c4ff, #82b1ff);
}

.bar-value {
  font-family: 'Courier New', monospace;
  font-size: 0.84rem;
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
  min-width: 60px;
  text-align: right;
}

.stat-row-reduction {
  background: rgba(255, 138, 58, 0.12);
  border-left: 2px solid rgba(255, 138, 58, 0.7);
}

.hero-menu-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 7px;
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  background: linear-gradient(160deg, rgba(35, 25, 0, 0.92), rgba(15, 10, 0, 0.96));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
  padding: 0;
  z-index: 6;
}

.hero-menu-btn:hover {
  background: linear-gradient(160deg, #ffe066 0%, #ff8a00 100%);
  border-color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 200, 60, 0.5);
}

.hero-menu-btn.open {
  background: linear-gradient(160deg, #ffe066 0%, #ff8a00 100%);
  border-color: #fff;
  box-shadow: 0 0 14px rgba(255, 230, 102, 0.7);
}

.hero-menu-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(20deg);
  pointer-events: none;
}

.hero-menu-btn.open .hero-menu-icon,
.hero-menu-btn:hover .hero-menu-icon {
  filter: brightness(0) invert(1);
}

.hero-menu-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #ff5252;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  border: 1.5px solid #1a1a2e;
  font-family: 'Courier New', monospace;
}

.hero-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: min(480px, calc(100vw - 4rem));
  max-height: 70vh;
  overflow-y: auto;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  border-radius: 14px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 200, 60, 0.25);
  z-index: 200;
  padding: 1.15rem 1.35rem;
}

.hero-dropdown-header {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 230, 102, 0.25);
  margin-bottom: 0.55rem;
}

.hero-dropdown-title {
  color: #ffe066;
  font-family: 'Georgia', serif;
  font-size: 1.28rem;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
}

.hero-dropdown-subtitle {
  color: #b6f5b6;
  font-size: 0.92rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero-dropdown-section {
  margin-bottom: 0.85rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px dashed rgba(255, 230, 102, 0.18);
}

.hero-dropdown-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.hero-dropdown-section-title {
  margin: 0 0 0.45rem;
  color: #4CAF50;
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.section-badge {
  background: rgba(255, 230, 102, 0.2);
  color: #ffe066;
  font-size: 0.72rem;
  padding: 0.05rem 0.45rem;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-weight: 800;
}

.hero-dropdown-stats {
  padding: 0;
  margin: 0;
}

.hero-dropdown-effects {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.hero-effect-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 152, 0, 0.12);
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border-left: 3px solid #ff9800;
}

.hero-effect-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.hero-effect-name {
  color: #ffe066;
  font-weight: 700;
  font-size: 0.96rem;
  text-shadow: 0 1px 2px #000;
}

.hero-effect-desc {
  color: #ccc;
  font-size: 0.82rem;
  line-height: 1.2;
}

.hero-effect-tags {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: flex-end;
  flex-shrink: 0;
}

.effect-tag {
  font-family: 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.05rem 0.3rem;
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

.hero-dropdown-empty {
  color: #b6b6b6;
  font-style: italic;
  font-size: 0.96rem;
  margin: 0;
  padding: 0.4rem 0.2rem;
  text-align: center;
  letter-spacing: 0.02em;
}

.hero-dropdown::-webkit-scrollbar {
  width: 6px;
}

.hero-dropdown::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.hero-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 230, 102, 0.5);
  border-radius: 3px;
}

.hero-dropdown-enter-active,
.hero-dropdown-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.hero-dropdown-enter-from,
.hero-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.empty-slot {
  width: 100%;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>