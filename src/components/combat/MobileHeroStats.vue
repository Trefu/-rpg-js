<script setup lang="ts">
import { computed, ref, nextTick, onBeforeUnmount, onMounted } from 'vue'
import type { Hero } from '@/core/Hero'
import '@/styles/hint-colors.css'

const props = defineProps<{
  hero: Hero
}>()

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

interface StatRow {
  label: string
  value: string
  section: 'atributos' | 'stats'
  hint?: string
  /**
   * Familia de color para la barrita lateral:
   *   body|atk|phys → naranja (Cuerpo)
   *   mind|mag|atk-mag → azul (Mente)
   *   agi|crit → amarillo (Agilidad)
   *   con → verde (Vitalidad)
   */
  kind: 'agi' | 'phys' | 'mag' | 'atk' | 'atk-mag' | 'body' | 'con' | 'mind' | 'crit'
}

function reductionPct(def: number): number {
  return Math.max(0, Math.min(50, Math.floor((def - 10) * 0.5 * 10) / 10))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

const rows = computed<StatRow[]>(() => {
  const p = props.hero
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
  const atkFromBody = round1((bodyV - 10) * 0.5)
  const atkFromLevel = p.level * 1
  const atk = p.attack()
  const critBonus = round1(Math.log(1 + Math.max(0, agi - 10)) * 2)
  const critPct = round1(p.getEffectiveCritChance())
  const matk = p.magicAttack()
  const matkFromMind = round1(Math.max(0, mindV - 10) * 0.4)
  const matkFromLevel = p.level * 1

  const atributos: StatRow[] = [
    {
      section: 'atributos',
      label: 'CUE',
      value: String(Math.round(bodyV)),
      kind: 'body',
      hint:
        `${T.cue('Cuerpo')}: ${T.cue(Math.round(bodyV))}\n` +
        `Alimenta ${T.atk('ATQ')} (${T.atk(atkFromBody + ' de daño')}) y ${T.def('DEF FÍS')} (${T.def(bodyBonus + ' de defensa')}).`
    },
    {
      section: 'atributos',
      label: 'MEN',
      value: String(Math.round(mindV)),
      kind: 'mind',
      hint:
        `${T.mind('Mente')}: ${T.mind(Math.round(mindV))}\n` +
        `Alimenta ${T.mag('ATQ MAG')} (${T.mag(matkFromMind + ' de daño mágico')}) y ${T.mdef('DEF MÁG')} (${T.mdef(mindBonus + ' de defensa')}).`
    },
    {
      section: 'atributos',
      label: 'CON',
      value: String(Math.round(conV)),
      kind: 'con',
      hint:
        `${T.con('Constitución')}: ${T.con(Math.round(conV))}\n` +
        `Aporta ${T.def(constiBonus + ' a la Defensa física')}\n` +
        `y +${T.con(Math.max(0, Math.round(conV) - 10) * 4 + ' HP')} a la vida máxima.`
    },
    {
      section: 'atributos',
      label: 'AGI',
      value: String(Math.round(agi)),
      kind: 'agi',
      hint:
        `${T.agi('Agilidad')}: ${T.agi(Math.round(agi))}\n` +
        `Alimenta ${T.agi('CRIT')} (bonus ≈ ${T.agi(critBonus + '%')}) y el orden de turno.`
    }
  ]

  const stats: StatRow[] = [
    {
      section: 'stats',
      label: 'ATQ',
      value: String(atk),
      kind: 'atk',
      hint:
        `${T.atk('Ataque físico')}: ${T.atk(atk)}\n` +
        `Suma: ${T.cue(atkFromBody + ' de Cuerpo')} + ${T.lvl(atkFromLevel + '')} de ${T.lvl('nivel')}.\n` +
        `Sin baseAttack (igual que enemigos).`
    },
    {
      section: 'stats',
      label: 'ATQ MAG',
      value: String(matk),
      kind: 'atk-mag',
      hint:
        `${T.mag('Ataque mágico')}: ${T.mag(matk)}\n` +
        `Suma: ${T.mind(matkFromMind + ' de Mente')} (×0.4) + ${T.lvl(matkFromLevel + '')} de ${T.lvl('nivel')}.\n` +
        `Base que usan tus hechizos/abilities.`
    },
    {
      section: 'stats',
      label: 'CRIT',
      value: `${critPct}%`,
      kind: 'crit',
      hint:
        `${T.agi('Crítico')}: ${T.agi(critPct + '%')}\n` +
        `Chance efectiva (base ${T.agi(p.critChance + '%')} + ${T.agi(critBonus + '%')} de ${T.agi('Agilidad')}).\n` +
        `Si >100% hay overcrits (×3).`
    },
    {
      section: 'stats',
      label: 'DEF FÍS',
      value: `${rpct}%`,
      kind: 'phys',
      hint:
        `Reducción física: ${T.phys(rpct + '%')}\n` +
        `DEF física = ${T.def(def)} (piso ${T.base('10')} + ${T.cue(bodyBonus + ' de Cuerpo')} + ${T.con(constiBonus + ' de Constitución')})\n` +
        `= (${T.def(def)} − piso ${T.base('10')}) × 0.5% = ${T.phys(rpct + '%')}.`
    },
    {
      section: 'stats',
      label: 'DEF MÁG',
      value: `${mpct}%`,
      kind: 'mag',
      hint:
        `Reducción mágica: ${T.mag(mpct + '%')}\n` +
        `DEF mágica = ${T.mdef(magicDef)} (piso ${T.base('10')} + ${T.mind(mindBonus + ' de Mente')})\n` +
        `= (${T.mdef(magicDef)} − piso ${T.base('10')}) × 0.5% = ${T.mag(mpct + '%')}.\n` +
        `Aplica contra hechizos, fuego, frío, veneno, arcano, holy y radiant.`
    }
  ]

  return [...atributos, ...stats]
})

const atributosRows = computed(() => rows.value.filter(r => r.section === 'atributos'))
const statsRows = computed(() => rows.value.filter(r => r.section === 'stats'))

/**
 * Tooltip móvil: tap en una fila muestra la fórmula con colores. Se
 * reutilizan las mismas clases `.hint-*` que HeroStatChips / PlayerStatsPanel
 * (mismo scope raíz vía Teleport).
 */
const activeKey = ref<string | null>(null)
const tooltipEl = ref<HTMLElement | null>(null)
const tooltipStyle = ref<{ top: string; left: string; placement: 'above' | 'below' }>({
  top: '-9999px',
  left: '-9999px',
  placement: 'below'
})

const activeHint = computed<string | null>(() => {
  if (!activeKey.value) return null
  return rows.value.find(r => `${r.section}:${r.label}` === activeKey.value)?.hint ?? null
})

function toggleHint(key: string, el: HTMLElement) {
  if (activeKey.value === key) {
    activeKey.value = null
    return
  }
  activeKey.value = key
  nextTick(() => nextTick()).then(() => {
    const tip = tooltipEl.value
    if (!tip) return
    const rect = el.getBoundingClientRect()
    const tipRect = tip.getBoundingClientRect()
    const margin = 6
    let top = rect.bottom + margin
    let placement: 'above' | 'below' = 'below'
    if (top + tipRect.height > window.innerHeight - 4) {
      top = rect.top - tipRect.height - margin
      placement = 'above'
      if (top < 4) top = 4
    }
    let left = rect.left + rect.width / 2 - tipRect.width / 2
    left = Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4))
    tooltipStyle.value = { top: `${top}px`, left: `${left}px`, placement }
  })
}

