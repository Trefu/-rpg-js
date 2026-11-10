/** Factions / habitats are explicit, never inferred from names or sprites. */
export const ENEMY_GROUPS = {
  goblins: { name: 'Goblins' },
  bandits: { name: 'Bandidos' },
  orcs: { name: 'Orcos' },
  skeletons: { name: 'Esqueletos' },
  kobolds: { name: 'Kobolds' },
  beasts: { name: 'Bestias de las cumbres' },
  stone: { name: 'Guardianes pétreos' },
  crystals: { name: 'Cristalinos de la cueva' },
  dragons: { name: 'Dragones' }
} as const

export type EnemyGroupId = keyof typeof ENEMY_GROUPS
