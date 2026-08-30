<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { DefensePatternConfig, DefensePhaseZone, DefensePhaseResult, DefensePhaseOutcome } from '@/core/defense/types'
import { DEFENSE_BAR_WIDTH, DEFENSE_PHASE_TIMEOUT_MS, DEFAULT_WAVE_SPEED } from '@/core/defense/types'
import { isWaveInSuccessZone } from '@/core/defense/DefenseEngine'

const BAR_WIDTH = DEFENSE_BAR_WIDTH
const PHASE_TIMEOUT_MS = DEFENSE_PHASE_TIMEOUT_MS

const props = withDefaults(defineProps<{
  show: boolean
  pattern: DefensePatternConfig | null
  zones: DefensePhaseZone[]
  phaseIndex: number
  isCrit?: boolean
}>(), {
  isCrit: false
})

const emit = defineEmits<{
  (e: 'phase-complete', result: DefensePhaseResult): void
  (e: 'all-phases-complete', results: DefensePhaseResult[]): void
  (e: 'close'): void
}>()

const isActive = ref(false)
const waveColumn = ref(0)

const waveSpeed = computed(() =>
  currentZone.value?.waveSpeed
    ?? props.pattern?.waveSpeed
    ?? DEFAULT_WAVE_SPEED
)
const waveDirection = ref(1)
const lastTimestamp = ref(0)
const phaseOutcome = ref<DefensePhaseOutcome | null>(null)
const phaseOutcomes = ref<DefensePhaseOutcome[]>([])
const timeoutDuration = ref(5000)
const timeoutKey = ref(0)
let animationFrame: number | null = null
let phaseTimeoutHandle: number | null = null
const FEEDBACK_DURATION_MS = 600

const barWidth = BAR_WIDTH

const waveLeft = computed(() => `${(waveColumn.value / barWidth) * 100}%`)

const phaseResults = ref<DefensePhaseResult[]>([])

const currentZone = computed<DefensePhaseZone | null>(() => {
  return props.zones[props.phaseIndex] ?? null
})

const feedbackClass = computed(() => {
  switch (phaseOutcome.value) {
    case 'success': return 'success'
    case 'fail': return 'fail'
    case 'timeout': return 'timeout'
    default: return ''
  }
})

const feedbackLabel = computed(() => {
  switch (phaseOutcome.value) {
    case 'success': return '¡BLOQUEADO!'
    case 'fail': return '¡FALLASTE!'
    case 'timeout': return '¡TIEMPO!'
    default: return ''
  }
})

const isLastPhase = computed(() => props.phaseIndex >= (props.pattern?.phases?.length ?? 1) - 1)

const phaseHeader = computed(() => `Fase ${props.phaseIndex + 1} / ${props.pattern?.phases?.length ?? 1}`)

function clearPhaseTimeout() {
  if (phaseTimeoutHandle !== null) {
    clearTimeout(phaseTimeoutHandle)
    phaseTimeoutHandle = null
  }
}

function resetForPhase() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  waveColumn.value = 0
  waveDirection.value = 1
  lastTimestamp.value = 0
  phaseOutcome.value = null
  isActive.value = true
  clearPhaseTimeout()
  if (props.pattern) {
    timeoutDuration.value = PHASE_TIMEOUT_MS
    timeoutKey.value++
    phaseTimeoutHandle = window.setTimeout(() => {
      handleTimeout()
    }, PHASE_TIMEOUT_MS)
  }
}

function handleTimeout() {
  if (!isActive.value) return
  isActive.value = false
  if (animationFrame) cancelAnimationFrame(animationFrame)
  phaseOutcome.value = 'timeout'
  const zone = currentZone.value!
  const result: DefensePhaseResult = {
    outcome: 'timeout',
    waveColumn: barWidth,
    zone
  }
  phaseResults.value.push(result)
  phaseOutcomes.value.push('timeout')
  finalizePhase(result)
}

function handleInput() {
  if (!isActive.value || !props.pattern || !currentZone.value) return
  isActive.value = false
  if (animationFrame) cancelAnimationFrame(animationFrame)
  clearPhaseTimeout()
  const col = waveColumn.value
  const success = isWaveInSuccessZone(col, currentZone.value)
  const outcome: DefensePhaseOutcome = success ? 'success' : 'fail'
  phaseOutcome.value = outcome
  const result: DefensePhaseResult = {
    outcome,
    waveColumn: col,
    zone: currentZone.value
  }
  phaseResults.value.push(result)
  phaseOutcomes.value.push(outcome)
  finalizePhase(result)
}

function finalizePhase(result: DefensePhaseResult) {
  setTimeout(() => {
    emit('phase-complete', result)
    if (isLastPhase.value) {
      emit('all-phases-complete', phaseResults.value)
    }
  }, FEEDBACK_DURATION_MS)
}

