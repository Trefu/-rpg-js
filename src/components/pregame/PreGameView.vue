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
import HeroStatChips from '@/components/combat/HeroStatChips.vue'
import { getAbilityIcon } from '@/core/abilities/abilityIcons'
import { getBasicAttackHitCount } from '@/core/abilities/Abilities'
import { getDamageTypeInfo } from '@/core/combat/damageTypes'
import type { AbilityDamagePreview } from '@/core/interfaces/IAbility'
import boltIcon from '@/assets/icons/bolt-shield.png'
import hourglassIcon from '@/assets/icons/hourglass.png'
import '@/styles/hint-colors.css'

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

/**
 * `selectedHeroIds` arranca vacio a propósito: el usuario debe
 * clicar activamente en un heroe para desbloquear el panel de
 * expediciones. Antes había un default `'warrior'` que el jugador
 * no había elegido explícitamente, contradiciendo el nuevo flow.
 */
const selectedHeroIds = ref<HeroChoice['id'][]>([])
const selectedZoneId = ref<ZoneId | null>(zones[0]?.id ?? null)

const selectedZone = computed<IZone | null>(() => {
  if (!selectedZoneId.value) return null
  return zones.find(z => z.id === selectedZoneId.value) ?? null
})

/**
 * `hasPickedHero` se usa como gate para habilitar el panel de
 * expediciones. Es true solo si el jugador ha clicado al menos
 * una tarjeta de heroe (single-hero) o si activo el modo debug.
 */
const hasPickedHero = computed(() => selectedHeroIds.value.length > 0)

const canStart = computed(
  () => selectedHeroIds.value.length > 0 && !!selectedZone.value
)

/**
 * Hero (instancia viva) usado por HeroStatChips y el preview de
 * abilities. Como `HeroChoice.factory` se llama cada vez que la
 * computed se recalcula, lo cacheamos en una sola instancia por
 * id para que los tooltips/chips no se reconstruyan en cada
 * cambio de zona y mantengan referencias estables a `hero`.
 */
const previewHeroCache = new Map<HeroChoice['id'], Hero>()
function getOrCreatePreviewHero(id: HeroChoice['id']): Hero | null {
  const choice = heroes.find(h => h.id === id)
  if (!choice) return null
  let cached = previewHeroCache.get(id)
  if (!cached) {
    cached = choice.factory()
    previewHeroCache.set(id, cached)
  }
  return cached
}

const previewHeroes = computed<Hero[]>(() => {
  const out: Hero[] = []
  for (const id of selectedHeroIds.value) {
    const hero = getOrCreatePreviewHero(id)
    if (hero) out.push(hero)
  }
  return out
})

/**
 * Hero "principal" mostrado en el panel de stats + abilities.
 * En single-hero mode siempre es el unico seleccionado; en multi-hero
 * mode (debug) es el primero de la lista.
 */
