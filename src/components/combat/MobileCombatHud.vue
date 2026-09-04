<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Hero } from '@/core/Hero'
import type { IEnemy } from '@/core/interfaces/ICharacter'
import { MAX_HEROES } from '@/stores/game'
import HeroDotIcons from './HeroDotIcons.vue'
import EnemyStatusIcons from './EnemyStatusIcons.vue'
import MobileHeroStats from './MobileHeroStats.vue'

const props = defineProps<{
    player: Hero | null
    heroes: Hero[]
    enemies: IEnemy[]
    aliveIndexByEnemyId: Record<string, number>
    isSelectingTarget?: boolean
    canTargetAllies?: boolean
    activeHeroIndex?: number
    attackedHeroIds?: string[]
}>()

const emit = defineEmits<{
    (e: 'selectEnemy', enemy: IEnemy): void
    (e: 'selectAlly', hero: Hero): void
}>()

const heroSlots = computed<(Hero | null)[]>(() => {
    const slots: (Hero | null)[] = []
    for (let i = 0; i < MAX_HEROES; i++) slots.push(props.heroes[i] ?? null)
    return slots
})

const fallbackHero = computed<Hero | null>(() => {
    return props.heroes.find(h => h.isAlive) ?? props.heroes[0] ?? null
})

const effectivePlayer = computed<Hero | null>(() => props.player ?? fallbackHero.value)

const attackedHero = computed<Hero | null>(() => {
    const ids = props.attackedHeroIds ?? []
    if (ids.length === 0) return null
    const targetId = ids[0]
    return props.heroes.find(h => h.id === targetId && h.isAlive) ?? null
})

const displayedHero = computed<Hero | null>(() => attackedHero.value ?? effectivePlayer.value)

const isDisplayingAttackedHero = computed(() => !!attackedHero.value)

const hpPercent = computed(() => {
    const h = displayedHero.value
    if (!h || h.maxHealth <= 0) return 0
    return Math.max(0, (h.health / h.maxHealth) * 100)
})

const energyPercent = computed(() => {
    const h = displayedHero.value
    if (!h || !h.maxEnergy) return 0
    return Math.max(0, (h.energy / h.maxEnergy) * 100)
})

const hpDisplay = computed(() =>
    displayedHero.value ? `${displayedHero.value.health}/${displayedHero.value.maxHealth}` : ''
)
const energyDisplay = computed(() =>
    displayedHero.value ? `${displayedHero.value.energy}/${displayedHero.value.maxEnergy}` : ''
)

function heroHpPercent(h: Hero) {
    if (h.maxHealth <= 0) return 0
    return Math.max(0, (h.health / h.maxHealth) * 100)
}

function heroEnergyPercent(h: Hero) {
    if (!h.maxEnergy) return 0
    return Math.max(0, (h.energy / h.maxEnergy) * 100)
}

const showAllyPreview = ref(false)
const allyStatsOpen = ref<Record<string, boolean>>({})

function toggleAllyPreview() {
    showAllyPreview.value = !showAllyPreview.value
    if (!showAllyPreview.value) allyStatsOpen.value = {}
}

const isAllyTargeting = computed(
    () => !!props.isSelectingTarget && !!props.canTargetAllies
)

function canPickAlly(hero: Hero | null): boolean {
    return !!hero && hero.isAlive && isAllyTargeting.value
}

function onHeroPortraitClick() {
    toggleAllyPreview()
}

function onAllyRowClick(hero: Hero | null) {
    if (!hero) return
    if (canPickAlly(hero)) {
        showAllyPreview.value = false
        allyStatsOpen.value = {}
        emit('selectAlly', hero)
        return
    }
    if (!hero.isAlive) return
    // Solo un panel de stats abierto a la vez: si abro el de este heroe,
    // cierro el de cualquier otro.
    const wasOpen = !!allyStatsOpen.value[hero.id]
    const next: Record<string, boolean> = {}
    if (!wasOpen) next[hero.id] = true
    allyStatsOpen.value = next
}
</script>

