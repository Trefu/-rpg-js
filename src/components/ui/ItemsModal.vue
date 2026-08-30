<script setup lang="ts">
import { computed } from 'vue'
import closeIcon from '@/assets/icons/cross-mark.png'
import backpackIcon from '@/assets/icons/backpack.png'
import { getItem } from '@/core/items/items'

export interface InventoryEntryView {
  id: string
  count: number
}

interface Props {
  show: boolean
  inventory: InventoryEntryView[]
  usedThisTurn?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'selectItem', entryId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const entries = computed(() =>
  props.inventory
    .map((entry) => {
      const item = getItem(entry.id)
      if (!item) return null
      return { entry, item }
    })
    .filter((x): x is { entry: InventoryEntryView, item: NonNullable<ReturnType<typeof getItem>> } => x !== null)
)

function closeModal() {
  emit('close')
}

function selectEntry(entryId: string) {
  emit('selectItem', entryId)
}

function handleModalOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('items-modal-overlay')) {
    closeModal()
  }
}
</script>

<template>
  <transition name="items-fade">
    <div v-if="show" class="items-modal-overlay" @mousedown="handleModalOverlayClick">
      <div class="items-modal">
        <div class="items-modal-header">
          <img :src="backpackIcon" class="items-modal-main-icon" alt="Objetos" />
          <h2>Objetos</h2>
          <button class="items-modal-close-btn" @click="closeModal" title="Cerrar">
            <img :src="closeIcon" alt="" class="close-icon" />
          </button>
        </div>

        <div v-if="entries.length === 0" class="items-empty">
          No tienes objetos disponibles.
        </div>

        <div v-else class="items-grid">
          <div
            v-for="entry in entries"
            :key="entry.entry.id"
            class="item-card"
            :class="{
              'item-disabled': entry.entry.count <= 0 || usedThisTurn
            }"
            @click="selectEntry(entry.entry.id)"
          >
            <div class="item-icon-wrapper">
              <img :src="entry.item.icon" class="item-icon" :alt="entry.item.name" />
              <div class="item-count">
                <span>x{{ entry.entry.count }}</span>
              </div>
            </div>

            <div class="item-content">
              <div class="item-header">
                <span class="item-name">{{ entry.item.name }}</span>
                <span
                  class="item-tag"
                  :class="usedThisTurn ? 'tag-already' : 'tag-use'"
                >
                  {{ usedThisTurn ? 'Ya usado' : 'Click para usar' }}
                </span>
              </div>
              <p class="item-desc">{{ entry.item.description }}</p>
            </div>
          </div>
        </div>

        <div class="items-modal-hint">
          <span v-if="usedThisTurn">Ya usaste un objeto este turno. Puedes usar una habilidad todavia.</span>
          <span v-else>Usar un objeto no consume el turno. Podras usar una habilidad despues.</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.items-fade-enter-active,
.items-fade-leave-active {
  transition: opacity 0.25s;
}
.items-fade-enter-from,
.items-fade-leave-to {
  opacity: 0;
}

.items-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 20, 0.85);
  z-index: 4100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.items-modal {
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border-radius: 18px;
  box-shadow: 0 8px 40px #000a, inset 0 1px 0 rgba(255, 255, 255, 0.05);
  padding: 2rem 2.5rem 1.4rem 2.5rem;
  min-width: 480px;
  max-width: 95vw;
  text-align: center;
  position: relative;
  animation: items-pop-in 0.25s;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

@keyframes items-pop-in {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.items-modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.4rem;
  position: relative;
}

.items-modal-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.items-modal-main-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px #000a);
}

.items-modal-close-btn {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 1.4rem;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.items-modal-close-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
}

.items-empty {
  color: #aaa;
  font-style: italic;
  padding: 1.5rem 0.5rem;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  background: linear-gradient(135deg, #1f3a5f 0%, #1a2a4a 100%);
  border-radius: 14px;
  padding: 1rem 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: left;
  border-left: 4px solid #42a5f5;
}

.item-card:hover:not(.item-disabled) {
  transform: translateX(4px);
  background: linear-gradient(135deg, #25497a 0%, #213562 100%);
  box-shadow: 0 4px 20px rgba(33, 150, 243, 0.35);
}

.item-card.item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-left-color: #555;
}

.item-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.item-icon {
  width: 52px;
  height: 52px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px #000a);
}

.item-count {
  position: absolute;
  bottom: -4px;
  right: -8px;
  background: linear-gradient(180deg, #ffe066 0%, #ff8a00 100%);
  color: #1a1a2e;
  font-weight: 900;
  font-size: 0.78rem;
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  border: 1.5px solid #1a1a2e;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  font-family: 'Courier New', monospace;
  line-height: 1;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.3rem;
}

.item-name {
  font-size: 1.15rem;
  font-weight: bold;
  color: #fff;
}

.item-tag {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.15rem 0.55rem;
  border-radius: 6px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.item-tag.tag-use {
  background: rgba(76, 175, 80, 0.18);
  color: #6fdc6f;
  border: 1px solid rgba(76, 175, 80, 0.35);
}

.item-tag.tag-already {
  background: rgba(255, 107, 107, 0.18);
  color: #ff9a9a;
  border: 1px solid rgba(255, 107, 107, 0.35);
}

.item-desc {
  color: #b8c8e0;
  font-size: 0.95rem;
  margin: 0.2rem 0;
  line-height: 1.4;
}

.items-modal-hint {
  margin-top: 1.2rem;
  color: #6fdc6f;
  font-size: 0.9rem;
  opacity: 0.85;
}

.items-modal-hint b {
  color: #ffe066;
}

.close-icon {
  width: 14px;
  height: 14px;
  display: block;
  margin: auto;
  filter: brightness(0) invert(1);
}

@media (max-width: 600px) {
  .items-modal {
    min-width: 95vw;
    padding: 1.2rem 1rem 1rem 1rem;
  }

  .item-card {
    padding: 0.8rem 1rem;
  }

  .item-icon {
    width: 44px;
    height: 44px;
  }
}
</style>