const focusedHero = computed<Hero | null>(() => {
  const list = previewHeroes.value
  return list.length > 0 ? list[0] : null
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
}

function selectZone(id: ZoneId) {
  if (!isZoneUnlocked(id)) return
  // Doble gate: ademas del flag del padre, exigimos que haya un heroe
  // elegido. Aunque `canSelectZones` desactiva el click en el DOM, esto
  // blinda el flujo si el metodo se invocara por otro medio.
  if (!hasPickedHero.value) return
  selectedZoneId.value = id
  // En lugar de arrancar automaticamente, abrimos el modal de
  // confirmacion. El usuario debe aceptar explicitamente para empezar
  // la expedicion (mismo patron que los nodos de curiosidad/recruit).
  const zone = zones.find(z => z.id === id)
  if (zone) pendingConfirmZone.value = zone
}

/**
 * Modal de confirmacion. Vive como estado local porque solo afecta
 * a esta vista. `pendingConfirmZone` se popula al clickar una
 * expedicion y se consume al confirmar/cancelar.
 */
const pendingConfirmZone = ref<IZone | null>(null)

function cancelConfirm() {
  pendingConfirmZone.value = null
}

function confirmAndStart() {
  const zone = pendingConfirmZone.value
  if (!zone || !canStart.value) {
    pendingConfirmZone.value = null
    return
  }
  const payload = {
    zoneId: zone.id as ZoneId,
    heroes: previewHeroes.value
  }
  pendingConfirmZone.value = null
  emit('start', payload)
}

/**
 * Preview de daño por ability del hero enfocado. Devuelve null para
 * curas/buffs (igual que AbilitiesModal). Se recalcula cuando cambia
 * el hero o sus stats (level-up, etc).
 */
const focusedAbilityPreviews = computed<(AbilityDamagePreview | null)[]>(() => {
  const hero = focusedHero.value
  if (!hero) return []
  return hero.abilities.map(a => {
    if (typeof a.previewDamage !== 'function') return null
    try {
      return a.previewDamage(hero)
    } catch {
      return null
    }
  })
})

const focusedBasicHitCount = computed(() =>
  getBasicAttackHitCount(focusedHero.value?.level ?? 1)
)

/**
 * Devuelve la clase CSS del tipo de daño (`dmg-fire`, `dmg-holy`, etc.)
 * para colorear el chip de tipo. Usa el registro central
 * `DAMAGE_TYPES` — cualquier tipo nuevo aparece automaticamente.
 */
function damageTypeClass(id?: string): string {
  if (!id) return ''
  return getDamageTypeInfo(id)?.className ?? ''
}
</script>

<template>
  <div class="pre-game">
    <header class="pre-game__header">
      <h1>Comienza tu Aventura</h1>
      <p class="pre-game__subtitle">
        Elige un heroe para revisar sus stats y habilidades. Las expediciones se desbloquearan al hacerlo.
      </p>
    </header>

    <!-- ======================= HEROES ======================= -->
    <section class="heroes-section">
      <div class="section-head">
        <h2>1 · Elige tu heroe</h2>
        <label v-if="isDev" class="debug-toggle">
          <input
            type="checkbox"
            :checked="multiHeroMode"
            @change="(e) => setMultiHeroMode((e.target as HTMLInputElement).checked)"
          />
          <span>Modo debug (multi-heroe, max {{ maxHeroes }})</span>
        </label>
      </div>

      <ul class="hero-list">
        <li
          v-for="hero in heroes"
          :key="hero.id"
          class="hero-card"
          :class="{ selected: isHeroSelected(hero.id) }"
          @click="toggleHero(hero.id)"
        >
          <div class="hero-card__portrait">
            <img :src="hero.sprite" :alt="hero.name" decoding="async" />
            <div v-if="isHeroSelected(hero.id)" class="hero-card__check">✓</div>
          </div>
          <div class="hero-card__body">
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
    </section>

    <!-- ================== HERO DETAIL (stat chips + abilities) ================== -->
    <transition name="detail-fade">
      <section v-if="focusedHero" class="hero-detail">
        <div class="hero-detail__head">
          <img :src="focusedHero.sprite" :alt="focusedHero.name" class="hero-detail__sprite" decoding="async" />
          <div class="hero-detail__title">
            <h2>{{ focusedHero.name }}</h2>
            <p class="hero-detail__vitals">
              <span class="vital">Nivel <strong>{{ focusedHero.level }}</strong></span>
              <span class="vital vital--hp">HP <strong>{{ focusedHero.health }}</strong>/{{ focusedHero.maxHealth }}</span>
              <span class="vital vital--energy">{{ focusedHero.energy }}/{{ focusedHero.maxEnergy }} energia</span>
            </p>
            <p class="hero-detail__hint">
              Pasa el cursor sobre los chips para ver la formula detallada.
            </p>
          </div>
        </div>

        <div class="hero-detail__body">
          <div class="hero-detail__stats">
            <h3>Stats</h3>
            <HeroStatChips :hero="focusedHero" :show-all="true" tooltip-position="below" />
          </div>

          <div class="hero-detail__abilities">
            <h3>Habilidades</h3>
            <ul class="ability-list">
              <li
                v-for="(ability, idx) in focusedHero.abilities"
                :key="ability.type + '-' + idx"
                class="ability-row"
              >
                <div class="ability-row__icon">
                  <img :src="getAbilityIcon(ability.type)" :alt="ability.name" />
                </div>
                <div class="ability-row__body">
                  <div class="ability-row__header">
                    <span class="ability-row__name">{{ ability.name }}</span>
                    <span v-if="ability.energyCost" class="energy-badge">
                      <img :src="boltIcon" alt="" class="energy-icon" /> {{ ability.energyCost }}
                    </span>
                    <span v-if="ability.cooldown > 0" class="cooldown-badge">
                      <img :src="hourglassIcon" alt="" class="cooldown-icon" />
                      {{ ability.cooldown }} turno{{ ability.cooldown > 1 ? 's' : '' }}
                    </span>
                  </div>
                  <p class="ability-row__desc">{{ ability.description }}</p>
                  <p v-if="ability.type === 'attack'" class="ability-row__hits">
                    Golpes base: <strong>{{ focusedBasicHitCount }}</strong>
                  </p>
                  <p v-if="focusedAbilityPreviews[idx]" class="ability-row__dmg">
                    Daño: <strong>{{ focusedAbilityPreviews[idx]!.min }}–{{ focusedAbilityPreviews[idx]!.max }}</strong>
                    <span
                    v-if="focusedAbilityPreviews[idx]!.damageTypeLabel"
                    class="ability-row__dmg-type"
                    :class="damageTypeClass(ability.damageType)"
                  >
                    {{ focusedAbilityPreviews[idx]!.damageTypeLabel }}
                  </span>
                  </p>
                  <div
                    v-if="focusedAbilityPreviews[idx]?.formula"
                    class="ability-row__formula pregame-ability-formula"
                    v-html="focusedAbilityPreviews[idx]!.formula"
                  ></div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </transition>

    <!-- ======================= EXPEDITIONS ======================= -->
    <section class="expeditions-section" :class="{ locked: !hasPickedHero }">
      <div class="section-head">
        <h2>2 · Elige expedicion</h2>
        <span v-if="!hasPickedHero" class="lock-hint">Elige un heroe para desbloquear</span>
      </div>

      <ul class="zone-list">
        <li
          v-for="zone in zones"
          :key="zone.id"
          class="zone-card"
          :class="{
            selected: zone.id === selectedZoneId,
            locked: !isZoneUnlocked(zone.id),
            'in-dev': zone.inDevelopment === true,
            disabled: !hasPickedHero || !isZoneUnlocked(zone.id)
          }"
          :aria-disabled="!hasPickedHero || !isZoneUnlocked(zone.id)"
          @click="selectZone(zone.id)"
        >
          <div class="zone-card__body">
            <h3>{{ zone.name }}</h3>
            <p>{{ zone.description }}</p>
            <div class="zone-card__meta">
              <span class="badge" :class="`badge--${zone.difficulty}`">{{ zone.difficulty }}</span>
              <small>Nivel minimo: {{ zone.minLevel }}</small>
            </div>
            <span v-if="zone.inDevelopment === true" class="dev-badge">En desarrollo</span>
            <span v-else-if="!isZoneUnlocked(zone.id)" class="locked-badge">Bloqueado</span>
          </div>
        </li>
      </ul>
    </section>

    <!-- ============== CONFIRM EXPEDITION MODAL ============== -->
    <transition name="modal-fade">
      <div v-if="pendingConfirmZone" class="confirm-overlay" @mousedown.self="cancelConfirm">
        <div class="confirm-modal">
          <h2>¿Empezar la expedicion?</h2>
          <p class="confirm-modal__zone">{{ pendingConfirmZone.name }}</p>
          <p class="confirm-modal__desc">{{ pendingConfirmZone.description }}</p>

          <ul class="confirm-modal__party">
            <li v-for="(hero, idx) in previewHeroes" :key="hero.id + '-' + idx">
              <img :src="hero.sprite" :alt="hero.name" />
              <div>
                <strong>{{ hero.name }}</strong>
                <span>Nivel {{ hero.level }} · {{ hero.health }}/{{ hero.maxHealth }} HP</span>
              </div>
            </li>
          </ul>

          <div class="confirm-modal__rewards">
            <span class="badge" :class="`badge--${pendingConfirmZone.difficulty}`">
              {{ pendingConfirmZone.difficulty }}
            </span>
            <span>Nivel minimo: {{ pendingConfirmZone.minLevel }}</span>
          </div>

          <div class="confirm-modal__actions">
            <button class="btn btn--ghost" @click="cancelConfirm">Cancelar</button>
            <button class="btn btn--primary" @click="confirmAndStart">
              Empezar expedicion
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============== ABILITIES MODAL (mismo que en combate) ============== -->
  </div>