<template>
    <div v-if="effectivePlayer" class="mobile-hud">
        <button class="mobile-hud-hero" :class="{
            'mobile-hud-hero-targeting': isAllyTargeting,
            'mobile-hud-hero-being-attacked': isDisplayingAttackedHero
        }" type="button"
            :title="isAllyTargeting
                ? 'Seleccionar aliado'
                : (isDisplayingAttackedHero
                    ? `${displayedHero?.name} esta siendo atacado`
                    : 'Ver estado del equipo')"
            @click="onHeroPortraitClick">
            <img v-if="displayedHero?.sprite" :src="displayedHero.sprite" :alt="displayedHero.name"
                class="mobile-hud-portrait" decoding="async" />
            <div class="mobile-hud-info">
                <div class="mobile-hud-name">
                    <span class="mobile-hud-name-text">
                        {{ isAllyTargeting
                            ? 'Seleccionar aliado'
                            : (isDisplayingAttackedHero
                                ? `${displayedHero?.name} Defendiendo`
                                : displayedHero?.name) }}
                    </span>
                    <span class="mobile-hud-level">Nv {{ displayedHero?.level }}</span>
                </div>
                <div class="mobile-hud-bar">
                    <div class="mobile-hud-bar-fill hp" :style="{ width: `${hpPercent}%` }"></div>
                    <span class="mobile-hud-bar-value">
                        {{ hpDisplay }}
                    </span>
                </div>
                <div class="mobile-hud-bar">
                    <div class="mobile-hud-bar-fill energy" :style="{ width: `${energyPercent}%` }"></div>
                    <span class="mobile-hud-bar-value">
                        {{ energyDisplay }}
                    </span>
                </div>
            </div>
            <HeroDotIcons v-if="displayedHero" :effects="displayedHero.statusEffects" />
        </button>

        <transition name="panel-preview">
            <div v-if="showAllyPreview" class="mobile-hud-panel mobile-hud-ally-preview">
                <div class="mobile-hud-ally-hint">
                    {{ isAllyTargeting ? 'Toca un aliado para seleccionarlo' : 'Toca un héroe para ver sus stats' }}
                </div>
                <div v-for="(hero, idx) in heroSlots" :key="hero?.id ?? `empty-${idx}`"
                    class="mobile-hud-ally-wrapper">
                    <button type="button"
                        class="mobile-hud-ally-row" :class="{
                            dead: !hero || !hero.isAlive,
                            active: hero && props.activeHeroIndex === idx,
                            targeting: canPickAlly(hero),
                            empty: !hero,
                            'being-attacked': !!hero && (props.attackedHeroIds ?? []).includes(hero.id),
                            'stats-open': hero && allyStatsOpen[hero.id]
                        }" :disabled="!hero || (!hero.isAlive && !isAllyTargeting)" @click="onAllyRowClick(hero)">
                        <img v-if="hero?.sprite" :src="hero.sprite" :alt="hero?.name ?? ''"
                            class="mobile-hud-ally-sprite" loading="lazy" decoding="async" />
                        <span v-else class="mobile-hud-ally-sprite mobile-hud-ally-sprite-empty">—</span>
                        <div class="mobile-hud-ally-body">
                            <div class="mobile-hud-ally-head">
                                <span class="mobile-hud-ally-name">{{ hero?.name ?? 'Vacío' }}</span>
                                <span v-if="hero" class="mobile-hud-ally-level">Nv {{ hero.level }}</span>
                                <span v-if="hero && (props.attackedHeroIds ?? []).includes(hero.id)"
                                    class="mobile-hud-ally-being-attacked">Defendiendo</span>
                            </div>
                            <template v-if="hero">
                                <div class="mobile-hud-ally-bar">
                                    <div class="mobile-hud-ally-bar-fill hp" :style="{ width: `${heroHpPercent(hero)}%` }">
                                    </div>
                                    <span class="mobile-hud-ally-bar-value">
                                        {{ hero.health }}/{{ hero.maxHealth }}
                                    </span>
                                </div>
                                <div v-if="hero.maxEnergy" class="mobile-hud-ally-bar">
                                    <div class="mobile-hud-ally-bar-fill energy"
                                        :style="{ width: `${heroEnergyPercent(hero)}%` }"></div>
                                    <span class="mobile-hud-ally-bar-value">
                                        {{ hero.energy }}/{{ hero.maxEnergy }}
                                    </span>
                                </div>
                                <EnemyStatusIcons v-if="hero.statusEffects && hero.statusEffects.length"
                                    :effects="hero.statusEffects" class="mobile-hud-ally-effects" />
                            </template>
                        </div>
                    </button>
                    <MobileHeroStats v-if="hero && allyStatsOpen[hero.id]" :hero="hero" />
                </div>
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
    padding: 0.5rem 0.75rem 1.6rem 0.75rem;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.55) 100%);
    border-bottom: 1px solid rgba(255, 230, 102, 0.35);
    backdrop-filter: blur(6px);
}

