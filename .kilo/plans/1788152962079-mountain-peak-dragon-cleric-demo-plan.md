# Plan: Mountain Peak Demo Polish + Dragon Boss + Cleric Join

## Goal

Make the existing `mountain-peak` demo fully playable end-to-end with:
1. Coherent enemy progression across all 10 floors.
2. A working XP/level-up loop (Hero already has the math; it's never triggered).
3. Shop and `?` curiosity nodes that, when clicked, mark themselves complete so the player can advance.
4. A **Dragon** as the floor-10 boss (replacing the placeholder `Orc(5)`), with 3 attack patterns and tuned HP/attack for the expected hero level by floor 10.
5. **Cleric (`Elara`)** automatically joins the party after the 3rd completed combat node, with a provisional on-screen notice.

Out of scope: real shop UI, persistence/save, skill-point picker, additional zones, multi-enemy balance passes beyond Dragon.

---

## Current State (verified)

- **Floors per run:** 10 (1 start + 8 mid + 1 boss). Source: `src/composables/useExpeditionGenerator.ts:13-20`.
- **Party size:** up to 3 (`MAX_HEROES = 3`, `src/stores/game.ts:9`). Default `beginRun` only places `Warrior.createStarter()` in slot 0.
- **Hero XP/Gold:** `Hero.gainExperience()` / `levelUp()` / `addGold()` all implemented (`src/core/Hero.ts:117-167`). `Enemy.getRewards()` returns `{experience, gold}` (`src/core/enemies/Enemy.ts:70-76`). **Nothing in `useCombat.endCombat()` or `App.vue` ever calls these** — that's the gap.
- **Level curve (current):** base 100 XP, `x1.5` per level. Level-ups add fixed stat growth + 20 maxHP + 10 maxEnergy.
- **Boss tier in pool:** `ZONE_ENEMY_POOLS['mountain-peak'].pools.boss = [() => new Orc(5)]` → 1 enemy, level 5. With the user's choices (full XP to each hero) and ~9 combat fights per run, `Warrior` reaches roughly **level 5–7** by the boss. The Dragon must be tuned around that.
- **Shop node:** routed via `App.vue:43-44` to a "En construcción" placeholder. No completion logic.
- **Curiosity node:** routed back to map (`App.vue:46`) but `expeditionStore.completeNode()` is never called, so the player is stuck (the next branch never unlocks).
- **Enemy sprite/pattern conventions:** see `Orc.ts`, `Goblin.ts`, `GoblinWarlock.ts`. Attacks are `DefensePatternConfig` objects from `src/core/abilities/EnemyAttacks.ts`. Sprite imported as `public readonly sprite = importedPng`.

---

## Expected Hero Level at Boss (sanity check)

Per-fight XP with full-reward-to-each-hero:
- intro (floor 1, 2x GoblinArcher/Warlock lvl 1): ~46 XP each
- early (2x mixed lvl 1-2): ~50 XP each
- mid (3x mixed lvl 2-3): ~110 XP each
- late (3-5x mixed lvl 3-4): ~120 XP each
- ~ **420-500 XP** by floor 10 without shop losses.

Level thresholds: 100 / 150 / 225 / 337 / 506. So `Warrior` reaches roughly **level 4-5** by the boss, gains 1-2 more from the Dragon itself, ending the run at **level 5-6**. Dragon should be tuned for that bracket (level 6-8 effective stats).

---

## Tasks (ordered)

### 1. New enemy: `Dragon` (boss)

Create **`src/core/enemies/Dragon.ts`** following the `Orc.ts` pattern.

- Import sprite: `import dragonSprite from '@/assets/sprites/enemies/dragon.png'`
- `public readonly sprite = dragonSprite`
- `public attackPatterns: DefensePatternConfig[] = [FIRE_BREATH, DEEP_SLASH, TRIPLE_COMBO]`
  - Reuses 3 existing patterns (DRY with codebase; all exist in `EnemyAttacks.ts:111-156`).
  - `FIRE_BREATH` → AoE burn aura, hits hard. `DEEP_SLASH` → single-target with Injured debuff. `TRIPLE_COMBO` → 3-phase burst.
  - Per-encounter pick is random via existing `Enemy.selectAttackPattern` default.
- Constructor (`level: number = 8`) passing `super({...})`:
  - `id: `dragon-${random}``
  - `name: 'Dragón Ancestral'`
  - `maxHealth: 260 + (level * 22)` → 436 at lvl 8
  - `baseAttack: 22 + (level * 2)` → 38 at lvl 8
  - `experienceReward: 100 + (level * 12)` → 196 at lvl 8
  - `goldReward: { min: 60 + (level * 6), max: 110 + (level * 7) }` → {108, 166} at lvl 8
  - `critChance: 0.10` (higher than other enemies, fits boss)
  - `agility: 8` (slow, dangerous)

### 2. Swap Mountain Peak boss pool

Edit **`src/core/zones/EnemyPools.ts`** only inside `ZONE_ENEMY_POOLS['mountain-peak'].pools.boss`:

```ts
boss: [
  () => new Dragon(8)
]
```

Add import: `import { Dragon } from '../enemies/Dragon'` at the top of `EnemyPools.ts`.

Leave the rest of the mountain-peak pool as-is (tiers are well-balanced already). Do NOT touch `forgotten-castle` or `crystal-caves` (out of scope).

### 3. Wire XP + Gold distribution on combat victory

Edit **`src/App.vue#handleCombatEnded`** to distribute rewards when `victory === true` and the node is combat/boss. Distribution rule per user's answer: **each hero in the party gets the full reward** from each defeated enemy (full XP **and** full gold to every hero, including dead ones — dead heroes still level up off-screen for this demo).

Algorithm:

```ts
const handleCombatEnded = (victory: boolean) => {
  if (victory) {
    const node = expeditionStore.selectedNode
    if (node?.type === 'combat' || node?.type === 'boss') {
      const defeatedEnemies = (node.enemies ?? []).filter(e => !e.isAlive)
      let totalXp = 0
      let totalGold = 0
      for (const e of defeatedEnemies) {
        const r = e.getRewards()
        totalXp += r.experience
        totalGold += r.gold
      }
      for (const hero of gameStore.heroes) {
        if (!hero) continue
        hero.gainExperience(totalXp)
        hero.addGold(totalGold)
      }
    }
    expeditionStore.completeNode(expeditionStore.selectedNode?.id || '')
    if (expeditionStore.selectedNode?.type === 'boss') {
      expeditionStore.completeExpedition()
    }
  }
  gameStore.navigateTo('expedition-map')
  checkClericJoin()
}
```

No changes needed in `useCombat.ts` — `enemy.isAlive` is already flipped to `false` by the combat engine when killed, and rewards are read from the same instance.

### 4. Shop + `?` curiosity: mark complete, no reward

Per user's answer: clicking either completes the node and returns to the map, with no item/gold grant.

Edit **`src/App.vue#handleNodeSelected`**:

```ts
} else if (node.type === 'shop' || node.type === 'curiosity') {
  expeditionStore.completeNode(node.id)
  gameStore.navigateTo('expedition-map')
}
```

This unlocks the next branch because `expeditionStore.availableNodes` already reads `selectedNode.connections` once the start node is complete.

### 5. Provisional: Cleric joins after 3rd combat

Two small changes; the user accepted "provisional" so we keep it simple.

**a) `src/stores/game.ts`** — add a helper action:

```ts
addHeroToFirstFreeSlot(hero: Hero): boolean {
  const idx = this.heroes.findIndex(h => h === null)
  if (idx === -1) return false
  this.heroes[idx] = hero
  return true
}
```

**b) `src/App.vue`** — after combat ends, count completed combat/boss nodes and join Cleric once:

```ts
const checkClericJoin = () => {
  const exp = expeditionStore.currentExpedition
  if (!exp) return
  const completedCombat = exp.nodes.filter(
    n => (n.type === 'combat' || n.type === 'boss') && n.completed
  ).length
  const alreadyJoined = gameStore.heroes.some(h => h?.name === 'Elara')
  if (completedCombat >= 3 && !alreadyJoined) {
    const ok = gameStore.addHeroToFirstFreeSlot(Cleric.createStarter())
    if (ok) {
      window.alert('¡Elara, la Clériga, se une al grupo! (PRUEBAS)')
    }
  }
}
```

Add the import: `import { Cleric } from './core/heroes/Cleric'`.

After joining, `Cleric.createStarter()` already calls `learnAbility(...)` for the three cleric abilities and adds one `healing-flask`. The slot rotation logic in `CombatView.vue#rotateHero` will naturally include her once she's in `gameStore.heroes`.

### 6. Combat-balance sanity (no code change, validation only)

