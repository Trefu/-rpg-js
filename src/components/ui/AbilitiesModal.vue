<script setup lang="ts">
import type { IAbility } from '@/core/interfaces/IAbility'
import closeIcon from '@/assets/icons/cross-mark.png'
import hourglassIcon from '@/assets/icons/hourglass.png'

interface Props {
  show: boolean
  abilities: IAbility[]
  abilityCooldowns: { [type: string]: number }
  abilityShortcuts: string[]
}

interface Emits {
  (e: 'close'): void
  (e: 'selectAbility', ability: IAbility, index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const closeModal = () => {
  emit('close')
}

const selectAbility = (ability: IAbility, index: number) => {
  emit('selectAbility', ability, index)
}

const handleModalOverlayClick = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
    closeModal()
  }
}

const getAbilityIcon = (type: string) => {
  const icons: Record<string, string> = {
    attack: '/src/assets/icons/wave-strike.png',
  }
  return icons[type]
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @mousedown="handleModalOverlayClick">
      <div class="modal abilities-modal">
        <div class="modal-header">
          <img src="/src/assets/icons/skills.png" class="modal-main-icon" alt="Habilidades" />
          <h2>Habilidades</h2>
          <button class="modal-close-btn" @click="closeModal" title="Cerrar"><img :src="closeIcon" alt="" class="close-icon" /></button>
        </div>

        <div class="abilities-grid">
          <div
            v-for="(ability, idx) in abilities"
            :key="ability.type"
            class="ability-card"
            :class="{ 'on-cooldown': abilityCooldowns[ability.type] > 0 }"
            @click="selectAbility(ability, idx)"
          >
            <div class="ability-icon-wrapper">
              <img :src="getAbilityIcon(ability.type)" class="ability-icon" :alt="ability.name" />
              <div v-if="abilityCooldowns[ability.type] > 0" class="cooldown-overlay">
                <span class="cooldown-count">{{ abilityCooldowns[ability.type] }}</span>
              </div>
            </div>

            <div class="ability-content">
              <div class="ability-header">
                <span class="ability-name">{{ ability.name }}</span>
                <span class="shortcut-badge">{{ abilityShortcuts[idx].toUpperCase() }}</span>
              </div>
              <p class="ability-desc">{{ ability.description }}</p>
              <div class="ability-footer">
                <span v-if="ability.cooldown > 0" class="cooldown-badge">
                  <img :src="hourglassIcon" alt="" class="cooldown-icon" /> {{ ability.cooldown }} turno{{ ability.cooldown > 1 ? 's' : '' }}
                </span>
                <span class="use-hint">{{ abilityCooldowns[ability.type] > 0 ? 'Enfriando...' : 'Click para usar' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-hotkey-hint">Pulsa <b>A</b> para cerrar</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 20, 0.85);
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.abilities-modal {
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border-radius: 18px;
  box-shadow: 0 8px 40px #000a, inset 0 1px 0 rgba(255,255,255,0.05);
  padding: 2rem 2.5rem 1.5rem 2.5rem;
  min-width: 500px;
  max-width: 95vw;
  text-align: center;
  position: relative;
  animation: pop-in 0.25s;
  border: 1px solid rgba(255,255,255,0.05);
}

@keyframes pop-in {
  0% {
    transform: scale(0.92);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.8rem;
  position: relative;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.modal-main-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px #000a);
}

.modal-close-btn {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  background: rgba(255,255,255,0.1);
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

.modal-close-btn:hover {
  opacity: 1;
  background: rgba(255,255,255,0.2);
}

.abilities-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ability-card {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  background: linear-gradient(135deg, #292b44 0%, #2f324d 100%);
  border-radius: 14px;
  padding: 1rem 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255,255,255,0.03);
  text-align: left;
}

.ability-card:hover:not(.on-cooldown) {
  transform: translateX(4px);
  background: linear-gradient(135deg, #323559 0%, #393e5f 100%);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.ability-card.on-cooldown {
  opacity: 0.5;
  cursor: not-allowed;
}

.ability-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.ability-icon {
  width: 52px;
  height: 52px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px #000a);
}

.on-cooldown .ability-icon {
  filter: grayscale(100%) brightness(0.5);
}

.cooldown-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cooldown-count {
  color: #ff6b6b;
  font-size: 1.3rem;
  font-weight: bold;
  text-shadow: 0 1px 4px #000;
}

.ability-content {
  flex: 1;
  min-width: 0;
}

.ability-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.3rem;
}

.ability-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
}

.shortcut-badge {
  background: rgba(255,230,0,0.15);
  color: #ffe600;
  font-weight: bold;
  border-radius: 6px;
  padding: 0.15em 0.6em;
  font-size: 0.85rem;
  border: 1px solid rgba(255,230,0,0.3);
}

.ability-desc {
  color: #b8b8d0;
  font-size: 0.95rem;
  margin: 0.2rem 0;
  line-height: 1.4;
}

.ability-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.cooldown-badge {
  background: rgba(255,180,0,0.15);
  color: #ffb400;
  padding: 0.2em 0.6em;
  border-radius: 6px;
  font-size: 0.85rem;
  border: 1px solid rgba(255,180,0,0.25);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.cooldown-icon { width: 0.9em; height: 0.9em; filter: sepia(1) saturate(5) hue-rotate(0deg) brightness(1.2); }
.close-icon { width: 14px; height: 14px; display: block; margin: auto; filter: brightness(0) invert(1); }

.use-hint {
  color: #6fdc6f;
  font-size: 0.85rem;
  opacity: 0.8;
}

.on-cooldown .use-hint {
  color: #ff6b6b;
}

.modal-hotkey-hint {
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}

.modal-hotkey-hint b {
  color: #999;
}

@media (max-width: 600px) {
  .abilities-modal {
    min-width: 95vw;
    padding: 1.2rem 1rem 1rem 1rem;
  }

  .ability-card {
    padding: 0.8rem 1rem;
  }

  .ability-icon {
    width: 44px;
    height: 44px;
  }
}
</style>