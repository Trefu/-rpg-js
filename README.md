# RPG JS

A Vue 3 + TypeScript RPG game with turn-based combat and timing mini-games.

## Tech Stack

- **Vue 3** - Frontend framework with Composition API
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Pinia** - State management
- **Howler.js** - Audio management

## Project Structure

```
src/
├── core/
│   ├── AudioManager.ts
│   ├── Character.ts
│   ├── Player.ts
│   ├── StatusEffects.ts
│   ├── enemies/
│   ├── interfaces/
│   └── zones/
├── components/
│   ├── ui/
│   ├── combat/
│   └── expedition/
├── composables/
│   ├── useCombat.ts
│   └── useExpeditionGenerator.ts
├── stores/
│   ├── game.ts
│   └── expedition.ts
├── App.vue
└── main.ts
```

## Game Features

### Combat System
- Turn-based combat with timing mini-game
- Critical and bonus hit zones on timing circle
- Status effects (stun, damage over time, etc.)
- Enemy AI with attack patterns

### Progression
- Experience and leveling system
- Gold rewards
- Stats: Strength, Dexterity, Intelligence, Wisdom, Constitution, Charisma

### Ability System (TODO)
- Modular abilities that can be learned during gameplay

### Expedition System
- Slay the Spire-style map with branching paths
- 8+ rows with 1-3 nodes per row
- Node types: combat, shop (TODO), curiosity (TODO), boss
- Every node connects to the next row, creating multiple paths

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Controls

### Combat
- **A** - Open abilities modal
- **Q/W/E/R** - Quick ability cast
- **1/2/3** - Target enemy
- **Click** - Timing circle input

### Navigation
- Click nodes on the expedition map to advance
- Direct path from start to boss through multiple choices