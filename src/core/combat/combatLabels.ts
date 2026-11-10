/** Stable ordinals include fallen enemies, so survivors are never renumbered. */
export function combatantLabel(actor: { id: string, name: string }, peers: { id: string, name: string }[]): string {
  const matches = peers.filter(peer => peer.name === actor.name)
  if (matches.length < 2) return actor.name
  return `${actor.name} ${matches.findIndex(peer => peer.id === actor.id) + 1}`
}