function onDocClick(e: MouseEvent) {
  if (!activeKey.value) return
  const target = e.target as Node
  if (tooltipEl.value && !tooltipEl.value.contains(target)) {
    activeKey.value = null
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div class="mobile-hero-stats" @click.stop>
    <div class="mobile-hero-stats-section">
      <div class="mobile-hero-stats-title">Atributos</div>
      <ul class="mobile-hero-stats-list">
        <li
          v-for="r in atributosRows"
          :key="r.label"
          class="mobile-hero-stats-row"
          :class="['kind-' + r.kind, { 'is-open': activeKey === `atributos:${r.label}` }]"
          @click.stop="(e) => toggleHint(`atributos:${r.label}`, e.currentTarget as HTMLElement)"
        >
          <span class="mobile-hero-stats-bar" aria-hidden="true"></span>
          <span class="mobile-hero-stats-label">{{ r.label }}</span>
          <span class="mobile-hero-stats-value">{{ r.value }}</span>
        </li>
      </ul>
    </div>
    <div class="mobile-hero-stats-section">
      <div class="mobile-hero-stats-title">Stats</div>
      <ul class="mobile-hero-stats-list">
        <li
          v-for="r in statsRows"
          :key="r.label"
          class="mobile-hero-stats-row"
          :class="['kind-' + r.kind, { 'is-open': activeKey === `stats:${r.label}` }]"
          @click.stop="(e) => toggleHint(`stats:${r.label}`, e.currentTarget as HTMLElement)"
        >
          <span class="mobile-hero-stats-bar" aria-hidden="true"></span>
          <span class="mobile-hero-stats-label">{{ r.label }}</span>
          <span class="mobile-hero-stats-value">{{ r.value }}</span>
        </li>
      </ul>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="activeHint"
      ref="tooltipEl"
      class="mobile-hero-stats-tooltip"
      :style="{ top: tooltipStyle.top, left: tooltipStyle.left }"
      @click.stop
      v-html="activeHint"
    ></div>
  </Teleport>
</template>

<style scoped>
.mobile-hero-stats {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.35rem;
  padding: 0.4rem 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 230, 102, 0.18);
  border-radius: 6px;
}

.mobile-hero-stats-section {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.mobile-hero-stats-title {
  font-size: 0.55rem;
  color: rgba(255, 230, 102, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
  padding-left: 0.05rem;
  border-top: 1px dashed rgba(255, 230, 102, 0.18);
  padding-top: 0.18rem;
}

.mobile-hero-stats-section:first-child .mobile-hero-stats-title {
  border-top: none;
  padding-top: 0;
}

.mobile-hero-stats-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.1rem 0.45rem;
}

.mobile-hero-stats-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  cursor: help;
  padding: 0.12rem 0.3rem 0.12rem 0.25rem;
  border-radius: 3px;
  transition: background 0.12s;
}

/* Barrita lateral de 2px que marca la familia de color de la stat.
   En minimalista basta una sola barra fina para indicar familia sin
   llenar la fila de color. */
.mobile-hero-stats-bar {
  width: 2px;
  height: 11px;
  border-radius: 1px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.25);
  transition: box-shadow 0.15s, background 0.15s;
}

