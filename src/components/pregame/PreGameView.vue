<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IZone } from '@/core/interfaces/IExpedition'
import type { ZoneId } from '@/core/zones/EnemyPools'
import { Warrior } from '@/core/heroes/Warrior'
import { listZones } from '@/core/zones/Zones'
import warriorSprite from '@/assets/sprites/heroes/warrior.png'

const emit = defineEmits<{
  (e: 'start', payload: { zoneId: ZoneId }): void
}>()

const zones = listZones()

interface HeroChoice {
  id: 'warrior'
  name: string
  description: string
  sprite: string
  factory: () => Warrior
}

const heroes: HeroChoice[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Guerrero cuerpo a cuerpo. Tanque con alto daño sostenido y autogestión de energia.',
    sprite: warriorSprite,
    factory: () => Warrior.createStarter()
  }
]

const selectedHeroId = ref<HeroChoice['id']>('warrior')
const selectedZoneId = ref<ZoneId | null>(zones[0]?.id ?? null)

const selectedHero = computed(() => heroes.find(h => h.id === selectedHeroId.value) ?? null)
const selectedZone = computed<IZone | null>(() => {
  if (!selectedZoneId.value) return null
  return zones.find(z => z.id === selectedZoneId.value) ?? null
})

const canStart = computed(() => !!selectedHero.value && !!selectedZone.value)

const previewHero = computed(() => selectedHero.value?.factory() ?? null)

function handleStart() {
  if (!canStart.value || !selectedZoneId.value) return
  emit('start', { zoneId: selectedZoneId.value })
}

function selectHero(id: HeroChoice['id']) {
  selectedHeroId.value = id
}

function selectZone(id: ZoneId) {
  selectedZoneId.value = id
}
</script>

<template>
  <div class="pre-game">
    <header class="pre-game__header">
      <h1>Comienza tu Aventura</h1>
      <p class="pre-game__subtitle">Elige tu heroe y la expedicion que quieres emprender.</p>
    </header>

    <section class="pre-game__panels">
      <div class="panel">
        <h2>Heroe</h2>
        <ul class="card-list">
          <li
            v-for="hero in heroes"
            :key="hero.id"
            class="card"
            :class="{ selected: hero.id === selectedHeroId }"
            @click="selectHero(hero.id)"
          >
            <img :src="hero.sprite" :alt="hero.name" class="card__sprite" />
            <div class="card__body">
              <h3>{{ hero.name }}</h3>
              <p>{{ hero.description }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div class="panel">
        <h2>Expedicion</h2>
        <ul class="card-list">
          <li
            v-for="zone in zones"
            :key="zone.id"
            class="card"
            :class="{ selected: zone.id === selectedZoneId }"
            @click="selectZone(zone.id)"
          >
            <div class="card__body">
              <h3>{{ zone.name }}</h3>
              <p>{{ zone.description }}</p>
              <span class="badge" :class="`badge--${zone.difficulty}`">{{ zone.difficulty }}</span>
              <small>Nivel minimo: {{ zone.minLevel }}</small>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="selectedHero && selectedZone" class="pre-game__summary">
      <div class="summary__hero">
        <img :src="selectedHero.sprite" :alt="selectedHero.name" />
        <div>
          <strong>{{ selectedHero.name }}</strong>
          <span v-if="previewHero">
            HP {{ previewHero.health }}/{{ previewHero.maxHealth }} ·
            ATQ {{ previewHero.baseAttack }} ·
            DEF {{ previewHero.defenseValue }}
          </span>
        </div>
      </div>
      <button class="start-btn" :disabled="!canStart" @click="handleStart">
        Comenzar expedicion
      </button>
    </section>
  </div>
</template>

<style scoped>
.pre-game {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  color: #f5f5f5;
}

.pre-game__header h1 {
  margin: 0;
  font-size: 2.25rem;
  letter-spacing: 0.02em;
}

.pre-game__subtitle {
  margin: 0.5rem 0 0;
  color: rgba(255, 255, 255, 0.65);
}

.pre-game__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 2rem;
}

.panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
}

.card-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s, background 0.2s;
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.card.selected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.12);
}

.card__sprite {
  width: 72px;
  height: 72px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 6px;
  padding: 4px;
}

.card__body h3 {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
}

.card__body p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.badge--easy {
  background: rgba(76, 175, 80, 0.2);
  color: #a5d6a7;
}

.badge--medium {
  background: rgba(255, 193, 7, 0.2);
  color: #ffe082;
}

.badge--hard {
  background: rgba(244, 67, 54, 0.2);
  color: #ef9a9a;
}

.card__body small {
  display: block;
  margin-top: 0.4rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
}

.pre-game__summary {
  margin-top: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.summary__hero {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary__hero img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px;
  border-radius: 6px;
}

.summary__hero div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.summary__hero span {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.start-btn {
  background: #4CAF50;
  border: none;
  color: #0d1f0d;
  font-weight: 700;
  padding: 0.75rem 1.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.15s, transform 0.1s;
}

.start-btn:hover:not(:disabled) {
  background: #66bb6a;
  transform: translateY(-1px);
}

.start-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .pre-game__panels {
    grid-template-columns: 1fr;
  }

  .pre-game__summary {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
}
</style>