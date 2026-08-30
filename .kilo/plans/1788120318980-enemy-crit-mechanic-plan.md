# Mecánica de Crítico para Enemigos

## Resumen

Añadir un nuevo stat `critChance` a `Enemy` (base 5% por clase). Antes de cada ataque enemigo se tira el crítico. Si sale crítico:
- QTE: `waveSpeed` x2 y zonas de éxito a la mitad (`ceil(count / 2)`, mínimo 1).
- Daño final del ataque x2.
- Si el patrón tiene `onFailureEffect` tipo DoT (poison/burn/freeze), los turnos del estado se aplican con duración 5 en vez de 3.
- Anuncio banner violeta con prefijo `¡CRÍTICO!` y +500ms de duración.
- Barras de éxito de la barra de defensa en violeta en vez de verde.

## Archivos a modificar

### 1. `src/core/enemies/Enemy.ts`
- `EnemyOptions`: añadir `critChance?: number` (default 0.05 en el constructor).
- `Enemy`: añadir `public readonly critChance: number` y un método `public rollCrit(): boolean { return Math.random() < this.critChance }`.

### 2. Subclases de enemigo (`Goblin.ts`, `Bandit.ts`, `Wolf.ts`, `Orc.ts`, `GoblinArcher.ts`, `GoblinWarlock.ts`, `Dummy.ts`)
- Pasar `critChance` al `super(...)`. Usar valores por defecto sensatos si se quiere diferenciar por clase; por ahora todas usan el default 0.05 (`Dummy` puede quedarse en 0 o 0.05 según se decida; ver "Decisiones pendientes").

### 3. `src/core/defense/DefenseEngine.ts`
- Nueva función `applyCritToPattern(pattern: DefensePatternConfig): DefensePatternConfig`:
  - `waveSpeed: (pattern.waveSpeed ?? 0) * 2` si estaba definido.
  - `baseSuccessZoneSize: pattern.baseSuccessZoneSize / 2` si estaba definido.
  - `phases`: mapear cada spec:
    - Si tiene `columnCount`: `Math.max(1, Math.ceil(columnCount / 2))`.
    - Si tiene `successColumns` (determinista): truncar a `Math.max(1, Math.ceil(successColumns.length / 2))` tomando el primer N (o usar shuffle determinista si se prefiere aleatorio).
    - Si no tiene ninguno: dejar igual (cae al fallback por `baseSuccessZoneSize`).

### 4. `src/core/StatusEffects.ts`
- Añadir `export const CRIT_DOT_DURATION = 5` junto a `MAX_DOT_DURATION = 3`.
- `applyFailureEffect(target, spec, opts?: { isCrit?: boolean })`:
  - Cuando `opts.isCrit === true` y el `statusType` es uno de los DoT (`poison`, `burn`, `freeze`): usar `CRIT_DOT_DURATION` como `maxDuration` en lugar de `MAX_DOT_DURATION`.
  - Para los demás status (`stun`, `slow`, etc.) el flag `isCrit` no afecta la duración.

### 5. `src/composables/useCombat.ts`
- En `enemyTurn()` (línea ~525), insertar el flujo de crítico **antes** del `showAnnouncement` para que el banner refleje el crítico desde el inicio:
  1. `const isCrit = enemy.rollCrit()` (usar el método nuevo de `Enemy`).
  2. `const baseDamage = enemy.attack(); const damage = Math.floor(baseDamage * selectedPattern.damageMultiplier * (isCrit ? 2 : 1));` — daño x2 si crítico.
  3. `const patternForChallenge = isCrit ? applyCritToPattern(selectedPattern) : selectedPattern;`
  4. `await startDefenseChallenge(enemy, damage, patternForChallenge, { isCrit });` — extender la firma para pasar `isCrit`.
  5. Construir texto del anuncio: `` const announceText = isCrit ? `¡CRÍTICO! ${enemyLabel} va a usar ${attackName}!` : `${enemyLabel} va a usar ${attackName}!`; ``
  6. Duración del anuncio: `` const announceDuration = (config.isTraining ? 800 : 1400) + (isCrit ? 500 : 0); ``
  7. Variant: `` showAnnouncement(announceText, isCrit ? 'crit-attack' : 'attack', announceDuration); ``
- En el log de combate: `` addToLog(isCrit ? `¡CRÍTICO! ${enemyLabel} va a usar ${attackName} (daño x2)` : `${enemyLabel} va a usar ${attackName}`); ``
- En `handleDefenseAllPhasesComplete` (línea ~169), cuando `result.appliedOnFailureEffect && pattern.onFailureEffect`, pasar `{ isCrit }` al llamar `applyOnFailureEffectToPlayer` (que a su vez llama `applyFailureEffect`).
- Modificar la firma de `startDefenseChallenge(enemy, attackDamage, preSelectedPattern?, opts?: { isCrit?: boolean })`:
  - Guardar `pendingDefenseIsCrit = opts?.isCrit ?? false` para usarlo al construir el `DefenseChallenge` (vía prop) y al aplicar el `onFailureEffect`.
- Exponer `isCrit` por la `DefenseChallenge` (nuevo prop) para que pinte las celdas en violeta.

