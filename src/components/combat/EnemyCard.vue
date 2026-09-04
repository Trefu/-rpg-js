<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IEnemy } from '@/core/interfaces/ICharacter'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import EnemyStatusIcons from './EnemyStatusIcons.vue'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import { useMediaQuery } from '@/composables/useMediaQuery'

interface Props {
  enemy: IEnemy
  index: number
  isSelected: boolean
  isSelectingTarget: boolean
  isActionTargetRequired: boolean
  isAttacking: boolean
  showShortcut: boolean
  hitPopups?: { value: number, key: number, isCrit?: boolean }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', enemy: IEnemy): void
}>()

const hpPercent = computed(() => {
  if (props.enemy.maxHealth <= 0) return 0
  return Math.max(0, Math.min(100, (props.enemy.health / props.enemy.maxHealth) * 100))
})

const hpLabel = computed(() => `${props.enemy.health}/${props.enemy.maxHealth}`)

const sprite = computed(() => props.enemy.sprite ?? goblinSprite)

const statusEffects = computed<IStatusEffect[]>(() => {
  if (!props.enemy.statusEffects) return []
  return props.enemy.statusEffects.filter(e => e.turns === undefined || e.turns > 0)
})

const isDead = computed(() => !props.enemy.isAlive)

const isTargetSelectable = computed(() => {
  return props.isSelectingTarget && props.enemy.isAlive && props.isActionTargetRequired
})

const isTargetAll = computed(() => {
  return props.isSelectingTarget && !props.isActionTargetRequired && props.enemy.isAlive
})

const rootEl = ref<HTMLElement | null>(null)

defineExpose({ rootEl })

const isMobileLayout = useMediaQuery('(max-width: 720px)')

const showAlwaysShortcut = computed(() =>
  !isDead.value && props.index >= 0 && !isMobileLayout.value &&
  props.showShortcut && isTargetSelectable.value
)

function onClick() {
  emit('select', props.enemy)
}
</script>

<template>
  <div class="enemy-card" :class="{
    selected: isSelected,
    dead: isDead,
    attacking: isAttacking,
    'target-selectable': isTargetSelectable,
    'target-all': isTargetAll,
    'mobile-layout': isMobileLayout
  }" ref="rootEl" @click="onClick">
    <div v-if="!isDead" class="enemy-name-top">{{ enemy.name }}</div>
    <EnemyStatusIcons v-if="statusEffects.length > 0" :effects="statusEffects" />
    <img :src="sprite" :alt="enemy.name" class="enemy-sprite-img" loading="lazy" decoding="async" />
    <div class="enemy-health">
      <div class="health-bar">
        <div class="health-fill" :style="{ width: `${hpPercent}%` }"></div>
        <span class="health-text">{{ hpLabel }}</span>
      </div>
    </div>
    <div v-if="showAlwaysShortcut" class="enemy-shortcut-badge">
      <span class="key-cap">{{ index + 1 }}</span>
    </div>
    <div v-if="hitPopups && hitPopups.length > 0" class="enemy-hit-container">
      <TransitionGroup name="enemy-hit" tag="div" class="enemy-hit-layer">
        <div
          v-for="popup in hitPopups"
          :key="popup.key"
          class="enemy-hit-popup"
          :class="{ crit: popup.isCrit, heal: popup.variant === 'heal' }"
          :style="{ left: `${50 + (popup.stackIndex ?? 0) * 14}%` }"
        >
          {{ popup.variant === 'heal' ? '+' : '-' }}{{ popup.value }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.enemy-card {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 0.4rem;
}

.enemy-card:hover {
  transform: scale(1.05);
}

.enemy-card.selected {
  background-color: rgba(255, 152, 0, 0.3);
  border: 2px solid #ff9800;
}

.enemy-card.target-selectable {
  background-color: rgba(255, 152, 0, 0.2);
  border: 2px solid #ff9800;
  animation: pulse 1.5s infinite;
}

.enemy-card.dead {
  opacity: 0.3;
  filter: grayscale(100%);
  cursor: default;
}

.enemy-card.attacking {
  box-shadow: 0 0 24px 6px #ff3333, 0 0 0 4px #ff3333 inset;
  border: 2px solid #ff3333;
  animation: attack-glow 1s infinite alternate;
  z-index: 2;
}

.enemy-sprite-img {
  width: 240px;
  height: 240px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  display: block;
}

.enemy-mobile-name {
  display: none;
}

.enemy-card.mobile-layout .enemy-shortcut-badge {
  display: none !important;
}

.enemy-card.mobile-layout .enemy-shortcut-badge .key-cap {
  min-width: 28px;
  font-size: 0.95rem;
  padding: 0.2rem 0.5rem;
}

.enemy-name-top {
  display: block;
  font-family: 'Georgia', serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffe066;
  text-align: center;
  text-shadow: 0 1px 3px #000a, 0 0 6px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
  padding: 0.1rem 0.4rem;
  margin-bottom: 0.15rem;
}

.enemy-health {
  margin-top: 0.4rem;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 0.2rem;
}

.health-bar {
  position: relative;
  width: 100%;
  height: 16px;
  background-color: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: linear-gradient(180deg, #66bb6a 0%, #2e7d32 100%);
  transition: width 0.3s ease;
}

.health-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 2px #000, 0 0 4px #000a;
  letter-spacing: 0.02em;
  pointer-events: none;
  line-height: 1;
}

.hit-popups-container {
  display: none;
}

.enemy-hit-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 9;
}

