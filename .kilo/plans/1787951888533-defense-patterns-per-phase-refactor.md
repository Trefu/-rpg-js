# Plan: Refactor de patrones de ataque enemigos con zonas por fase discretas

## Objetivo

1. Cada ataque enemigo debe poder declarar **columnas de éxito por fase de forma explícita** (azúcar sintáctico, como `phase(n)` / `fixedPhase(...)`).
2. Cada ataque lleva un campo `type` (string tipado, mock por ahora) listo para daño elemental futuro.
3. **Ascua conserva su comportamiento actual**: fase 1 = 4 columnas, fase 2 = 5 columnas.
4. **Todos los demás ataques mantienen su número de columnas actual** (Espadazo 3, Flecha 6, Mordida 3, Zarpazos 3, Hachazos 3, Golpe aplastante 3, Dummy 5/2/3/3/4/3/9 etc.) bajo el nuevo sistema.
5. **Borra el bug raíz**: las zonas pasan de floats normalizados a columnas enteras, eliminando la fluctuación 4↔5 que producía `0.15 × 30 = 4.5`.

## Contexto relevante (verificado en código)

- `src/core/defense/types.ts:1-4` define `DefensePhaseZone { successZoneStart, successZoneEnd }` en floats `[0..1]`.
- `src/core/defense/DefenseEngine.ts:33-49` (`pickZonesForPhases`) genera zonas aleatorias por fase; ahí está la no-discreción que causa el bug de Ascua.
- `src/core/defense/DefenseEngine.ts:67-73` (`isWaveInSuccessZone`) ya discretiza comparando contra centros de columna `(i+0.5)/BAR_WIDTH`.
- `src/components/combat/DefenseChallenge.vue:226` repite la misma matemática flotante para iluminar columnas; hay que actualizar.
- `src/core/abilities/EnemyAttacks.ts` y `src/core/enemies/Dummy.ts` (líneas 7-82) son los **dos** lugares donde se definen `DefensePatternConfig`.
- `applyModifiersToPattern` (`DefenseEngine.ts:15-31`) hace `...pattern`, así que cualquier campo nuevo se propaga solo a través de modificadores.
- `pickZonesForPhases` se llama desde `useCombat.ts:120` y el resultado se inyecta al `DefenseChallenge.vue` por la prop `zones`.
- Tests: **no hay** (`**/*.test.ts` no existe). El refactor se valida manualmente + checklist.

## Diseño

### 1. Modelo de zona: floats → columnas enteras

Reemplazar `DefensePhaseZone` por la versión discreta:

```ts
// src/core/defense/types.ts
export interface DefensePhaseZone {
  /** Índices de columna (0-indexed, en [0, DEFENSE_BAR_WIDTH)) que cuentan como éxito. */
  successColumns: number[]
}
```

`isWaveInSuccessZone` simplificado:

```ts
export function isWaveInSuccessZone(waveColumn: number, zone: DefensePhaseZone): boolean {
  const col = Math.max(0, Math.min(DEFENSE_BAR_WIDTH - 1, Math.floor(waveColumn)))
  return zone.successColumns.includes(col)
}
```

`applyModifiersToPattern` no requiere cambios (propaga `phaseCount`, `baseSuccessZoneSize`, `waveSpeed`; los nuevos campos se filtran sin tocarlos).

### 2. Spec de fase y campo `type`

```ts
// src/core/defense/types.ts (extender)
export type AttackType = 'physical' | 'fire' | 'frost' | 'poison' | 'shadow' | 'arcane' | 'holy'

export interface DefensePhaseSpec {
  /** Cantidad de columnas a sortear dentro del margen (excluyente con successColumns). */
  columnCount?: number
  /** Columnas exactas 0-indexed; si está, ignora columnCount. */
  successColumns?: number[]
}

export interface DefensePatternConfig {
  name?: string
  /** Tipo elemental (mock; reservado para resistencias/damage-type futuro). */
  type?: AttackType
  phaseCount: number
  waveSpeed?: number
  /** Tamaño por defecto en floats [0..1]. Se ignora si `phases` está definido. */
  baseSuccessZoneSize?: number
  baseMaxBlockReduction: number
  damageMultiplier: number
  seed?: number
  /** Si está definido y tiene `phaseCount` entradas, tiene prioridad sobre baseSuccessZoneSize. */
  phases?: DefensePhaseSpec[]
  onFailureEffect?: DefenseFailureEffect
  onBlockEffect?: DefenseBlockEffect
}
```