### 6. `src/components/combat/CombatView.vue`
- Pasar `:is-crit="defenseIsCrit"` (nuevo getter del store/composable) al `<DefenseChallenge>`.

### 7. `src/components/combat/DefenseChallenge.vue`
- Nuevo prop `isCrit: boolean` (default `false`).
- En `.defense-column.success`, agregar modificador `.is-crit` que sobrescribe el verde a violeta (mismo violeta del variant `status`: `rgba(160, 80, 220, 0.75)` + glow morado).
- Mismo cambio para `.phase-dot.success` y `.defense-overlay.success` para coherencia visual.

### 8. `src/components/combat/AnnouncementBanner.vue`
- Extender `AnnouncementVariant` con `'crit-attack'`.
- Bloque `.variant-crit-attack` siguiendo la estética del variant `status` pero con un glow violeta más intenso y tipografía ligeramente más grande para distinguirlo:
  - border `#b388ff`, text `#dcc6ff`, glow `rgba(179, 136, 255, 0.5)`.
  - `font-size: 1.5rem`, `font-weight: 700`.
  - `animation: announcement-pulse 0.6s ease-out;` (reutilizar la keyframe existente).

## Datos / flujo

```
enemyTurn()
  └─ para cada enemigo vivo:
       ├─ selectedPattern = enemy.selectAttackPattern(player)
       ├─ isCrit = enemy.rollCrit()        // <-- NUEVO
       ├─ baseDamage = enemy.attack()
       ├─ damage = floor(baseDamage * pattern.damageMultiplier * (isCrit ? 2 : 1))
       ├─ patternForChallenge = isCrit ? applyCritToPattern(selectedPattern) : selectedPattern
       ├─ announceText = isCrit ? `¡CRÍTICO! ${label} va a usar ${attackName}!` : `${label} va a usar ${attackName}!`
       ├─ announceDuration = (isTraining ? 800 : 1400) + (isCrit ? 500 : 0)
       ├─ showAnnouncement(announceText, isCrit ? 'crit-attack' : 'attack', announceDuration)
       ├─ addToLog(...)
       ├─ delay(anunciar)
       ├─ startDefenseChallenge(enemy, damage, patternForChallenge, { isCrit })
       │    └─ DefenseChallenge se monta con :is-crit="isCrit" → barras violetas
       └─ onComplete → si appliedOnFailureEffect && isCrit: applyFailureEffect(target, fx, { isCrit })
                       → DOT aplicado con turns = 5 en lugar de 3
```

## Casos borde cubiertos
- Patrón sin `phases` (fallback por `baseSuccessZoneSize`): `applyCritToPattern` divide `baseSuccessZoneSize / 2`.
- Patrón con `successColumns` determinista (poco común, p.ej. `fixedPhase(1,2,3,4,5)`): truncar a la mitad (mantener determinismo, tomar el primer `ceil(len/2)`).
- `columnCount = 1`: `Math.max(1, Math.ceil(1/2))` = 1 ✓.
- Dummy: si `critChance = 0`, no critea (útil para tests en entrenamiento).
- Crítico + stun: el stun sigue comprobándose igual; si el enemigo está stun, no ataca, pero el `isCrit` ya se tiró y queda perdido. Aceptable.
- Crítico con `onFailureEffect` que no es DoT (no existe actualmente, pero la firma lo deja preparado): se ignora el flag `isCrit` para esos estados.

## Validación / pasos de prueba
1. `npm run type-check` (o `tsc --noEmit`) — confirmar tipos de la nueva firma `startDefenseChallenge` y `applyCritToPattern`.
2. Arrancar `npm run dev` y entrar a la Sala de Pruebas (Dummy):
   - Forzar `dummy.critChance = 1` temporalmente para validar visualmente la mecánica.
   - Verificar: banner violeta con prefijo `¡CRÍTICO!`, duración extendida, zonas violetas, daño x2 en el log.
3. Devolver `critChance` a 0.05 y hacer 30+ combates de expedición para confirmar frecuencia ~5%.
4. En combate contra un enemigo con DOT (p.ej. `GOBLIN_FLECHA_VENENOSA` → poison), forzar crítico y fallar a propósito: confirmar `stacks = 10` y `turns = 5` (en lugar de 3).
5. Confirmar que sin crítico el flujo no cambia (regresión): banner rojo normal, zonas verdes, daño normal.

## Decisiones pendientes
1. **Dummy de entrenamiento**: ¿crítico habilitado o forzado a 0? Por defecto: `critChance = 0` para no interferir con la práctica.
2. **Variación por clase**: ¿todos los enemigos usan 5% o se diferencian (p.ej. Orc 8%, Goblin 5%, GoblinWarlock 10%)? Por defecto: todos 0.05 hasta nueva decisión.
3. **Texto exacto del log**: `¡CRÍTICO! ${label} va a usar ${name} (daño x2)` vs `¡${label} prepara un GOLPE CRÍTICO con ${name}!`. Por defecto la primera.
4. **Crítico + stun**: ¿re-roll si el enemigo está stun? Por defecto NO (mantiene simplicidad).