</template>

<style scoped>
.pre-game {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  color: #f5f5f5;
}

.pre-game__header h1 {
  margin: 0;
  font-size: 2.1rem;
  letter-spacing: 0.02em;
}

.pre-game__subtitle {
  margin: 0.5rem 0 0;
  color: rgba(255, 255, 255, 0.65);
}

/* ----- Section header shared ----- */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.75rem 0 0.75rem;
}

.section-head h2 {
  margin: 0;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.75);
}

.section-head h2::before {
  content: '';
  display: inline-block;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #4CAF50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.7);
  margin-right: 0.55rem;
  vertical-align: middle;
}

/* ============ HEROES ============ */
.hero-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.hero-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.hero-card:hover {
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.hero-card.selected {
  border-color: #4CAF50;
  background: linear-gradient(145deg, rgba(76, 175, 80, 0.18), rgba(76, 175, 80, 0.04));
  box-shadow: 0 0 14px rgba(76, 175, 80, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.hero-card__portrait {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.hero-card__portrait img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 8px;
  padding: 4px;
}

.hero-card__check {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  background: #4CAF50;
  color: #0d1f0d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.hero-card__body h3 {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
}

.hero-card__body p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.88rem;
  line-height: 1.4;
}

.hero-card__body small {
  display: block;
  margin-top: 0.4rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
}

.debug-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.65rem;
  background: rgba(255, 230, 102, 0.08);
  border: 1px dashed rgba(255, 230, 102, 0.35);
  border-radius: 6px;
  color: rgba(255, 230, 102, 0.9);
  font-size: 0.8rem;
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

/* ============ HERO DETAIL ============ */
.hero-detail {
  margin-top: 1.5rem;
  padding: 1.25rem 1.25rem 1.5rem;
  background: linear-gradient(145deg, rgba(30, 32, 53, 0.6), rgba(35, 36, 58, 0.6));
  border: 1px solid rgba(76, 175, 80, 0.25);
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.detail-fade-enter-from,
.detail-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.hero-detail__head {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  margin-bottom: 1.25rem;
}

.hero-detail__sprite {
  width: 96px;
  height: 96px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 6px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-detail__title h2 {
  margin: 0 0 0.35rem;
  font-size: 1.5rem;
  letter-spacing: 0.02em;
}

.hero-detail__vitals {
  margin: 0 0 0.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.vital {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(0, 0, 0, 0.35);
  padding: 0.2rem 0.55rem;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.vital strong {
  color: #fff;
}

.vital--hp strong {
  color: #5cff8a;
}

.vital--energy strong {
  color: #82b1ff;
}

.hero-detail__hint {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 230, 102, 0.7);
  font-style: italic;
}

.hero-detail__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
  gap: 1.5rem;
}

.hero-detail__body h3 {
  margin: 0 0 0.65rem;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.ability-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.ability-row {
  display: flex;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  background: rgba(20, 22, 38, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.ability-row__icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ability-row__icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(0 1px 3px #000a);
}

.ability-row__body {
  flex: 1;
  min-width: 0;
}

.ability-row__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.15rem;
}

.ability-row__name {
  font-weight: 700;
  color: #fff;
}

.ability-row__desc {
  margin: 0.1rem 0 0.15rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  line-height: 1.35;
}

.ability-row__hits,
.ability-row__dmg {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.65);
}

.ability-row__hits strong,
.ability-row__dmg strong {
  color: #ff8a8a;
  font-variant-numeric: tabular-nums;
}

.ability-row__dmg-type {
  margin-left: 0.4rem;
  padding: 0.05rem 0.45rem;
  border-radius: 4px;
  background: rgba(130, 177, 255, 0.15);
  color: #b8c8ff;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
}

/* Damage-type colors — sincronizados con `DAMAGE_TYPES`. */
.ability-row__dmg-type.dmg-physical { color: #d7ccc8; background: rgba(215, 204, 200, 0.18); }
.ability-row__dmg-type.dmg-fire    { color: #ff8a3a; background: rgba(255, 138, 58, 0.18); }
.ability-row__dmg-type.dmg-holy    { color: #ffe066; background: rgba(255, 224, 102, 0.18); }
.ability-row__dmg-type.dmg-poison  { color: #9ccc65; background: rgba(156, 204, 101, 0.18); }
.ability-row__dmg-type.dmg-arcane  { color: #b388ff; background: rgba(179, 136, 255, 0.18); }
.ability-row__dmg-type.dmg-electric{ color: #ffeb3b; background: rgba(255, 235, 59, 0.18); }
.ability-row__dmg-type.dmg-water   { color: #64b5f6; background: rgba(100, 181, 246, 0.18); }

.ability-row__formula {
  margin-top: 0.4rem;
  padding: 0.45rem 0.6rem;
  background: rgba(20, 22, 38, 0.7);
  border: 1px solid rgba(130, 177, 255, 0.22);
  border-radius: 6px;
  font-family: 'Consolas', 'Menlo', monospace;
  color: #b0bec5;
  font-size: 0.78rem;
  line-height: 1.4;
  word-break: break-word;
}

/* ============ EXPEDITIONS ============ */
.expeditions-section {
  position: relative;
  transition: opacity 0.2s ease, filter 0.2s ease;
}

.expeditions-section.locked .zone-list {
  pointer-events: none;
  user-select: none;
  filter: grayscale(0.7) brightness(0.55);
  opacity: 0.55;
}

.lock-hint {
  font-size: 0.8rem;
  color: rgba(255, 230, 102, 0.85);
  background: rgba(255, 230, 102, 0.08);
  padding: 0.3rem 0.6rem;
  border-radius: 5px;
  border: 1px dashed rgba(255, 230, 102, 0.35);
}

.zone-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.zone-card {
  display: flex;
  padding: 1rem;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}

.zone-card:hover:not(.disabled):not(.locked) {
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.zone-card.selected {
  border-color: #4CAF50;
  background: linear-gradient(145deg, rgba(76, 175, 80, 0.16), rgba(76, 175, 80, 0.04));
  box-shadow: 0 0 14px rgba(76, 175, 80, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.zone-card.locked,
.zone-card.disabled {
  cursor: not-allowed;
}

.zone-card__body {
  flex: 1;
}

.zone-card__body h3 {
  margin: 0 0 0.3rem;
  font-size: 1.1rem;
}

.zone-card__body p {
  margin: 0 0 0.55rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.88rem;
  line-height: 1.4;
}

.zone-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.7rem;
}

.zone-card__meta small {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.78rem;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.55rem;
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

.locked-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgba(158, 158, 158, 0.25);
  color: #bdbdbd;
}

.dev-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgba(255, 193, 7, 0.18);
  color: #ffe082;
  border: 1px dashed rgba(255, 193, 7, 0.5);
}

.zone-card.in-dev:not(.locked) .dev-badge {
  margin-left: 0.35rem;
}

/* ============ Energy / Cooldown badges ============
   Reusan los mismos estilos que `AbilitiesModal` para que la lectura
   sea identica al combate. */
.energy-badge {
  background: rgba(64, 196, 255, 0.15);
  color: #82b1ff;
  padding: 0.2em 0.6em;
  border-radius: 6px;
  font-size: 0.78rem;
  border: 1px solid rgba(64, 196, 255, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Courier New', monospace;
  font-weight: 700;
}

.cooldown-badge {
  background: rgba(255, 180, 0, 0.15);
  color: #ffb400;
  padding: 0.2em 0.6em;
  border-radius: 6px;
  font-size: 0.78rem;
  border: 1px solid rgba(255, 180, 0, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Courier New', monospace;
  font-weight: 700;
}

.energy-icon {
  width: 0.9em;
  height: 0.9em;
}

.cooldown-icon {
  width: 0.9em;
  height: 0.9em;
  filter: sepia(1) saturate(5) hue-rotate(0deg) brightness(1.2);
}

/* ============ CONFIRM MODAL ============ */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 10, 18, 0.78);
  backdrop-filter: blur(4px);
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.confirm-modal {
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1px solid rgba(76, 175, 80, 0.4);
  border-radius: 14px;
  padding: 1.75rem 2rem 1.5rem;
  min-width: min(440px, 95vw);
  max-width: 560px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: confirm-pop 0.22s ease;
}

@keyframes confirm-pop {
  from { transform: scale(0.94); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

.confirm-modal h2 {
  margin: 0 0 0.6rem;
  font-size: 1.25rem;
}

.confirm-modal__zone {
  margin: 0 0 0.3rem;
  font-size: 1.1rem;
  color: #4CAF50;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.confirm-modal__desc {
  margin: 0 0 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.45;
}

.confirm-modal__party {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.confirm-modal__party li {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.confirm-modal__party img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  padding: 3px;
}

.confirm-modal__party div {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.confirm-modal__party span {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.8rem;
}

.confirm-modal__rewards {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.85rem;
  margin: 0 0 1.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.confirm-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
}

.btn {
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.15s ease;
}

.btn--ghost {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
}

.btn--ghost:hover {
  background: rgba(255, 255, 255, 0.16);
}

.btn--primary {
  background: #4CAF50;
  color: #0d1f0d;
}

.btn--primary:hover {
  background: #66bb6a;
  transform: translateY(-1px);
}

/* ============ Responsive ============ */
@media (max-width: 720px) {
  .pre-game {
    padding: 1.25rem 1rem 3rem;
  }
  .hero-detail__body {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  .section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>