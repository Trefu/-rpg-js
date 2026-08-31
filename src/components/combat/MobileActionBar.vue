<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IAbility } from '@/core/interfaces/IAbility'
import { getAbilityIcon } from '@/core/abilities/abilityIcons'
import backpackIcon from '@/assets/icons/backpack.png'
import boltIcon from '@/assets/icons/bolt-shield.png'
import hourglassIcon from '@/assets/icons/hourglass.png'

type Slot =
  | { kind: 'attack' }
  | { kind: 'ability', ability: IAbility, index: number }
  | { kind: 'object' }
  | { kind: 'empty' }

const props = defineProps<{
  abilities: IAbility[]
  abilityCooldowns: Record<string, number>
  playerEnergy: number
  isPlayerInputLocked: boolean
  selectedAbility: IAbility | null
  isSelectingTarget: boolean
  usedItemThisTurn: boolean
}>()

const emit = defineEmits<{
  (e: 'attack'): void
  (e: 'selectAbility', ability: IAbility, index: number): void
  (e: 'object'): void
  (e: 'cancel'): void
}>()

const attackIcon = computed(() => getAbilityIcon('attack'))

const slots = computed<Slot[]>(() => {
  const list: Slot[] = []
  list.push({ kind: 'attack' })
  const filtered = props.abilities.filter(a => a.type !== 'attack')
  for (let i = 0; i < 4; i++) {
    const ab = filtered[i]
    if (ab) {
      const originalIndex = props.abilities.indexOf(ab)
      list.push({ kind: 'ability', ability: ab, index: originalIndex })
    } else list.push({ kind: 'empty' })
  }
  list.push({ kind: 'object' })
  return list
})

function isSlotDisabled(slot: Slot): boolean {
  if (props.isPlayerInputLocked) return true
  if (slot.kind === 'empty') return true
  if (slot.kind === 'object' && props.usedItemThisTurn) return true
  return false
}

function handleSlotClick(slot: Slot, event: MouseEvent | TouchEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (isSlotDisabled(slot)) return
  if (slot.kind === 'attack') {
    emit('attack')
  } else if (slot.kind === 'ability') {
    onAbilityClick(slot.ability, slot.index)
  } else if (slot.kind === 'object') {
    emit('object')
  }
}

function iconFor(type: string) {
  return getAbilityIcon(type)
}

function cooldownOf(type: string) {
  return props.abilityCooldowns[type] ?? 0
}

function isOnCooldown(ability: IAbility) {
  return cooldownOf(ability.type) > 0
}

function isAffordable(ability: IAbility) {
  if (!ability.energyCost) return true
  return props.playerEnergy >= ability.energyCost
}

function abilityState(ability: IAbility, index: number) {
  const cd = cooldownOf(ability.type)
  if (cd > 0) return 'cooldown'
  if (!isAffordable(ability)) return 'no-energy'
  return 'ready'
}

const infoAbility = ref<IAbility | null>(null)
const infoAbilityIndex = ref(-1)

function showAbilityInfo(ability: IAbility, index: number, event: Event) {
  event.stopPropagation()
  infoAbility.value = ability
  infoAbilityIndex.value = index
}

function closeInfo() {
  infoAbility.value = null
  infoAbilityIndex.value = -1
}

function useFromInfo() {
  if (!infoAbility.value) return
  const ab = infoAbility.value
  const idx = infoAbilityIndex.value
  closeInfo()
  onAbilityClick(ab, idx)
}

function canUseInfo() {
  const a = infoAbility.value
  if (!a) return false
  if (props.isPlayerInputLocked) return false
  if (isOnCooldown(a)) return false
  if (!isAffordable(a)) return false
  return true
}

function onAbilityClick(ability: IAbility, index: number) {
  if (props.isPlayerInputLocked) return
  if (isOnCooldown(ability)) return
  if (!isAffordable(ability)) return
  if (props.isSelectingTarget && props.selectedAbility?.type === ability.type) {
    emit('cancel')
    return
  }
  emit('selectAbility', ability, index)
}

function slotClasses(slot: Slot) {
  return {
    'mab-attack': slot.kind === 'attack',
    'mab-object': slot.kind === 'object',
    'mab-object-used': slot.kind === 'object' && props.usedItemThisTurn,
    'mab-cooldown': slot.kind === 'ability' && abilityState(slot.ability, slot.index) === 'cooldown',
    'mab-no-energy': slot.kind === 'ability' && abilityState(slot.ability, slot.index) === 'no-energy',
    'mab-empty': slot.kind === 'empty',
    'mab-disabled': isSlotDisabled(slot),
    'mab-info-open': slot.kind === 'ability' && infoAbility.value?.type === slot.ability.type,
    'mab-selected': slot.kind === 'ability' && isSelectedForTarget(slot.ability)
  }
}

function onAbilityIconClick(ability: IAbility, index: number, event: Event) {
  event.stopPropagation()
  if (isSelectedForTarget(ability)) {
    emit('cancel')
    return
  }
  showAbilityInfo(ability, index, event)
}

