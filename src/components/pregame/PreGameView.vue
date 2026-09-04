<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IZone } from '@/core/interfaces/IExpedition'
import type { ZoneId } from '@/core/zones/EnemyPools'
import { Warrior } from '@/core/heroes/Warrior'
import { Cleric } from '@/core/heroes/Cleric'
import type { Hero } from '@/core/Hero'
import { listZones } from '@/core/zones/Zones'
import warriorSprite from '@/assets/sprites/heroes/warrior.png'
import clericSprite from '@/assets/sprites/heroes/cleric.png'
import { MAX_HEROES } from '@/stores/game'

const emit = defineEmits<{
  (e: 'start', payload: { zoneId: ZoneId, heroes: Hero[] }): void
}>()

const zones = listZones()
const UNLOCKED_ZONE_IDS: ZoneId[] = ['mountain-peak']

function isZoneUnlocked(id: ZoneId): boolean {
  return UNLOCKED_ZONE_IDS.includes(id)
}

interface HeroChoice {
  id: 'warrior' | 'cleric'
  name: string
  description: string
  sprite: string
  factory: () => Hero
}

const heroes: HeroChoice[] = [
  {
    id: 'warrior',
    name: 'Bjorn',
    description: 'Guerrero cuerpo a cuerpo. Tanque con alto daño sostenido y autogestión de energia.',
    sprite: warriorSprite,
    factory: () => Warrior.createStarter()
  },
  {
    id: 'cleric',
    name: 'Elara',
    description: 'Cleriga con ataques radiantes. Soporte sagrado: daño radiante y curación de aliados.',
    sprite: clericSprite,
    factory: () => Cleric.createStarter()
  }
]

/**
 * Modo debug local: permite arrancar con varios heroes a la vez
 * (incluyendo duplicados de la misma clase) para poder probar
 * combate multi-heroe, rotacion, splash multi-heroe, etc.
 * Capado por MAX_HEROES (=3).
 *
 * Solo visible y usable en `npm run dev`. En build de produccion
 * (`vite build`) el checkbox se oculta y `setMultiHeroMode` queda
 * anulado para que el jugador solo pueda elegir 1 heroe al inicio.
 */
const isDev = import.meta.env.DEV
const multiHeroMode = ref(false)
const maxHeroes = MAX_HEROES

const selectedHeroIds = ref<HeroChoice['id'][]>(['warrior'])
const selectedZoneId = ref<ZoneId | null>(zones[0]?.id ?? null)

const selectedZone = computed<IZone | null>(() => {
  if (!selectedZoneId.value) return null
  return zones.find(z => z.id === selectedZoneId.value) ?? null
})

const canStart = computed(
  () => selectedHeroIds.value.length > 0 && !!selectedZone.value
)

const previewHeroes = computed<Hero[]>(() => {
  const out: Hero[] = []
  for (const id of selectedHeroIds.value) {
    const choice = heroes.find(h => h.id === id)
    if (choice) out.push(choice.factory())
  }
  return out
})

function isHeroSelected(id: HeroChoice['id']): boolean {
  if (multiHeroMode.value) return selectedHeroIds.value.includes(id)
  return selectedHeroIds.value[0] === id
}

function heroCount(id: HeroChoice['id']): number {
  return selectedHeroIds.value.filter(x => x === id).length
}

function toggleHero(id: HeroChoice['id']) {
  if (multiHeroMode.value) {
    const idx = selectedHeroIds.value.lastIndexOf(id)
    if (idx >= 0) {
      const next = selectedHeroIds.value.slice()
      next.splice(idx, 1)
      selectedHeroIds.value = next
    } else {
      if (selectedHeroIds.value.length >= maxHeroes) return
      selectedHeroIds.value = [...selectedHeroIds.value, id]
    }
  } else {
    selectedHeroIds.value = [id]
  }
}

