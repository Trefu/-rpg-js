<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Hero } from '@/core/Hero'
import '@/styles/hint-colors.css'

interface Props {
  hero: Hero | null
  showAll?: boolean
  tooltipPosition?: 'below' | 'above'
  /**
   * Filtra los chips renderizados. Default `all`.
   * - `atributos`: solo la sección ATRIBUTOS (AGI, CUE, CON, MEN)
   * - `stats`:     solo la sección STATS (ATQ, CRIT, DEF FÍS, DEF MÁG)
   * - `defense`:  solo los chips de reducción (DEF FÍS y DEF MÁG)
   */
  only?: 'all' | 'atributos' | 'stats' | 'defense'
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
  kind: 'agi' | 'phys' | 'mag' | 'atk' | 'atk-mag' | 'body' | 'con' | 'mind' | 'crit'
  section: 'atributos' | 'stats'
}

interface ChipGroup {
  section: 'atributos' | 'stats'
  label: string
  chips: StatChip[]
}

function reductionPct(def: number): number {
  return Math.max(0, Math.min(50, Math.floor((def - 10) * 0.5 * 10) / 10))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Helpers de coloreo para los hints. Cada color coincide con el chip/badge
 * de su stat para que el ojo identifique al instante qué número viene
 * de dónde. Familias de color:
 *   - Cuerpo (orange)   → CUE, ATQ, DEF FÍS
 *   - Mente  (azul)     → MEN, ATQ MAG, DEF MÁG
 *   - Agi    (amarillo) → AGI, CRIT
 *   - Vida   (verde)    → CON, DEF crudo
 *
 * `v-html` se usa en el render del tooltip y los inputs son cálculos +
 * strings estáticos, así que no hay riesgo de inyección.
 */
const T = {
  base: (n: string | number) => `<span class="hint-base">${n}</span>`,
  lvl:  (n: string | number) => `<span class="hint-lvl">${n}</span>`,
  atk:  (n: string | number) => `<span class="hint-atk">${n}</span>`,
  def:  (n: string | number) => `<span class="hint-def">${n}</span>`,
  mdef: (n: string | number) => `<span class="hint-mdef">${n}</span>`,
  phys: (n: string | number) => `<span class="hint-phys">${n}</span>`,
  mag:  (n: string | number) => `<span class="hint-mag">${n}</span>`,
  cue:  (n: string | number) => `<span class="hint-cue">${n}</span>`,
  con:  (n: string | number) => `<span class="hint-con">${n}</span>`,
  mind: (n: string | number) => `<span class="hint-mind">${n}</span>`,
  agi:  (n: string | number) => `<span class="hint-agi">${n}</span>`
}

const chipGroups = computed<ChipGroup[]>(() => {
  const p = props.hero
  if (!p) return []
  const def = p.defense()
  const magicDef = typeof p.magicDefense === 'function' ? p.magicDefense() : def
  const rpct = reductionPct(def)
  const mpct = reductionPct(magicDef)
  const agi = p.baseStats.agility.value
  const bodyV = p.baseStats.body.value
  const conV = p.baseStats.constitution.value
  const mindV = p.baseStats.mind.value
  const bodyBonus = round1(Math.log(1 + Math.max(0, bodyV - 10)) * 4)
  const constiBonus = round1(Math.max(0, conV - 10) * 0.5)
  const mindBonus = round1(Math.log(1 + Math.max(0, mindV - 10)) * 4)
  const atk = p.attack()
  const atkFromBody = round1((bodyV - 10) * 0.5)
  const atkFromLevel = p.level * 1
  const physDefExtra = Math.max(0, def - 10)
  const magDefExtra = Math.max(0, magicDef - 10)
  const critBonus = round1(Math.log(1 + Math.max(0, agi - 10)) * 2)
  const critPct = round1(p.getEffectiveCritChance())
  const matk = p.magicAttack()
  const matkFromMind = round1(Math.max(0, mindV - 10) * 0.4)
  const matkFromLevel = p.level * 1

  /**
   * ATRIBUTOS — las stats puras que alimentan todo lo demás:
   * Cuerpo (daño/defensa), Mente (daño mágico/defensa mágica),
   * Agilidad (orden de turno/crítico) y Constitución (defensa física/vida).
   */
  const atributosChips: StatChip[] = [
    {
      key: 'body',
      label: 'CUE',
      value: String(Math.round(bodyV)),
      kind: 'body',
      section: 'atributos',
      hint:
        `${T.cue('Cuerpo')}: ${T.cue(Math.round(bodyV))}\n` +
        `Alimenta ${T.atk('ATQ')} (${T.atk(atkFromBody + ' de daño')}) y ${T.def('DEF FÍS')} (${T.def(bodyBonus + ' de defensa')}).`
    },
    {
      key: 'mind',
      label: 'MEN',
      value: String(Math.round(mindV)),
      kind: 'mind',
      section: 'atributos',
      hint:
        `${T.mind('Mente')}: ${T.mind(Math.round(mindV))}\n` +
        `Alimenta ${T.mag('ATQ MAG')} (${T.mag(matkFromMind + ' de daño mágico')}) y ${T.mdef('DEF MÁG')} (${T.mdef(mindBonus + ' de defensa')}).`
    },
    {
      key: 'con',
      label: 'CON',
      value: String(Math.round(conV)),
      kind: 'con',
      section: 'atributos',
      hint:
        `${T.con('Constitución')}: ${T.con(Math.round(conV))}\n` +
        `Aporta ${T.def(constiBonus + ' a la Defensa física')}\n` +
        `y +${T.con(Math.max(0, Math.round(conV) - 10) * 4 + ' HP')} a la vida máxima.`
    },
    {
      key: 'agi',
      label: 'AGI',
      value: String(Math.round(agi)),
      kind: 'agi',
      section: 'atributos',
      hint:
        `${T.agi('Agilidad')}: ${T.agi(Math.round(agi))}\n` +
        `Alimenta ${T.agi('CRIT')} (bonus de crit ≈ ${T.agi(critBonus + '%')}) y el orden de turno.`
    }
  ]

  /**
   * STATS — todo lo derivado que ves en combate. Las defensas absorben el %
   * como valor principal; el número crudo de defensa aparece en el tooltip.
   */
  const statsChips: StatChip[] = [
    {
      key: 'atk',
      label: 'ATQ',
      value: String(atk),
      kind: 'atk',
      section: 'stats',
      hint:
        `${T.atk('Ataque físico')}: ${T.atk(atk)}\n` +
        `Suma: ${T.cue(atkFromBody + ' de Cuerpo')} + ${T.lvl(atkFromLevel + '')} de ${T.lvl('nivel')}.\n` +
        `Solo ${T.cue('Cuerpo')} y ${T.lvl('nivel')} (sin baseAttack, igual que enemigos).`
    },
    {
      key: 'atk-mag',
      label: 'ATQ MAG',
      value: String(matk),
      kind: 'atk-mag',
      section: 'stats',
      hint:
        `${T.mag('Ataque mágico')}: ${T.mag(matk)}\n` +
        `Suma: ${T.mind(matkFromMind + ' de Mente')} (×0.4) + ${T.lvl(matkFromLevel + '')} de ${T.lvl('nivel')}.\n` +
        `Es la base que usan tus hechizos/abilities antes de aplicar el modificador de la habilidad.`
    },
    {
      key: 'phys',
      label: 'DEF FÍS',
      value: `${rpct}%`,
      kind: 'phys',
      section: 'stats',
      hint:
        `Reducción de daño físico: ${T.phys(rpct + '%')}\n` +
        `Tu ${T.cue('Cuerpo')} y ${T.con('Constitución')} se vuelven ${T.def('Defensa física')}.\n` +
        `DEF física = ${T.def(def)} (piso ${T.base('10')} + ${T.cue(bodyBonus + ' de Cuerpo')} + ${T.con(constiBonus + ' de Constitución')})\n` +
        `Reducción = (${T.def(def)} − piso ${T.base('10')}) × 0.5% = ${T.phys(rpct + '%')}.`
    },
    {
      key: 'mag',
      label: 'DEF MÁG',
      value: `${mpct}%`,
      kind: 'mag',
      section: 'stats',
      hint:
        `Reducción de daño mágico: ${T.mag(mpct + '%')}\n` +
        `Depende de tu ${T.mind('Mente')} (no del ${T.cue('Cuerpo')}).\n` +
        `DEF mágica = ${T.mdef(magicDef)} (piso ${T.base('10')} + ${T.mind(mindBonus + ' de Mente')})\n` +
        `Reducción = (${T.mdef(magicDef)} − piso ${T.base('10')}) × 0.5% = ${T.mag(mpct + '%')}.\n` +
        `Aplica contra hechizos, fuego, frío, veneno, arcano, holy y radiant.`
    },
    {
      key: 'crit',
      label: 'CRIT',
      value: `${critPct}%`,
      kind: 'crit',
      section: 'stats',
      hint:
        `${T.agi('Crítico')}: ${T.agi(critPct + '%')}\n` +
        `Chance efectiva de crítico (base ${T.agi(p.critChance + '%')} + ${T.agi(critBonus + '%')} de ${T.agi('Agilidad')}).\n` +
        `Si supera 100% parte de los golpes son overcrits (×3 de daño).`
    }
  ]

  // Vista reducida: solo los derivados que el jugador necesita en combate.
  if (!props.showAll) {
    return [{ section: 'stats', label: 'Stats', chips: statsChips }]
  }

  // Filtros explícitos.
  if (props.only === 'atributos') {
    return [{ section: 'atributos', label: 'Atributos', chips: atributosChips }]
  }
  if (props.only === 'stats') {
    return [{ section: 'stats', label: 'Stats', chips: statsChips }]
  }
  if (props.only === 'defense') {
    return [{
      section: 'stats',
      label: 'Stats',
      chips: statsChips.filter(c => c.kind === 'phys' || c.kind === 'mag')
    }]
  }
  return [
    { section: 'atributos', label: 'Atributos', chips: atributosChips },
    { section: 'stats', label: 'Stats', chips: statsChips }
  ]
})

const showAtributosHeader = computed(() =>
  props.showAll && props.only !== 'stats' && props.only !== 'defense'
)
const showStatsHeader = computed(() => props.only !== 'atributos')

const activeKey = computed(() => hovered.value ?? touched.value)
const activeChip = computed<StatChip | null>(() => {
  const k = activeKey.value
  if (!k) return null
  for (const group of chipGroups.value) {
    const found = group.chips.find(c => c.key === k)
    if (found) return found
  }
  return null
})

function setChipRef(key: string) {
  // Vue 3 pasa `Element | ComponentPublicInstance | null` al ref callback.
  // Lo casteamos a HTMLElement porque solo guardamos refs a <button>s.
  return (el: unknown) => {
    if (el instanceof HTMLElement) {
      chipEls.value[key] = el
    } else {
      delete chipEls.value[key]
    }
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
  <div class="hero-stat-chips-stack" @click.stop>
    <div
      v-for="group in chipGroups"
      :key="group.section"
      class="hero-stat-chips"
    >
      <div class="stat-chip-section-label">{{ group.label }}</div>
      <button
        v-for="chip in group.chips"
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
      <div class="stat-chip-tooltip-line" v-html="activeChip.hint"></div>
    </div>
  </Teleport>
</template>

<style scoped>
.hero-stat-chips-stack {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

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
  border-color: rgba(255, 138, 58, 0.65);
  background: linear-gradient(135deg, rgba(255, 138, 58, 0.24), rgba(180, 60, 0, 0.34));
}
.stat-chip-atk:hover,
.stat-chip-atk.tooltip-open {
  box-shadow: 0 0 10px rgba(255, 138, 58, 0.7);
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
  border-color: rgba(255, 138, 58, 0.55);
  background: linear-gradient(135deg, rgba(255, 138, 58, 0.18), rgba(180, 60, 0, 0.28));
}
.stat-chip-body:hover,
.stat-chip-body.tooltip-open {
  box-shadow: 0 0 8px rgba(255, 138, 58, 0.6);
}

.stat-chip-con {
  border-color: rgba(102, 187, 106, 0.65);
  background: linear-gradient(135deg, rgba(102, 187, 106, 0.22), rgba(46, 125, 50, 0.34));
}
.stat-chip-con:hover,
.stat-chip-con.tooltip-open {
  box-shadow: 0 0 10px rgba(102, 187, 106, 0.65);
}

.stat-chip-mind {
  border-color: rgba(130, 177, 255, 0.55);
  background: linear-gradient(135deg, rgba(130, 177, 255, 0.18), rgba(40, 90, 180, 0.28));
}
.stat-chip-mind:hover,
.stat-chip-mind.tooltip-open {
  box-shadow: 0 0 8px rgba(130, 177, 255, 0.6);
}

.stat-chip-atk-mag {
  border-color: rgba(130, 177, 255, 0.65);
  background: linear-gradient(135deg, rgba(130, 177, 255, 0.24), rgba(40, 90, 180, 0.34));
}
.stat-chip-atk-mag:hover,
.stat-chip-atk-mag.tooltip-open {
  box-shadow: 0 0 10px rgba(130, 177, 255, 0.7);
}

.stat-chip-crit {
  border-color: rgba(255, 230, 102, 0.7);
  background: linear-gradient(135deg, rgba(255, 230, 102, 0.22), rgba(255, 200, 60, 0.34));
}
.stat-chip-crit:hover,
.stat-chip-crit.tooltip-open {
  box-shadow: 0 0 10px rgba(255, 230, 102, 0.7);
}

.stat-chip-section-label {
  grid-column: 1 / -1;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #4CAF50;
  text-transform: uppercase;
  padding: 0.15rem 0 0.05rem;
  border-top: 1px dashed rgba(255, 230, 102, 0.25);
  margin-top: 0.2rem;
}

.stat-chip-section-label:first-child {
  border-top: none;
  margin-top: 0;
}

.stat-chip-section-label-stats {
  margin-top: 0.4rem;
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

/*
 * Coloreo de los números en los hints de los chips. Cada color matchea el
 * badge de su stat para que sea fácil seguir el origen de cada sumando.
 * Se aplican como fondo + texto para buen contraste sobre el tooltip oscuro.
 *
 * NOTA: estos estilos van en un <style> NO scoped (más abajo) porque el
 * tooltip se inyecta vía <Teleport to="body"> y su contenido v-html no
 * recibe el atributo data-v del scope, así que un selector .hint-base[data-v-XXX]
 * no aplicaría. Por eso las clases son globales y se limitan al árbol del
 * tooltip vía `.stat-chip-tooltip .hint-base { ... }`.
 */

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