.enemy-hit-popup {
  position: absolute;
  top: 50%;
  color: #ff3333;
  font-size: 1.55rem;
  font-weight: 900;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0, 0, 0, 0.85);
  pointer-events: none;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transform: translate(-50%, -50%);
  opacity: 1;
}

.enemy-hit-popup.crit {
  color: #ffe066;
  font-size: 2rem;
  text-shadow: 0 0 16px #ff8c00, 0 0 8px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0, 0, 0, 0.85);
}

.enemy-hit-popup.heal {
  color: #5cff8a;
  font-size: 1.55rem;
  font-weight: 900;
  text-shadow: 0 0 14px rgba(92, 255, 138, 0.85), 0 0 6px rgba(0, 0, 0, 0.85), 0 2px 6px rgba(0, 0, 0, 0.85);
}

.enemy-hit-enter-active {
  animation: enemy-hit-rise 0.95s ease-out forwards;
}

@keyframes enemy-hit-rise {
  0% {
    opacity: 0;
    transform: translate(-50%, -30%);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -55%);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -110%);
  }
}

.enemy-shortcut-badge {
  position: absolute;
  bottom: -38px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  font-weight: bold;
  padding: 0.3rem 0.5rem 0.3rem 0.35rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px #000a;
  z-index: 10;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  border: 1px solid rgba(255, 230, 0, 0.4);
}

.enemy-shortcut-badge .key-cap {
  background: linear-gradient(180deg, #fff7c2 0%, #ffe600 100%);
  color: #1a1a2e;
  font-weight: 900;
  font-size: 0.95rem;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  border: 2px solid #1a1a2e;
  box-shadow: 0 2px 0 #b29600, 0 3px 6px #000a;
  min-width: 28px;
  text-align: center;
  font-family: 'Courier New', monospace;
  line-height: 1;
  box-sizing: border-box;
}

.enemy-shortcut-badge .enemy-name-badge {
  display: none;
}

@keyframes pulse {
  0% { box-shadow: 0 0 15px rgba(255, 152, 0, 0.8); }
  50% { box-shadow: 0 0 25px rgba(255, 152, 0, 1); }
  100% { box-shadow: 0 0 15px rgba(255, 152, 0, 0.8); }
}

@keyframes attack-glow {
  0% { box-shadow: 0 0 8px 2px #ff3333, 0 0 0 4px #ff3333 inset; }
  100% { box-shadow: 0 0 32px 12px #ff3333, 0 0 0 4px #ff3333 inset; }
}
</style>
