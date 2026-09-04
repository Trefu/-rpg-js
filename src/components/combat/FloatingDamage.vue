<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export type FloatingDamageVariant = 'damage' | 'crit' | 'blocked' | 'heal' | 'miss'

interface Props {
  value: number
  variant?: FloatingDamageVariant
  /** Elemento sobre el que se ancla el popup (su centro superior). */
  targetEl: HTMLElement | null
  /** Indice de stack para que varios popups simultaneos no se solapen. */
  stackIndex?: number
  /** Prefijo opcional (ej. '-' para damage, '+' para heal). Vacio por defecto. */
  prefix?: string
  /** Duracion total del popup (entrada + drift + salida) en ms. */
  durationMs?: number
  /** Distancia maxima del drift lateral aleatorio (px). */
  driftSpreadX?: number
  /** Distancia minima del drift vertical hacia arriba (px). */
  driftMinY?: number
  /** Distancia adicional aleatoria por encima del driftMinY (px). */
  driftJitterY?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'damage',
  stackIndex: 0,
  prefix: '',
  durationMs: 1100,
  driftSpreadX: 70,
  driftMinY: 36,
  driftJitterY: 28
})

const emit = defineEmits<{
  (e: 'done'): void
}>()

const position = ref({ left: 0, top: 0 })
const driftX = ref(0)
const driftY = ref(0)
const rotateDeg = ref(0)

function measure() {
  const el = props.targetEl
  if (!el) return
  const rect = el.getBoundingClientRect()
  // Anclaje: centro horizontal, ~35% desde arriba del sprite (cabeza).
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height * 0.35
  // Stack vertical: empuja hacia abajo cada popup extra para que no se monten.
  const stackOffset = props.stackIndex * 28
  position.value = {
    left: cx,
    top: cy + stackOffset
  }
}

function rollDrift() {
  driftX.value = Math.round((Math.random() - 0.5) * props.driftSpreadX)
  driftY.value = -(props.driftMinY + Math.round(Math.random() * props.driftJitterY))
  rotateDeg.value = Math.round((Math.random() - 0.5) * 14)
}

let rafId = 0

onMounted(() => {
  rollDrift()
  measure()
  // Re-medir tras el próximo frame (algunos layouts asíncronos, p.ej. fuentes).
  rafId = window.requestAnimationFrame(measure)
  window.addEventListener('resize', measure, { passive: true })
  window.addEventListener('scroll', measure, { passive: true, capture: true })
  window.setTimeout(() => emit('done'), props.durationMs)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  window.removeEventListener('scroll', measure, { capture: true } as EventListenerOptions)
  if (rafId) cancelAnimationFrame(rafId)
})

const label = computed(() => `${props.prefix}${props.value}`)
const isCrit = computed(() => props.variant === 'crit')
</script>

<template>
  <Teleport to="body">
    <div
      class="floating-damage"
      :class="[`variant-${variant}`, { crit: isCrit }]"
      :style="{
        left: `${position.left}px`,
        top: `${position.top}px`,
        '--fd-drift-x': `${driftX}px`,
        '--fd-drift-y': `${driftY}px`,
        '--fd-rotate': `${rotateDeg}deg`,
        '--fd-duration': `${durationMs}ms`
      }"
      aria-hidden="true"
    >{{ label }}</div>
  </Teleport>
</template>

<style scoped>
.floating-damage {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transform: translate(-50%, -50%);
  font-family: 'Courier New', ui-monospace, monospace;
  font-weight: 900;
  font-size: clamp(1.05rem, 2.4vw, 1.55rem);
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  user-select: none;
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.85),
    0 0 4px rgba(0, 0, 0, 0.9);
  animation: fd-pop var(--fd-duration, 1100ms) cubic-bezier(0.18, 0.9, 0.32, 1.15) forwards;
  will-change: transform, opacity;
}

.variant-damage {
  color: #ff5252;
}
.variant-crit {
  color: #ffe066;
  font-size: clamp(1.6rem, 3.6vw, 2.4rem);
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.9),
    0 0 14px rgba(255, 165, 0, 0.85),
    0 0 4px rgba(0, 0, 0, 0.9);
}
.variant-blocked {
  color: #7df0a0;
  font-size: clamp(0.95rem, 2vw, 1.2rem);
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.85),
    0 0 10px rgba(125, 240, 160, 0.6);
}
.variant-heal {
  color: #6cffb0;
}
.variant-miss {
  color: #b0b8c8;
  font-size: clamp(0.9rem, 1.8vw, 1.1rem);
  font-style: italic;
}

@keyframes fd-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) translate(0, 0) scale(0.55) rotate(0deg);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -50%) translate(calc(var(--fd-drift-x, 0px) * 0.25), calc(var(--fd-drift-y, 0px) * 0.2)) scale(1.25) rotate(calc(var(--fd-rotate, 0deg) * 0.4));
  }
  32% {
    opacity: 1;
    transform: translate(-50%, -50%) translate(calc(var(--fd-drift-x, 0px) * 0.55), calc(var(--fd-drift-y, 0px) * 0.5)) scale(1) rotate(calc(var(--fd-rotate, 0deg) * 0.7));
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translate(var(--fd-drift-x, 0px), var(--fd-drift-y, 0px)) scale(0.95) rotate(var(--fd-rotate, 0deg));
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-damage {
    animation-duration: 1ms;
  }
}
</style>
