<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Hero } from '@/core/Hero'
import type { IEnemy } from '@/core/interfaces/ICharacter'
import { MAX_HEROES } from '@/stores/game'
import EnemyStatusIcons from './EnemyStatusIcons.vue'
import heartIcon from '@/assets/icons/heart-bottle.png'
import boltIcon from '@/assets/icons/bolt-shield.png'
import ogreIcon from '@/assets/icons/ogre.png'
import partyIcon from '@/assets/icons/team-idea.png'

const props = defineProps<{
  player: Hero | null
  heroes: Hero[]
  enemies: IEnemy[]
  aliveIndexByEnemyId: Record<string, number>
  isPlayerTurn: boolean
  isSelectingTarget?: boolean
  canTargetAllies?: boolean
  activeHeroIndex?: number
  /** IDs de heroes recibiendo actualmente un ataque enemigo (incluye target principal y splashes). */
  attackedHeroIds?: string[]
}>()

const emit = defineEmits<{
  (e: 'rotateHero'): void
  (e: 'selectEnemy', enemy: IEnemy): void
  (e: 'selectAlly', hero: Hero): void
}>()

const heroSlots = computed<(Hero | null)[]>(() => {
  const slots: (Hero | null)[] = []
  for (let i = 0; i < MAX_HEROES; i++) slots.push(props.heroes[i] ?? null)
  return slots
})

const hpPercent = computed(() => {
  if (!props.player || props.player.maxHealth <= 0) return 0
  return Math.max(0, (props.player.health / props.player.maxHealth) * 100)
})

const energyPercent = computed(() => {
  if (!props.player || !props.player.maxEnergy) return 0
  return Math.max(0, (props.player.energy / props.player.maxEnergy) * 100)
})

const hpDisplay = computed(() =>
  props.player ? `${props.player.health}/${props.player.maxHealth}` : ''
)
const energyDisplay = computed(() =>
  props.player ? `${props.player.energy}/${props.player.maxEnergy}` : ''
)

const aliveEnemies = computed(() => props.enemies.filter(e => e.isAlive))

const aliveAllies = computed(() => props.heroes.filter(h => h.isAlive))

const allyIndexByHeroId = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {}
  aliveAllies.value.forEach((h, idx) => { map[h.id] = idx })
  return map
})

function enemyHpPercent(e: IEnemy) {
  if (e.maxHealth <= 0) return 0
  return Math.max(0, (e.health / e.maxHealth) * 100)
}

function heroHpPercent(h: Hero) {
  if (h.maxHealth <= 0) return 0
  return Math.max(0, (h.health / h.maxHealth) * 100)
}

function heroEnergyPercent(h: Hero) {
  if (!h.maxEnergy) return 0
  return Math.max(0, (h.energy / h.maxEnergy) * 100)
}

const showEnemyPreview = ref(false)
const showAllyPreview = ref(false)
function toggleEnemyPreview() {
  showEnemyPreview.value = !showEnemyPreview.value
  if (showEnemyPreview.value) showAllyPreview.value = false
}
function toggleAllyPreview() {
  showAllyPreview.value = !showAllyPreview.value
  if (showAllyPreview.value) showEnemyPreview.value = false
}

const isAllyTargeting = computed(
  () => !!props.isSelectingTarget && !!props.canTargetAllies
)

function onHeroPortraitClick() {
  if (isAllyTargeting.value) {
    toggleAllyPreview()
    return
  }
  if (props.heroes.length > 1) emit('rotateHero')
}

function onAllyRowClick(hero: Hero | null) {
  if (!hero) return
  if (isAllyTargeting.value) {
    if (!hero.isAlive) return
    emit('selectAlly', hero)
    return
  }
  emit('rotateHero')
}
</script>