function animate(now: number) {
  if (!isActive.value || !props.pattern) return
  const delta = lastTimestamp.value ? now - lastTimestamp.value : 16
  lastTimestamp.value = now
  waveColumn.value += (delta / 1000) * waveSpeed.value * waveDirection.value
  if (waveColumn.value >= barWidth) {
    waveColumn.value = barWidth
    waveDirection.value = -1
  } else if (waveColumn.value <= 0) {
    waveColumn.value = 0
    waveDirection.value = 1
  }
  animationFrame = requestAnimationFrame(animate)
}

function onKeydown(e: KeyboardEvent) {
  if (!props.show) return
  if (e.code === 'Space') {
    if (isActive.value) {
      e.preventDefault()
      handleInput()
    }
  } else if (e.code === 'Escape') {
    emit('close')
  }
}

function onPointerDown(e: PointerEvent) {
  if (!isActive.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  e.preventDefault()
  handleInput()
}

watch(() => props.show, (val) => {
  if (val && props.pattern) {
    phaseResults.value = []
    phaseOutcomes.value = []
    resetForPhase()
    animationFrame = requestAnimationFrame(animate)
  } else {
    isActive.value = false
    if (animationFrame) cancelAnimationFrame(animationFrame)
    clearPhaseTimeout()
    phaseOutcome.value = null
  }
})

watch(() => props.phaseIndex, (val) => {
  if (props.show && props.pattern && val >= 0 && val < (props.pattern.phases?.length ?? 1)) {
    resetForPhase()
    animationFrame = requestAnimationFrame(animate)
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (animationFrame) cancelAnimationFrame(animationFrame)
  clearPhaseTimeout()
})
</script>

<template>
  <div v-if="show && pattern" class="defense-overlay" :class="[feedbackClass, { 'is-crit': isCrit }]" @pointerdown="onPointerDown">
    <div class="defense-modal">
      <div class="defense-header">
        <h3>¡DEFENDE!</h3>
        <span class="phase-counter">{{ phaseHeader }}</span>
      </div>

      <div class="defense-timeout-bar-wrap">
        <div class="defense-timeout-bar">
          <div class="defense-timeout-fill" :key="timeoutKey" :style="{ animationDuration: timeoutDuration + 'ms' }"></div>
        </div>
      </div>

      <div class="defense-bar-wrap">
        <div class="defense-bar">
          <div
            v-for="i in barWidth"
            :key="i"
            class="defense-column"
            :class="{
              success: !!currentZone && currentZone.successColumns.includes(i - 1),
              'under-wave': waveColumn >= i - 1 && waveColumn <= i
            }"
          />
          <div class="wave-cursor" :style="{ left: waveLeft }">
            <div class="wave-cursor-inner"></div>
          </div>
        </div>
      </div>

      <div class="defense-progress">
        <div class="phase-dot"
          v-for="(_, i) in phaseOutcomes"
          :key="i"
          :class="{
            success: phaseOutcomes[i] === 'success',
            fail: phaseOutcomes[i] === 'fail',
            timeout: phaseOutcomes[i] === 'timeout'
          }">
          {{ i + 1 }}
        </div>
        <div class="phase-dot pending"
          v-for="i in ((pattern.phases?.length ?? 1) - phaseOutcomes.length)"
          :key="`p-${i}`">
          ·
        </div>
      </div>

      <div class="defense-cta">
        <span class="cta-key">ESPACIO</span>
        <span class="cta-text">para bloquear</span>
      </div>

      <transition name="defense-feedback">
        <div v-if="phaseOutcome" class="defense-feedback" :class="feedbackClass">
          <div class="defense-feedback-text">{{ feedbackLabel }}</div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.defense-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 20, 0.85);
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.defense-overlay.success {
  box-shadow: inset 0 0 80px 10px #4CAF5088;
}

.defense-overlay.success.is-crit {
  box-shadow: inset 0 0 80px 10px #b388ff99;
}

.defense-overlay.fail,
.defense-overlay.timeout {
  box-shadow: inset 0 0 80px 10px #ff333399;
}

.defense-modal {
  background: rgba(0, 0, 0, 0.92);
  border: 3px solid #4CAF50;
  border-radius: 14px;
  padding: 1.5rem 2rem;
  width: min(680px, 92vw);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 10px 40px #000a;
}

.defense-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.defense-header h3 {
  margin: 0;
  color: #ffe600;
  font-size: 1.4rem;
  letter-spacing: 0.06em;
  text-shadow: 0 0 12px #ffe60088;
}

.phase-counter {
  color: #ccc;
  font-weight: bold;
  font-size: 0.95rem;
}

.defense-bar-wrap {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 1rem 1.5rem;
  cursor: pointer;
  user-select: none;
}

.defense-timeout-bar-wrap {
  padding: 0 1.5rem;
}

