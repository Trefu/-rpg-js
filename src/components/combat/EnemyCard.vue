<script setup lang="ts">
import { computed } from 'vue'
import type { IEnemy } from '@/core/interfaces/ICharacter'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import EnemyStatusIcons from './EnemyStatusIcons.vue'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'

interface Props {
  enemy: IEnemy
  index: number
  isSelected: boolean
  isSelectingTarget: boolean
  isActionTargetRequired: boolean
  isAttacking: boolean
  hitPopups: Array<{ id: string, value: number, key: number }>
  showShortcut: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', enemy: IEnemy): void
}>()

const hpPercent = computed(() => {
  if (props.enemy.maxHealth <= 0) return 0
  return Math.max(0, (props.enemy.health / props.enemy.maxHealth) * 100)
})

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

const myHitPopups = computed(() => props.hitPopups.filter(p => p.id === props.enemy.id))

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
    'target-all': isTargetAll
  }" @click="onClick">
    <EnemyStatusIcons v-if="statusEffects.length > 0" :effects="statusEffects" />
    <img :src="sprite" :alt="enemy.name" class="enemy-sprite-img" />
    <div class="enemy-health">
      <div class="health-bar">
        <div class="health-fill" :style="{ width: `${hpPercent}%` }"></div>
      </div>
    </div>
    <transition-group name="hit-popup" tag="div" class="hit-popups-container">
      <div v-for="popup in myHitPopups" :key="popup.key" class="hit-popup">
        -{{ popup.value }}
      </div>
    </transition-group>
    <div v-if="showShortcut && isTargetSelectable && !isDead && index >= 0" class="enemy-shortcut-badge">
      <span class="key-cap">{{ index + 1 }}</span>
      <span class="enemy-name-badge">{{ enemy.name }}</span>
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

.enemy-health {
  margin-top: 0.4rem;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 0.2rem;
}

.health-bar {
  width: 100%;
  height: 10px;
  background-color: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.hit-popups-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hit-popup {
  position: absolute;
  left: 50%;
  top: -10px;
  transform: translateX(-50%);
  color: #ff3333;
  font-size: 1.1em;
  font-weight: bold;
  text-shadow: 0 2px 8px #000a;
  pointer-events: none;
  opacity: 0.95;
  z-index: 20;
  animation: hit-pop 0.9s cubic-bezier(.68, -0.55, .27, 1.55);
}

.enemy-shortcut-badge {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  font-weight: bold;
  padding: 0.2rem 0.5rem 0.2rem 0.2rem;
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
  font-size: 0.9rem;
  padding: 0.05rem 0.45rem;
  border-radius: 5px;
  border: 2px solid #1a1a2e;
  border-bottom-width: 3px;
  box-shadow: 0 2px 0 #b29600, 0 2px 4px #000a;
  min-width: 22px;
  text-align: center;
  font-family: 'Courier New', monospace;
  line-height: 1.1;
}

.enemy-shortcut-badge .enemy-name-badge {
  color: #fff;
  font-size: 0.8rem;
  text-shadow: 0 1px 3px #000a;
  font-weight: 600;
  padding-right: 0.2rem;
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

@keyframes hit-pop {
  0% { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.7); }
  20% { opacity: 1; transform: translateX(-50%) translateY(-12px) scale(1.1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-36px) scale(0.95); }
}
</style>
