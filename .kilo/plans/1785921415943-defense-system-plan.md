# Sistema de Defensa — Plan de Implementación

## Resumen

Añadir un sistema de **defensa por timing** al combate del RPG. **Todos los monstruos** definen un `DefensePattern` obligatorio (mínimo 1 fase) que reemplaza el daño instantáneo actual por una **secuencia de fases**. En cada fase, una onda recorre una barra de columnas verticales (rojas/verdes) y el jugador presiona **Espacio** cuando el pico de la onda coincide con una columna verde. Éxito = bloquea la fracción de daño correspondiente a esa fase; fallo (o timeout de 5s) = la fase aplica su daño completo (+ posible debuff configurable). Items, perks y stats del jugador modifican velocidad, tamaño de zona y reducción.

## Decisiones de diseño confirmadas

| Decisión | Valor |
|---|---|
| Defensa opcional vs obligatoria | **Obligatoria**: todo monstruo declara `defensePattern`. Mínimo 1 fase. |
| Modelo de daño multi-fase | **Por-fase independiente** (`attackDamage / phaseCount` por fase) |
| Reducción por fase exitosa | `maxBlockReduction / phaseCount` del daño total del ataque = `maxBlockReduction * phaseDamage` por fase |
| `maxBlockReduction` por defecto | Configurable por ataque (recomendado: `0.5` para ataques normales, `0.8` para ataques muy blockeables). Modificadores del jugador (perks/items) suman a este cap. |
| Cap duro de `maxBlockReduction` | **1.0** (100% = negación total con perks) |
| Bonus por éxito total | **Implícito en maxBlock**: bloquear todas las fases = `maxBlockReduction` de reducción total (no hay un segundo bonus separado). |
| Timeout por fase | **5 segundos** sin input = auto-fallo (equivalente a fallo: fase completa + posible debuff) |
| Counter-attack perk | Diferido (placeholder de hook listo, sin implementar perk real) |
| Velocidad de la onda | Configurable por ataque (columnas/seg). Modificadores del jugador aplican multiplicador. |
| Tamaño de zona verde | Configurable por ataque, **capped al 50% del ancho de barra** |
| Posición de la zona verde | Aleatoria por fase (entre los límites válidos), con `seed?` opcional en el pattern para bosses |
| Input | **Espacio** (mismo que `TimingChallenge` existente) + click en la barra |
| Ataques básicos garantizados | Cada monstruo tiene un ataque base (existente `attack()`) y un `defensePattern` mínimo (1 fase, zona razonable) |

### Modelo de daño — fórmula canónica

```
phaseDamage   = attackDamage / phaseCount
maxBlock      = clamp(baseMaxBlockReduction + blockReductionBonus, 0, 1)   // bonuses del jugador
perPhaseBlock = maxBlock / phaseCount                                       // fracción del daño total bloqueado por fase exitosa

totalDamage = attackDamage * (1 - perPhaseBlock * successfulPhases)
            = attackDamage * (1 - maxBlock * successfulPhases / phaseCount)
```

Casos de referencia (ataque 100 dmg):

| phaseCount | maxBlock | successfulPhases | totalDamage | Reducción |
|---|---|---|---|---|
| 4 | 0.5 | 0 | 100 | 0% |
| 4 | 0.5 | 1 | 87.5 | 12.5% |
| 4 | 0.5 | 2 | 75 | 25% |
| 4 | 0.5 | 4 | 50 | 50% |
| 1 | 0.5 | 1 | 50 | 50% |
| 1 | 0.8 | 1 | 20 | 80% |

## Modelo de datos

### 1. Nuevos tipos — `src/core/defense/types.ts`

```ts
export interface DefensePhaseZone {
  successZoneStart: number; // fracción 0..1
  successZoneEnd: number;   // fracción 0..1, > start; tamaño = end - start
}

export interface DefensePatternConfig {
  phaseCount: number;            // >= 1 (validado)
  waveSpeed: number;             // columnas por segundo (e.g., 6)
  barWidth: number;              // nº de columnas (e.g., 20)
  baseSuccessZoneSize: number;   // 0..0.5 (cap duro en validación)
  baseMaxBlockReduction: number; // 0..1 (e.g., 0.5 o 0.8); bonuses del jugador suman
  phaseTimeoutMs: number;        // default 5000
  seed?: number;                 // opcional: si está presente, RNG determinístico (bosses)
  onFailureEffect?: {            // opcional: aplica status al player en CUALQUIER fallo de fase
    statusType: 'POISON' | 'BURN' | 'WEAKNESS' | 'SLOW' | string;
    duration: number;
    damagePerTurn?: number;
  };
  // Las posiciones de zona verde se generan aleatoriamente al iniciar el QTE
  // (entre 0 y 1 - baseSuccessZoneSize), una por fase
}
```

