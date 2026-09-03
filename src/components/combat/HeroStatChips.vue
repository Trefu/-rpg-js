<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Hero } from '@/core/Hero'

interface Props {
  hero: Hero | null
  showAll?: boolean
  tooltipPosition?: 'below' | 'above'
  /**
   * Filtra los chips renderizados. Default `all`.
   * - `stats`: solo las stats base (ATQ, DEF, AGI, CUE, CON, MEN)
   * - `defense`: solo los derivados de defensa (FÍS, MAG)
   */
  only?: 'all' | 'stats' | 'defense'
}
const props = withDefaults(defineProps<Props>(), {
  tooltipPosition: 'below',
  only: 'all'
})

const hovered = ref<string | null>(null)
const touched = ref<string | null>(null)
const chipEls = ref<Record<string, HTMLElement | null>>({})
const tooltipEl = ref<HTMLElement | null>(null)
const tooltipStyle = ref<{ top: string; left: string; placement: 'above' | 'below' }>({
  top: '-9999px',
  left: '-9999px',
  placement: 'below'
})

interface StatChip {
  key: string
  label: string
  value: string
  hint: string
  kind: 'agi' | 'phys' | 'mag' | 'atk' | 'def' | 'body' | 'con' | 'mind'
}

function reductionPct(def: number): number {
  return Math.max(0, Math.min(50, Math.floor((def - 10) * 0.5 * 10) / 10))
}

const chips = computed<StatChip[]>(() => {
  const p = props.hero
  if (!p) return []
  const def = p.defense()
  const rpct = reductionPct(def)
  const agi = p.baseStats.agility.value
  if (!props.showAll) {
    return [
      {
        key: 'phys',
        label: 'FÍS',
        value: `${rpct}%`,
        kind: 'phys',
        hint: `Reducción de daño físico: ${rpct}%\nFórmula: max(0, defense - 10) × 0.5% (cap 50%).\nDefense = 10 + ln(1 + max(0, body - 10)) × 4 + max(0, constitution - 10) × 0.5.\nSe aplica como bonus al max block reduction del patrón enemigo (cap 50% por stat, más el base del patrón).`
      },
      {
        key: 'mag',
        label: 'MAG',
        value: `${rpct}%`,
        kind: 'mag',
        hint: `Reducción de daño mágico: ${rpct}%\nEste juego usa defensa unificada: la reducción mágica se calcula con la misma fórmula que la física (defensa del personaje).\nSi en el futuro se separa, se aplicará mind × coeficiente aquí.`
      },
      {
        key: 'agi',
        label: 'AGI',
        value: String(agi),
        kind: 'agi',
        hint: `Agilidad: ${agi}\nDefine cuándo actúas y suma chance de crítico.\nFórmula: critChance base + bonus(agi).\nBonus(agi) = (ln(1 + max(0, agi - 10)) × 5)%`
      }
    ]
  }
  const allChips: StatChip[] = [
    {
      key: 'atk',
      label: 'ATQ',
      value: String(p.attack()),
      kind: 'atk',
      hint: `Ataque: ${p.attack()}\nFórmula: baseAttack + (body - 10) × 0.5 + nivel × 1.`
    },
    {
      key: 'def',
      label: 'DEF',
      value: String(def),
      kind: 'def',
      hint: `Defensa: ${def}\nFórmula: 10 + ln(1 + max(0, body - 10)) × 4 + max(0, constitution - 10) × 0.5.`
    },
    {
      key: 'phys',
      label: 'FÍS',
      value: `${rpct}%`,
      kind: 'phys',
      hint: `Reducción de daño físico: ${rpct}%\nFórmula: max(0, defense - 10) × 0.5% (cap 50%).\nDefense = 10 + ln(1 + max(0, body - 10)) × 4 + max(0, constitution - 10) × 0.5.\nSe aplica como bonus al max block reduction del patrón enemigo (cap 50% por stat, más el base del patrón).`
    },
    {
      key: 'mag',
      label: 'MAG',
      value: `${rpct}%`,
      kind: 'mag',
      hint: `Reducción de daño mágico: ${rpct}%\nEste juego usa defensa unificada: la reducción mágica se calcula con la misma fórmula que la física (defensa del personaje).\nSi en el futuro se separa, se aplicará mind × coeficiente aquí.`
    },
    {
      key: 'agi',
      label: 'AGI',
      value: String(agi),
      kind: 'agi',
      hint: `Agilidad: ${agi}\nDefine cuándo actúas y suma chance de crítico.\nFórmula: critChance base + bonus(agi).\nBonus(agi) = (ln(1 + max(0, agi - 10)) × 5)%`
    },
    {
      key: 'body',
      label: 'CUE',
      value: String(Math.round(p.baseStats.body.value)),
      kind: 'body',
      hint: `Cuerpo: ${p.baseStats.body.value}\nStat de daño físico y defensivo (logarítmico sobre 10).`
    },
    {
      key: 'con',
      label: 'CON',
      value: String(Math.round(p.baseStats.constitution.value)),
      kind: 'con',
      hint: `Constitución: ${p.baseStats.constitution.value}\nResistencia física y vitalidad. Bonus lineal ×0.5 sobre 10 a la defensa.`
    },
    {
      key: 'mind',
      label: 'MEN',
      value: String(Math.round(p.baseStats.mind.value)),
      kind: 'mind',
      hint: `Mente: ${p.baseStats.mind.value}\nPoder mágico. Escala daño de hechizos (coeficiente 0.4 sobre 10).`
    }
  ]
  if (props.only === 'stats') {
    return allChips.filter(c => c.kind !== 'phys' && c.kind !== 'mag')
  }
  if (props.only === 'defense') {
    return allChips.filter(c => c.kind === 'phys' || c.kind === 'mag')
  }
  return allChips
})

