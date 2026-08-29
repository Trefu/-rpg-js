<script setup lang="ts">
import { computed } from 'vue'
import type { IAbility } from '@/core/interfaces/IAbility'
import attackIcon from '@/assets/icons/wave-strike.png'
import backpackIcon from '@/assets/icons/backpack.png'

const props = defineProps<{
  abilities: IAbility[]
  abilityCooldowns: Record<string, number>
  playerEnergy: number
  isPlayerInputLocked: boolean
}>()

const emit = defineEmits<{
  (e: 'attack'): void
  (e: 'selectAbility', ability: IAbility, index: number): void
  (e: 'object'): void
}>()

const slots = computed(() => {
  const list: Array<
    | { kind: 'attack' }
    | { kind: 'ability', ability: IAbility, index: number }
    | { kind: 'object' }
    | { kind: 'empty' }
  > = []
  list.push({ kind: 'attack' })
  for (let i = 0; i < 4; i++) {
    const ab = props.abilities[i]
    if (ab) list.push({ kind: 'ability', ability: ab, index: i })
    else list.push({ kind: 'empty' })
  }
  list.push({ kind: 'object' })
  return list
})

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

function onAbilityClick(ability: IAbility, index: number) {
  if (props.isPlayerInputLocked) return
  if (isOnCooldown(ability)) return
  if (!isAffordable(ability)) return
  emit('selectAbility', ability, index)
}
</script>

<template>
  <div class="mobile-action-bar" role="toolbar" aria-label="Acciones de combate">
    <button
      v-for="(slot, idx) in slots"
      :key="idx"
      type="button"
      class="mab-btn"
      :class="{
        'mab-attack': slot.kind === 'attack',
        'mab-object': slot.kind === 'object',
        'mab-cooldown': slot.kind === 'ability' && abilityState(slot.ability, slot.index) === 'cooldown',
        'mab-no-energy': slot.kind === 'ability' && abilityState(slot.ability, slot.index) === 'no-energy',
        'mab-empty': slot.kind === 'empty',
        'mab-disabled': isPlayerInputLocked
      }"
      :disabled="isPlayerInputLocked || slot.kind === 'empty'"
      @click="slot.kind === 'attack' && emit('attack'); slot.kind === 'object' && emit('object'); slot.kind === 'ability' && onAbilityClick(slot.ability, slot.index)"
    >
      <template v-if="slot.kind === 'attack'">
        <img :src="attackIcon" alt="" class="mab-icon" />
        <span class="mab-label">Atk</span>
      </template>

      <template v-else-if="slot.kind === 'ability'">
        <img
          v-if="slot.ability.type === 'attack' || slot.ability.type === 'warriorAttack' || slot.ability.type === 'warriorVerticalSlash' || slot.ability.type === 'warriorDevastatingStrike'"
          :src="attackIcon"
          :alt="slot.ability.name"
          class="mab-icon"
        />
        <span v-else class="mab-letter">{{ (slot.ability.name || '?').charAt(0).toUpperCase() }}</span>
        <span class="mab-label">{{ slot.ability.name }}</span>
        <span v-if="cooldownOf(slot.ability.type) > 0" class="mab-cooldown">
          {{ cooldownOf(slot.ability.type) }}
        </span>
      </template>

      <template v-else-if="slot.kind === 'object'">
        <img :src="backpackIcon" alt="" class="mab-icon" />
        <span class="mab-label">Obj</span>
      </template>

      <template v-else>
        <span class="mab-label mab-empty-label">—</span>
      </template>
    </button>
  </div>
</template>

<style scoped>
.mobile-action-bar {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom)) 6px;
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
  gap: 2px;
  min-height: 56px;
  min-width: 0;
  padding: 4px 2px;
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
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px #000a);
}

.mab-letter {
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 900;
  color: #ffe066;
  line-height: 1;
}

.mab-label {
  font-size: 0.52rem;
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

.mab-cooldown {
  position: absolute;
  top: 2px;
  right: 4px;
  background: rgba(0, 0, 0, 0.85);
  color: #ff6b6b;
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: 900;
  border-radius: 6px;
  padding: 0 5px;
  border: 1px solid rgba(255, 107, 107, 0.4);
  line-height: 1.1;
}
</style>