### 2. `defensePattern` OBLIGATORIO en `IEnemy` — `src/core/interfaces/ICharacter.ts`

```ts
export interface IEnemy extends ICharacter {
  // ... campos existentes
  defensePattern: DefensePatternConfig;  // REQUERIDO (no opcional)
}
```

Implicación: **no hay rama de "daño directo"** en `useCombat.ts`. Todo ataque enemigo pasa por `runDefenseChallenge`. Esto incluye `Dummy`, que tendrá un pattern trivial pero con daño base = 0.

### 3. Modificadores del jugador — `src/core/defense/modifiers.ts`

```ts
export interface DefenseModifiers {
  waveSpeedMultiplier: number;    // 1.0 default; <1 = más lento (más fácil)
  successZoneSizeBonus: number;   // 0 default; cap: baseSize + bonus <= 0.5
  phaseCountReduction: number;    // 0 default (entero, positivo = menos fases)
  blockReductionBonus: number;    // 0 default; se suma a baseMaxBlockReduction; cap final 1.0
  counterAttackFraction: number;  // 0 default; si >0 aplica contrataque en éxito
}

export function getDefenseModifiers(player: IPlayer): DefenseModifiers
```

Agrega bonuses desde:
- `StatusEffects.DEFENSE_BOOST.defenseBonus` → suma a `blockReductionBonus` (+0.1 por stack)
- `StatusEffects.SPEED_BOOST.speedBonus` → `waveSpeedMultiplier -= speedBonus * 0.1` (clamp ≥ 0.3)
- `Player.defenseValue` → ligero `blockReductionBonus` (e.g., +0.005 por punto sobre 10)
- Hook preparado para `Player.items` (no se implementa item DB; solo se documenta el contrato)

### 4. Resultado de fase / combate — `src/core/defense/types.ts`

```ts
export type DefensePhaseOutcome = 'success' | 'fail' | 'timeout';

export interface DefensePhaseResult {
  outcome: DefensePhaseOutcome;
  waveColumn: number;       // columna donde estaba la onda al presionar/timeout
  zone: DefensePhaseZone;   // zona de la fase (para feedback visual)
}

export interface DefenseChallengeResult {
  pattern: DefensePatternConfig;
  phaseResults: DefensePhaseResult[];
  totalDamage: number;       // calculado y entregado al caller
  appliedOnFailureEffect: boolean;
  triggeredCounterAttack: boolean;
}
```

## Motor de cálculo — `src/core/defense/DefenseEngine.ts`

Función pura `calculateDefenseDamage(pattern, phaseResults, modifiers, attackDamage)`:

```
phaseCount     = pattern.phaseCount
phaseDamage    = attackDamage / phaseCount
maxBlock       = clamp(pattern.baseMaxBlockReduction + modifiers.blockReductionBonus, 0, 1)
perPhaseBlock  = maxBlock / phaseCount   // fracción del daño total bloqueado por fase exitosa

successfulPhases = count(r => r.outcome === 'success', phaseResults)
totalBlock = perPhaseBlock * successfulPhases
totalDamage = max(0, attackDamage * (1 - totalBlock))
return totalDamage
```

Función auxiliar `pickZonesForPhases(pattern, rng)`: genera `phaseCount` zonas (no superpuestas al borde), cada una de tamaño `pattern.baseSuccessZoneSize + modifiers.successZoneSizeBonus`, posicionadas aleatoriamente en `[0, 1 - zoneSize]`. Usa `pattern.seed` si está presente.

## Integración en combate — `src/composables/useCombat.ts`

Modificar `enemyTurn`:

```
for each alive enemy:
  pattern = enemy.defensePattern (siempre presente)
  modifiers = getDefenseModifiers(player)
  adjustedPattern = applyModifiersToPattern(pattern, modifiers)  // clona + ajusta waveSpeed, successZoneSize, phaseCount
  zones = pickZonesForPhases(adjustedPattern, rng)
  showAttackWarning(enemy)  // "X va a atacar!" 1.2s (más corto que 2s, la defensa empieza justo después)
  result = await runDefenseChallenge(adjustedPattern, zones, callbacks)  // devuelve {phaseResults[], totalDamage}
  player.takeDamage(result.totalDamage)
  if result.appliedOnFailureEffect:
    applyOnFailureEffectToPlayer(player, pattern.onFailureEffect)  // aplica status UNA VEZ si hubo cualquier fallo
  if result.triggeredCounterAttack:
    enemy.takeDamage(attackDamage * modifiers.counterAttackFraction)
  continue con siguiente enemigo
```

Añadir refs:
- `isDefenseActive: Ref<boolean>`
- `defenseProgress: Ref<{ phase: number; total: number } | null>`
- `currentDefenseZone: Ref<DefensePhaseZone | null>`
- `currentWaveColumn: Ref<number>`
- `defensePhaseOutcomes: Ref<DefensePhaseOutcome[]>` (para dots de progreso)

Eliminar la rama de daño directo del enemigo (ya no aplica porque todos tienen pattern). Mantener el resto de la lógica de `enemyTurn` (iteración, fin de combate, etc.).

## Componente UI — `src/components/combat/DefenseChallenge.vue`

Estructura:
- Overlay modal (similar a `TimingOverlay.vue`) con backdrop semitransparente.
- Barra horizontal con `barWidth` columnas (rectángulos CSS).
- Cada columna coloreada según `currentZone.successZoneStart/End` (verde oscuro dentro, rojo oscuro fuera).
- Indicador de onda (`<div class="wave-cursor">`) con `transform: translateX(...)` sincronizado al RAF.
- Columna bajo la onda ligeramente agrandada (`scale(1.15)` con transition).
- Listener `keydown` para Space, `click` sobre la barra para input alternativo.
- Barra de progreso del timeout de 5s (lineal horizontal arriba).
- Indicador de fases (puntos: ✓ / ✗ / pendiente).
- Animaciones: flash verde (éxito), flash rojo + shake (fallo/timeout).
- Botón grande "BLOQUEAR (Espacio)" visible para clarificar el input.

Hook de ciclo de vida (similar a `TimingChallenge.vue`):
- `start(pattern, zones, onPhaseComplete, onAllPhasesComplete)`:
  - Inicializa RAF loop con la zona de la fase actual.
  - Empieza timeout de 5s para la fase actual.
  - En RAF: actualiza `waveColumn` por `delta * waveSpeed`. Si llega al final sin input → emite `phaseResult({outcome:'timeout', waveColumn: end})`.
  - `onSpace` (o click en barra): captura `waveColumn`, determina si cae en `[successZoneStart, successZoneEnd]` → emite `phaseResult({outcome, waveColumn, zone})`. Cancela timeout. Si quedan fases, prepara la siguiente; si no, emite `allPhasesComplete`.
- Emite `phaseComplete` (con resultado de fase) y `allPhasesComplete` (con array de resultados).

Props:
- `pattern: DefensePatternConfig`
- `zones: DefensePhaseZone[]`

Emits:
- `phase-complete` con `DefensePhaseResult`
- `all-phases-complete` con `DefensePhaseResult[]`

## Enemigos concretos — `src/core/enemies/*.ts`

Añadir `defensePattern` a **todos** los enemigos (incluido `Dummy`, con damage base = 0):

| Enemigo | attack | phaseCount | waveSpeed | zoneSize | maxBlock | onFailureEffect |
|---|---|---|---|---|---|---|
| `Goblin` (mordida) | `attack()` | 2 | 8 (rápido) | 0.35 | 0.5 | — |
| `GoblinVenomous` (nueva variante) | `attack()` | 1 | 5 (medio) | 0.20 | 0.5 | POISON 4 turns 3/turn |
| `Orc` (hachazos múltiples) | `attack()` | 4 | 5 (medio) | 0.22 | 0.5 | — |
| `Wolf` (mordida triple) | `attack()` | 3 | 7 (rápido) | 0.25 | 0.5 | — |
| `Archer` (nuevo `Archer.ts`) | `attack()` | 1 | 9 (rápido) | 0.15 | 0.5 | — |
| `Dummy` (training) | `0` (existente) | 1 | 4 (lento) | 0.45 | 0.8 | — |