<template>
  <div v-if="player" class="mobile-hud">
    <button
      class="mobile-hud-hero"
      :class="{ 'mobile-hud-hero-targeting': isAllyTargeting }"
      type="button"
      :title="isAllyTargeting ? 'Seleccionar aliado' : (heroSlots.length > 1 ? 'Cambiar héroe' : '')"
      @click="onHeroPortraitClick"
    >
      <img v-if="player.sprite" :src="player.sprite" :alt="player.name" class="mobile-hud-portrait" />
      <div class="mobile-hud-info">
        <div class="mobile-hud-name">
          <span class="mobile-hud-name-text">
            {{ isAllyTargeting ? 'Seleccionar aliado' : player.name }}
          </span>
          <span class="mobile-hud-level">Nv {{ player.level }}</span>
        </div>
        <div class="mobile-hud-bar">
          <div class="mobile-hud-bar-fill hp" :style="{ width: `${hpPercent}%` }"></div>
          <span class="mobile-hud-bar-value">
            <img :src="heartIcon" alt="" class="mobile-hud-bar-icon" />
            {{ hpDisplay }}
          </span>
        </div>
        <div class="mobile-hud-bar">
          <div class="mobile-hud-bar-fill energy" :style="{ width: `${energyPercent}%` }"></div>
          <span class="mobile-hud-bar-value">
            <img :src="boltIcon" alt="" class="mobile-hud-bar-icon" />
            {{ energyDisplay }}
          </span>
        </div>
      </div>
    </button>

    <div class="mobile-hud-side">
      <button
        class="mobile-hud-side-btn mobile-hud-party"
        type="button"
        @click="toggleAllyPreview"
        :aria-expanded="showAllyPreview"
        :title="'Ver estado de los héroes'"
      >
        <span class="mobile-hud-side-count">{{ heroes.filter(h => h).length }}/{{ MAX_HEROES }}</span>
        <img :src="partyIcon" alt="" class="mobile-hud-side-icon" />
        <span class="mobile-hud-side-label">equipo</span>
      </button>

      <button
        class="mobile-hud-side-btn mobile-hud-enemies"
        type="button"
        @click="toggleEnemyPreview"
        :aria-expanded="showEnemyPreview"
      >
        <span class="mobile-hud-side-count">{{ aliveEnemies.length }}</span>
        <img :src="ogreIcon" alt="" class="mobile-hud-side-icon" />
        <span class="mobile-hud-side-label">enemigos</span>
      </button>
    </div>

    <transition name="enemy-preview">
      <div v-if="showEnemyPreview" class="mobile-hud-enemy-preview">
        <button
          v-for="(enemy, idx) in enemies"
          :key="enemy.id"
          type="button"
          class="mobile-hud-enemy-row"
          :class="{ dead: !enemy.isAlive }"
          @click="enemy.isAlive && emit('selectEnemy', enemy)"
        >
          <span class="mobile-hud-enemy-key">{{ idx + 1 }}</span>
          <img v-if="enemy.sprite" :src="enemy.sprite" :alt="enemy.name" class="mobile-hud-enemy-sprite" />
          <span class="mobile-hud-enemy-name">{{ enemy.name }}</span>
          <div class="mobile-hud-enemy-bar">
            <div class="mobile-hud-enemy-bar-fill" :style="{ width: `${enemyHpPercent(enemy)}%` }"></div>
          </div>
          <span class="mobile-hud-enemy-hp">{{ enemy.health }}/{{ enemy.maxHealth }}</span>
        </button>
      </div>
    </transition>

    <transition name="enemy-preview">
      <div v-if="showAllyPreview" class="mobile-hud-enemy-preview mobile-hud-ally-preview">
        <div class="mobile-hud-ally-hint">
          {{ isAllyTargeting ? 'Toca un aliado para seleccionarlo' : 'Toca un héroe para cambiarlo' }}
        </div>
        <button
          v-for="(hero, idx) in heroSlots"
          :key="hero?.id ?? `empty-${idx}`"
          type="button"
          class="mobile-hud-ally-row"
          :class="{
            dead: !hero || !hero.isAlive,
            active: hero && props.activeHeroIndex === idx,
            targeting: isAllyTargeting && hero && hero.isAlive,
            empty: !hero,
            'being-attacked': !!hero && (props.attackedHeroIds ?? []).includes(hero.id)
          }"
          :disabled="!hero || (!hero.isAlive && !isAllyTargeting)"
          @click="onAllyRowClick(hero)"
        >
          <span class="mobile-hud-ally-slot">#{{ idx + 1 }}</span>
          <img v-if="hero?.sprite" :src="hero.sprite" :alt="hero?.name ?? ''" class="mobile-hud-ally-sprite" />
          <span v-else class="mobile-hud-ally-sprite mobile-hud-ally-sprite-empty">—</span>
          <div class="mobile-hud-ally-body">
            <div class="mobile-hud-ally-head">
              <span class="mobile-hud-ally-name">{{ hero?.name ?? 'Vacío' }}</span>
              <span v-if="hero" class="mobile-hud-ally-level">Nv {{ hero.level }}</span>
              <span v-if="hero && (props.attackedHeroIds ?? []).includes(hero.id)" class="mobile-hud-ally-being-attacked">¡TE ATACAN!</span>
            </div>
            <template v-if="hero">
              <div class="mobile-hud-ally-bar">
                <div class="mobile-hud-ally-bar-fill hp" :style="{ width: `${heroHpPercent(hero)}%` }"></div>
                <span class="mobile-hud-ally-bar-value">
                  <img :src="heartIcon" alt="" class="mobile-hud-ally-bar-icon" />
                  {{ hero.health }}/{{ hero.maxHealth }}
                </span>
              </div>
              <div v-if="hero.maxEnergy" class="mobile-hud-ally-bar">
                <div class="mobile-hud-ally-bar-fill energy" :style="{ width: `${heroEnergyPercent(hero)}%` }"></div>
                <span class="mobile-hud-ally-bar-value">
                  <img :src="boltIcon" alt="" class="mobile-hud-ally-bar-icon" />
                  {{ hero.energy }}/{{ hero.maxEnergy }}
                </span>
              </div>
              <EnemyStatusIcons
                v-if="hero.statusEffects && hero.statusEffects.length"
                :effects="hero.statusEffects"
                class="mobile-hud-ally-effects"
              />
            </template>
          </div>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.mobile-hud {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem 0.5rem 3.25rem;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.55) 100%);
  border-bottom: 1px solid rgba(255, 230, 102, 0.35);
  backdrop-filter: blur(6px);
}

