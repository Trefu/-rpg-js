# -rpg-js

RPG estilo LoL/Diablo construido con Vue 3 + Pinia + Vite + TypeScript.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server con HMR en `localhost:5173` |
| `npm run build` | Build de producción a `dist/` (vite + esbuild) |
| `npm run preview` | Sirve el build localmente |
| `npm run typecheck` | `tsc --noEmit` sin emitir archivos |
| `npm test` | Corre los tests una vez |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests + reporte de coverage |

## Tests y CI

Los tests viven al lado del código como `*.test.ts` en `src/core/**`. Cubren los sistemas puros de `core/` (damage pipeline, registry, crit, status effects, hero/enemy formulas, damage types). Los componentes Vue no se testean todavía — son otra capa.

### Pre-push hook (Husky)

Al instalar dependencias, Husky configura un hook pre-push en `.husky/pre-push` que corre `npm test && npm run build` antes de cada push. Si los tests fallan o el build rompe, el push se cancela.

El typecheck (`npm run typecheck`) NO está en el hook local para no bloquear pushes por errores preexistentes en `useCombat.ts` y `stores/`. La CI en GitHub Actions corre todo (typecheck + tests + build + coverage) y bloquea merges a `main` si algo falla.

```bash
# Bypass del hook (emergencias):
git push --no-verify
```

### CI en GitHub Actions

El workflow `.github/workflows/ci.yml` corre en cada push y PR a `main`:

1. `npx tsc --noEmit` — type-check
2. `npm run build` — bundle de producción
3. `npm test` — vitest
4. `npm run test:coverage` — coverage + upload del reporte como artifact (14 días de retención)

Si querés que el push se bloquee por coverage mínimo, editá `coverage.thresholds` en `vite.config.ts`.

## Estructura del proyecto

```
src/
  core/                    # Lógica de juego pura (sin Vue)
    abilities/             # Registry de abilities + damage pipeline DSL
    combat/                # Tipos de daño + modificadores
    defense/               # Sistema de defense challenges
    enemies/               # Clases de enemigos
    heroes/                # Clases de heroes
    interfaces/            # TypeScript interfaces compartidas
  components/              # Componentes Vue
  composables/             # Lógica reactiva (useCombat, etc.)
  stores/                  # Pinia stores
```

## Convenciones

- Cada ability se auto-registra via `registerAbility(...)` al importarse.
- Cada enemy attack se auto-registra via `registerEnemyAttack(...)`.
- Stats se leen con `caster.baseStats.<stat>.value` (estructura `IPlayerStats` / `IEnemyStats`).
- Damage pipeline: declarar `pipeline: damageStep({...})` en la ability; `previewDamage` se deriva automáticamente. `execute` usa `dealDamage(...)` para encapsular variance → outgoingMult → crit → takeDamage.