After implementation, run a quick mental pass:
- **Floor 1 (intro, 2 enemies lvl 1):** Warriors with Basic Attack + 1 flask clear easily.
- **Floor 9 (late, 3-5 enemies lvl 3-4):** Spiky but survivable; Healing Flask + ClericHeal (post-Cleric) covers it.
- **Floor 10 (Dragon lvl 8):** Solo ~436 HP and ~38 base attack, 10% crit, with `FIRE_BREATH` capable of burning for 30 stacks on failure. This is the run-defining fight. With a level-5 Warrior + level-1 Cleric (joined at combat 3, so 5 fights of XP), they should win in ~6-8 player turns at the cost of 1-2 healing flasks.

If during playtest the Dragon is too easy/hard, tweak the `level` parameter passed to `new Dragon(8)` in `EnemyPools.ts` (single point of tuning) — no other stats need to change.

---

## Files Touched

| File | Change |
|---|---|
| `src/core/enemies/Dragon.ts` | **NEW** — boss enemy, 3 patterns, level 8 stats |
| `src/core/zones/EnemyPools.ts` | Import Dragon; replace `boss` factory with `() => new Dragon(8)` |
| `src/stores/game.ts` | Add `addHeroToFirstFreeSlot(hero)` action |
| `src/App.vue` | Add XP/gold distribution in `handleCombatEnded`; mark shop/`?` complete; add `checkClericJoin()` |

No changes to `useCombat.ts`, `Hero.ts`, `Enemy.ts`, the combat engine, the expedition generator, the map UI, or any other zone.

---

## Validation

Manual end-to-end run on the demo:

1. Start a run. Warrior in slot 0, slot 1/2 empty.
2. Click start node → enter combat. Win → return to map.
3. Click 2 more combat nodes → win each → return to map.
4. After the 3rd combat victory, `alert("¡Elara, la Clériga, se une al grupo! (PRUEBAS)")` fires. Slot 1 now has Cleric (level 1, with `healing-flask` + 3 cleric abilities). Slot 2 still empty.
5. Click a shop node (15% chance) → return to map; node is marked completed; a child node becomes available.
6. Click a `?` curiosity node (10% chance) → return to map; node is marked completed; a child node becomes available.
7. Continue combat nodes. Warrior gains XP each fight (full XP per defeated enemy). Verify by checking `gameStore.heroes[0].level` increases; level-ups happen silently (no modal — out of scope).
8. Reach floor 10 boss → Dragon sprite shows up. Fight to victory. Run ends; both heroes' XP and gold reflect cumulative rewards. If they die, no rewards; run is lost (current behavior preserved).

Linting: run the project's `npm run lint` (and `npm run typecheck` if configured) after edits. The new code uses no new dependencies.

---

## Risks / Caveats

- **Silent level-up.** With `Hero.levelUp()` running during `gainExperience()`, level transitions happen mid-loop. There's no UI modal — that's accepted per scope, but if any UI reads `hero.level` mid-combat it will look sudden. (No current consumer does.)
- **Dead heroes still get XP/gold.** Accepted per user's "full reward to each hero". For a one-hero demo this is moot; once Cleric joins it means she can out-level the Warrior if he dies.
- **Curiosity has zero payoff.** Per user choice. Consider adding a tiny gold or flavor log later, but for this demo it stays bare.
- **Dragon damage ceiling.** `FIRE_BREATH` can stack 30 burn on a failed block; combined with 10% crit chance, a single bad turn on a fresh Warrior could drop him. Acceptable boss-fight tension; tune by lowering Dragon `level` parameter if too punishing.
- **Alert pop-up.** `window.alert` is the simplest provisional notice. It blocks the UI briefly but is acceptable for a demo milestone. Swap for an in-app toast later.

---

## Open Questions

None — user answered the two design decisions.