.defense-timeout-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.defense-timeout-fill {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #4CAF50 0%, #ffe600 60%, #ff3333 100%);
  transform-origin: left center;
  animation-name: timeout-drain;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes timeout-drain {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

.defense-bar {
  position: relative;
  display: flex;
  align-items: center;
  height: 60px;
  gap: 4px;
}

.defense-column {
  flex: 1;
  height: 50px;
  background: rgba(180, 30, 30, 0.55);
  border-radius: 4px;
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.defense-column.success {
  background: rgba(60, 180, 80, 0.7);
  box-shadow: 0 0 8px rgba(60, 180, 80, 0.5);
}

.defense-bar-wrap.is-crit-mode ~ * .defense-column.success,
.defense-overlay.is-crit .defense-column.success {
  background: rgba(160, 80, 220, 0.78);
  box-shadow: 0 0 12px rgba(179, 136, 255, 0.85), 0 0 22px rgba(160, 80, 220, 0.5);
}

.defense-column.under-wave {
  transform: scaleY(1.15);
  box-shadow: 0 0 14px rgba(255, 230, 0, 0.7);
}

.wave-cursor {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 14px;
  transform: translateX(-50%);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
}

.wave-cursor-inner {
  width: 100%;
  height: 70px;
  background: linear-gradient(180deg, rgba(255, 230, 0, 0.95), rgba(255, 152, 0, 0.85));
  border-radius: 4px;
  box-shadow: 0 0 18px rgba(255, 230, 0, 0.85);
  border: 2px solid #fff;
}

.defense-progress {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.phase-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #333;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.85rem;
  border: 2px solid #555;
}

.phase-dot.success {
  background: #4CAF50;
  border-color: #2e7d32;
  color: #fff;
}

.defense-overlay.is-crit .phase-dot.success {
  background: #b388ff;
  border-color: #7c4dff;
  color: #1a0033;
  box-shadow: 0 0 12px rgba(179, 136, 255, 0.7);
}

.phase-dot.fail,
.phase-dot.timeout {
  background: #ff3333;
  border-color: #b71c1c;
  color: #fff;
}

.phase-dot.pending {
  background: #222;
  color: #666;
  border-color: #444;
}

.defense-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  color: #fff;
  font-size: 1rem;
}

.cta-key {
  background: linear-gradient(180deg, #fff7c2 0%, #ffe600 100%);
  color: #1a1a2e;
  font-weight: 900;
  padding: 0.2rem 0.8rem;
  border-radius: 6px;
  border: 2px solid #1a1a2e;
  border-bottom-width: 3px;
  box-shadow: 0 2px 0 #b29600, 0 2px 4px #000a;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.08em;
}

.cta-text {
  text-shadow: 0 1px 3px #000a;
}

.defense-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
  contain: layout paint;
  will-change: transform, opacity;
}

.defense-feedback-text {
  font-weight: 900;
  font-size: 3.5rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow: 0 0 10px currentColor, 0 3px 6px rgba(0, 0, 0, 0.85);
  color: #fff;
  text-align: center;
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.defense-feedback.success .defense-feedback-text {
  color: #4CAF50;
  animation: success-pulse 0.6s ease-out;
}

.defense-overlay.is-crit .defense-feedback.success .defense-feedback-text {
  color: #b388ff;
  text-shadow: 0 0 10px #b388ff, 0 3px 6px rgba(0, 0, 0, 0.85);
}

.defense-feedback.fail .defense-feedback-text,
.defense-feedback.timeout .defense-feedback-text {
  color: #ff3333;
  animation: fail-pulse 0.6s ease-out;
}

.defense-feedback-enter-active {
  transition: transform 0.15s cubic-bezier(.68, -0.55, .27, 1.55), opacity 0.15s ease-out;
}

.defense-feedback-leave-active {
  transition: opacity 0.25s ease-in;
}

.defense-feedback-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.4);
}

.defense-feedback-enter-to {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.15);
}

.defense-feedback-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.defense-feedback-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.4);
}

@keyframes success-pulse {
  0%   { transform: scale(0.5);  opacity: 0.4; }
  50%  { transform: scale(1.2);  opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}

@keyframes fail-pulse {
  0%, 100% { transform: scale(1); }
  25% { transform: translateX(-6px) scale(1); }
  50% { transform: translateX(6px) scale(1); }
  75% { transform: translateX(-4px) scale(1); }
}

@media (max-width: 720px) {
  .defense-feedback-text {
    font-size: 2.4rem;
    letter-spacing: 0.04em;
    text-shadow: 0 0 8px currentColor, 0 2px 4px rgba(0, 0, 0, 0.85);
  }
  .defense-overlay.is-crit .defense-feedback.success .defense-feedback-text {
    text-shadow: 0 0 8px #b388ff, 0 2px 4px rgba(0, 0, 0, 0.85);
  }
  .defense-feedback.success .defense-feedback-text,
  .defense-feedback.fail .defense-feedback-text,
  .defense-feedback.timeout .defense-feedback-text {
    animation-duration: 0.45s;
  }
}
</style>