const activeKey = computed(() => hovered.value ?? touched.value)
const activeChip = computed<StatChip | null>(() => {
  const k = activeKey.value
  if (!k) return null
  return chips.value.find(c => c.key === k) ?? null
})

function setChipRef(key: string) {
  return (el: Element | null) => {
    if (el) chipEls.value[key] = el as HTMLElement
    else delete chipEls.value[key]
  }
}

function recomputeTooltipPosition() {
  const key = activeKey.value
  const chip = key ? chipEls.value[key] : null
  const tip = tooltipEl.value
  if (!chip || !tip) return

  const chipRect = chip.getBoundingClientRect()
  const tipRect = tip.getBoundingClientRect()
  const margin = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const prefer = props.tooltipPosition

  let placement: 'above' | 'below' = prefer
  let top: number
  if (prefer === 'above') {
    top = chipRect.top - tipRect.height - margin
    if (top < 4) {
      top = chipRect.bottom + margin
      placement = 'below'
    }
  } else {
    top = chipRect.bottom + margin
    if (top + tipRect.height > vh - 4) {
      top = chipRect.top - tipRect.height - margin
      placement = 'above'
      if (top < 4) top = 4
    }
  }

  let left = chipRect.left + chipRect.width / 2 - tipRect.width / 2
  left = Math.max(4, Math.min(left, vw - tipRect.width - 4))

  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    placement
  }
}

async function openTooltip(key: string) {
  hovered.value = key
  await nextTick()
  await nextTick()
  recomputeTooltipPosition()
}

function closeTooltip(key: string) {
  if (hovered.value === key) hovered.value = null
}

function toggle(key: string) {
  touched.value = touched.value === key ? null : key
  nextTick(() => nextTick()).then(recomputeTooltipPosition)
}

function isOpen(key: string): boolean {
  return activeKey.value === key
}

function onDocClick() {
  touched.value = null
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', recomputeTooltipPosition, true)
  window.addEventListener('resize', recomputeTooltipPosition)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', recomputeTooltipPosition, true)
  window.removeEventListener('resize', recomputeTooltipPosition)
})
</script>

<template>
  <div class="hero-stat-chips" @click.stop>
    <button
      v-for="chip in chips"
      :key="chip.key"
      type="button"
      class="stat-chip"
      :class="[
        'stat-chip-' + chip.kind,
        { 'tooltip-open': isOpen(chip.key) }
      ]"
      :ref="setChipRef(chip.key)"
      @mouseenter="openTooltip(chip.key)"
      @mouseleave="closeTooltip(chip.key)"
      @click.stop="toggle(chip.key)"
    >
      <span class="stat-chip-label">{{ chip.label }}</span>
      <span class="stat-chip-value">{{ chip.value }}</span>
    </button>
  </div>

  <Teleport to="body">
    <div
      v-if="activeChip"
      ref="tooltipEl"
      class="stat-chip-tooltip"
      :class="['stat-chip-tooltip-' + tooltipStyle.placement]"
      :style="{ top: tooltipStyle.top, left: tooltipStyle.left }"
      @click.stop
      @mouseenter="recomputeTooltipPosition"
    >
      <div class="stat-chip-tooltip-line">{{ activeChip.hint }}</div>
    </div>
  </Teleport>
</template>

<style scoped>
.hero-stat-chips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(105px, 1fr));
  gap: 0.4rem;
  justify-content: start;
}