.mobile-hero-stats-row:hover .mobile-hero-stats-bar,
.mobile-hero-stats-row.is-open .mobile-hero-stats-bar {
  box-shadow: 0 0 6px currentColor;
}

.mobile-hero-stats-row:hover,
.mobile-hero-stats-row.is-open {
  background: rgba(255, 255, 255, 0.05);
}

.mobile-hero-stats-label {
  color: #cfd8dc;
  font-weight: 600;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.mobile-hero-stats-value {
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

/*
 * Familias de color — la barrita lateral toma el color de la mecánica.
 * Coinciden con las familias de HeroStatChips (naranja/azul/amarillo/verde).
 * Cuerpo: orange · Mente: azul · Agi: amarillo · CON: verde
 */
.kind-body   .mobile-hero-stats-bar,
.kind-atk    .mobile-hero-stats-bar,
.kind-phys   .mobile-hero-stats-bar { background: #ff8a3a; }

.kind-mind   .mobile-hero-stats-bar,
.kind-mag    .mobile-hero-stats-bar,
.kind-atk-mag .mobile-hero-stats-bar { background: #82b1ff; }

.kind-agi    .mobile-hero-stats-bar,
.kind-crit   .mobile-hero-stats-bar { background: #ffe066; }

.kind-con    .mobile-hero-stats-bar { background: #66bb6a; }

/* El `color` actual hace que el glow del hover/open matchee la familia. */
.kind-body, .kind-atk, .kind-phys { color: #ff8a3a; }
.kind-mind, .kind-mag, .kind-atk-mag { color: #82b1ff; }
.kind-agi, .kind-crit { color: #ffe066; }
.kind-con { color: #66bb6a; }

/* Tooltip móvil (mismas reglas que antes). */
.mobile-hero-stats-tooltip {
  position: fixed;
  width: max-content;
  max-width: 280px;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.7);
  z-index: 9999;
  text-align: left;
  pointer-events: auto;
  white-space: pre-line;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  line-height: 1.5;
  color: #cfd8dc;
  text-shadow: 0 1px 2px #000;
}
</style>