.mobile-hud-hero {
    flex: 1 1 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.55rem 0.7rem;
    border-radius: 10px;
    border: 1.5px solid rgba(255, 230, 102, 0.35);
    background: linear-gradient(145deg, #2a1f4a 0%, #1a1230 100%);
    color: #fff;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
}

.mobile-hud-portrait {
    width: 64px;
    height: 64px;
    border-radius: 9px;
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
    gap: 5px;
}

.mobile-hud-name {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.4rem;
    min-width: 0;
}

.mobile-hud-name-text {
    font-size: 1rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mobile-hud-level {
    font-size: 0.74rem;
    color: #b6f5b6;
    letter-spacing: 0.04em;
    flex-shrink: 0;
}

.mobile-hud-bar {
    position: relative;
    height: 18px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 8px;
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
    font-size: 0.78rem;
    font-weight: 800;
    color: #fff;
    text-shadow: 0 1px 2px #000;
    pointer-events: none;
}

.mobile-hud-bar-icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
    filter: drop-shadow(0 1px 1px #000a);
    flex-shrink: 0;
}

.mobile-hud-hero-targeting {
    border-color: rgba(102, 255, 178, 0.85) !important;
    box-shadow: 0 0 0 2px rgba(102, 255, 178, 0.35);
    animation: mobile-hud-targeting-pulse 1.2s ease-in-out infinite;
}

.mobile-hud-hero-being-attacked {
    border-color: rgba(255, 68, 85, 0.95) !important;
    box-shadow: 0 0 0 2px rgba(255, 68, 85, 0.55), 0 0 14px rgba(255, 51, 68, 0.6);
    animation: mobile-hud-being-attacked-pulse 0.8s ease-in-out infinite;
}

@keyframes mobile-hud-targeting-pulse {

    0%,
    100% {
        box-shadow: 0 0 0 2px rgba(102, 255, 178, 0.35);
    }

    50% {
        box-shadow: 0 0 0 4px rgba(102, 255, 178, 0.55);
    }
}

.mobile-hud-panel {
    position: absolute;
    top: calc(100% + 4px);
    left: 0.5rem;
    right: 0.5rem;
    background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
    border: 1.5px solid rgba(102, 255, 178, 0.55);
    border-radius: 10px;
    padding: 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    z-index: 25;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
    max-height: 65vh;
    overflow-y: auto;
}

.mobile-hud-ally-hint {
    font-size: 0.72rem;
    color: #b6f5b6;
    text-align: center;
    padding: 0.15rem 0.25rem 0.4rem;
    border-bottom: 1px solid rgba(102, 255, 178, 0.25);
    margin-bottom: 0.2rem;
}

@keyframes mobile-hud-being-attacked-pulse {

    0%,
    100% {
        box-shadow: 0 0 0 1.5px rgba(255, 68, 85, 0.45), 0 0 8px rgba(255, 51, 68, 0.35);
    }

    50% {
        box-shadow: 0 0 0 2.5px rgba(255, 68, 85, 0.85), 0 0 18px rgba(255, 51, 68, 0.8);
    }
}

.mobile-hud-ally-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.mobile-hud-ally-row {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 0.55rem;
    align-items: center;
    padding: 0.55rem 0.65rem;
    border-radius: 8px;
    border: 1px solid rgba(102, 255, 178, 0.25);
    background: linear-gradient(145deg, rgba(22, 48, 42, 0.7) 0%, rgba(12, 28, 24, 0.7) 100%);
    color: #fff;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
}

.mobile-hud-ally-row.stats-open {
    border-color: rgba(255, 230, 102, 0.55);
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

.mobile-hud-ally-being-attacked {
    display: inline-block;
    background: #ff3344;
    color: #fff;
    font-size: 0.64rem;
    font-weight: 700;
    padding: 1px 6px;
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

.mobile-hud-ally-sprite {
    width: 48px;
    height: 48px;
    object-fit: contain;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 7px;
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
    gap: 4px;
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
    font-size: 0.94rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mobile-hud-ally-level {
    font-size: 0.74rem;
    color: #b6f5b6;
    letter-spacing: 0.04em;
    flex-shrink: 0;
}

.mobile-hud-ally-bar {
    position: relative;
    height: 14px;
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
    font-size: 0.72rem;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 2px #000;
    pointer-events: none;
}

.mobile-hud-ally-bar-icon {
    width: 12px;
    height: 12px;
    object-fit: contain;
    filter: drop-shadow(0 1px 1px #000a);
    flex-shrink: 0;
}

.mobile-hud-ally-effects,
.mobile-hud-ally-effects.enemy-status-icons {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    justify-content: flex-start;
    margin-top: 2px;
    background: rgba(0, 0, 0, 0.5);
    padding: 0.1rem 0.3rem;
    z-index: auto;
    max-width: 100%;
    flex-wrap: wrap;
    gap: 0.2rem;
}

.mobile-hud-ally-effects .enemy-status-icon img {
    width: 18px;
    height: 18px;
}

.mobile-hud-info-status .enemy-status-icon img {
    width: 18px;
    height: 18px;
}

.panel-preview-enter-active,
.panel-preview-leave-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.panel-preview-enter-from,
.panel-preview-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
</style>