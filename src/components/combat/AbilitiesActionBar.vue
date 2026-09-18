<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IAbility, AbilityDamagePreview } from '@/core/interfaces/IAbility'
import type { Hero } from '@/core/Hero'
import { getAbilityIcon } from '@/core/abilities/getAbilityIcon'
import { getBasicAttackHitCount, getAbilityHitCount, isBasicAttack } from '@/core/abilities/Abilities'
import backpackIcon from '@/assets/icons/backpack.png'
import boltIcon from '@/assets/icons/bolt-shield.png'
import hourglassIcon from '@/assets/icons/hourglass.png'

type Slot =
  | { kind: 'ability', ability: IAbility, index: number }
  | { kind: 'object' }
  | { kind: 'empty' }

const props = withDefaults(defineProps<{
  abilities: IAbility[]
  abilityCooldowns: Record<string, number>
  abilityShortcuts?: string[]
  playerEnergy: number
  isPlayerInputLocked: boolean
  selectedAbility: IAbility | null
  isSelectingTarget: boolean
  usedItemThisTurn: boolean
  /** Heroe activo cuyas stats alimentan el preview de daño. */
  caster: Hero | null
  /**
   * `mobile` = barra compacta pegada al borde inferior (6 columnas fijas).
   * `desktop` = barra horizontal inline con botones mas grandes, label
   * completo y badge de hotkey Q/W/E/R/T. Comparte la misma lógica de
   * tap → preview → "Usar" → selección de objetivo.
   */
  layout?: 'mobile' | 'desktop'
}>(), {
  abilityShortcuts: () => [] as string[],
  layout: 'mobile'
})

const emit = defineEmits<{
  (e: 'attack'): void
  (e: 'selectAbility', ability: IAbility, index: number): void
  (e: 'object'): void
  (e: 'cancel'): void
}>()

const isDesktop = computed(() => props.layout === 'desktop')

const slots = computed<Slot[]>(() => {
  const list: Slot[] = []
  // 5 slots para abilities (incluye BasicAttack, que ya viene en `props.abilities`
  // porque Hero.learnAbility(BasicAttack) se llama en su constructor). Asi el
  // ataque basico sigue el mismo flujo que las demas habilidades:
  // tap en el icono abre la tarjeta con su preview, tap en "Usar" la activa.
  for (let i = 0; i < 5; i++) {
    const ab = props.abilities[i]
    if (ab) {
      list.push({ kind: 'ability', ability: ab, index: i })
    } else list.push({ kind: 'empty' })
  }
  list.push({ kind: 'object' })
  return list
})

/**
 * Slots que NO deben responder a clicks. Se usa para el `:disabled` del
 * boton (HTML disabled bloquea el click event del navegador). Solo cubre
 * los casos realmente no-interactivos:
 *  - input bloqueado durante animaciones / defensas
 *  - slot vacio (sin ability)
 *  - objeto ya usado este turno
 *
 * Las abilities en cooldown / sin energia / silenciadas NO entran aca:
 * se quiere poder abrirlas para leer que hacen, y bloquearlas solo al
 * confirmar con "Usar" (ver `canUseAbility` / `canUseInfo`).
 */
function isSlotBlocked(slot: Slot): boolean {
  if (props.isPlayerInputLocked) return true
  if (slot.kind === 'empty') return true
  if (slot.kind === 'object' && props.usedItemThisTurn) return true
  return false
}

/**
 * Si la ability puede castearse AHORA. Usado por el boton "Usar" dentro
 * de la info card y para decidir las clases CSS que aplican el estilo
 * "deshabilitado" (gris, sin saturacion, etc.) sin bloquear el click.
 */
function canUseAbility(ability: IAbility): boolean {
  if (isOnCooldown(ability)) return false
  if (!isAffordable(ability)) return false
  if (isCasterSilenced.value && !isBasicAttack(ability)) return false
  return true
}

/** Estado visual "no usable" — solo para CSS, no bloquea clicks. */
function isSlotDisabled(slot: Slot): boolean {
  if (isSlotBlocked(slot)) return true
  if (slot.kind === 'ability') return !canUseAbility(slot.ability)
  return false
}

