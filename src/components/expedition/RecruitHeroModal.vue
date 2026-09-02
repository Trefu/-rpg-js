<script setup lang="ts">
import { computed } from 'vue'
import type { Hero } from '@/core/Hero'
import { useGameStore, MAX_HEROES } from '@/stores/game'
import { RECRUITABLE_HEROES, type RecruitableHero } from '@/core/heroes/recruitment'
import closeIcon from '@/assets/icons/cross-mark.png'
import partyIcon from '@/assets/icons/shield.png'
import helpIcon from '@/assets/icons/help.png'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'heroRecruited', hero: Hero): void
}>()

const gameStore = useGameStore()

/**
 * Lista de heroes disponibles para reclutar. Por ahora solo el Cleric,
 * pero la coleccion RECRUITABLE_HEROES esta pensada para crecer.
 *
 * Filtramos los que ya estan en la party para no permitir duplicados
 * de la misma clase (asi el modal nunca ofrece reclutar a Elara dos
 * veces). Usamos `hero.heroClassId`, campo estable definido por cada
 * subclase al construir el Hero.
 */
const availableChoices = computed<RecruitableHero[]>(() => {
  const currentClassIds = new Set(
    gameStore.activeHeroes.map(h => h.heroClassId)
  )
  return RECRUITABLE_HEROES.filter(r => !currentClassIds.has(r.id))
})

const hasFreeSlot = computed(
  () => gameStore.heroes.filter(h => h === null).length > 0
)

const slotsUsed = computed(() => gameStore.heroes.filter(h => h !== null).length)

function closeModal() {
  emit('close')
}

function recruit(choice: RecruitableHero) {
  if (!hasFreeSlot.value) return
  const newHero = choice.factory()
  const ok = gameStore.addHeroToFirstFreeSlot(newHero)
  if (!ok) return
  emit('heroRecruited', newHero)
  closeModal()
}
</script>

<template>
  <transition name="recruit-fade">
    <div
      v-if="true"
      class="recruit-overlay"
      @mousedown.self="closeModal"
    >
      <div class="recruit-modal" role="dialog" aria-labelledby="recruit-title">
        <header class="recruit-header">
          <img :src="helpIcon" alt="" class="recruit-header-icon" />
          <h2 id="recruit-title">Un alma aparece en el camino</h2>
          <button class="recruit-close" type="button" @click="closeModal" title="Cerrar">
            <img :src="closeIcon" alt="" />
          </button>
        </header>

        <p class="recruit-intro">
          Un extrano te ofrece acompanarte. Elige a quien sumar a tu grupo:
        </p>

        <div v-if="!hasFreeSlot" class="recruit-warning">
          Tu grupo ya tiene {{ MAX_HEROES }}heroes y no hay espacio.
        </div>

        <ul class="recruit-list">
          <li
            v-for="choice in availableChoices"
            :key="choice.id"
            class="recruit-card"
            :class="{ disabled: !hasFreeSlot }"
          >
            <div class="recruit-portrait">
              <img :src="choice.sprite" :alt="choice.displayName" />
            </div>

            <div class="recruit-body">
              <div class="recruit-name-row">
                <span class="recruit-name">{{ choice.displayName }}</span>
                <span class="recruit-class">Clase</span>
              </div>
              <p class="recruit-desc">{{ choice.description }}</p>
            </div>

            <button
              class="recruit-btn"
              type="button"
              :disabled="!hasFreeSlot"
              @click="recruit(choice)"
            >
              <img :src="partyIcon" alt="" class="recruit-btn-icon" />
              <span>Unirse</span>
            </button>
          </li>
        </ul>

        <footer class="recruit-footer">
          <div class="recruit-slot-info">
            <img :src="partyIcon" alt="" />
            <span>{{ slotsUsed }} / {{ MAX_HEROES }} heroes en la party</span>
          </div>
          <button class="recruit-skip" type="button" @click="closeModal">
            Seguir solo
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.recruit-fade-enter-active,
.recruit-fade-leave-active {
  transition: opacity 0.2s ease;
}
.recruit-fade-enter-from,
.recruit-fade-leave-to {
  opacity: 0;
}

/* =========================================================
   Overlay (mobile-first: ocupa casi todo en pantallas chicas,
   centra modal en pantallas grandes).
   ========================================================= */
.recruit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;          /* mobile: anclado abajo */
  justify-content: center;
  z-index: 1100;
  padding: 0;
  backdrop-filter: blur(4px);
}

.recruit-modal {
  position: relative;
  width: 100%;
  max-width: 100%;
  background: linear-gradient(180deg, #1f2230 0%, #15171f 100%);
  color: #e8e8ea;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: none;
  padding: 1rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: 85vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.55);
}

/* ---- Header ---- */
.recruit-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.recruit-header-icon {
  width: 28px;
  height: 28px;
  filter: brightness(0) invert(1);
}
.recruit-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  flex: 1;
  line-height: 1.2;
}
.recruit-close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.recruit-close img {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
}

/* ---- Intro ---- */
.recruit-intro {
  margin: 0;
  font-size: 0.92rem;
  color: rgba(232, 232, 234, 0.85);
  line-height: 1.4;
}

/* ---- Warning ---- */
.recruit-warning {
  background: rgba(244, 67, 54, 0.18);
  border: 1px solid rgba(244, 67, 54, 0.4);
  border-radius: 6px;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
  color: #ffb4ae;
}

/* ---- Lista de opciones ---- */
.recruit-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.recruit-card {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.6rem;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.recruit-card:not(.disabled):active {
  transform: scale(0.99);
  border-color: rgba(76, 175, 80, 0.5);
}
.recruit-card.disabled {
  opacity: 0.5;
}

.recruit-portrait {
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}
.recruit-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recruit-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;          /* permite wrap del texto */
}
.recruit-name-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.recruit-name {
  font-size: 1rem;
  font-weight: 600;
}
.recruit-class {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(232, 232, 234, 0.55);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
}
.recruit-desc {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(232, 232, 234, 0.75);
  line-height: 1.35;
}

.recruit-btn {
  flex: 0 0 auto;
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.9rem;
  background: #4caf50;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
  min-height: 44px;       /* touch target amigable */
  min-width: 44px;
}
.recruit-btn:hover:not(:disabled) {
  background: #43a047;
}
.recruit-btn:disabled {
  background: #2e7d32;
  opacity: 0.5;
  cursor: not-allowed;
}
.recruit-btn-icon {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1);
}

/* ---- Footer ---- */
.recruit-footer {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.recruit-slot-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: rgba(232, 232, 234, 0.7);
}
.recruit-slot-info img {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1);
}
.recruit-skip {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(232, 232, 234, 0.85);
  padding: 0.65rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 44px;
}
.recruit-skip:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* =========================================================
   Breakpoint tablet / desktop: centra el modal y limita
   el ancho para que no se estire en monitores grandes.
   ========================================================= */
@media (min-width: 720px) {
  .recruit-overlay {
    align-items: center;
    padding: 1.5rem;
  }
  .recruit-modal {
    width: 100%;
    max-width: 520px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1.5rem 1.5rem 1.25rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    max-height: 80vh;
  }
  .recruit-header h2 {
    font-size: 1.25rem;
  }
  .recruit-list {
    gap: 0.75rem;
  }
  .recruit-card {
    padding: 0.75rem;
  }
}
</style>