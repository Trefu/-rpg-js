<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, useAttrs, watch } from 'vue'
import type { IStatusEffect, StatusEffectSide } from '@/core/interfaces/IStatusEffect'
import { presentStatus, isActiveStatus, statusChanges } from '@/core/combat/statusPresentation'
import '@/styles/combat-status.css'
import { useExclusiveToggle } from '@/composables/useExclusiveToggle'
import roundClockIcon from '@/assets/ui/status-round-clock.png'

/**
 * El template tiene dos raices (un <div> para los iconos y un <Teleport>
 * para el popup), asi que Vue no puede auto-heredar los attrs no-prop
 * (incluido `class`) y emite un warning. Forzamos la herencia manual
 * aplicandolos al contenedor de iconos, que es donde el consumidor
 * espera que caigan (ej. `class="mobile-hud-ally-effects"`).
 */
defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const rootClass = computed(() => attrs.class as string | undefined)

const props = withDefaults(defineProps<{
  effects: IStatusEffect[]
  side?: StatusEffectSide
}>(), { side: 'enemy' })
const activeEffects = computed(() => props.effects.filter(isActiveStatus))
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | null = null
watch(() => props.effects.map(effect => ({ ...effect })), (after, before) => {
  const messages = statusChanges(before, after)
  if (messages.length) {
    notice.value = messages.join(' · ')
    if (noticeTimer) clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => { notice.value = '' }, 1800)
  }
  if (infoEffect.value) {
    const updated = after.find(effect => effect.type === infoEffect.value?.type && isActiveStatus(effect))
    if (updated) infoEffect.value = updated
    else closeInfo()
  }
})

const infoEffect = ref<IStatusEffect | null>(null)
const popupToggle = useExclusiveToggle(`combat-status-${getCurrentInstance()?.uid}`)
watch(popupToggle.isOpen, open => { if (!open) closeInfo(false) })
const containerEl = ref<HTMLElement | null>(null)
const iconEls = ref<HTMLElement[]>([])

const infoDescription = computed(() => {
  if (!infoEffect.value) return ''
  return presentStatus(infoEffect.value, props.side).description
})

interface PopupLayout {
  side: 'left' | 'right' | 'center'
  /** Coordenadas del popup en px CSS relativos al viewport (position: fixed). */
  left: number
  top: number
  maxWidth: number
  /** Posición X (px CSS) de la flecha, relativa al borde izquierdo del popup. */
  arrowLeft: number
}

const DEFAULT_MAX = 320
const EDGE = 12

/**
 * Resuelve la geometría del popup. Se calcula con position: fixed en
 * coordenadas de viewport para escapar del stacking context del icono
 * (que es el problema cuando hay varios enemigos en pantalla).
 */
function computeLayout(): PopupLayout | null {
  if (!infoEffect.value) return null
  if (typeof window === 'undefined') return null
  const idx = activeEffects.value.findIndex(e => e.type === infoEffect.value!.type)
  const el = iconEls.value[idx]
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const center = rect.left + rect.width / 2
  const halfDefault = DEFAULT_MAX / 2
  const rightSpace = vw - rect.right - EDGE
  const leftSpace = rect.left - EDGE

  let side: 'left' | 'right' | 'center'
  let maxWidth: number
  if (center - halfDefault < EDGE) {
    side = 'left'
    maxWidth = Math.max(180, Math.min(DEFAULT_MAX, rightSpace))
  } else if (center + halfDefault > vw - EDGE) {
    side = 'right'
    maxWidth = Math.max(180, Math.min(DEFAULT_MAX, leftSpace))
  } else {
    side = 'center'
    maxWidth = Math.min(DEFAULT_MAX, leftSpace + rightSpace)
  }

  // Posición del popup (fixed)
  let popupLeft: number
  if (side === 'left') {
    popupLeft = rect.left
  } else if (side === 'right') {
    popupLeft = rect.right - maxWidth
  } else {
    popupLeft = center - maxWidth / 2
  }
  const popupTop = rect.bottom + 8

  // Si no hay espacio debajo, lo colocamos arriba del icono
  // (estimamos 180px de alto para el popup; si no entra, subimos)
  const ESTIMATED_POPUP_HEIGHT = popupEl.value?.offsetHeight ?? 180
  let top = popupTop
  if (top + ESTIMATED_POPUP_HEIGHT > vh - EDGE) {
    top = Math.max(EDGE, rect.top - ESTIMATED_POPUP_HEIGHT - 8)
  }

  // Posición X de la flecha (relativa al popup)
  const arrowLeft = Math.max(10, Math.min(maxWidth - 10, center - popupLeft))

  return {
    side,
    left: Math.round(Math.max(EDGE, Math.min(popupLeft, vw - maxWidth - EDGE))),
    top: Math.round(top),
    maxWidth: Math.floor(maxWidth),
    arrowLeft: Math.round(arrowLeft)
  }
}