function handleSlotClick(slot: Slot, event: MouseEvent | TouchEvent) {
  event.preventDefault()
  if (isSlotBlocked(slot)) return
  if (slot.kind === 'ability') {
    // Si la ability ya esta marcada para seleccionar objetivo, el tap la
    // cancela. En cualquier otro caso, abre la tarjeta con su info y preview
    // de daño — incluso si está en cooldown / sin energia / silenciada,
    // para que el jugador pueda leer que hace. Confirmar la acción requiere
    // pulsar "Usar" dentro de la tarjeta, que solo está activo si
    // `canUseInfo()` lo permite.
    if (isSelectedForTarget(slot.ability)) {
      emit('cancel')
      return
    }
    showAbilityInfo(slot.ability, slot.index)
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

function hasEnoughEnergy(ability: IAbility) {
  const cost = ability.energyCost ?? 0
  if (cost <= 0) return true
  return props.playerEnergy >= cost
}

function hasEnoughHeroism(ability: IAbility) {
  const cost = ability.heroismCost ?? 0
  if (cost <= 0) return true
  const heroism = (props.caster as any)?.heroism ?? 0
  return heroism >= cost
}

function isAffordable(ability: IAbility) {
  return hasEnoughEnergy(ability) && hasEnoughHeroism(ability)
}

function abilityState(ability: IAbility, index: number) {
  const cd = cooldownOf(ability.type)
  if (cd > 0) return 'cooldown'
  if (!isAffordable(ability)) return 'no-energy'
  if (isCasterSilenced.value && !isBasicAttack(ability)) return 'silenced'
  return 'ready'
}

const isCasterSilenced = computed(() => !!props.caster?.hasStatusEffect?.('silenced'))

const infoAbility = ref<IAbility | null>(null)
const infoAbilityIndex = ref(-1)
const infoFormulaOpen = ref(false)

const infoPreview = computed<AbilityDamagePreview | null>(() => {
  const a = infoAbility.value
  if (!a || !props.caster || typeof a.previewDamage !== 'function') return null
  try {
    return a.previewDamage(props.caster)
  } catch {
    return null
  }
})

const basicHitCount = computed(() => getBasicAttackHitCount(props.caster?.level ?? 1))

function hitCountFor(ability: IAbility): number | null {
  if (!props.caster) return null
  return getAbilityHitCount(ability, props.caster.level)
}

function toggleInfoFormula(event: Event) {
  event.stopPropagation()
  infoFormulaOpen.value = !infoFormulaOpen.value
}

function showAbilityInfo(ability: IAbility, index: number) {
  infoFormulaOpen.value = false
  infoAbility.value = ability
  infoAbilityIndex.value = index
}

function closeInfo() {
  infoAbility.value = null
  infoAbilityIndex.value = -1
  infoFormulaOpen.value = false
}

function useFromInfo() {
  if (!infoAbility.value) return
  const ab = infoAbility.value
  const idx = infoAbilityIndex.value
  closeInfo()
  emit('selectAbility', ab, idx)
}

function canUseInfo() {
  const a = infoAbility.value
  if (!a) return false
  if (props.isPlayerInputLocked) return false
  return canUseAbility(a)
}

function infoUseLabel(a: IAbility): string {
  if (isOnCooldown(a)) return 'Enfriando'
  if (isCasterSilenced.value && !isBasicAttack(a)) return 'Silenciado'
  if (!hasEnoughHeroism(a)) return 'Sin heroísmo suficiente'
  if (!hasEnoughEnergy(a)) return 'Sin energía suficiente'
  return 'Usar'
}

function slotClasses(slot: Slot) {
  return {
    'aab-attack': slot.kind === 'ability' && slot.ability.type === 'attack',
    'aab-object': slot.kind === 'object',
    'aab-object-used': slot.kind === 'object' && props.usedItemThisTurn,
    'aab-cooldown': slot.kind === 'ability' && abilityState(slot.ability, slot.index) === 'cooldown',
    'aab-no-energy': slot.kind === 'ability' && abilityState(slot.ability, slot.index) === 'no-energy',
    'aab-silenced': slot.kind === 'ability' && abilityState(slot.ability, slot.index) === 'silenced',
    'aab-empty': slot.kind === 'empty',
    'aab-disabled': isSlotDisabled(slot),
    'aab-info-open': slot.kind === 'ability' && infoAbility.value?.type === slot.ability.type,
    'aab-selected': slot.kind === 'ability' && isSelectedForTarget(slot.ability),
    'aab-desktop': isDesktop.value,
    'aab-mobile': !isDesktop.value
  }
}

function isSelectedForTarget(ability: IAbility): boolean {
  return props.isSelectingTarget && props.selectedAbility?.type === ability.type
}

/**
 * Label corto solo para layout mobile (ancho de slot ~50px).
 * En desktop se muestra el nombre completo.
 */
function shortLabel(name: string, max = 5): string {
  const first = name.trim().split(/\s+/)[0] ?? name
  if (first.length <= max) return first.toUpperCase()
  return first.slice(0, max - 1).toUpperCase() + '.'
}

function shortcutFor(index: number): string | null {
  const s = props.abilityShortcuts[index]
  return s ? s.toUpperCase() : null
}
</script>

<template>
  <div
    class="abilities-action-bar"
    :class="{ 'aab-is-desktop': isDesktop, 'aab-is-mobile': !isDesktop }"
    role="toolbar"
    aria-label="Acciones de combate"
  >
    <button
      v-for="(slot, idx) in slots"
      :key="idx"
      type="button"
      class="aab-btn"
      :class="slotClasses(slot)"
      :disabled="isSlotBlocked(slot)"
      :aria-label="slot.kind === 'ability' ? slot.ability.name : slot.kind === 'object' ? 'Objeto' : 'Slot vacío'"
      @click="handleSlotClick(slot, $event)"
    >
      <template v-if="slot.kind === 'ability'">
        <span v-if="isDesktop && shortcutFor(slot.index)" class="aab-shortcut">{{ shortcutFor(slot.index) }}</span>
        <img
          :src="iconFor(slot.ability.type)"
          :alt="slot.ability.name"
          class="aab-icon"
        />
        <span class="aab-label" :title="slot.ability.name">
          {{ isDesktop ? slot.ability.name : shortLabel(slot.ability.name) }}
        </span>
        <span v-if="cooldownOf(slot.ability.type) > 0" class="aab-cd-badge">
          {{ cooldownOf(slot.ability.type) }}
        </span>
        <span v-else-if="isSelectedForTarget(slot.ability)" class="aab-cancel-hint" aria-hidden="true">
          ✕ {{ isDesktop ? 'Click para cancelar' : 'Toca para cancelar' }}
        </span>
      </template>

      <template v-else-if="slot.kind === 'object'">
        <img :src="backpackIcon" alt="" class="aab-icon" />
        <span class="aab-label">Objeto</span>
        <span v-if="usedItemThisTurn" class="aab-used-mark">✓</span>
      </template>

      <template v-else>
        <span class="aab-label aab-empty-label">—</span>
      </template>
    </button>

    <transition name="aab-info">
      <div
        v-if="infoAbility"
        class="aab-info"
        :class="{ 'aab-info-desktop': isDesktop }"
        role="dialog"
        :aria-label="`Info de ${infoAbility.name}`"
        @click.stop
      >
        <div class="aab-info-card">
          <header class="aab-info-header">
            <img :src="iconFor(infoAbility.type)" :alt="infoAbility.name" class="aab-info-icon" />
            <div class="aab-info-titles">
              <span class="aab-info-name">{{ infoAbility.name }}</span>
            </div>
            <button class="aab-info-close" type="button" aria-label="Cerrar" @click="closeInfo">✕</button>
          </header>
          <p class="aab-info-desc">{{ infoAbility.description }}</p>
          <p v-if="infoAbility.type === 'attack'" class="aab-info-hits">
            Golpes: <strong>{{ basicHitCount }}</strong>
            <span class="aab-info-hits-hint">(+1 por cada 4 niveles)</span>
          </p>

          <button
            v-if="infoPreview"
            type="button"
            class="aab-info-damage"
            :class="{ 'is-open': infoFormulaOpen }"
            :aria-expanded="infoFormulaOpen"
            :aria-label="`Toca para ver la fórmula de daño de ${infoAbility.name}`"
            @click="toggleInfoFormula"
          >
            <span class="aab-info-damage-label">Daño</span>
            <span class="aab-info-damage-values">{{ infoPreview.min }}–{{ infoPreview.max }}</span>
            <span
              v-if="hitCountFor(infoAbility)"
              class="aab-info-damage-hits"
              :title="`${hitCountFor(infoAbility)} ataques`"
            >× {{ hitCountFor(infoAbility) }}</span>
            <span v-if="infoPreview.damageTypeLabel" class="aab-info-damage-type">{{ infoPreview.damageTypeLabel }}</span>
          </button>
          <div v-if="infoPreview && infoFormulaOpen" class="aab-info-formula" @click.stop>
            <div class="aab-info-formula-line" v-html="infoPreview.formula"></div>
          </div>

          <footer class="aab-info-footer">
            <span v-if="infoAbility.energyCost" class="aab-info-cost">
              <img :src="boltIcon" alt="" class="aab-info-cost-icon" />
              {{ infoAbility.energyCost }}
            </span>
            <span v-if="infoAbility.cooldown > 0" class="aab-info-cd">
              <img :src="hourglassIcon" alt="" class="aab-info-cd-icon" />
              {{ infoAbility.cooldown }}t
            </span>
            <span v-if="cooldownOf(infoAbility.type) > 0" class="aab-info-cd-active">
              Enfriando: {{ cooldownOf(infoAbility.type) }}t
            </span>
            <span v-if="isSelectingTarget && selectedAbility?.type === infoAbility.type" class="aab-info-targeting">
              Selecciona un objetivo
            </span>
            <button
              type="button"
              class="aab-info-use"
              :disabled="!canUseInfo()"
              @click="useFromInfo"
            >
              {{ infoUseLabel(infoAbility) }}
            </button>
          </footer>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.abilities-action-bar {
  position: relative;
  display: grid;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.85) 100%);
  border-top: 1px solid rgba(255, 230, 102, 0.35);
  backdrop-filter: blur(6px);
}

