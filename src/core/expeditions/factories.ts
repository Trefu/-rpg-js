import { Bandit } from '@/core/enemies/mountainPeak/Bandit'
import { BanditArcher } from '@/core/enemies/mountainPeak/BanditArcher'
import { BanditCaptain } from '@/core/enemies/mountainPeak/BanditCaptain'
import { BanditRogue } from '@/core/enemies/mountainPeak/BanditRogue'
import { Dragon } from '@/core/enemies/mountainPeak/Dragon'
import { Goblin } from '@/core/enemies/mountainPeak/Goblin'
import { GoblinArcher } from '@/core/enemies/mountainPeak/GoblinArcher'
import { GoblinWarlock } from '@/core/enemies/mountainPeak/GoblinWarlock'
import { Orc } from '@/core/enemies/mountainPeak/Orc'
import { OrcArcher } from '@/core/enemies/mountainPeak/OrcArcher'
import { Wolf } from '@/core/enemies/mountainPeak/Wolf'
import type { EnemyFactory } from './types'

/**
 * Generadores de factories parametrizados por nivel. Cada helper recibe
 * el nivel y devuelve una `EnemyFactory` (la unidad minima del DSL de
 * pools y encounters).
 *
 * Antes habia que escribir `() => new Goblin(1)` a mano cada vez; ahora:
 *
 *   mob(goblin(1), 2)         // 2 goblins nivel 1
 *   pool(mob(orc(5), 3))      // 3 orcos nivel 5 en el pool
 *
 * Los generadores son funciones puras (no cachean instancias): cada
 * llamada a la factory resultante produce un `IEnemy` fresco con su
 * propio seed/estado.
 */
export const goblin = (level: number): EnemyFactory => () => new Goblin(level)
export const goblinArcher = (level: number): EnemyFactory => () => new GoblinArcher(level)
export const goblinWarlock = (level: number): EnemyFactory => () => new GoblinWarlock(level)
export const orc = (level: number): EnemyFactory => () => new Orc(level)
export const orcArcher = (level: number): EnemyFactory => () => new OrcArcher(level)
export const wolf = (level: number): EnemyFactory => () => new Wolf(level)
export const bandit = (level: number): EnemyFactory => () => new Bandit(level)
export const banditArcher = (level: number): EnemyFactory => () => new BanditArcher(level)
export const banditRogue = (level: number): EnemyFactory => () => new BanditRogue(level)
export const banditCaptain = (level: number): EnemyFactory => () => new BanditCaptain(level)
export const dragon = (level: number): EnemyFactory => () => new Dragon(level)
