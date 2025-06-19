<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineExpose, computed } from 'vue'

interface Area {
  startAngle: number // en grados, 0 = arriba
  endAngle: number   // en grados
  type: 'normal' | 'bonificado' | 'critico'
  color: string      // color para el área
}

const props = defineProps<{
  areas: Area[]                // Áreas especiales del círculo
  pointerSpeed: number         // Velocidad de rotación (grados/segundo)
  multiCircles?: Area[][]      // Para habilidades avanzadas: varios círculos
  radius?: number              // Radio del círculo (opcional)
  autoFailOnFullCircle?: boolean // Si true, al dar una vuelta completa se emite 'normal'
}>()

const emit = defineEmits<{
  (e: 'result', result: { type: Area['type'], area: Area | null }): void
}>()

const pointerAngle = ref(0)
const isRunning = ref(false)
let animationFrame: number | null = null
let lastAngle = 0

// SVG size helpers
const size = computed(() => props.radius ? props.radius * 2 : 200)
const center = computed(() => size.value / 2)
const circleRadius = computed(() => (props.radius ?? 100) - 10) // margen de 10px

function start() {
  isRunning.value = true
  pointerAngle.value = 0
  lastAngle = 0
  animate()
}

function stop(forceNormal = false) {
  isRunning.value = false
  if (animationFrame) cancelAnimationFrame(animationFrame)
  // Determinar en qué área cayó el puntero
  let resultType: Area['type'] = 'normal'
  let hit: Area | null = null
  if (!forceNormal) {
    hit = props.areas.find(area =>
      pointerAngle.value >= area.startAngle && pointerAngle.value <= area.endAngle
    ) || null
    resultType = hit?.type ?? 'normal'
  }
  emit('result', { type: resultType, area: hit })
}

function animate() {
  if (!isRunning.value) return
  lastAngle = pointerAngle.value
  pointerAngle.value = (pointerAngle.value + props.pointerSpeed / 60)
  // Si pasa de 360° y autoFailOnFullCircle está activo, termina como normal
  if (props.autoFailOnFullCircle && pointerAngle.value >= 360) {
    pointerAngle.value = 360
    stop(true)
    return
  }
  pointerAngle.value = pointerAngle.value % 360
  animationFrame = requestAnimationFrame(animate)
}

// Control con barra espaciadora
function onKeydown(e: KeyboardEvent) {
  if (isRunning.value && e.code === 'Space') {
    stop()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (animationFrame) cancelAnimationFrame(animationFrame)
})

defineExpose({ start, stop })

// Utilidad para describir arcos en SVG
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'L', cx, cy,
    'Z'
  ].join(' ')
}
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180.0
  return {
    x: cx + (r * Math.cos(rad)),
    y: cy + (r * Math.sin(rad))
  }
}
</script>

<template>
  <div class="timing-circle">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
    >
      <!-- Línea de fallo (ángulo 0°/360°) -->
      <line
        :x1="center"
        :y1="center"
        :x2="center"
        :y2="center - circleRadius"
        stroke="#ff3333"
        stroke-width="4"
        stroke-dasharray="6,4"
      />
      <!-- Áreas -->
      <template v-for="(area, i) in areas" :key="i">
        <path
          :d="describeArc(center, center, circleRadius, area.startAngle, area.endAngle)"
          :fill="area.color"
          :stroke="'#222'"
          stroke-width="2"
          opacity="0.7"
        />
      </template>
      <!-- Círculo base -->
      <circle :cx="center" :cy="center" :r="circleRadius" fill="none" stroke="#fff" stroke-width="6"/>
      <!-- Puntero -->
      <g>
        <line
          :x1="center"
          :y1="center"
          :x2="center + Math.sin(pointerAngle * Math.PI / 180) * circleRadius"
          :y2="center - Math.cos(pointerAngle * Math.PI / 180) * circleRadius"
          stroke="#fff"
          stroke-width="4"
        />
      </g>
    </svg>
    <slot />
  </div>
</template>

<style scoped>
.timing-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.7);
  border-radius: 16px;
  padding: 2rem;
  z-index: 2000;
}
svg {
  user-select: none;
  background: transparent;
}
</style> 