function isSelectedForTarget(ability: IAbility): boolean {
  return props.isSelectingTarget && props.selectedAbility?.type === ability.type
}

function shortLabel(name: string, max = 5): string {
  const first = name.trim().split(/\s+/)[0] ?? name
  if (first.length <= max) return first.toUpperCase()
  return first.slice(0, max - 1).toUpperCase() + '.'
}
</script>

<template>
  <div class="mobile-action-bar" role="toolbar" aria-label="Acciones de combate">
    <button
      v-for="(slot, idx) in slots"
      :key="idx"
      type="button"
      class="mab-btn"
      :class="slotClasses(slot)"
      :disabled="isSlotDisabled(slot)"
      @click="handleSlotClick(slot, $event)"
      @contextmenu.prevent="slot.kind === 'ability' && showAbilityInfo(slot.ability, slot.index, $event)"
    >
      <template v-if="slot.kind === 'attack'">
        <img :src="attackIcon" alt="" class="mab-icon" />
        <span class="mab-label">Atk</span>
      </template>

      <template v-else-if="slot.kind === 'ability'">
        <img
          :src="iconFor(slot.ability.type)"
          :alt="slot.ability.name"
          class="mab-icon"
          @click.stop="onAbilityIconClick(slot.ability, slot.index, $event)"
        />
        <span class="mab-label" :title="slot.ability.name">{{ shortLabel(slot.ability.name) }}</span>
        <span v-if="cooldownOf(slot.ability.type) > 0" class="mab-cd-badge">
          {{ cooldownOf(slot.ability.type) }}
        </span>
        <span v-else-if="isSelectedForTarget(slot.ability)" class="mab-cancel-hint" aria-hidden="true">
          ✕ Toca para cancelar
        </span>
      </template>

      <template v-else-if="slot.kind === 'object'">
        <img :src="backpackIcon" alt="" class="mab-icon" />
        <span class="mab-label">Obj</span>
        <span v-if="usedItemThisTurn" class="mab-used-mark">✓</span>
      </template>

      <template v-else>
        <span class="mab-label mab-empty-label">—</span>
      </template>
    </button>

    <transition name="mab-info">
      <div
        v-if="infoAbility"
        class="mab-info"
        role="dialog"
        :aria-label="`Info de ${infoAbility.name}`"
        @click.stop
      >
        <div class="mab-info-card">
          <header class="mab-info-header">
            <img :src="iconFor(infoAbility.type)" :alt="infoAbility.name" class="mab-info-icon" />
            <div class="mab-info-titles">
              <span class="mab-info-name">{{ infoAbility.name }}</span>
            </div>
            <button class="mab-info-close" type="button" aria-label="Cerrar" @click="closeInfo">✕</button>
          </header>
          <p class="mab-info-desc">{{ infoAbility.description }}</p>
          <footer class="mab-info-footer">
            <span v-if="infoAbility.energyCost" class="mab-info-cost">
              <img :src="boltIcon" alt="" class="mab-info-cost-icon" />
              {{ infoAbility.energyCost }}
            </span>
            <span v-if="infoAbility.cooldown > 0" class="mab-info-cd">
              <img :src="hourglassIcon" alt="" class="mab-info-cd-icon" />
              {{ infoAbility.cooldown }}t
            </span>
            <span v-if="cooldownOf(infoAbility.type) > 0" class="mab-info-cd-active">
              Enfriando: {{ cooldownOf(infoAbility.type) }}t
            </span>
            <button
              type="button"
              class="mab-info-use"
              :disabled="!canUseInfo()"
              @click="useFromInfo"
            >
              {{ isOnCooldown(infoAbility) ? 'Enfriando' : (isAffordable(infoAbility) ? 'Usar' : 'Sin energía') }}
            </button>
          </footer>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.mobile-action-bar {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 3px;
  padding: 4px 4px calc(4px + env(safe-area-inset-bottom)) 4px;
  box-sizing: border-box;
  width: 100%;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.85) 100%);
  border-top: 1px solid rgba(255, 230, 102, 0.35);
  backdrop-filter: blur(6px);
}

.mab-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  min-height: 44px;
  min-width: 0;
  max-width: 100%;
  padding: 3px 1px;
  box-sizing: border-box;
  background: linear-gradient(145deg, #292b44 0%, #2f324d 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  overflow: hidden;
}

.mab-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.mab-btn:disabled {
  cursor: not-allowed;
}

