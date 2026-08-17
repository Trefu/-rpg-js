<script setup lang="ts">
import { computed } from 'vue'
import type { Hero } from '@/core/Hero'

interface Props {
  hero: Hero | null
  index: number
  isActive: boolean
}

const props = defineProps<Props>()

const hpPercent = computed(() => {
  if (!props.hero || props.hero.maxHealth <= 0) return 0
  return Math.max(0, Math.min(100, (props.hero.health / props.hero.maxHealth) * 100))
})

const energyPercent = computed(() => {
  if (!props.hero || !props.hero.maxEnergy) return 0
  return Math.max(0, Math.min(100, (props.hero.energy / props.hero.maxEnergy) * 100))
})

const hpDisplay = computed(() => {
  if (!props.hero) return ''
  return `${props.hero.health}/${props.hero.maxHealth}`
})

const energyDisplay = computed(() => {
  if (!props.hero) return ''
  return `${props.hero.energy}/${props.hero.maxEnergy}`
})
</script>

<template>
  <div class="hero-card" :class="{ empty: !hero, active: isActive }">
    <template v-if="hero">
      <div class="hero-portrait">
        <img :src="hero.sprite" :alt="hero.name" class="hero-sprite" />
        <div v-if="isActive" class="active-badge">ACTIVO</div>
      </div>
      <div class="hero-info">
        <div class="hero-name">{{ hero.name }}</div>
        <div class="hero-level">Nivel {{ hero.level }}</div>
        <div class="hero-bars">
          <div class="bar-line">
            <div class="bar-track">
              <div class="bar-fill bar-hp" :style="{ width: `${hpPercent}%` }"></div>
            </div>
            <span class="bar-value">{{ hpDisplay }}</span>
          </div>
          <div class="bar-line">
            <div class="bar-track">
              <div class="bar-fill bar-energy" :style="{ width: `${energyPercent}%` }"></div>
            </div>
            <span class="bar-value">{{ energyDisplay }}</span>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="empty-slot"></div>
    </template>
  </div>
</template>

<style scoped>
.hero-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: linear-gradient(135deg, rgba(40, 30, 60, 0.85) 0%, rgba(25, 15, 45, 0.95) 100%);
  border: 2px solid rgba(180, 160, 220, 0.25);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  min-height: 96px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.hero-card.active {
  border-color: #ffe066;
  box-shadow: 0 0 14px rgba(255, 230, 102, 0.55), 0 2px 8px rgba(0, 0, 0, 0.45);
}

.hero-card.empty {
  background: rgba(20, 15, 30, 0.4);
  border-style: dashed;
  border-color: rgba(180, 160, 220, 0.18);
  opacity: 0.7;
}

.hero-portrait {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-sprite {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.active-badge {
  position: absolute;
  top: 2px;
  left: 2px;
  background: #ffe066;
  color: #1a1a2e;
  font-size: 0.55rem;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hero-name {
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  text-shadow: 0 1px 2px #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-level {
  color: #b6f5b6;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero-bars {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.bar-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-hp {
  background: linear-gradient(90deg, #ff6b6b, #ff3a3a);
}

.bar-energy {
  background: linear-gradient(90deg, #40c4ff, #82b1ff);
}

.bar-value {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
  min-width: 48px;
  text-align: right;
}

.empty-slot {
  width: 100%;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