### 3. Helpers (azúcar sintáctico)

```ts
// src/core/defense/attackPatterns.ts (nuevo)
import type { DefensePhaseSpec } from './types'

/** Fase con N columnas aleatorias dentro del margen. */
export function phase(columnCount: number): DefensePhaseSpec {
  return { columnCount }
}

/** Fase con columnas exactas (0-indexed). */
export function fixedPhase(...columns: number[]): DefensePhaseSpec {
  return { successColumns: [...columns].sort((a, b) => a - b) }
}
```

### 4. `pickZonesForPhases` reescrito

```ts
// src/core/defense/DefenseEngine.ts
const PHASE_MARGIN_COLUMNS = 2
const DEFAULT_ZONE_COLUMNS = Math.max(1, Math.round(
  (DEFAULT_SUCCESS_ZONE_SIZE) * DEFENSE_BAR_WIDTH
)) // = 3 columnas para default 0.10

export function pickZonesForPhases(
  pattern: DefensePatternConfig,
  rng: () => number = Math.random
): DefensePhaseZone[] {
  // Camino explícito: el dev declaró `phases`
  if (pattern.phases && pattern.phases.length === pattern.phaseCount) {
    return pattern.phases.map(spec => resolvePhaseSpec(spec, pattern, rng))
  }
  // Camino retrocompatible: sortear con baseSuccessZoneSize (en floats)
  const fallbackColumns = Math.max(
    1,
    Math.round((pattern.baseSuccessZoneSize ?? DEFAULT_SUCCESS_ZONE_SIZE) * DEFENSE_BAR_WIDTH)
  )
  return Array.from({ length: pattern.phaseCount }, () =>
    randomZoneOfColumns(fallbackColumns, rng)
  )
}

function resolvePhaseSpec(
  spec: DefensePhaseSpec,
  pattern: DefensePatternConfig,
  rng: () => number
): DefensePhaseZone {
  if (spec.successColumns && spec.successColumns.length > 0) {
    return { successColumns: dedupeAndClamp(spec.successColumns) }
  }
  const count = spec.columnCount ?? Math.max(
    1,
    Math.round((pattern.baseSuccessZoneSize ?? DEFAULT_SUCCESS_ZONE_SIZE) * DEFENSE_BAR_WIDTH)
  )
  return randomZoneOfColumns(count, rng)
}

function randomZoneOfColumns(count: number, rng: () => number): DefensePhaseZone {
  const maxStart = DEFENSE_BAR_WIDTH - count - PHASE_MARGIN_COLUMNS
  const minStart = PHASE_MARGIN_COLUMNS
  const start = minStart + Math.floor(rng() * (maxStart - minStart + 1))
  return {
    successColumns: Array.from({ length: count }, (_, i) => start + i)
  }
}

function dedupeAndClamp(cols: number[]): number[] {
  const set = new Set<number>()
  for (const c of cols) {
    if (c >= 0 && c < DEFENSE_BAR_WIDTH) set.add(c)
  }
  return [...set].sort((a, b) => a - b)
}
```

### 5. Visualización

`DefenseChallenge.vue:222-229` — reemplazar la matemática flotante por lookup directo:

```vue
<div
  v-for="i in barWidth"
  :key="i"
  class="defense-column"
  :class="{
    success: currentZone?.successColumns?.includes(i - 1),
    'under-wave': waveColumn >= i - 1 && waveColumn <= i
  }"
/>
```

`waveCursor` (`waveLeft`) no cambia.

### 6. Reescritura de `EnemyAttacks.ts` (azúcar sintáctico)

