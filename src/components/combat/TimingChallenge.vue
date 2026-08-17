<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { TimingCircle } from '@/core/TimingCircle'
import { AudioManager } from '@/core/AudioManager'
import type { TimingCircleConfig, TimingResultData, TimingResult } from '@/types/timing'
import { BASIC_ATTACK_CONFIG } from '@/types/timing'

const props = defineProps<{
  config?: TimingCircleConfig
}>()

const emit = defineEmits<{
  (e: 'result', result: TimingResultData): void
}>()

const defaultConfig = BASIC_ATTACK_CONFIG
const config = computed(() => props.config ?? defaultConfig)

const timingCircle = ref<TimingCircle | null>(null)
const isActive = ref(false)
const lastTimestamp = ref(0)
let animationFrame: number | null = null
let feedbackTimeout: number | null = null

const feedbackResult = ref<TimingResult | null>(null)
const feedbackVisible = ref(false)

const size = computed(() => (config.value.outerRadius + 20) * 2)
const center = computed(() => size.value / 2)

const outerRadius = computed(() => config.value.outerRadius)
const innerRadius = computed(() => timingCircle.value?.getCurrentRadius() ?? config.value.outerRadius)
const criticalRadius = computed(() => config.value.criticalZoneSize)
const centerDotRadius = computed(() => config.value.centerDotRadius)

const FEEDBACK_DURATION_MS = 750

const feedbackLabel = computed(() => {
  switch (feedbackResult.value) {
    case 'critical': return '¡CRÍTICO!'
    case 'bonus': return '¡BONUS!'
    case 'normal': return '¡ATAQUE!'
    case 'miss': return '¡FALLASTE!'
    default: return ''
  }
})

const feedbackClass = computed(() => {
  switch (feedbackResult.value) {
    case 'critical': return 'crit'
    case 'bonus': return 'bonus'
    case 'normal': return 'normal'
    case 'miss': return 'miss'
    default: return ''
  }
})

function clearFeedback() {
  if (feedbackTimeout !== null) {
    clearTimeout(feedbackTimeout)
    feedbackTimeout = null
  }
  feedbackResult.value = null
  feedbackVisible.value = false
}

function showFeedback(result: TimingResult) {
  feedbackResult.value = result
  feedbackVisible.value = true
  feedbackTimeout = window.setTimeout(() => {
    feedbackVisible.value = false
    feedbackResult.value = null
    feedbackTimeout = null
  }, FEEDBACK_DURATION_MS)
}

const handleInput = () => {
  if (!isActive.value || !timingCircle.value) return
  const result = timingCircle.value.checkHit()
  isActive.value = false
  if (animationFrame) cancelAnimationFrame(animationFrame)
  showFeedback(result.result)

  const audio = AudioManager.getInstance()
  if (result.result === 'critical') {
    audio.playCritSound()
  } else if (result.result === 'bonus') {
    audio.playBonusSound()
  }

  feedbackTimeout = window.setTimeout(() => {
    emit('result', result)
  }, FEEDBACK_DURATION_MS)
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && isActive.value) {
    e.preventDefault()
    handleInput()
  }
}

const onWindowClick = (e: MouseEvent) => {
  if (!isActive.value) return
  e.preventDefault()
  handleInput()
}

function animate(now: number) {
  if (!isActive.value || !timingCircle.value) return

  const delta = lastTimestamp.value ? now - lastTimestamp.value : 16
  lastTimestamp.value = now

  timingCircle.value.update(delta)

  if (timingCircle.value.getCurrentRadius() <= 0) {
    const timePressed = timingCircle.value.startTime ? performance.now() - timingCircle.value.startTime : 0
    const result: TimingResultData = {
      result: 'miss',
      accuracy: 0,
      timePressed
    }
    isActive.value = false
    showFeedback(result.result)
    feedbackTimeout = window.setTimeout(() => {
      emit('result', result)
    }, FEEDBACK_DURATION_MS)
    return
  }

  animationFrame = requestAnimationFrame(animate)
}

function start() {
  if (!timingCircle.value) {
    timingCircle.value = new TimingCircle(config.value)
  } else {
    timingCircle.value.reset()
  }

  timingCircle.value.startShrinking()
  isActive.value = true
  lastTimestamp.value = 0
  animationFrame = requestAnimationFrame(animate)
}

function stop() {
  isActive.value = false
  if (animationFrame) cancelAnimationFrame(animationFrame)
  clearFeedback()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('click', onWindowClick)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('click', onWindowClick)
  if (animationFrame) cancelAnimationFrame(animationFrame)
  clearFeedback()
})

defineExpose({ start, stop })
</script>

