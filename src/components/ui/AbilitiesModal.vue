<script setup lang="ts">
import type { IAbility } from '@/core/interfaces/IAbility'

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
</script>

<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @mousedown="handleModalOverlayClick">
      <div class="modal abilities-modal">
        <div class="modal-header">
          <img src="/src/assets/icons/menu/skill.png" class="modal-main-icon" alt="Habilidades" />
          <h2>Habilidades</h2>
          <button class="modal-close-btn" @click="closeModal" title="Cerrar">✕</button>
        </div>
        <ul class="abilities-list">
          <li v-for="(ability, idx) in abilities" :key="ability.type" class="ability-item" :class="{ 'on-cooldown': abilityCooldowns[ability.type] > 0 }">
            <div class="ability-info">
              <img v-if="ability.type === 'attack'" src="/src/assets/icons/splash-icons/1.png" class="ability-icon-lg" alt="Atacar" />
              <img v-else-if="ability.type === 'stunStrike'" src="/src/assets/icons/splash-icons/35.png" class="ability-icon-lg" alt="Golpe Aturdidor" />
              <img v-else-if="ability.type === 'stealthStrike'" src="/src/assets/icons/splash-icons/2.png" class="ability-icon-lg" alt="Golpe Sigiloso" />
              <img v-else-if="ability.type === 'fireball'" src="/src/assets/icons/splash-icons/10.png" class="ability-icon-lg" alt="Bola de Fuego" />
              <img v-else src="/src/assets/icons/splash-icons/1.png" class="ability-icon-lg" :alt="ability.name" />
              <div class="ability-meta">
                <div class="ability-name">{{ ability.name }}</div>
                <div class="ability-type">Tipo: {{ ability.type }}</div>
                <div v-if="ability.cooldown > 0" class="ability-cooldown">Cooldown base: {{ ability.cooldown }} turno(s)</div>
              </div>
            </div>
            <div class="ability-desc">{{ ability.description }}</div>
            <button class="ability-use-btn" :disabled="abilityCooldowns[ability.type] > 0" @click="selectAbility(ability, idx)">
              <span v-if="abilityCooldowns[ability.type] > 0">
                Enfriamiento ({{ abilityCooldowns[ability.type] }})
              </span>
              <span v-else>
                Usar <span class="shortcut-badge">[{{ abilityShortcuts[idx].toUpperCase() }}]</span>
              </span>
            </button>
          </li>
        </ul>
        <div class="modal-hotkey-hint">Pulsa <b>A</b> para abrir/cerrar</div>
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
  background: #23243a;
  border-radius: 18px;
  box-shadow: 0 8px 32px #000a;
  padding: 2.5rem 2.5rem 1.5rem 2.5rem;
  min-width: 340px;
  max-width: 95vw;
  text-align: center;
  position: relative;
  animation: pop-in 0.25s;
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
  gap: 1.2rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.modal-main-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px #000a);
}

.modal-close-btn {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.7rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.modal-close-btn:hover {
  opacity: 1;
}

.abilities-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 1rem 0;
}

.ability-item {
  margin-bottom: 2.2rem;
  background: #292b44;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0003;
  padding: 1.2rem 1.2rem 1.5rem 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

.ability-info {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 0.7rem;
}

.ability-icon-lg {
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px #000a);
}

.ability-meta {
  text-align: left;
}

.ability-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: #fff;
}

.ability-type {
  font-size: 0.95rem;
  color: #6fdc6f;
  margin-top: 0.1rem;
}

.ability-cooldown {
  font-size: 0.95rem;
  color: #ffe600;
  margin-top: 0.1rem;
}

.ability-desc {
  color: #ffe600;
  font-size: 1.05rem;
  margin: 0.5rem 0 0.7rem 0;
  text-align: left;
}

.ability-use-btn {
  margin-top: 0.2rem;
  background: linear-gradient(90deg, #4CAF50 0%, #2a2a2a 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.7rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, opacity 0.2s;
  box-shadow: 0 2px 8px #0005;
}

.ability-use-btn:disabled {
  background: #555;
  color: #bbb;
  opacity: 0.6;
  cursor: not-allowed;
}

.ability-use-btn:not(:disabled):hover {
  background: linear-gradient(90deg, #6fdc6f 0%, #444 100%);
  transform: scale(1.04);
}

.ability-use-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ability-item.on-cooldown {
  background: #2f314d;
  opacity: 0.6;
}

.ability-item.on-cooldown .ability-name,
.ability-item.on-cooldown .ability-desc {
  color: #999;
}

.ability-item.on-cooldown .ability-icon-lg {
  filter: grayscale(80%);
}

.modal-hotkey-hint {
  margin-top: 0.7rem;
  color: #aaa;
  font-size: 0.95rem;
}

.shortcut-badge {
  background: #222;
  color: #ffe600;
  font-weight: bold;
  border-radius: 4px;
  padding: 0.1em 0.4em;
  margin-left: 0.5em;
  font-size: 0.95em;
}

@media (max-width: 600px) {
  .abilities-modal {
    min-width: 90vw;
    padding: 1.2rem 0.5rem 1rem 0.5rem;
  }

  .ability-item {
    padding: 0.7rem 0.5rem 1rem 0.5rem;
  }

  .modal-header h2 {
    font-size: 1.1rem;
  }
}
</style> 