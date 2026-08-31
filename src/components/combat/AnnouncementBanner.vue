<script setup lang="ts">
import { computed } from 'vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import type { AnnouncementVariant } from '@/composables/useAnnouncer'

const announcer = useAnnouncer()

const visible = computed(() => announcer.current.value !== null)
const text = computed(() => announcer.current.value?.text ?? '')
const variant = computed<AnnouncementVariant>(() => announcer.current.value?.variant ?? 'info')
const variantClass = computed(() => `variant-${variant.value}`)
</script>

<template>
  <transition name="announcement">
    <div v-if="visible && text" class="announcement-banner" :class="variantClass">
      <div class="announcement-frame">
        <span class="announcement-text">{{ text }}</span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.announcement-banner {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1500;
  pointer-events: none;
  display: flex;
  justify-content: center;
}

.announcement-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.6rem;
  min-width: 240px;
  max-width: 70vw;
  background: linear-gradient(180deg, rgba(15, 22, 42, 0.95) 0%, rgba(8, 12, 26, 0.95) 100%);
  border-radius: 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6) inset,
    0 4px 22px rgba(0, 0, 0, 0.55),
    0 0 18px rgba(255, 255, 255, 0.08);
  position: relative;
}

.announcement-frame::before,
.announcement-frame::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  transform: translateY(-50%) rotate(45deg);
  background: rgba(15, 22, 42, 0.95);
}

.announcement-frame::before { left: -5px; }
.announcement-frame::after  { right: -5px; }

.announcement-text {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #ffffff;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  line-height: 1.2;
  white-space: pre-line;
}

.variant-attack .announcement-frame {
  border-color: #ff6b6b;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6) inset,
    0 4px 22px rgba(0, 0, 0, 0.55),
    0 0 22px rgba(255, 107, 107, 0.35);
}
.variant-attack .announcement-frame::before,
.variant-attack .announcement-frame::after { border-color: #ff6b6b; }
.variant-attack .announcement-text { color: #ffb3b3; }

.variant-status .announcement-frame {
  border-color: #b388ff;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6) inset,
    0 4px 22px rgba(0, 0, 0, 0.55),
    0 0 22px rgba(179, 136, 255, 0.35);
}
.variant-status .announcement-frame::before,
.variant-status .announcement-frame::after { border-color: #b388ff; }
.variant-status .announcement-text { color: #dcc6ff; }

.variant-turn .announcement-frame {
  border-color: #ffe066;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6) inset,
    0 4px 22px rgba(0, 0, 0, 0.55),
    0 0 22px rgba(255, 224, 102, 0.35);
}
.variant-turn .announcement-frame::before,
.variant-turn .announcement-frame::after { border-color: #ffe066; }
.variant-turn .announcement-text { color: #ffe066; }

.variant-crit .announcement-frame {
  border-color: #ffe066;
  background: linear-gradient(180deg, rgba(40, 30, 0, 0.95) 0%, rgba(20, 14, 0, 0.95) 100%);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6) inset,
    0 4px 22px rgba(0, 0, 0, 0.55),
    0 0 30px rgba(255, 224, 102, 0.5);
  animation: announcement-pulse 0.6s ease-out;
}
.variant-crit .announcement-frame::before,
.variant-crit .announcement-frame::after { border-color: #ffe066; }
.variant-crit .announcement-text {
  color: #ffe066;
  font-size: 1.55rem;
  font-weight: 700;
}

.variant-crit-attack .announcement-frame {
  border-color: #b388ff;
  border-width: 2px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6) inset,
    0 4px 22px rgba(0, 0, 0, 0.55),
    0 0 22px rgba(179, 136, 255, 0.4);
}
.variant-crit-attack .announcement-frame::before,
.variant-crit-attack .announcement-frame::after { border-color: #b388ff; }
.variant-crit-attack .announcement-text {
  color: #dcc6ff;
}

@keyframes announcement-pulse {
  0%   { transform: scale(0.92); }
  60%  { transform: scale(1.04); }
  100% { transform: scale(1); }
}

.announcement-enter-active {
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(.34, 1.56, .64, 1);
}
.announcement-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.announcement-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-14px);
}
.announcement-enter-to {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.announcement-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.announcement-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

@media (max-width: 720px) {
  .announcement-banner {
    top: 150px;
    bottom: auto;
  }
  .announcement-frame {
    min-width: 0;
    padding: 0.35rem 0.9rem;
    border-width: 1px;
  }
  .announcement-frame::before,
  .announcement-frame::after {
    width: 6px;
    height: 6px;
  }
  .announcement-frame::before { left: -3px; }
  .announcement-frame::after  { right: -3px; }
  .announcement-text {
    font-size: 0.78rem;
  }
  .variant-crit .announcement-text {
    font-size: 0.9rem;
  }
  .announcement-enter-from {
    transform: translateX(-50%) translateY(-14px);
  }
  .announcement-enter-to {
    transform: translateX(-50%) translateY(0);
  }
  .announcement-leave-from {
    transform: translateX(-50%) translateY(0);
  }
  .announcement-leave-to {
    transform: translateX(-50%) translateY(-10px);
  }
}
</style>