function setMultiHeroMode(enabled: boolean) {
  if (!isDev) {
    multiHeroMode.value = false
    if (selectedHeroIds.value.length > 1) {
      selectedHeroIds.value = [selectedHeroIds.value[0]]
    }
    return
  }
  multiHeroMode.value = enabled
  if (!enabled && selectedHeroIds.value.length > 1) {
    selectedHeroIds.value = [selectedHeroIds.value[0]]
  }
  if (selectedHeroIds.value.length === 0 && heroes[0]) {
    selectedHeroIds.value = [heroes[0].id]
  }
}

function selectZone(id: ZoneId) {
  if (!isZoneUnlocked(id)) return
  selectedZoneId.value = id
}

function handleStart() {
  if (!canStart.value || !selectedZoneId.value) return
  emit('start', {
    zoneId: selectedZoneId.value,
    heroes: previewHeroes.value
  })
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
        <label v-if="isDev" class="debug-toggle">
          <input
            type="checkbox"
            :checked="multiHeroMode"
            @change="(e) => setMultiHeroMode((e.target as HTMLInputElement).checked)"
          />
          <span>Modo debug (multi-heroe, max {{ maxHeroes }})</span>
        </label>
        <ul class="card-list">
          <li
            v-for="hero in heroes"
            :key="hero.id"
            class="card"
            :class="{ selected: isHeroSelected(hero.id) }"
            @click="toggleHero(hero.id)"
          >
            <img :src="hero.sprite" :alt="hero.name" class="card__sprite" decoding="async" />
            <div class="card__body">
              <h3>{{ hero.name }}</h3>
              <p>{{ hero.description }}</p>
              <small v-if="multiHeroMode && heroCount(hero.id) > 0">
                Seleccionados: {{ heroCount(hero.id) }}
              </small>
              <small v-else-if="multiHeroMode">Clic para anadir</small>
            </div>
          </li>
        </ul>
        <small v-if="multiHeroMode" class="multi-hint">
          {{ selectedHeroIds.length }}/{{ maxHeroes }} heroes seleccionados. Clic otra vez en la misma tarjeta para quitar uno.
        </small>
      </div>

      <div class="panel">
        <h2>Expedicion</h2>
        <ul class="card-list">
          <li
            v-for="zone in zones"
            :key="zone.id"
            class="card"
            :class="{ selected: zone.id === selectedZoneId, locked: !isZoneUnlocked(zone.id) }"
            :aria-disabled="!isZoneUnlocked(zone.id)"
            @click="selectZone(zone.id)"
          >
            <div class="card__body">
              <h3>{{ zone.name }}</h3>
              <p>{{ zone.description }}</p>
              <span class="badge" :class="`badge--${zone.difficulty}`">{{ zone.difficulty }}</span>
              <small>Nivel minimo: {{ zone.minLevel }}</small>
              <span v-if="!isZoneUnlocked(zone.id)" class="locked-badge">Bloqueado</span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="canStart && selectedZone" class="pre-game__summary">
      <div class="summary__heroes">
        <div
          v-for="(hero, idx) in previewHeroes"
          :key="hero.id + '-' + idx"
          class="summary__hero"
        >
          <img :src="hero.sprite" :alt="hero.name" decoding="async" />
          <div>
            <strong>{{ hero.name }}</strong>
            <span>
              HP {{ hero.health }}/{{ hero.maxHealth }} ·
              ATQ {{ hero.attack() }} ·
              DEF {{ hero.defense() }}
            </span>
          </div>
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

.card.locked {
  cursor: not-allowed;
  opacity: 0.55;
  filter: grayscale(0.6);
}

.card.locked:hover {
  border-color: rgba(255, 255, 255, 0.08);
  transform: none;
}

.locked-badge {
  display: inline-block;
  margin-top: 0.5rem;
  margin-left: 0.5rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgba(158, 158, 158, 0.25);
  color: #bdbdbd;
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

.summary__heroes {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.debug-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 230, 102, 0.08);
  border: 1px dashed rgba(255, 230, 102, 0.35);
  border-radius: 6px;
  color: rgba(255, 230, 102, 0.9);
  font-size: 0.85rem;
  cursor: pointer;
}

.debug-toggle input {
  cursor: pointer;
}

.multi-hint {
  display: block;
  margin-top: 0.6rem;
  color: rgba(255, 230, 102, 0.75);
  font-size: 0.8rem;
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