const popupStyle = computed(() => {
  const layout = computeLayout()
  if (!layout) return {}
  return {
    position: 'fixed',
    left: `${layout.left}px`,
    top: `${layout.top}px`,
    maxWidth: `${layout.maxWidth}px`,
    width: `${layout.maxWidth}px`
  }
})

const popupArrowStyle = computed(() => {
  const layout = computeLayout()
  if (!layout) return {}
  if (layout.side === 'center') return null
  // Solo mostramos la flecha en flush-left/right cerca del icono
  return {
    left: `${layout.arrowLeft}px`,
    right: 'auto',
    transform: 'translateX(-50%) rotate(45deg)'
  }
})

const showPopupArrow = computed(() => {
  const layout = computeLayout()
  if (!layout) return false
  return layout.side !== 'center'
})

async function showEffectInfo(effect: IStatusEffect, event: Event) {
  event.stopPropagation()
  infoEffect.value = infoEffect.value?.type === effect.type ? null : effect
  if (infoEffect.value) {
    popupToggle.open()
    triggerEl = event.currentTarget as HTMLElement
    await nextTick()
    if (infoEffect.value) infoEffect.value = { ...infoEffect.value }
    popupEl.value?.querySelector<HTMLButtonElement>('button')?.focus()
  }
}

let triggerEl: HTMLElement | null = null
const popupEl = ref<HTMLElement | null>(null)
function closeInfo(restoreFocus = true) {
  infoEffect.value = null
  popupToggle.close()
  if (restoreFocus) triggerEl?.focus()
}

function onDocClick(e: MouseEvent | TouchEvent) {
  if (!infoEffect.value) return
  const target = e.target as Node
  // Como el popup esta teletransportado a body, no podemos preguntar por
  // `containerEl.contains(target)`. Comprobamos si el click fue sobre el
  // propio popup o el contenedor de iconos.
    const popup = popupEl.value
    if (popup && (popup === target || popup.contains(target))) return
  if (containerEl.value && containerEl.value.contains(target)) return
  closeInfo(false)
}

function onKey(e: KeyboardEvent) {
  if (!infoEffect.value) return
  if (e.key === 'Escape') closeInfo()
  if (infoEffect.value && e.key === 'Tab') {
    e.preventDefault()
    popupEl.value?.querySelector<HTMLButtonElement>('button')?.focus()
  }
}