.mab-attack {
  background: linear-gradient(145deg, #f44336 0%, #b71c1c 100%);
  border-color: rgba(255, 200, 200, 0.3);
}

.mab-object {
  background: linear-gradient(145deg, #2196F3 0%, #0d47a1 100%);
  border-color: rgba(180, 220, 255, 0.3);
}

.mab-object-used {
  opacity: 0.45;
  filter: grayscale(0.55);
}

.mab-used-mark {
  position: absolute;
  top: 1px;
  right: 3px;
  background: rgba(76, 175, 80, 0.95);
  color: #0e1f0e;
  font-family: 'Courier New', monospace;
  font-size: 0.55rem;
  font-weight: 900;
  border-radius: 5px;
  padding: 0 3px;
  border: 1px solid rgba(76, 175, 80, 0.5);
  line-height: 1.1;
}

.mab-cooldown {
  opacity: 0.55;
  filter: grayscale(0.4);
}

.mab-no-energy {
  opacity: 0.45;
}

.mab-empty {
  background: rgba(40, 40, 60, 0.3);
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.05);
}

.mab-disabled {
  opacity: 0.5;
}

.mab-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px #000a);
}

.mab-label {
  font-size: 0.48rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.1;
}

.mab-empty-label {
  opacity: 0.4;
}

.mab-cd-badge {
  position: absolute;
  top: 1px;
  right: 3px;
  background: rgba(0, 0, 0, 0.85);
  color: #ff6b6b;
  font-family: 'Courier New', monospace;
  font-size: 0.55rem;
  font-weight: 900;
  border-radius: 5px;
  padding: 0 4px;
  border: 1px solid rgba(255, 107, 107, 0.4);
  line-height: 1.1;
}

.mab-info {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  z-index: 60;
  pointer-events: none;
}

.mab-info-card {
  pointer-events: auto;
  width: min(320px, 90vw);
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  border-radius: 12px;
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 200, 60, 0.25);
  padding: 0.65rem 0.8rem 0.7rem;
  color: #fff;
  font-family: inherit;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.mab-info-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.mab-info-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.45);
  padding: 3px;
  filter: drop-shadow(0 1px 3px #000a);
  flex-shrink: 0;
}

.mab-info-titles {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mab-info-name {
  font-family: 'Georgia', serif;
  font-size: 1rem;
  font-weight: 700;
  color: #ffe066;
  text-shadow: 0 1px 2px #000;
  line-height: 1.15;
}

.mab-info-close {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mab-info-close:hover {
  background: rgba(255, 255, 255, 0.18);
}

.mab-info-desc {
  margin: 0;
  color: #d8d8e8;
  font-size: 0.82rem;
  line-height: 1.35;
}

.mab-info-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mab-info-cost,
.mab-info-cd {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.18rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mab-info-cost {
  background: rgba(64, 196, 255, 0.15);
  color: #82b1ff;
}

.mab-info-cd {
  background: rgba(255, 180, 0, 0.15);
  color: #ffb400;
}

.mab-info-cd-active {
  background: rgba(255, 107, 107, 0.18);
  color: #ff9a9a;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.18rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 107, 107, 0.35);
  font-family: 'Courier New', monospace;
}

.mab-info-cost-icon,
.mab-info-cd-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  filter: drop-shadow(0 1px 1px #000a);
}

.mab-info-use {
  margin-left: auto;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  border: 1.5px solid rgba(255, 230, 102, 0.6);
  background: linear-gradient(145deg, #ffe066 0%, #ff8a00 100%);
  color: #1a1230;
  cursor: pointer;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 8px rgba(255, 200, 60, 0.35);
}

.mab-info-use:disabled {
  background: rgba(60, 60, 80, 0.8);
  color: #888;
  border-color: rgba(255, 255, 255, 0.08);
  text-shadow: none;
  cursor: not-allowed;
  box-shadow: none;
}

.mab-info-use:not(:disabled):active {
  transform: scale(0.97);
}

.mab-info-open {
  outline: 2px solid rgba(255, 230, 102, 0.75);
  outline-offset: 1px;
}

.mab-selected {
  border-color: #ffe066;
  box-shadow:
    0 0 0 2px rgba(255, 224, 102, 0.85) inset,
    0 0 14px rgba(255, 224, 102, 0.65);
  animation: mab-selected-pulse 1.2s ease-in-out infinite;
}

.mab-selected .mab-label {
  color: #ffe066;
}

@keyframes mab-selected-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(255, 224, 102, 0.85) inset, 0 0 10px rgba(255, 224, 102, 0.55); }
  50%      { box-shadow: 0 0 0 2px rgba(255, 224, 102, 1)    inset, 0 0 20px rgba(255, 224, 102, 0.85); }
}

.mab-cancel-hint {
  position: absolute;
  top: 1px;
  right: 3px;
  background: rgba(0, 0, 0, 0.85);
  color: #ffe066;
  font-family: 'Courier New', monospace;
  font-size: 0.5rem;
  font-weight: 900;
  border-radius: 5px;
  padding: 1px 3px;
  border: 1px solid rgba(255, 224, 102, 0.5);
  line-height: 1.1;
  letter-spacing: 0.02em;
  pointer-events: none;
}

.mab-info-enter-active,
.mab-info-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.mab-info-enter-from,
.mab-info-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>