Notas:
- `Dummy` con zona 0.45 + maxBlock 0.8 = bloqueo trivial para practicar.
- `Archer` con zona 0.15 (cap respetado: ≤ 0.5) y velocidad alta = difícil.
- `Orc` con 4 fases + zona 0.22 + maxBlock 0.5 = bloqueo total = 50% reducción, fallo de 1 = 12.5% reducción solo.
- `GoblinVenomous`: `maxBlock = 0.5` (ataque venenoso no es trivial), cualquier fallo aplica POISON. Bloquearlo perfectamente bloquea tanto daño como veneno.

## Items / Perks (alcance MVP)

- **No se crea DB de items nueva** en este plan.
- **No se crea sistema de perks nuevo** en este plan.
- Se deja:
  - `Player.items: string[]` sin cambios (sigue siendo stub).
  - Hook `getDefenseModifiers(player)` extensible: lee `player.statusEffects` y `player.defenseValue`; lista de items queda comentada con `TODO: leer de item DB cuando exista`.
- Status `DEFENSE_BOOST` ya existe y se cablea a `blockReductionBonus`.
- Perks/items de contrataque y counters se documentan como **fuera de alcance** (siguiente iteración).

## Archivos a crear / modificar

**Crear:**
- `src/core/defense/types.ts`
- `src/core/defense/modifiers.ts`
- `src/core/defense/DefenseEngine.ts`
- `src/components/combat/DefenseChallenge.vue`

**Modificar:**
- `src/core/interfaces/ICharacter.ts` — añadir `defensePattern: DefensePatternConfig` (requerido) a `IEnemy`
- `src/core/enemies/Enemy.ts` — añadir `defensePattern` al constructor o como campo público (clase abstracta provee default; subclases lo sobrescriben)
- `src/core/enemies/Goblin.ts` — añadir `defensePattern` (mordida 2 fases rápido)
- `src/core/enemies/Orc.ts` — añadir `defensePattern` (4 hachazos)
- `src/core/enemies/Wolf.ts` — añadir `defensePattern` (3 mordidas)
- `src/core/enemies/Dummy.ts` — añadir `defensePattern` (1 fase lenta, zona ancha)
- `src/core/enemies/Archer.ts` — **nuevo** con `defensePattern` (1 fase narrow)
- `src/core/enemies/GoblinVenomous.ts` — **nuevo** con `defensePattern` + onFailureEffect (POISON)
- `src/composables/useCombat.ts` — modificar `enemyTurn` para integrar defensa (eliminar rama de daño directo)
- `src/components/combat/CombatView.vue` — montar `<DefenseChallenge />`, leer nuevos refs
- `src/styles/combat.css` — estilos para barra, onda, columnas, flashes, timer, dots de progreso

**No tocar (en este plan):**
- `src/core/abilities/Abilities.ts` — no se añade ability de defensa activa (la defensa es pasiva durante turno enemigo).
- `src/stores/game.ts`, `src/stores/expedition.ts` — sin cambios.

## Orden de implementación

1. **Tipos y motor puro** (`types.ts`, `DefenseEngine.ts`, `modifiers.ts`) — sin UI, testeable mentalmente con casos conocidos (validar tabla de referencia).
2. **`DefenseChallenge.vue` estático** — recibe pattern + zones, emite resultados; sin integración al combate aún. Probar manualmente con un botón temporal o `CombatView` con un Dummy de prueba.
3. **Integración en `useCombat.ts`** — sustituir el daño directo cuando hay `defensePattern`. Como ahora todos tienen pattern, no hay fallback. Verificar que `Dummy` (damage = 0) no rompe nada.
4. **Añadir `defensePattern` a TODOS los enemigos existentes** (Dummy, Goblin, Orc, Wolf) + crear `Archer.ts` y `GoblinVenomous.ts`. Asegurar que el constructor de `Enemy` acepte `defensePattern` o que las subclases lo asignen.
5. **Estilos** — `combat.css` para barra, columnas, onda, flashes, timer, dots de progreso, overlay.
6. **Verificación manual** contra `Dummy` (1 fase lenta), `Goblin` (2 fases), `GoblinVenomous` (1 fase + veneno en fallo), `Orc` (4 fases), `Archer` (1 fase narrow).