```ts
// src/core/abilities/EnemyAttacks.ts
import { phase, fixedPhase } from '../defense/attackPatterns'
import type { DefensePatternConfig } from '../defense/types'

export const GOBLIN_ESPADAZO: DefensePatternConfig = {
  name: 'Espadazo',
  type: 'physical',
  phaseCount: 2,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 2,
  phases: [phase(3), phase(3)]
}

export const GOBLIN_FLECHA_VENENOSA: DefensePatternConfig = {
  name: 'Flecha venenosa',
  type: 'physical',
  phaseCount: 1,
  waveSpeed: 60,
  baseMaxBlockReduction: 0.5,
  baseSuccessZoneSize: 0.20, // 6 columnas (retrocompat)
  damageMultiplier: 0.6,
  onFailureEffect: { statusType: 'poison', duration: 3, stacks: 1 }
}

export const GOBLIN_ASCUA: DefensePatternConfig = {
  name: 'Ascua',
  type: 'fire',
  phaseCount: 2,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.7,
  phases: [
    phase(4), // fase 1: 4 columnas (era el bug)
    phase(5)  // fase 2: 5 columnas (era el bug)
  ],
  onFailureEffect: { statusType: 'burn', duration: 3, stacks: 3 }
}

export const WOLF_MORDIDA_FEROZ: DefensePatternConfig = {
  name: 'Mordida feroz',
  type: 'physical',
  phaseCount: 5,
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: Array.from({ length: 5 }, () => phase(3))
}

export const WOLF_ZARPAZOS_RAPIDOS: DefensePatternConfig = {
  name: 'Zarpazos rápidos',
  type: 'physical',
  phaseCount: 3,
  waveSpeed: 40,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.5,
  phases: Array.from({ length: 3 }, () => phase(3))
}

export const ORC_HACHAZOS_MULTIPLES: DefensePatternConfig = {
  name: 'Hachazos múltiples',
  type: 'physical',
  phaseCount: 4,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 0.8,
  phases: Array.from({ length: 4 }, () => phase(3))
}

export const ORC_GOLPE_APLASTANTE: DefensePatternConfig = {
  name: 'Golpe aplastante',
  type: 'physical',
  phaseCount: 2,
  baseMaxBlockReduction: 0.5,
  damageMultiplier: 1.5,
  phases: [phase(3), phase(3)]
}

// Listas (sin cambios de estructura)
export const GOBLIN_ATTACKS = [GOBLIN_ESPADAZO, GOBLIN_FLECHA_VENENOSA]
export const GOBLIN_ARCHER_ATTACKS = [GOBLIN_FLECHA_VENENOSA]
export const GOBLIN_WARLOCK_ATTACKS = [GOBLIN_ASCUA]
export const WOLF_ATTACKS = [WOLF_MORDIDA_FEROZ, WOLF_ZARPAZOS_RAPIDOS]
export const ORC_ATTACKS = [ORC_HACHAZOS_MULTIPLES, ORC_GOLPE_APLASTANTE]
export const ALL_ENEMY_ATTACKS = [
  ...GOBLIN_ATTACKS, ...GOBLIN_ARCHER_ATTACKS, ...GOBLIN_WARLOCK_ATTACKS,
  ...WOLF_ATTACKS, ...ORC_ATTACKS
]
```

### 7. Dummy attacks (`src/core/enemies/Dummy.ts:7-82`)

Migrar las 6 entradas inline + las importadas. Mapeo de columnas:

| nombre actual | `baseSuccessZoneSize` actual | columnas (0.10×30) | acción |
|---|---|---|---|
| Golpe Suave | 0.18 | 5 | `phases: [phase(5)]` |
| Golpe Rápido | 0.08 | 2 | `phases: [phase(2)]` |
| Combo Doble | 0.12 | 4 | `phases: [phase(4), phase(4)]` |
| Combo Triple | 0.10 | 3 | `phases: [phase(3), phase(3), phase(3)]` |
| Mordida Tóxica | (hereda 0.20) | 6 | (sigue heredando) |
| Aliento de Fuego | 0.12 | 4 | `phases: Array(10).fill(phase(4))` |
| Aliento Glacial | 0.10 | 3 | `phases: [phase(3)]` |

> Nota: el dummy hoy "ve" `baseSuccessZoneSize` interpretado en floats; en este refactor, con el nuevo `pickZonesForPhases`, ese tamaño se redondea a columnas enteras, así que `0.12 × 30 = 3.6 → 4` y `0.08 × 30 = 2.4 → 2`. Si el dev quiere mantener el conteo anterior exacto, debe declarar `phases` explícitos como arriba.

## Archivos a tocar