function onResize() {
  if (infoEffect.value) {
    // Forzar re-evaluacion de popupStyle (depende de getBoundingClientRect).
    infoEffect.value = { ...infoEffect.value }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', onDocClick)
  window.addEventListener('touchstart', onDocClick)
  window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
}

onBeforeUnmount(() => {
  if (noticeTimer) clearTimeout(noticeTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', onDocClick)
    window.removeEventListener('touchstart', onDocClick)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('scroll', onResize, true)
  }
})

function effectTagline(e: IStatusEffect): string {
  const status = presentStatus(e, props.side)
  return `${status.polarity} · ${status.counters}`
}

/**
 * "∞" cuando el efecto tiene duracion infinita (regido por cargas o por un
 * hook de combate, ej. Second Wind). Evita el texto crudo "Infinity" en la UI.
 */
</script>

<template>
  <span class="combat-status-notice" role="status" aria-live="polite" aria-atomic="true">{{ notice }}</span>
  <div
    ref="containerEl"
    class="enemy-status-icons"
    :class="[rootClass, { 'is-empty': !activeEffects.length }]"
  >
    <div
      v-for="effect in activeEffects"
      :key="effect.type"
      ref="iconEls"
      class="enemy-status-icon"
      :class="{ 'is-info-open': infoEffect?.type === effect.type, 'is-buff': effect.isBuff, 'is-debuff': !effect.isBuff }"
      :title="presentStatus(effect, side).label"
      :aria-label="presentStatus(effect, side).label"
      :aria-expanded="infoEffect?.type === effect.type"
      role="button"
      tabindex="0"
      @click="showEffectInfo(effect, $event)"
      @contextmenu.prevent="showEffectInfo(effect, $event)"
      @keydown.enter.stop.prevent="showEffectInfo(effect, $event)"
      @keydown.space.stop.prevent="showEffectInfo(effect, $event)"
    >
      <img :src="effect.icon" :alt="effect.name" />
      <span class="status-polarity" aria-hidden="true">{{ effect.isBuff ? '+' : '−' }}</span>
      <span v-if="presentStatus(effect, side).turns !== null" class="enemy-status-turns"><img :src="roundClockIcon" class="status-round-clock" alt="" aria-hidden="true" />{{ effect.turns }}</span>
      <span v-if="presentStatus(effect, side).charges !== null" class="status-charges">◆{{ effect.charges }}</span>
      <span v-if="presentStatus(effect, side).shield !== null" class="status-shield">◇{{ effect.absorbRemaining }}</span>
      <span
        v-if="presentStatus(effect, side).stacks !== null"
        class="enemy-status-stacks"
        :title="`${effect.stacks} stacks`"
      >
        ×{{ presentStatus(effect, side).stacks }}
      </span>

      <transition name="esi-info">
        <div
          v-if="false"
        ></div>
      </transition>
    </div>
  </div>

  <Teleport to="body">
    <transition name="esi-info">
      <div
        v-if="infoEffect"
        ref="popupEl"
        class="esi-info-popup"
        role="dialog"
        :aria-label="`Info de ${infoEffect.name}`"
        :style="popupStyle"
        @click.stop
      >
        <header class="esi-info-header">
          <img :src="infoEffect.icon" :alt="infoEffect.name" class="esi-info-icon" />
          <div class="esi-info-titles">
            <span class="esi-info-name">{{ infoEffect.name }}</span>
            <span class="esi-info-tag">{{ effectTagline(infoEffect) }}</span>
          </div>
          <button
            type="button"
            class="esi-info-close"
            aria-label="Cerrar"
            @click.stop="closeInfo()"
          >✕</button>
        </header>
        <p v-if="infoDescription" class="esi-info-desc">{{ infoDescription }}</p>
        <p v-else class="esi-info-desc esi-info-desc-empty">Sin descripción disponible.</p>
        <p v-if="presentStatus(infoEffect, side).rules" class="esi-info-desc">{{ presentStatus(infoEffect, side).rules }}</p>
        <span v-if="showPopupArrow" class="esi-info-arrow" :style="popupArrowStyle"></span>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
@layer combat-legacy {
.enemy-status-icons {
  position: relative;
  width: max-content;
  max-width: 100%;
  height: 28px;
  min-height: 28px;
  margin: 4px auto;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 0.2rem;
  background: rgba(30, 32, 60, 0.72);
  border-radius: 6px;
  padding: 2px 4px;
  z-index: 6;
  pointer-events: auto;
}

.enemy-status-icons.is-empty {
  visibility: hidden;
  pointer-events: none;
}

.enemy-status-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 20px;
  height: 20px;
  padding: 1px;
  border-radius: 4px;
  transition: background 0.15s;
}

.enemy-status-icon:hover,
.enemy-status-icon:focus-visible {
  background: rgba(255, 255, 255, 0.08);
  outline: none;
}

.enemy-status-icon.is-info-open {
  background: rgba(255, 230, 102, 0.2);
  outline: 1.5px solid rgba(255, 230, 102, 0.75);
}

.enemy-status-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  background: transparent;
}

.enemy-status-turns {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 2;
  background: #ff3333;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  border: 1px solid #fff;
}

.enemy-status-stacks {
  position: absolute;
  bottom: -10px;
  left: -10px;
  z-index: 2;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 999px;
  background: var(--jrpg-dot-stacks-background);
  color: var(--jrpg-dot-stacks-text);
  font-size: 0.55rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 4px rgba(179, 136, 255, 0.6), 0 1px 2px rgba(0, 0, 0, 0.6);
  border: 1px solid #1a1a2e;
  font-family: 'Courier New', monospace;
}

.esi-info-popup {
  /* position, left, top, max-width se aplican inline desde popupStyle */
  z-index: 9999;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.65), 0 0 16px rgba(255, 200, 60, 0.3);
  padding: 0.7rem 0.85rem 0.75rem;
  color: #fff;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.esi-info-popup::before {
  display: none;
}

.esi-info-arrow {
  position: absolute;
  top: -6px;
  width: 10px;
  height: 10px;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border-top: 1.5px solid rgba(255, 230, 102, 0.55);
  border-left: 1.5px solid rgba(255, 230, 102, 0.55);
}

.esi-info-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.esi-info-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.45);
  padding: 3px;
  filter: drop-shadow(0 1px 3px #000a);
  flex-shrink: 0;
}

.esi-info-titles {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.esi-info-name {
  font-family: 'Georgia', serif;
  font-size: 1rem;
  font-weight: 700;
  color: #ffe066;
  text-shadow: 0 1px 2px #000;
  line-height: 1.15;
}

.esi-info-tag {
  font-family: 'Courier New', monospace;
  font-size: 0.68rem;
  color: #b6f5b6;
  letter-spacing: 0.02em;
}

.esi-info-close {
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

.esi-info-close:hover {
  background: rgba(255, 255, 255, 0.18);
}

.esi-info-desc {
  margin: 0;
  color: #e0e0f0;
  font-size: 0.82rem;
  line-height: 1.4;
}

.esi-info-desc-empty {
  color: #777;
  font-style: italic;
}

.esi-info-enter-active,
.esi-info-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.esi-info-enter-from,
.esi-info-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
}
</style>