.stat-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.4);
  cursor: help;
  font-family: 'Courier New', monospace;
  font-size: 0.88rem;
  color: #fff;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  text-shadow: 0 1px 2px #000;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}

.stat-chip:hover,
.stat-chip.tooltip-open {
  transform: translateY(-1px);
  z-index: 8;
}

.stat-chip-agi {
  border-color: rgba(255, 230, 102, 0.55);
  background: linear-gradient(135deg, rgba(255, 230, 102, 0.18), rgba(180, 140, 0, 0.25));
}
.stat-chip-agi:hover,
.stat-chip-agi.tooltip-open {
  box-shadow: 0 0 8px rgba(255, 230, 102, 0.55);
}

.stat-chip-phys {
  border-color: rgba(255, 138, 58, 0.55);
  background: linear-gradient(135deg, rgba(255, 138, 58, 0.18), rgba(180, 60, 0, 0.28));
}
.stat-chip-phys:hover,
.stat-chip-phys.tooltip-open {
  box-shadow: 0 0 8px rgba(255, 138, 58, 0.6);
}

.stat-chip-mag {
  border-color: rgba(130, 177, 255, 0.55);
  background: linear-gradient(135deg, rgba(130, 177, 255, 0.18), rgba(40, 90, 180, 0.28));
}
.stat-chip-mag:hover,
.stat-chip-mag.tooltip-open {
  box-shadow: 0 0 8px rgba(130, 177, 255, 0.6);
}

.stat-chip-atk {
  border-color: rgba(255, 102, 102, 0.5);
  background: linear-gradient(135deg, rgba(255, 102, 102, 0.16), rgba(160, 40, 40, 0.28));
}
.stat-chip-atk:hover,
.stat-chip-atk.tooltip-open {
  box-shadow: 0 0 8px rgba(255, 102, 102, 0.55);
}

.stat-chip-def {
  border-color: rgba(102, 187, 106, 0.55);
  background: linear-gradient(135deg, rgba(102, 187, 106, 0.16), rgba(40, 120, 60, 0.28));
}
.stat-chip-def:hover,
.stat-chip-def.tooltip-open {
  box-shadow: 0 0 8px rgba(102, 187, 106, 0.55);
}

.stat-chip-body {
  border-color: rgba(255, 167, 38, 0.5);
  background: linear-gradient(135deg, rgba(255, 167, 38, 0.16), rgba(160, 80, 0, 0.28));
}
.stat-chip-body:hover,
.stat-chip-body.tooltip-open {
  box-shadow: 0 0 8px rgba(255, 167, 38, 0.5);
}

.stat-chip-con {
  border-color: rgba(174, 213, 129, 0.5);
  background: linear-gradient(135deg, rgba(174, 213, 129, 0.16), rgba(80, 130, 60, 0.28));
}
.stat-chip-con:hover,
.stat-chip-con.tooltip-open {
  box-shadow: 0 0 8px rgba(174, 213, 129, 0.5);
}

.stat-chip-mind {
  border-color: rgba(186, 104, 200, 0.55);
  background: linear-gradient(135deg, rgba(186, 104, 200, 0.16), rgba(90, 30, 120, 0.28));
}
.stat-chip-mind:hover,
.stat-chip-mind.tooltip-open {
  box-shadow: 0 0 8px rgba(186, 104, 200, 0.55);
}

.stat-chip-label {
  font-weight: 700;
  letter-spacing: 0.06em;
  opacity: 0.85;
}

.stat-chip-value {
  font-weight: 800;
  color: #fff;
}

.stat-chip-tooltip {
  position: fixed;
  width: max-content;
  max-width: 320px;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.7);
  z-index: 9999;
  text-align: left;
  pointer-events: auto;
  white-space: pre-line;
  animation: stat-chip-tooltip-in 0.12s ease-out;
}

.stat-chip-tooltip-above::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-top-color: rgba(255, 230, 102, 0.55);
}

.stat-chip-tooltip-below::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-bottom-color: rgba(255, 230, 102, 0.55);
}

.stat-chip-tooltip-line {
  color: #cfd8dc;
  font-family: 'Courier New', monospace;
  font-size: 0.92rem;
  line-height: 1.55;
  text-shadow: 0 1px 2px #000;
}

@keyframes stat-chip-tooltip-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 720px) {
  .hero-stat-chips {
    grid-template-columns: repeat(3, 1fr);
  }
  .stat-chip {
    font-size: 0.72rem;
    padding: 0.2rem 0.45rem;
  }
  .stat-chip-tooltip {
    max-width: 240px;
    font-size: 0.78rem;
  }
}
</style>