| Archivo | Cambio |
|---|---|
| `src/core/defense/types.ts` | `DefensePhaseZone` discreto; nuevo `DefensePhaseSpec`, `AttackType`; campos `type?`, `phases?` en `DefensePatternConfig`. Quitar `DEFAULT_SUCCESS_ZONE_SIZE` si pasa a `const` interno (opcional, mantener export por compat). |
| `src/core/defense/DefenseEngine.ts` | Reescribir `pickZonesForPhases`, `isWaveInSuccessZone`. |
| `src/core/defense/attackPatterns.ts` | **Nuevo**. Helpers `phase()` y `fixedPhase()`. |
| `src/core/abilities/EnemyAttacks.ts` | Añadir `type` y `phases` a cada ataque. |
| `src/core/enemies/Dummy.ts` | Migrar `DUMMY_ATTACKS`. |
| `src/components/combat/DefenseChallenge.vue` | Template `defense-column` usa `currentZone.successColumns.includes(i - 1)`. |

No tocar: `modifiers.ts`, `useCombat.ts` (sigue llamando `pickZonesForPhases`), clases de enemigos, `Abilities.ts`.

## Compatibilidad hacia atrás

- Un ataque que solo defina `baseSuccessZoneSize` (sin `phases`) sigue funcionando: `pickZonesForPhases` sortea columnas redondeando `baseSuccessZoneSize × BAR_WIDTH`.
- Atributo `DefensePhaseZone.successZoneStart/End` **se elimina**. Cualquier consumidor externo debe actualizarse; solo lo usan `DefenseEngine.ts` y `DefenseChallenge.vue`, ambos en la lista de cambios.
- `applyModifiersToPattern` no necesita cambios (spread ya arrastra campos nuevos).

## Riesgos

1. **Diferencia visual menor en ataques que solo usaban `baseSuccessZoneSize`** (rounding 0.10→3, 0.20→6 son enteros; 0.12→4 vs antes 3.6 columnas fluctuantes). **Mitigación**: declarar `phases: [...]` explícito en Dummy para fijar exactamente las 5/2/4/3/4/3 columnas que el dev espera.
2. **`type` ignorado en runtime hoy**. No debe romper nada. Solo se valida en TS.
3. **`v-for="i in barWidth"` en Vue devuelve 1..30**. Usar `i - 1` en `includes()` para mapear a 0-indexed.

## Validación

Manual:

1. `npm run type-check` (o el script equivalente en `package.json`) — debe pasar.
2. Levantar la app y entrar al **Entrenamiento**:
   - Forzar **Ascua** desde el panel del dummy → verificar que la **fase 1 muestra 4 columnas verdes** y la **fase 2 muestra 5 columnas verdes**, **en todas las repeticiones** (no más fluctuación).
   - Forzar **Espadazo**, **Mordida Feroz**, **Zarpazos Rápidos**, **Hachazos Múltiples**, **Golpe Aplastante** → 3 columnas por fase (aleatorias pero estables en conteo).
   - Forzar **Flecha Venenosa** → 6 columnas (zona ancha).
3. **Combate real contra Goblin Warlock**: invocar Ascua varias veces; las fases siempre deben mostrar 4 y 5 columnas respectivamente.
4. Verificar visualmente que la **animación de la onda** se siente igual (no cambia la física, solo la representación de la zona).
5. Verificar que `onFailureEffect` (poison/burn) sigue aplicándose cuando se falla una fase.
6. Capturar consola: ningún warning de TS ni runtime.

Checklist de aceptación:

- [ ] Ascua fase 1: 4 columnas, fase 2: 5 columnas (determinístico).
- [ ] Otros ataques: conteo igual o explícitamente migrado en Dummy.
- [ ] Sin referencias rotas a `successZoneStart/End` en el repo.
- [ ] `type` se puede leer desde `pattern.type` en runtime (aunque no se use).
- [ ] `phase(n)` y `fixedPhase(...)` importables y ergonómicos.

## Pregunta abierta para resolver antes de implementar

¿El `phases` debería aceptar **solo columnas** o también otros params por fase (p.ej. `waveSpeed`, `blockReductionMultiplier` por fase)? Mi recomendación: **solo columnas** en este refactor (mínimo viable, sin YAGNI). Si en el futuro quieres per-phase waveSpeed, se añade como campo opcional sin romper nada. ¿OK?