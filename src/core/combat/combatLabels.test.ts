import { expect, it } from 'vitest'
import { combatantLabel } from './combatLabels'

it('distingue enemigos repetidos sin renumerar al superviviente', () => {
  const peers = [{ id: 'a', name: 'Orco', isAlive: false }, { id: 'b', name: 'Orco', isAlive: true }, { id: 'c', name: 'Chamán' }]
  expect(combatantLabel(peers[0], peers)).toBe('Orco 1')
  expect(combatantLabel(peers[1], peers)).toBe('Orco 2')
  expect(combatantLabel(peers[2], peers)).toBe('Chamán')
})