.aab-is-mobile {
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 4px;
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom)) 6px;
  width: 100%;
}

.aab-is-desktop {
  /* Mismo layout horizontal single-row que mobile: 6 columnas fijas.
     Cada boton se reparte el ancho disponible (1fr) asi nunca wrappea ni
     empuja al log de combate fuera del viewport. */
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 230, 102, 0.25);
  border-radius: 10px 10px 0 0;
  background: linear-gradient(180deg, rgba(15, 17, 30, 0.92) 0%, rgba(8, 10, 20, 0.95) 100%);
  box-shadow: 0 -6px 22px rgba(0, 0, 0, 0.45);
  width: 100%;
}

.aab-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  max-width: 100%;
  padding: 5px 2px;
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

.aab-is-mobile .aab-btn {
  min-height: 58px;
}

.aab-is-desktop .aab-btn {
  min-height: 82px;
  padding: 8px 8px 9px;
  gap: 4px;
  border-radius: 10px;
}

.aab-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.aab-btn:disabled {
  cursor: not-allowed;
}

.aab-attack {
  background: linear-gradient(145deg, #f44336 0%, #b71c1c 100%);
  border-color: rgba(255, 200, 200, 0.3);
}

.aab-object {
  background: linear-gradient(145deg, #2196F3 0%, #0d47a1 100%);
  border-color: rgba(180, 220, 255, 0.3);
}

.aab-object-used {
  opacity: 0.45;
  filter: grayscale(0.55);
}

.aab-used-mark {
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

.aab-is-desktop .aab-used-mark {
  font-size: 0.72rem;
  padding: 1px 6px;
}

.aab-cooldown {
  opacity: 0.55;
  filter: grayscale(0.4);
}

.aab-no-energy {
  opacity: 0.45;
}

.aab-silenced {
  opacity: 0.4;
  filter: grayscale(0.65);
  cursor: not-allowed;
}

.aab-empty {
  background: rgba(40, 40, 60, 0.3);
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.05);
}

.aab-disabled {
  opacity: 0.5;
}

.aab-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px #000a);
}

.aab-is-desktop .aab-icon {
  width: 36px;
  height: 36px;
}

.aab-label {
  font-size: 0.55rem;
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

.aab-is-desktop .aab-label {
  font-size: 0.72rem;
  letter-spacing: 0.01em;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  text-transform: none;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.aab-empty-label {
  opacity: 0.4;
}

.aab-shortcut {
  position: absolute;
  top: 3px;
  left: 4px;
  background: rgba(255, 230, 102, 0.18);
  color: #ffe066;
  font-family: 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 800;
  border-radius: 4px;
  padding: 0 5px;
  border: 1px solid rgba(255, 230, 102, 0.35);
  line-height: 1.15;
}

.aab-cd-badge {
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

.aab-is-desktop .aab-cd-badge {
  font-size: 0.78rem;
  padding: 1px 7px;
  top: 4px;
  right: 5px;
}

.aab-info {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  z-index: 60;
  pointer-events: none;
}

.aab-info-desktop {
  /* El bar está pegado al borde inferior del viewport (grid-area bottom),
     asi que el popover SIEMPRE va encima del bar para no quedar clippeado
     por el overflow:hidden de `.combat-view`. Centrado horizontal igual
     que en mobile. */
  left: 50%;
  right: auto;
  bottom: calc(100% + 8px);
  top: auto;
  transform: translateX(-50%);
  max-width: min(520px, calc(100vw - 24px));
}

.aab-info-card {
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

.aab-info-desktop .aab-info-card {
  width: auto;
  max-width: 480px;
  padding: 0.85rem 1rem 0.9rem;
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 200, 60, 0.2);
}

.aab-info-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.aab-info-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.45);
  padding: 3px;
  filter: drop-shadow(0 1px 3px #000a);
  flex-shrink: 0;
}

.aab-info-titles {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.aab-info-name {
  font-family: 'Georgia', serif;
  font-size: 1rem;
  font-weight: 700;
  color: #ffe066;
  text-shadow: 0 1px 2px #000;
  line-height: 1.15;
}

.aab-info-sub {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.72rem;
}

.aab-info-close {
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

.aab-info-close:hover {
  background: rgba(255, 255, 255, 0.18);
}

.aab-info-desc {
  margin: 0;
  color: #d8d8e8;
  font-size: 0.82rem;
  line-height: 1.35;
}

.aab-info-hits {
  margin: 0.3rem 0 0;
  font-size: 0.82rem;
  color: #ffe066;
}
.aab-info-hits strong {
  color: #4CAF50;
  font-size: 0.95rem;
  margin-right: 0.3rem;
}
.aab-info-hits-hint {
  color: #aaa;
  font-size: 0.72rem;
  font-style: italic;
}

.aab-info-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.aab-info-cost,
.aab-info-cd {
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

.aab-info-cost {
  background: rgba(64, 196, 255, 0.15);
  color: #82b1ff;
}

.aab-info-cd {
  background: rgba(255, 180, 0, 0.15);
  color: #ffb400;
}

.aab-info-cd-active {
  background: rgba(255, 107, 107, 0.18);
  color: #ff9a9a;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.18rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 107, 107, 0.35);
  font-family: 'Courier New', monospace;
}

.aab-info-targeting {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #ffe066;
  background: rgba(255, 230, 102, 0.12);
  border: 1px solid rgba(255, 230, 102, 0.4);
  padding: 0.18rem 0.55rem;
  border-radius: 6px;
  animation: aab-targeting-pulse 1.2s ease-in-out infinite;
}

@keyframes aab-targeting-pulse {
  0%, 100% { opacity: 0.85; }
  50%      { opacity: 1; }
}

.aab-info-cost-icon,
.aab-info-cd-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  filter: drop-shadow(0 1px 1px #000a);
}

.aab-info-use {
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

.aab-info-use:disabled {
  background: rgba(60, 60, 80, 0.8);
  color: #888;
  border-color: rgba(255, 255, 255, 0.08);
  text-shadow: none;
  cursor: not-allowed;
  box-shadow: none;
}

.aab-info-use:not(:disabled):active {
  transform: scale(0.97);
}

.aab-info-damage {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 107, 107, 0.12);
  border: 1px solid rgba(255, 107, 107, 0.32);
  padding: 0.22em 0.6em;
  border-radius: 6px;
  font-size: 0.8rem;
  align-self: flex-start;
  font-family: inherit;
  color: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.aab-info-damage:hover {
  background: rgba(255, 107, 107, 0.2);
  border-color: rgba(255, 107, 107, 0.55);
}

.aab-info-damage.is-open {
  background: rgba(130, 177, 255, 0.18);
  border-color: rgba(130, 177, 255, 0.55);
}

.aab-info-damage-label {
  color: #ffb3b3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.7rem;
}

.aab-info-damage-values {
  color: #ff8a8a;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.aab-info-damage-hits {
  color: #ffe066;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  background: rgba(255, 230, 102, 0.15);
  border: 1px solid rgba(255, 230, 102, 0.4);
  padding: 0 0.4em;
  border-radius: 4px;
  font-size: 0.72rem;
}

.aab-info-damage-type {
  color: #b8b8d0;
  font-size: 0.7rem;
  opacity: 0.85;
  font-weight: 700;
  letter-spacing: 0.04em;
}

/* Damage-type colors — sincronizados con `DAMAGE_TYPES`. */
.aab-info-damage-type.dmg-physical { color: #d7ccc8; }
.aab-info-damage-type.dmg-fire    { color: #ff8a3a; }
.aab-info-damage-type.dmg-holy    { color: #ffe066; }
.aab-info-damage-type.dmg-poison  { color: #9ccc65; }
.aab-info-damage-type.dmg-arcane  { color: #b388ff; }
.aab-info-damage-type.dmg-electric{ color: #ffeb3b; }
.aab-info-damage-type.dmg-water   { color: #64b5f6; }

.aab-info-formula {
  background: rgba(20, 22, 38, 0.55);
  border: 1px solid rgba(130, 177, 255, 0.22);
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  font-size: 0.78rem;
  color: #d8d8e8;
}

.aab-info-formula-line {
  font-family: 'Consolas', 'Menlo', monospace;
  color: #b0bec5;
  font-size: 0.85rem;
  line-height: 1.45;
  word-break: break-word;
}

.aab-info-open {
  outline: 2px solid rgba(255, 230, 102, 0.75);
  outline-offset: 1px;
}

.aab-selected {
  border-color: #ffe066;
  box-shadow:
    0 0 0 2px rgba(255, 224, 102, 0.85) inset,
    0 0 14px rgba(255, 224, 102, 0.65);
  animation: aab-selected-pulse 1.2s ease-in-out infinite;
}

.aab-selected .aab-label {
  color: #ffe066;
}

@keyframes aab-selected-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(255, 224, 102, 0.85) inset, 0 0 10px rgba(255, 224, 102, 0.55); }
  50%      { box-shadow: 0 0 0 2px rgba(255, 224, 102, 1)    inset, 0 0 20px rgba(255, 224, 102, 0.85); }
}

.aab-cancel-hint {
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

.aab-is-desktop .aab-cancel-hint {
  font-size: 0.66rem;
  padding: 2px 6px;
  top: 4px;
  right: 5px;
  font-family: inherit;
  letter-spacing: 0.01em;
}

.aab-info-enter-active,
.aab-info-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.aab-info-enter-from,
.aab-info-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>