import type { INode } from '../interfaces/IExpedition'

export const mountainPeakNodes: INode[] = [
  { id: 'start', type: 'combat', position: { x: 50, y: 10 }, connections: ['combat1', 'combat2', 'combat3'], completed: false },
  { id: 'combat1', type: 'combat', position: { x: 30, y: 30 }, connections: ['shop1', 'event1'], completed: false },
  { id: 'combat2', type: 'combat', position: { x: 50, y: 30 }, connections: ['event1', 'shop1', 'combat4'], completed: false },
  { id: 'combat3', type: 'combat', position: { x: 70, y: 30 }, connections: ['shop1', 'combat4'], completed: false },
  { id: 'shop1', type: 'shop', position: { x: 30, y: 50 }, connections: ['combat5'], completed: false },
  { id: 'event1', type: 'event', position: { x: 50, y: 50 }, connections: ['combat5'], completed: false },
  { id: 'combat4', type: 'combat', position: { x: 70, y: 50 }, connections: ['combat5'], completed: false },
  { id: 'combat5', type: 'combat', position: { x: 50, y: 70 }, connections: [], completed: false }
] 