<template>
  <div class="timing-challenge" :class="feedbackClass">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <defs>
        <radialGradient id="criticalGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FF5722" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#FF5722" stop-opacity="0.4"/>
        </radialGradient>
        <radialGradient id="outerGradient" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stop-color="transparent"/>
          <stop offset="100%" stop-color="#4CAF50" stop-opacity="0.6"/>
        </radialGradient>
      </defs>

      <circle
        :cx="center"
        :cy="center"
        :r="outerRadius"
        fill="none"
        stroke="#fff"
        stroke-width="4"
        opacity="0.5"
      />

      <circle
        :cx="center"
        :cy="center"
        :r="outerRadius - 2"
        fill="none"
        stroke="#4CAF50"
        stroke-width="2"
        stroke-dasharray="8,4"
        opacity="0.4"
      />

      <circle
        :cx="center"
        :cy="center"
        :r="criticalRadius"
        :fill="'url(#criticalGradient)'"
      />

      <circle
        :cx="center"
        :cy="center"
        :r="innerRadius"
        fill="none"
        :stroke="config.color"
        stroke-width="6"
      />

      <g v-if="innerRadius < outerRadius && innerRadius > criticalRadius">
        <line
          :x1="center"
          :y1="center - outerRadius"
          :x2="center"
          :y2="center - innerRadius"
          :stroke="config.color"
          stroke-width="3"
          opacity="0.6"
        />
        <line
          :x1="center"
          :y1="center + outerRadius"
          :x2="center"
          :y2="center + innerRadius"
          :stroke="config.color"
          stroke-width="3"
          opacity="0.6"
        />
        <line
          :x1="center - outerRadius"
          :y1="center"
          :x2="center - innerRadius"
          :y2="center"
          :stroke="config.color"
          stroke-width="3"
          opacity="0.6"
        />
        <line
          :x1="center + outerRadius"
          :y1="center"
          :x2="center + innerRadius"
          :y2="center"
          :stroke="config.color"
          stroke-width="3"
          opacity="0.6"
        />
      </g>

      <circle
        :cx="center"
        :cy="center"
        :r="centerDotRadius"
        fill="#FFD700"
        opacity="0.95"
      />
    </svg>

    <transition name="timing-feedback">
      <div
        v-if="feedbackVisible"
        class="timing-feedback"
        :class="feedbackClass"
        :key="feedbackResult"
      >
        <div class="timing-feedback-text">{{ feedbackLabel }}</div>
      </div>
    </transition>

    <div class="timing-label">
      <span v-if="isActive">Presiona SPACE o CLICK</span>
    </div>
  </div>
</template>

<style scoped>
.timing-challenge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  position: relative;
}

svg {
  background: transparent;
}

.timing-label {
  margin-top: 1rem;
  color: #fff;
  font-size: 1.2rem;
  text-shadow: 0 0 10px rgba(0,0,0,0.8);
}

.timing-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
}

.timing-feedback-text {
  font-weight: 900;
  font-size: 4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow:
    0 0 18px currentColor,
    0 0 36px currentColor,
    0 4px 12px rgba(0, 0, 0, 0.85);
  color: #fff;
}

.timing-feedback.crit .timing-feedback-text {
  color: #ffe600;
  font-size: 5rem;
  animation: crit-text-pulse 0.75s ease-out;
}

.timing-feedback.bonus .timing-feedback-text {
  color: #4CAF50;
  font-size: 4.5rem;
  animation: bonus-text-pulse 0.75s ease-out;
}

.timing-feedback.normal .timing-feedback-text {
  color: #ff9800;
  font-size: 3.5rem;
  animation: normal-text-pulse 0.75s ease-out;
}

.timing-feedback.miss .timing-feedback-text {
  color: #ff3333;
  font-size: 3rem;
  animation: miss-text-pulse 0.75s ease-out;
}

.timing-feedback-enter-active {
  transition: transform 0.15s cubic-bezier(.68, -0.55, .27, 1.55), opacity 0.15s ease-out;
}

.timing-feedback-leave-active {
  transition: opacity 0.25s ease-in;
}

.timing-feedback-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.4) rotate(-6deg);
}

.timing-feedback-enter-to {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.15) rotate(0deg);
}

.timing-feedback-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1) rotate(0deg);
}

.timing-feedback-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.4) rotate(2deg);
}

@keyframes crit-text-pulse {
  0% { transform: scale(0.4) rotate(-6deg); filter: brightness(1.5); }
  40% { transform: scale(1.35) rotate(2deg); filter: brightness(2); }
  70% { transform: scale(1.05) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
}

@keyframes bonus-text-pulse {
  0% { transform: scale(0.5); filter: brightness(1.4); }
  50% { transform: scale(1.25); filter: brightness(1.8); }
  100% { transform: scale(1); filter: brightness(1); }
}

@keyframes normal-text-pulse {
  0% { transform: scale(0.6); }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes miss-text-pulse {
  0%, 100% { transform: scale(1); }
  25% { transform: translateX(-6px) scale(1); }
  50% { transform: translateX(6px) scale(1); }
  75% { transform: translateX(-4px) scale(1); }
}
</style>