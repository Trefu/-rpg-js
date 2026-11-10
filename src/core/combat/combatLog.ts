export type CombatLogKind = 'action' | 'turn' | 'status' | 'damage'
export interface CombatLogEntry {
  message: string
  kind: CombatLogKind
  turn: number
}
