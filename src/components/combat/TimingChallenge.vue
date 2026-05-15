<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { TimingCircle } from '@/core/TimingCircle'
import type { TimingCircleConfig, TimingResultData } from '@/types/timing'
import { BASIC_ATTACK_CONFIG } from '@/types/timing'

const props = defineProps<{
  config?: TimingCircleConfig
  enabled?: boolean
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

const size = computed(() => (config.value.outerRadius + 20) * 2)
const center = computed(() => size.value / 2)

const outerRadius = computed(() => config.value.outerRadius)
const innerRadius = computed(() => timingCircle.value?.getCurrentRadius() ?? config.value.outerRadius)
const criticalRadius = computed(() => config.value.criticalZoneSize)

const handleInput = () => {
  if (!isActive.value || !timingCircle.value) return
  const result = timingCircle.value.checkHit()
  isActive.value = false
  if (animationFrame) cancelAnimationFrame(animationFrame)
  emit('result', result)
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
    const result = timingCircle.value.checkHit(0)
    isActive.value = false
    emit('result', result)
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
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('click', onWindowClick)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('click', onWindowClick)
  if (animationFrame) cancelAnimationFrame(animationFrame)
})

defineExpose({ start, stop })
</script>

<template>
  <div class="timing-challenge">
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
        r="8"
        fill="#fff"
        opacity="0.8"
      />
    </svg>

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
</style>