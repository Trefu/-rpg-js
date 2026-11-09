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
| `npm run test:company` | Integración en Chromium: tienda, reclutas, derrota y persistencia |
| `npm run test:campaign-ui` | Interfaz de campaña: móvil/escritorio, compras, filtros, NPC y eventos |

## Tests y CI

Los tests viven al lado del código como `*.test.ts` en `src/core/**`. Cubren los sistemas puros de `core/` (damage pipeline, registry, crit, status effects, hero/enemy formulas, damage types). Los componentes Vue no se testean todavía — son otra capa.

### Pre-push hook (Husky)

Al instalar dependencias, Husky configura un hook pre-push en `.husky/pre-push` que corre `npm test && npm run build` antes de cada push. Si los tests fallan o el build rompe, el push se cancela.

El typecheck (`npm run typecheck`) no está en el hook local; puede ejecutarse por separado. La CI en GitHub Actions corre todo (typecheck + tests + build + coverage) y bloquea merges a `main` si algo falla.

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

## Compañía y Montañas Rocosas

- El campamento es también la pantalla inicial. Muestra los héroes disponibles, sus chips con fórmulas y sus habilidades, y permite elegir un grupo de **1 a 3** antes de partir. Una partida nueva ofrece las clases iniciales del registro; futuras clases pueden marcar `availableAtStart: false` para requerir reclutamiento.
- `companyHeroes` conserva la compañía completa, sin el límite de tres; `heroes` contiene exclusivamente los tres puestos del grupo de expedición. Solo el grupo recibe la XP de combate. El equipo compartido beneficia también a la reserva y la selección solo se puede modificar en el campamento.
- El guardado usa el formato 2 bajo la misma clave local y migra el formato anterior. Guarda todos los héroes de la compañía y, por separado, el grupo elegido y su orden. Los reclutas que no caben en el grupo quedan en reserva.
- La compañía conserva héroes reclutados, nivel/XP, oro, equipo y consumibles restantes después de una derrota o retirada. El campamento restaura vida y energía para el próximo intento.
- El progreso se guarda localmente con la clave versionada `rpg-company-v1`. Al recargar durante una expedición se vuelve al campamento con lo obtenido en los puntos de guardado, no al combate interrumpido. «Reiniciar Juego» borra expresamente este progreso.
- El oro pertenece a la compañía: cada recompensa se cobra una vez. Reclutar no multiplica el botín.
- Los dos frascos básicos se recargan al ganar combates y al iniciar intentos. Las pociones compradas son unidades independientes y nunca se rellenan gratis.
- La tienda de la fila 3 está garantizada. Vende curación, energía, antídotos, vendas y cinco mejoras únicas que afectan al grupo entero, incluidos futuros reclutas. «Equipo del grupo» está disponible desde Ajustes durante mapa y combate.
- Las estadísticas de equipo se reemplazan de forma idempotente con `Hero.setPartyBonuses()`, sin multiplicarse al cargar o subir de nivel. Todas las fórmulas y previews siguen leyendo las mismas estadísticas efectivas de `baseStats`.
- La expedición usa composiciones curadas, un capitán a mitad del recorrido y un dragón final. El chamán protege/cura enemigos; el guardián anuncia su golpe y después queda vulnerable. No hay un requisito artificial de número de intentos ni escalado adaptativo.
- Todos los enemigos tienen **al menos 4 ataques ofensivos distintos** (curas y buffs de apoyo no cuentan para el mínimo). `src/core/enemies/repertoires.test.ts` lo verifica para cada clase y para cada rol de `MountainEnemy`, incluyendo la regresión de Enredar en el goblin arquero.

### Grupos de enemigos

- Las expediciones eligen una **facción y una formación completa**, nunca enemigos individuales al azar. Las familias están en `src/core/enemies/groups.ts` y cada enemigo de montaña declara `enemyGroup`.
- `groupPools` indica las facciones disponibles por tramo; `enemyGroups` enumera sus formaciones por dificultad. Cada encuentro declara `group`. El resolver rechaza cualquier miembro de otra facción y cualquier configuración vacía, sin recurrir a una pool mezclada.
- Montaña incluye goblins, bandidos, orcos, esqueletos, kobolds, bestias de las cumbres, guardianes pétreos y dragones. Las patrullas tienen DPS, tanque y apoyo de su propia familia; el dragón final es un encuentro de jefe independiente.
- Un evento `?` puede usar `{ kind: 'ambush', group: 'bandits', flavor: 'Los bandidos cortan el paso.' }`: `resolveAmbushEnemies` escoge una formación de bandidos del tramo actual. Para escenas únicas puede indicarse `encounter` en lugar de `group`. No se permite una emboscada sin ninguno de los dos.
- Para añadir una variante, darle su familia y al menos cuatro ataques ofensivos, definir su formación y registrarla en el tramo apropiado. `enemyGroups.test.ts` comprueba coherencia, variedad, eventos y ausencia del fallback aleatorio.
- `npm test -- src/core/expeditions/mountainBalance.test.ts` ejecuta campañas reproducibles con las tres clases y bloqueos probabilísticos. Es una aproximación para detectar regresiones de progresión y calibrar una victoria alrededor del tercer intento, no una medición de la dificultad del minijuego para jugadores reales.

### Arte e interfaz de campaña

- Tienda, campamento, mapa y encuentros comparten estilos en `src/styles/campaign.css`.
- El preview de Montañas Rocosas utiliza la imagen proporcionada en `src/assets/backgrounds/mountain-preview.png`.
- Los iconos de pociones se importan desde `new-assets/potions` a `src/assets/icons/potions`; `itemIcons.ts` los comparte entre tienda, bolsa y combate.
- `src/core/npcs.ts` registra los dos personajes del pack de bosque. **Bram** (`forest-merchant`) atiende la tienda; `forest-wanderer` queda preparado sin un papel asignado ni aparición en pantalla.
- Ambos GIF usan los diez fotogramas y los tiempos del `.aseprite` original. `NpcPortrait.vue` utiliza un PNG estático cuando se solicita movimiento reducido.
- Para regenerar los NPC y los iconos: `python scripts/import_new_assets.py` (requiere Pillow). Los archivos originales permanecen en `new-assets`.
- Los eventos muestran costes/recompensas antes de elegir, mantienen el foco del teclado en el diálogo y presentan el resultado antes de continuar. Una emboscada ya aceptada se resuelve desde su botón de combate.