## Validación

- `npm run build` debe pasar sin errores TS.
- Probar manualmente:
  - `Dummy`: 1 fase, zona ancha, maxBlock 0.8, daño = 0 (verificar flujo end-to-end sin daño).
  - `Goblin`: 2 fases rápidas con zona ancha; presión fuera = fallo (50 dmg); presión en verde = éxito (12.5 dmg bloqueado × 2 = 25 dmg bloqueado = 25 daño tomado).
  - `GoblinVenomous`: 1 fase media con zona angosta; fallo = 50 dmg + POISON; éxito = 25 dmg, sin veneno.
  - `Orc`: 4 fases con zona angosta; 1 fallo = 12.5% reducción solo; 4 éxitos = 50% reducción.
  - `Archer`: 1 fase, zona angosta (0.15), rápida. Difícil.
  - Timeout de 5s: dejar pasar sin input = auto-fallo (mismo daño y debuff).
  - Edge cases:
    - Enemigo muere durante el turno del jugador → `enemyTurn` ya filtra por `aliveEnemies`.
    - Player muere durante la defensa → cancelar fases restantes, fin de combate.
    - Multi-enemigo: `enemyTurn` itera secuencialmente; cada uno con su propio `defensePattern`.
- Tabla de validación de daño (referencia):
  - Goblin (100 dmg, 2 fases, maxBlock 0.5):
    - 0/2 → 100 | 1/2 → 75 | 2/2 → 50
  - Orc (100 dmg, 4 fases, maxBlock 0.5):
    - 0/4 → 100 | 1/4 → 87.5 | 2/4 → 75 | 3/4 → 62.5 | 4/4 → 50
  - Archer (100 dmg, 1 fase, maxBlock 0.5):
    - 0/1 → 100 | 1/1 → 50
  - Dummy (0 dmg, 1 fase, maxBlock 0.8):
    - 0/1 → 0 | 1/1 → 0

## Riesgos y notas

- **`Character.defense()` ya existe pero no se aplica** — el daño actual se calcula solo con `enemy.attack()`. La integración debe decidir si la `defense()` del player reduce el daño final después de aplicar el bloqueo, o si se queda solo como stat informativa. **Decisión propuesta**: `takeDamage` resta `defense()` después del bloqueo (es lo más natural y reutiliza la lógica existente). Si se prefiere lo contrario, ajustar en paso 3.
- **`defensePattern` ahora obligatorio** — esto rompe el contrato suave anterior. Verificar que ningún test, factory o llamada externa cree `Enemy` sin pattern; añadir default sensato en el constructor abstracto para minimizar el impacto.
- **Performance del RAF** — la barra de 20 columnas es trivial; sin riesgo.
- **Accesibilidad** — el timeout de 5s es duro. Si se quiere modo "pause" o "slow mode" para accesibilidad, queda fuera de alcance.
- **RNG de la zona verde** — si el seed no es controlado, puede generar zonas siempre al borde (triviales o imposibles). Implementar validación que centre las zonas (e.g., `successZoneStart` random ∈ `[0.1, 0.9 - baseSuccessZoneSize]`) para evitar zonas en los extremos en barras cortas.
- **Boss con patrones fijos** — exponer `seed?: number` en `DefensePatternConfig` para reproducibilidad (no se usa en MVP).
- **Cada monstruo debe tener al menos un ataque básico** — esto se cumple porque todos extienden `Enemy` con `attack()`. La garantía es que `defensePattern` también está siempre definido (mínimo 1 fase) por contrato de tipo.

## Fuera de alcance (siguiente iteración)

- Perk / item que active **contrataque** (ya hay hook `counterAttackFraction`).
- DB de items con efectos de defensa.
- Animaciones avanzadas (cámara shake, partículas).
- Sonidos de bloque/perfect/parry (placeholder; añadir a `AudioManager` cuando se definan SFX).
- `GoblinVenomous` solo se incluye como ejemplo de `onFailureEffect`; no se cablea al pool de enemigos hasta definir selección de variantes.
- Defensa activa como ability (presionar un botón distinto a Espacio para defender "manualmente" fuera del timing exacto).