.mobile-hud-hero {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  border: 1.5px solid rgba(255, 230, 102, 0.35);
  background: linear-gradient(145deg, #2a1f4a 0%, #1a1230 100%);
  color: #fff;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

.mobile-hud-portrait {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  image-rendering: pixelated;
  background: #000;
}

.mobile-hud-info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mobile-hud-name {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem;
  min-width: 0;
}

.mobile-hud-name-text {
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-hud-level {
  font-size: 0.6rem;
  color: #b6f5b6;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.mobile-hud-bar {
  position: relative;
  height: 12px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.mobile-hud-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.mobile-hud-bar-fill.hp {
  background: linear-gradient(90deg, #ff6b6b, #ff3a3a);
}

.mobile-hud-bar-fill.energy {
  background: linear-gradient(90deg, #40c4ff, #82b1ff);
}

.mobile-hud-bar-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
}

.mobile-hud-bar-icon {
  width: 11px;
  height: 11px;
  object-fit: contain;
  filter: drop-shadow(0 1px 1px #000a);
  flex-shrink: 0;
}

.mobile-hud-side {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-hud-side-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 56px;
  height: 38px;
  border-radius: 10px;
  border: 1.5px solid rgba(255, 230, 102, 0.45);
  background: linear-gradient(145deg, #2a1f4a 0%, #1a1230 100%);
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  padding: 2px;
}

.mobile-hud-party {
  border-color: rgba(102, 255, 178, 0.55);
  background: linear-gradient(145deg, #16302a 0%, #0c1c18 100%);
}

.mobile-hud-enemies {
  border-color: rgba(255, 80, 80, 0.55);
  background: linear-gradient(145deg, #2a0e0e 0%, #180606 100%);
}

.mobile-hud-side-count {
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  font-weight: 900;
  color: #ffe066;
  line-height: 1;
}

.mobile-hud-side-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: drop-shadow(0 1px 1px #000a);
}

.mobile-hud-side-label {
  font-size: 0.5rem;
  letter-spacing: 0.04em;
  color: #b6f5b6;
  text-transform: uppercase;
  line-height: 1;
}

.mobile-hud-enemies .mobile-hud-side-label {
  color: #ff9a9a;
}

.mobile-hud-enemy-preview {
  position: absolute;
  top: calc(100% + 4px);
  left: 0.5rem;
  right: 0.5rem;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.45);
  border-radius: 10px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  z-index: 25;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
  max-height: 60vh;
  overflow-y: auto;
}

.mobile-hud-ally-preview {
  border-color: rgba(102, 255, 178, 0.55);
}

.mobile-hud-ally-hint {
  font-size: 0.7rem;
  color: #b6f5b6;
  text-align: center;
  padding: 0.15rem 0.25rem 0.35rem;
  border-bottom: 1px solid rgba(102, 255, 178, 0.25);
  margin-bottom: 0.15rem;
}

.mobile-hud-hero-targeting {
  border-color: rgba(102, 255, 178, 0.85) !important;
  box-shadow: 0 0 0 2px rgba(102, 255, 178, 0.35);
  animation: mobile-hud-targeting-pulse 1.2s ease-in-out infinite;
}

@keyframes mobile-hud-targeting-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(102, 255, 178, 0.35); }
  50% { box-shadow: 0 0 0 4px rgba(102, 255, 178, 0.55); }
}

.mobile-hud-enemy-row {
  display: grid;
  grid-template-columns: 18px 32px 1fr 1fr auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}

.mobile-hud-enemy-row.dead {
  opacity: 0.4;
  cursor: default;
  filter: grayscale(0.8);
}

.mobile-hud-enemy-key {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  font-weight: 900;
  color: #ffe066;
  background: rgba(255, 230, 0, 0.12);
  border: 1px solid rgba(255, 230, 0, 0.4);
  border-radius: 4px;
  text-align: center;
  padding: 1px 0;
}

.mobile-hud-enemy-sprite {
  width: 32px;
  height: 32px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
}

.mobile-hud-enemy-name {
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-hud-enemy-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mobile-hud-enemy-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #66bb6a, #43a047);
  transition: width 0.3s ease;
}

.mobile-hud-enemy-hp {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  color: #fff;
}

.mobile-hud-ally-row {
  display: grid;
  grid-template-columns: 28px 40px 1fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(102, 255, 178, 0.25);
  background: linear-gradient(145deg, rgba(22, 48, 42, 0.7) 0%, rgba(12, 28, 24, 0.7) 100%);
  color: #fff;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}

.mobile-hud-ally-row.active {
  border-color: rgba(255, 230, 102, 0.7);
  box-shadow: 0 0 0 1.5px rgba(255, 230, 102, 0.35);
}

.mobile-hud-ally-row.being-attacked {
  border-color: rgba(255, 68, 85, 0.95);
  box-shadow: 0 0 0 2px rgba(255, 68, 85, 0.55), 0 0 14px rgba(255, 51, 68, 0.6);
  animation: mobile-hud-being-attacked-pulse 0.8s ease-in-out infinite;
}

@keyframes mobile-hud-being-attacked-pulse {
  0%, 100% {
    box-shadow: 0 0 0 1.5px rgba(255, 68, 85, 0.45), 0 0 8px rgba(255, 51, 68, 0.35);
  }
  50% {
    box-shadow: 0 0 0 2.5px rgba(255, 68, 85, 0.85), 0 0 18px rgba(255, 51, 68, 0.8);
  }
}

.mobile-hud-ally-being-attacked {
  display: inline-block;
  background: #ff3344;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.04em;
  margin-left: 0.4rem;
  box-shadow: 0 0 6px rgba(255, 51, 68, 0.7);
  vertical-align: middle;
}

.mobile-hud-ally-row.targeting {
  border-color: rgba(102, 255, 178, 0.85);
  box-shadow: 0 0 0 1.5px rgba(102, 255, 178, 0.45);
  animation: mobile-hud-targeting-pulse 1.2s ease-in-out infinite;
}

.mobile-hud-ally-row.dead {
  opacity: 0.55;
  filter: grayscale(0.6);
}

.mobile-hud-ally-row.empty {
  opacity: 0.4;
  cursor: default;
  border-style: dashed;
}

.mobile-hud-ally-row:disabled {
  cursor: default;
}

.mobile-hud-ally-slot {
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  font-weight: 900;
  color: #ffe066;
  background: rgba(255, 230, 0, 0.1);
  border: 1px solid rgba(255, 230, 0, 0.35);
  border-radius: 4px;
  text-align: center;
  padding: 2px 0;
}

.mobile-hud-ally-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  image-rendering: pixelated;
}

.mobile-hud-ally-sprite-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 1rem;
}

.mobile-hud-ally-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.mobile-hud-ally-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem;
  min-width: 0;
}

.mobile-hud-ally-name {
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-hud-ally-level {
  font-size: 0.6rem;
  color: #b6f5b6;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.mobile-hud-ally-bar {
  position: relative;
  height: 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.mobile-hud-ally-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.mobile-hud-ally-bar-fill.hp {
  background: linear-gradient(90deg, #ff6b6b, #ff3a3a);
}

.mobile-hud-ally-bar-fill.energy {
  background: linear-gradient(90deg, #40c4ff, #82b1ff);
}

.mobile-hud-ally-bar-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.58rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
}

.mobile-hud-ally-bar-icon {
  width: 10px;
  height: 10px;
  object-fit: contain;
  filter: drop-shadow(0 1px 1px #000a);
  flex-shrink: 0;
}

.mobile-hud-ally-effects {
  position: relative;
  top: auto;
  left: auto;
  transform: none;
  justify-content: flex-start;
  margin-top: 2px;
  background: rgba(0, 0, 0, 0.5);
}

.enemy-preview-enter-active,
.enemy-preview-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.enemy-preview-enter-from,
.enemy-preview-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>