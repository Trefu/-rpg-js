import { ref, computed, nextTick } from 'vue'
import { useGameStore } from '@/stores/game'
import type { Hero } from '@/core/Hero'
import { AudioManager } from '@/core/AudioManager'
import type { IEnemy } from '@/core/interfaces/ICharacter'
import type { IAbility, AbilityContext } from '@/core/interfaces/IAbility'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import type { IItem, ItemTargetType } from '@/core/items/types'
import { getItemOrThrow } from '@/core/items/items'
import { consumeItem, getInventoryEntries, type InventoryEntry } from '@/core/items/inventory'
import { StatusEffects, applyFailureEffect } from '@/core/StatusEffects'
import type {
  DefenseChallengeResult,
  DefensePatternConfig,
  DefensePhaseResult,
  DefensePhaseZone
} from '@/core/defense/types'
import {
  applyModifiersToPattern,
  applyCritToPattern,
  buildDefenseResult,
  pickZonesForPhases
} from '@/core/defense/DefenseEngine'
import { DEFAULT_BLOCK_EFFECT } from '@/core/defense/types'
import { getDefenseModifiers } from '@/core/defense/modifiers'
import { useAnnouncer } from './useAnnouncer'
import type { AnnouncementVariant } from './useAnnouncer'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Tipos de estado que infligen daño por turno. Cada stack = 1 de daño fijo.
const DO_STATUS_TYPES: Set<string> = new Set([
  StatusEffects.BURN.type,
  StatusEffects.POISON.type,
  StatusEffects.FREEZE.type
])

export interface CombatConfig {
  isTraining?: boolean
  onCombatEnd?: (victory: boolean) => void
  onTrainingEnd?: () => void
}

export function useCombat(config: CombatConfig = {}) {
  const gameStore = useGameStore()
  const player = computed<Hero | null>(() => gameStore.activeHero)
  const heroes = computed<Hero[]>(() => gameStore.activeHeroes)
  const enemies = ref<IEnemy[]>([])
  const selectedEnemy = ref<IEnemy | null>(null)
  const combatLog = ref<string[]>([])
  const isPlayerTurn = ref(true)
  const isExecutingAction = ref(false)
  const isCombatEnded = ref(false)
  const isSelectingTarget = ref(false)
  const selectedAbility = ref<IAbility | null>(null)
  const audioManager = AudioManager.getInstance()
  const currentAction = ref<{ ability: IAbility, target: any } | null>(null)
  const attackingEnemyId = ref<string | null>(null)
  const combatLogRef = ref<HTMLDivElement | null>(null)
  const enemyHitPopups = ref<{ id: string, value: number, key: number }[]>([])
  const playerHitPopups = ref<{ value: number, key: number }[]>([])
  const showAbilitiesModal = ref(false)
  const abilityCooldowns = ref<{ [type: string]: number }>({})

  // ---- Sistema de objetos ----
  const showItemsModal = ref(false)
  const selectedItem = ref<IItem | null>(null)
  // El uso de un objeto NO cierra el turno, para permitir usar
  // una habilidad inmediatamente despues. Solo se reinicia al
  // empezar el siguiente turno del jugador.
  const usedItemThisTurn = ref(false)

  const announcer = useAnnouncer()
  const announcement = computed(() => announcer.current.value)

  const VARIANT_PRIORITY: Record<AnnouncementVariant, number> = {
    'info': 0,
    'status': 1,
    'turn': 5,
    'attack': 5,
    'crit': 10,
    'crit-attack': 10
  }

  function showAnnouncement(
    text: string,
    variant: AnnouncementVariant = 'info',
    duration: number = 2000,
    options: { sticky?: boolean; priority?: number; id?: string } = {}
  ) {
    return announcer.show(text, variant, duration, {
      ...options,
      priority: options.priority ?? VARIANT_PRIORITY[variant]
    })
  }

  const clearAnnouncement = announcer.clear

  const isDefenseActive = ref(false)
  const defensePattern = ref<DefensePatternConfig | null>(null)
  const defenseZones = ref<DefensePhaseZone[]>([])
  const defensePhaseIndex = ref(0)
  const defenseEnemyId = ref<string | null>(null)
  const defenseIsCrit = ref(false)
  let pendingDefenseResolve: ((result: DefenseChallengeResult | null) => void) | null = null
  let pendingDefensePattern: DefensePatternConfig | null = null
  let pendingDefenseAttackDamage = 0
  let pendingDefenseEnemy: IEnemy | null = null
  let pendingDefenseTarget: Hero | null = null
  let pendingDefenseIsCrit = false
  let popupKey = 0

  const abilities = computed(() => {
    if (player.value?.abilities) {
      return player.value.abilities
    }
    return []
  })

  const aliveEnemies = computed(() => enemies.value.filter(enemy => enemy.isAlive))

  const isPlayerInputLocked = computed(() => {
    return !isPlayerTurn.value ||
           isCombatEnded.value ||
           isExecutingAction.value ||
           isDefenseActive.value
  })

  function startDefenseChallenge(
    enemy: IEnemy,
    target: Hero,
    attackDamage: number,
    preSelectedPattern?: DefensePatternConfig,
    opts: { isCrit?: boolean } = {}
  ): Promise<DefenseChallengeResult | null> {
    return new Promise((resolve) => {
      const modifiers = getDefenseModifiers(target, enemy)
      const selectedPattern = preSelectedPattern ?? enemy.selectAttackPattern(target)
      const withModifiers = applyModifiersToPattern(selectedPattern, modifiers)
      const adjusted = opts.isCrit ? applyCritToPattern(withModifiers, modifiers) : withModifiers
      const zones = pickZonesForPhases(adjusted)
      pendingDefenseResolve = resolve
      pendingDefensePattern = adjusted
      pendingDefenseAttackDamage = attackDamage
      pendingDefenseEnemy = enemy
      pendingDefenseTarget = target
      pendingDefenseIsCrit = !!opts.isCrit
      defensePattern.value = adjusted
      defenseZones.value = zones
      defensePhaseIndex.value = 0
      defenseEnemyId.value = enemy.id
      defenseIsCrit.value = pendingDefenseIsCrit
      isDefenseActive.value = true
    })
  }

  function handleDefensePhaseComplete(result: DefensePhaseResult) {
    // Dispara los hooks `onBlock` una vez por cada fase acertada del desafio de defensa.
    // Asi, una fase que entra en el area de exito consume 1 carga del buff.
    if (result.outcome === 'success') {
      processPlayerOnBlockHooks(1)
    }
    if (defensePhaseIndex.value < (defensePattern.value?.phases?.length ?? 1) - 1) {
      defensePhaseIndex.value++
    }
  }

  /**
   * Itera los efectos de estado del jugador con `onBlock` + `charges`,
   * los dispara, y elimina los que se quedan sin cargas.
   * Llamado una vez por cada fase del desafio de defensa en la que el jugador
   * acierta el area de exito (no por ataque entero).
   */
  function processPlayerOnBlockHooks(blockedFraction: number) {
    const p = player.value
    if (!p) return
    const consumed: string[] = []
    for (const effect of p.statusEffects) {
      if (typeof effect.onBlock !== 'function') continue
      if (typeof effect.charges === 'number' && effect.charges <= 0) continue
      effect.onBlock(p, blockedFraction)
      if (typeof effect.charges === 'number') {
        effect.charges -= 1
        if (effect.charges <= 0) consumed.push(effect.type)
      }
    }
    if (consumed.length === 0) return
    for (const type of consumed) p.removeStatusEffect(type)
    addToLog(`¡${consumed.join(', ')} se consumieron tras agotar sus cargas!`)
  }

  function handleDefenseAllPhasesComplete(results: DefensePhaseResult[]) {
    const pattern = pendingDefensePattern
    const enemy = pendingDefenseEnemy
    const target = pendingDefenseTarget
    const attackDamage = pendingDefenseAttackDamage
    const resolve = pendingDefenseResolve
    const wasCrit = pendingDefenseIsCrit
    pendingDefenseResolve = null
    pendingDefensePattern = null
    pendingDefenseEnemy = null
    pendingDefenseTarget = null
    pendingDefenseIsCrit = false
    isDefenseActive.value = false
    defensePattern.value = null
    defenseZones.value = []
    defenseEnemyId.value = null
    defenseIsCrit.value = false

    if (!pattern || !enemy || !target || !resolve) return

    const modifiers = getDefenseModifiers(target, enemy)
    const result = buildDefenseResult(pattern, results, modifiers, attackDamage)

    const finalDamage = Math.max(0, result.totalDamage)
    const blockedFraction = attackDamage > 0
      ? Math.max(0, Math.min(1, 1 - (finalDamage / attackDamage)))
      : (finalDamage === 0 ? 1 : 0)
    const blockPercent = Math.round(blockedFraction * 100)

    const blockEffect = modifiers.blockEffectOverride
      ?? pattern.onBlockEffect
      ?? DEFAULT_BLOCK_EFFECT
    const extraEffects = modifiers.additionalBlockEffects ?? []
    const effectLabels = [blockEffect.label, ...extraEffects.map(e => e.label)]
    const effectLabelText = effectLabels.length > 1
      ? effectLabels.join(' + ')
      : effectLabels[0]

    const critTag = wasCrit ? ' (CRÍTICO)' : ''
    const blockLog = blockedFraction >= 1
      ? `¡Bloqueaste el ataque por completo (${effectLabelText})!`
      : blockedFraction > 0
        ? `Bloqueaste ${blockPercent}% del daño (${effectLabelText}).`
        : ''

    if (finalDamage > 0) {
      target.takeDamage(finalDamage)
      showPlayerHit(finalDamage)
      audioManager.playAttackSound()
      audioManager.playHitSound()
      addToLog(blockLog
        ? `${blockLog}${critTag} Recibes ${finalDamage} de daño.`
        : `Recibes ${finalDamage} de daño${critTag}.`)
    } else {
      addToLog(blockLog || `¡Bloqueaste el ataque!`)
    }

    if (result.appliedOnFailureEffect && pattern.onFailureEffect) {
      applyOnFailureEffectToPlayer(target, pattern.onFailureEffect, wasCrit)
    }

    resolve(result)
  }

  function applyOnFailureEffectToPlayer(p: any, fx: { statusType: string; stacks?: number }, isCrit: boolean = false) {
    const template = StatusEffects.getByType(fx.statusType)
    if (!template) {
      throw new Error(
        `[useCombat] Attack references unknown status effect "${fx.statusType}". Registered: ${StatusEffects.getRegisteredTypes().join(', ')}`
      )
    }

    applyFailureEffect(p, fx, { isCrit })

    const applied = p.statusEffects.find((e: IStatusEffect) => e.type === template.type)
    const stackLabel = (applied?.stacks ?? 1) > 1 ? ` x${applied?.stacks}` : ''
    const critLabel = isCrit ? ' (crítico)' : ''
    addToLog(`¡Sufres el efecto: ${template.name}${stackLabel}${critLabel}!`)
    showAnnouncement(`¡${template.name}${stackLabel}${critLabel}!`, 'status', 1800)
  }

  function closeDefenseChallenge() {
    if (pendingDefenseResolve) {
      pendingDefenseResolve(null)
      pendingDefenseResolve = null
    }
    pendingDefensePattern = null
    pendingDefenseEnemy = null
    pendingDefenseTarget = null
    pendingDefenseIsCrit = false
    isDefenseActive.value = false
    defensePattern.value = null
    defenseZones.value = []
    defenseEnemyId.value = null
    defenseIsCrit.value = false
  }

  function resetAbilityCooldowns() {
    abilityCooldowns.value = {}
    abilities.value.forEach((a: IAbility) => {
      abilityCooldowns.value[a.type] = 0
    })
  }

  function decrementAbilityCooldowns() {
    Object.keys(abilityCooldowns.value).forEach(type => {
      if (abilityCooldowns.value[type] > 0) abilityCooldowns.value[type]--
    })
  }

  function onAbilityUsed(type: string, cooldown: number) {
    if (cooldown > 0) abilityCooldowns.value[type] = cooldown + 1
  }

  function openAbilitiesModal() {
    if (!isPlayerTurn.value || isCombatEnded.value || isExecutingAction.value) return
    showAbilitiesModal.value = true
  }

  function closeAbilitiesModal() {
    showAbilitiesModal.value = false
  }

  function selectAbility(ability: IAbility, index: number) {
    if (abilityCooldowns.value[ability.type] > 0) return
    if (!canAffordAbility(ability)) {
      closeAbilitiesModal()
      return
    }
    selectedAbility.value = ability
    closeAbilitiesModal()

    if (!actionRequiresTarget(ability)) {
      const caster = player.value as Hero | null
      if (!caster || !caster.isAlive) {
        cancelAction('No puedes actuar sin un heroe vivo.')
        return
      }
      currentAction.value = { ability, target: caster }
      isSelectingTarget.value = false
      clearAnnouncement()
      triggerExecution(caster)
      return
    }

    isSelectingTarget.value = true
    showTargetSelectionAnnouncement(ability)
  }

  function canAffordAbility(ability: IAbility): boolean {
    const caster = player.value as Hero | null
    if (!caster) return false
    const cost = ability.energyCost ?? 0
    if (cost <= 0) return true
    if (caster.energy >= cost) return true
    showAnnouncement(`¡Energia insuficiente! (${caster.energy}/${cost})`, 'status', 1500)
    addToLog(`Energia insuficiente para ${ability.name} (necesitas ${cost}).`)
    return false
  }

  // ===== Objetos =====

  const inventory = computed<InventoryEntry[]>(() => {
    const hero = player.value
    if (!hero) return []
    return getInventoryEntries(hero)
  })

  function itemRequiresTarget(item: IItem): boolean {
    return item.requiresTarget !== false
  }

  function itemCanTargetAllies(item: IItem | null): boolean {
    if (!item) return false
    const tt: ItemTargetType = item.targetType ?? 'allies-only'
    return tt === 'all' || tt === 'allies-only'
  }

  /**
   * Abre el menu de objetos. Si hay una habilidad seleccionada que
   * requiere objetivo, la cancela primero (no consume turno).
   */
  function openItemsModal() {
    if (!isPlayerTurn.value || isCombatEnded.value || isExecutingAction.value) return
    if (usedItemThisTurn.value) {
      showAnnouncement('Ya usaste un objeto este turno.', 'status', 1500)
      addToLog('Ya usaste un objeto este turno.')
      return
    }
    if (isSelectingTarget.value && selectedAbility.value && actionRequiresTarget(selectedAbility.value)) {
      cancelAction()
    }
    showItemsModal.value = true
  }

  function closeItemsModal() {
    showItemsModal.value = false
  }

  /**
   * Inicia el flujo de uso de un objeto. Si requiere objetivo,
   * entra en modo de seleccion (cancelando cualquier habilidad pendiente).
   * Si no requiere, ejecuta inmediatamente sobre el caster.
   */
  function selectItem(itemId: string) {
    const caster = player.value as Hero | null
    if (!caster) return
    if (usedItemThisTurn.value) return
    let item: IItem
    try {
      item = getItemOrThrow(itemId)
    } catch {
      return
    }
    if (!itemRequiresTarget(item)) {
      selectedItem.value = item
      closeItemsModal()
      executeItem(item, caster)
      return
    }
    if (isSelectingTarget.value && selectedAbility.value && actionRequiresTarget(selectedAbility.value)) {
      cancelAction()
    }
    selectedItem.value = item
    closeItemsModal()
    isSelectingTarget.value = true
    showAnnouncement(
      `Selecciona un aliado para ${item.name.toLowerCase()}.`,
      'info',
      0,
      { sticky: true }
    )
  }

  async function executeItem(item: IItem, target: Hero) {
    const caster = player.value as Hero | null
    if (!caster) return
    isExecutingAction.value = true
    try {
      consumeItem(caster, item.id)
      await item.execute({
        caster,
        target,
        addToLog,
        showAnnouncement: (text, variant, duration) => showAnnouncement(text, variant ?? 'info', duration),
        audioManager,
        animationDelay: item.animationDurationMs ?? 900
      })
      usedItemThisTurn.value = true
    } finally {
      isExecutingAction.value = false
      selectedItem.value = null
      isSelectingTarget.value = false
      clearAnnouncement()
    }
  }

  function selectItemAllyTarget(hero: Hero) {
    if (!isPlayerTurn.value || !hero.isAlive || isPlayerInputLocked.value) return
    if (!isSelectingTarget.value || !selectedItem.value) return
    if (!itemCanTargetAllies(selectedItem.value)) {
      addToLog(`${selectedItem.value.name} no se puede usar sobre aliados.`)
      return
    }
    const item = selectedItem.value
    executeItem(item, hero)
  }

  function showTargetSelectionAnnouncement(ability: IAbility) {
    const name = ability.name.toLowerCase()
    if (canTargetAllies(ability) && !canTargetEnemies(ability)) {
      showAnnouncement(
        `Selecciona un aliado para ${name}.`,
        'info',
        0,
        { sticky: true }
      )
    } else if (actionRequiresTarget(ability)) {
      showAnnouncement(
        `Selecciona un objetivo para ${name}.`,
        'info',
        0,
        { sticky: true }
      )
    } else {
      showAnnouncement(
        `Todos los enemigos seran afectados por ${name}. Pulsa [A] para confirmar.`,
        'info',
        0,
        { sticky: true }
      )
    }
  }

  /**
   * Cancela la accion actual y libera el input del jugador sin consumir turno.
   * Solo cancela habilidades en modo de seleccion de objetivo. Las auto-cast
   * (requiresTarget === false) ya se ejecutaron y no se ven afectadas.
   */
  function cancelAction(reasonMessage?: string) {
    if (!isSelectingTarget.value && !selectedAbility.value && !selectedItem.value) return
    if (selectedAbility.value && !actionRequiresTarget(selectedAbility.value)) return
    if (selectedItem.value && !itemRequiresTarget(selectedItem.value)) return
    if (reasonMessage) addToLog(reasonMessage)
    isSelectingTarget.value = false
    selectedAbility.value = null
    selectedItem.value = null
    selectedEnemy.value = null
    currentAction.value = null
    isExecutingAction.value = false
    clearAnnouncement()
  }

  /**
   * Ejecuta la accion directamente.
   *
   * Validacion de energia:
   * - energyCost (fijo): se cobra antes de ejecutar. Si no alcanza, cancela sin gastar turno.
   */
  function triggerExecution(_target: any) {
    const ability = selectedAbility.value
    if (!ability) return

    const caster = player.value as Hero | null
    if (!caster || !caster.isAlive) {
      cancelAction('No puedes actuar sin un heroe vivo.')
      return
    }

    if (ability.energyCost && ability.energyCost > 0) {
      if (caster.energy < ability.energyCost) {
        cancelAction(`Energia insuficiente para ${ability.name} (necesitas ${ability.energyCost}).`)
        return
      }
      caster.spendEnergy(ability.energyCost)
    }

    executeAbility(ability.energyCost ?? 0)
  }

  function canTargetEnemies(ability: IAbility | null): boolean {
    if (!ability) return false
    const tt = ability.targetType ?? 'enemies-only'
    return tt === 'all' || tt === 'enemies-only'
  }

  function canTargetAllies(ability: IAbility | null): boolean {
    if (!ability) return false
    const tt = ability.targetType ?? 'enemies-only'
    return tt === 'all' || tt === 'allies-only'
  }

  function selectAlly(hero: Hero) {
    if (!isPlayerTurn.value || !hero.isAlive || isPlayerInputLocked.value) return
    if (!isSelectingTarget.value) return
    if (selectedItem.value) {
      selectItemAllyTarget(hero)
      return
    }
    if (!selectedAbility.value) return
    if (!canTargetAllies(selectedAbility.value)) {
      addToLog(`Solo puedes lanzar ${selectedAbility.value.name} sobre enemigos.`)
      return
    }
    currentAction.value = { ability: selectedAbility.value, target: hero }
    triggerExecution(hero)
  }

  const abilityShortcuts = ['q', 'w', 'e', 'r']

  function handleAbilitiesModalShortcuts(e: KeyboardEvent) {
    if (!showAbilitiesModal.value) {
      if (e.key.toLowerCase() === 'a' && isPlayerTurn.value && !isExecutingAction.value) {
        openAbilitiesModal()
        e.preventDefault()
      }
      return
    }

    if (e.key.toLowerCase() === 'a') {
      closeAbilitiesModal()
      e.preventDefault()
      return
    }

    const keyIndex = abilityShortcuts.indexOf(e.key.toLowerCase())
    if (keyIndex !== -1 && abilities.value[keyIndex]) {
      selectAbility(abilities.value[keyIndex], keyIndex)
      e.preventDefault()
    }
  }

  function handleCombatShortcuts(e: KeyboardEvent) {
    if (isCombatEnded.value) return
    if (showAbilitiesModal.value) return
    if (showItemsModal.value) return

    if (e.key === 'Escape' && isSelectingTarget.value && (selectedAbility.value || selectedItem.value)) {
      cancelAction()
      e.preventDefault()
      return
    }

    if (isSelectingTarget.value && ['1', '2', '3', '4', '5'].includes(e.key)) {
      const idx = parseInt(e.key, 10) - 1
      if (selectedItem.value && itemCanTargetAllies(selectedItem.value)) {
        const aliveAllies = heroes.value.filter(h => h.isAlive)
        if (aliveAllies[idx]) {
          selectAlly(aliveAllies[idx])
          e.preventDefault()
        } else {
          addToLog(`No hay aliado en la posición ${e.key}.`)
          e.preventDefault()
        }
        return
      }
      if (selectedAbility.value && actionRequiresTarget(selectedAbility.value)) {
        if (canTargetEnemies(selectedAbility.value)) {
          const alive = aliveEnemies.value
          if (alive[idx]) {
            selectEnemy(alive[idx])
            e.preventDefault()
          } else {
            addToLog(`No hay enemigo en la posición ${e.key}.`)
            e.preventDefault()
          }
        } else if (canTargetAllies(selectedAbility.value)) {
          const aliveAllies = heroes.value.filter(h => h.isAlive)
          if (aliveAllies[idx]) {
            selectAlly(aliveAllies[idx])
            e.preventDefault()
          } else {
            addToLog(`No hay aliado en la posición ${e.key}.`)
            e.preventDefault()
          }
        }
      }
    }
  }

  function showEnemyHit(enemyId: string, value: number) {
    const key = popupKey++
    enemyHitPopups.value.push({ id: enemyId, value, key })
    setTimeout(() => {
      enemyHitPopups.value = enemyHitPopups.value.filter(p => p.key !== key)
    }, 900)
  }

  function showPlayerHit(value: number) {
    const key = popupKey++
    playerHitPopups.value.push({ value, key })
    setTimeout(() => {
      playerHitPopups.value = playerHitPopups.value.filter(p => p.key !== key)
    }, 900)
  }

  function actionRequiresTarget(ability: IAbility | null): boolean {
    if (!ability) return false
    return ability.requiresTarget !== false
  }

  function endPlayerTurn() {
    isPlayerTurn.value = false
    decrementAbilityCooldowns()
    if (typeof player.value?.restoreEnergy === 'function') {
      const regen = typeof player.value.getTurnEndEnergyRegen === 'function'
        ? player.value.getTurnEndEnergyRegen()
        : 0
      if (regen > 0) {
        const restored = player.value.restoreEnergy(regen)
        if (restored > 0) {
          addToLog(`Recuperaste ${restored} de energia (fin de turno).`)
        }
      }
    }
    setTimeout(enemyTurn, config.isTraining ? 1000 : 2000)
  }

  async function startPlayerTurn() {
    if (!player.value) return
    if (isCombatEnded.value) return
    if (!isPlayerTurn.value) return
    usedItemThisTurn.value = false
    await applyPlayerStatusTick()
  }

  async function enemyTurn() {
    if (!player.value) return

    const aliveEnemies = enemies.value.filter(enemy => enemy.isAlive)
    if (aliveEnemies.length === 0) {
      endCombat(true)
      return
    }

    const enemyTargets = new Map<string, Hero | null>()
    for (const enemy of aliveEnemies) {
      enemyTargets.set(enemy.id, enemy.selectTarget(gameStore.activeHeroes))
    }

    for (let i = 0; i < aliveEnemies.length; i++) {
      const enemy = aliveEnemies[i]
      if (!player.value || !player.value.isAlive) break

      let target = enemyTargets.get(enemy.id) ?? null
      if (!target) {
        addToLog(`${enemy.name} no encuentra un objetivo válido y pierde su turno.`)
        await delay(config.isTraining ? 600 : 1200)
        continue
      }

      const selectedPattern = enemy.selectAttackPattern(target)
      const attackName = selectedPattern.name ?? 'atacar'
      const enemyIndex = enemies.value.filter(e => e.name === enemy.name && e.isAlive).indexOf(enemy) + 1
      const enemyLabel = aliveEnemies.length > 1 ? `${enemy.name} ${enemyIndex}` : enemy.name

      const isCrit = typeof enemy.rollCrit === 'function' && enemy.rollCrit()

      attackingEnemyId.value = enemy.id
      const announceText = isCrit
        ? `¡CRÍTICO! ${enemyLabel} va a usar ${attackName}!`
        : `${enemyLabel} va a usar ${attackName}!`
      const announceDuration = (config.isTraining ? 800 : 1400) + (isCrit ? 500 : 0)
      const announceVariant: 'attack' | 'crit-attack' = isCrit ? 'crit-attack' : 'attack'
      showAnnouncement(announceText, announceVariant, announceDuration)
      addToLog(isCrit
        ? `¡CRÍTICO! ${enemyLabel} va a usar ${attackName} (daño x2)`
        : `${enemyLabel} va a usar ${attackName}`)
      await delay(announceDuration)
      attackingEnemyId.value = null

      await showEnemyStatusSequence(enemy)

      const stunEffect = enemy.statusEffects.find(e => e.type === 'stun')
      if (stunEffect && stunEffect.turns > 0) {
        addToLog(`${enemy.name} está aturdido y pierde su turno. (${stunEffect.turns} turno(s) restante(s))`)
        await delay(config.isTraining ? 1000 : 2000)
        enemy.reduceStatusEffects && enemy.reduceStatusEffects()
        continue
      }

      const rawDamage = enemy.attack()
      const damage = Math.floor(rawDamage * selectedPattern.damageMultiplier * (isCrit ? 2 : 1))
      await startDefenseChallenge(enemy, target, damage, selectedPattern, { isCrit })

      if (selectedPattern.multiHeroAttack) {
        await applyEnemyMultiHeroSplash(selectedPattern.multiHeroAttack, target, enemy)
      }

      if (!target.isAlive) {
        if (config.isTraining) {
          addToLog('¡Has caído en el entrenamiento! Usa "Revivir" en el panel para continuar.')
          isPlayerTurn.value = true
          isExecutingAction.value = false
          return
        }
        const rotated = rotateToNextAliveHero()
        if (!rotated) {
          addToLog('¡Todos tus heroes han caido!')
          endCombat(false)
          return
        }
        addToLog(`¡${player.value.name} entra en combate!`)
        for (let j = i + 1; j < aliveEnemies.length; j++) {
          const remaining = aliveEnemies[j]
          enemyTargets.set(remaining.id, remaining.selectTarget(gameStore.activeHeroes))
        }
      }
      await delay(config.isTraining ? 600 : 1500);

      // Decrement DESPUES de las acciones del turno: el efecto (ej. INJURED)
      // debe aplicarse durante el ataque del enemigo y solo expirar al final.
      enemy.reduceStatusEffects && enemy.reduceStatusEffects()
    }

    isPlayerTurn.value = true
    isExecutingAction.value = false
    // Decrement de estados del jugador al FINAL del turno enemigo: el efecto
    // (ej. INJURED del jugador) debe seguir activo durante los ataques
    // enemigos de este turno y solo expirar cuando el siguiente turno
    // del jugador comienza (consistente con la logica del enemigo).
    if (typeof player.value?.reduceStatusEffects === 'function') {
      player.value.reduceStatusEffects()
    }
    // Si el heroe activo murio durante el turno enemigo, rotar al siguiente heroe vivo.
    if (!player.value || !player.value.isAlive) {
      const rotated = rotateToNextAliveHero()
      if (!rotated) {
        addToLog('¡Todos tus heroes han caido!')
        endCombat(false)
        return
      }
      addToLog(`Tu turno. ${gameStore.activeHero?.name} entra en combate.`)
    } else {
      addToLog('Tu turno.')
    }
    showAnnouncement('Tu turno', 'turn', 1400)
    await startPlayerTurn()
  }

  /**
   * Rota el activeHero al siguiente slot con un heroe vivo.
   * @returns true si encontro un heroe vivo, false si todos estan muertos.
   */
  function rotateToNextAliveHero(): boolean {
    const all = gameStore.heroes
    const currentIdx = gameStore.activeHeroIndex
    for (let offset = 0; offset < all.length; offset++) {
      const idx = (currentIdx + offset) % all.length
      const candidate = all[idx]
      if (candidate && candidate.isAlive) {
        if (idx !== currentIdx) {
          gameStore.setActiveHero(idx)
        }
        return true
      }
    }
    return false
  }

  function revivePlayer() {
    if (!player.value) return
    player.value.health = player.value.maxHealth
    player.value.isAlive = true
    addToLog('Te has revivido con toda tu vida.')
  }

  function healPlayerToFull() {
    if (!player.value) return
    player.value.health = player.value.maxHealth
    addToLog('Vida restaurada al máximo.')
  }

  function clearAllStatusEffects() {
    if (!player.value) return
    player.value.statusEffects = []
    enemies.value.forEach(e => { e.statusEffects = [] })
    addToLog('Efectos de estado eliminados.')
  }

  function restoreAllEnergy() {
    if (!player.value) return
    const p = player.value as Hero
    if (typeof p.maxEnergy !== 'number' || typeof p.restoreEnergy !== 'function') return
    const restored = p.restoreEnergy(p.maxEnergy)
    if (restored > 0) {
      addToLog(`Energía restaurada (+${restored}).`)
    }
  }

  async function applyPlayerStatusTick() {
    const p = player.value
    if (!p || !Array.isArray(p.statusEffects) || p.statusEffects.length === 0) return

    const active = p.statusEffects.filter(e => e.turns > 0 && DO_STATUS_TYPES.has(e.type))
    for (const effect of active) {
      const stacks = effect.stacks ?? 1
      const dmg = stacks
      p.takeDamage(dmg)
      showPlayerHit(dmg)
      audioManager.playHitSound()
      if (effect.turnLabel && effect.announceOnTurn) {
        const stackSuffix = stacks > 1 ? ` (x${stacks})` : ''
        showAnnouncement(`${effect.turnLabel}${stackSuffix}`, 'status', 1800)
        addToLog(`${effect.name}${stackSuffix}: recibes ${dmg} de daño.`)
        await delay(1800)
      } else       if (effect.turnLabel) {
        addToLog(`${effect.name}: recibes ${dmg} de daño.`)
      }
    }
    // El decrement de turnos ocurre al final del turno del jugador (en
    // `endPlayerTurn`) para que los efectos sigan activos durante el ataque
    // del enemigo que le sigue.
  }

  async function showEnemyStatusSequence(enemy: IEnemy) {
    if (enemy.isAlive && enemy.statusEffects.length > 0) {
      for (const effect of enemy.statusEffects) {
        if (effect.turns > 0 && effect.turnLabel && effect.announceOnTurn) {
          showAnnouncement(`${enemy.name}: ${effect.turnLabel}`, 'status', 2000)
          await delay(2000)
          await delay(200)
        }
      }
    }
  }

  function endCombat(victory: boolean) {
    isCombatEnded.value = true

    clearAllStatusEffects()
    restoreAllEnergy()

    if (victory) {
      audioManager.playVictorySound()
      addToLog('¡Victoria! Has completado el combate.')
    } else {
      addToLog('Derrota. El combate ha terminado.')
    }

    setTimeout(() => {
      if (config.onCombatEnd) {
        config.onCombatEnd(victory)
      }
    }, 2000)
  }

  function endTraining() {
    isCombatEnded.value = true
    clearAllStatusEffects()
    restoreAllEnergy()
    addToLog('Entrenamiento terminado.')
    setTimeout(() => {
      if (config.onTrainingEnd) {
        config.onTrainingEnd()
      }
    }, 2000)
  }

  function addToLog(message: string) {
    combatLog.value.push(message)
    if (combatLog.value.length > 10) {
      combatLog.value.shift()
    }
    nextTick(() => {
      if (combatLogRef.value) {
        combatLogRef.value.scrollTop = combatLogRef.value.scrollHeight
      }
    })
  }

  function getHealthPercentage(current: number, max: number) {
    return Math.max(0, (current / max) * 100)
  }

  function shuffle<T>(items: T[]): T[] {
    const copy = items.slice()
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  /**
   * Splash de una ability de heroe: tras el impacto principal, golpea a
   * N objetivos aleatorios extra del campo enemigo (excluyendo al principal)
   * con `primaryBaseDamage * damageMultiplier`. Sin critico en splashes.
   */
  async function applyHeroSplash(
    spec: NonNullable<IAbility['randomAttack']>,
    primaryTargetId: string,
    primaryBaseDamage: number
  ) {
    const candidates = enemies.value.filter(e => e.isAlive && e.id !== primaryTargetId)
    if (candidates.length === 0) return
    const cap = Math.min(spec.maxExtraTargets, candidates.length)
    const min = Math.min(spec.minExtraTargets, cap)
    if (cap < min) return
    const count = min + Math.floor(Math.random() * (cap - min + 1))
    const extras = shuffle(candidates).slice(0, count)
    const splashDamage = Math.max(0, Math.floor(primaryBaseDamage * spec.damageMultiplier))
    if (splashDamage <= 0) return
    for (const enemy of extras) {
      enemy.takeDamage(splashDamage)
      showEnemyHit(enemy.id, splashDamage)
      audioManager.playAttackSound()
      audioManager.playHitSound()
      addToLog(`¡La luz salta a ${enemy.name}! ${splashDamage} de daño.`)
      await delay(280)
    }
    if (extras.length > 0) {
      showAnnouncement(
        `¡Salto radiante! ${extras.length} objetivo${extras.length > 1 ? 's' : ''} extra`,
        'status',
        1200
      )
    }
  }

  /**
   * Multi-hero attack de un enemigo: tras la defensa contra el target principal,
   * golpea a N heroes adicionales al azar (excluyendo al principal) con daño
   * `enemy.attack() * damageMultiplier`. Sin critico en splashes.
   */
  async function applyEnemyMultiHeroSplash(
    spec: NonNullable<DefensePatternConfig['multiHeroAttack']>,
    primaryTarget: Hero,
    enemy: IEnemy
  ) {
    const pool = heroes.value.filter(h => h.isAlive && h.id !== primaryTarget.id)
    if (pool.length === 0) return
    const cap = Math.min(spec.maxExtraTargets, pool.length)
    const min = Math.min(spec.minExtraTargets, cap)
    if (cap < min) return
    const count = min + Math.floor(Math.random() * (cap - min + 1))
    const extras = shuffle(pool).slice(0, count)
    const baseDmg = Math.max(0, Math.floor(enemy.attack() * spec.damageMultiplier))
    if (baseDmg <= 0) return
    for (const hero of extras) {
      const dmg = Math.max(0, baseDmg)
      hero.takeDamage(dmg)
      showPlayerHit(dmg)
      audioManager.playAttackSound()
      audioManager.playHitSound()
      addToLog(`¡${enemy.name} golpea a ${hero.name}! ${dmg} de daño.`)
      await delay(280)
    }
  }

  /**
   * AOE de una ability de heroe: golpea a TODOS los enemigos vivos (incluido
   * el primario seleccionado) con el mismo daño final (con crit ya aplicado)
   * en un unico tick simultaneo. La ability NO debe aplicar dano ni popup
   * al target primario en su `execute`; eso lo hace esta funcion para que
   * todos los impactos caigan a la vez.
   * Sin critico adicional en los splashes.
   */
  async function applyHeroAoe(
    primaryTargetId: string,
    finalDamage: number,
    animationDelay: number = 1500
  ) {
    if (finalDamage <= 0) return
    const targets = enemies.value.filter(e => e.isAlive)
    if (targets.length === 0) return
    await Promise.all(
      targets.map(async enemy => {
        enemy.takeDamage(finalDamage)
        showEnemyHit(enemy.id, finalDamage)
        addToLog(
          enemy.id === primaryTargetId
            ? `¡Golpe devastador golpea a ${enemy.name}! ${finalDamage} de daño.`
            : `¡Golpe devastador alcanza a ${enemy.name}! ${finalDamage} de daño.`
        )
      })
    )
    audioManager.playAttackSound()
    audioManager.playHitSound()
    showAnnouncement(
      `¡Golpe devastador! ${targets.length} enemigo${targets.length > 1 ? 's' : ''} simultaneamente`,
      'status',
      1200
    )
    await delay(animationDelay)
  }

  const executeAbility = async (
    energySpent: number = 0
  ) => {
    isExecutingAction.value = true

    if (currentAction.value) {
      const { ability, target } = currentAction.value
      const playerChar = player.value as Hero
      const animationDelay = ability.animationDurationMs ?? 1500

      const abilityContext: AbilityContext = {
        caster: playerChar,
        target,
        addToLog,
        showEnemyHit,
        showAnnouncement: (text, variant, duration) => showAnnouncement(text, variant ?? 'info', duration),
        audioManager,
        animationDelay,
        energySpent
      }

      if (ability.execute) {
        await ability.execute(abilityContext)
        onAbilityUsed(ability.type, ability.cooldown)
      }

      if (ability.randomAttack && typeof abilityContext.lastPrimaryBaseDamage === 'number') {
        await applyHeroSplash(ability.randomAttack, target.id, abilityContext.lastPrimaryBaseDamage)
      }

      if (ability.aoe && typeof abilityContext.lastPrimaryFinalDamage === 'number') {
        await applyHeroAoe(target.id, abilityContext.lastPrimaryFinalDamage, animationDelay)
      }
    }

    isSelectingTarget.value = false
    selectedAbility.value = null
    selectedEnemy.value = null
    currentAction.value = null
    clearAnnouncement()

    endPlayerTurn()
  }

  function selectEnemy(enemy: IEnemy) {
    if (!isPlayerTurn.value || !enemy.isAlive || isPlayerInputLocked.value) return

    if (isSelectingTarget.value && selectedAbility.value) {
      if (!canTargetEnemies(selectedAbility.value)) {
        addToLog(`${selectedAbility.value.name} solo afecta a aliados.`)
        return
      }
      selectedEnemy.value = enemy
      currentAction.value = { ability: selectedAbility.value, target: enemy }
      triggerExecution(enemy)
    }
  }

  type ActionType = 'attack' | 'skill' | 'spell' | 'stunStrike' | 'stealthStrike' | 'fireball'

  function isActionType(action: string): action is ActionType {
    return action === 'attack' || action === 'skill' || action === 'spell' || action === 'stunStrike' || action === 'stealthStrike' || action === 'fireball';
  }

  function selectAction(action: string) {
    if (!isPlayerTurn.value || isCombatEnded.value || isExecutingAction.value) return

    if (action === 'Objeto') {
      if (config.isTraining) {
        addToLog('No puedes usar objetos durante el entrenamiento.')
        return
      }
      openItemsModal()
      return
    }

    if (isActionType(action)) {
      const ability = abilities.value.find((a: IAbility) => a.type === action)
      if (ability) {
        if (!canAffordAbility(ability)) return
        selectedAbility.value = ability
        isSelectingTarget.value = true
        showTargetSelectionAnnouncement(ability)
      }
      return
    }
  }

  function initializeCombat(enemyList: IEnemy[]) {
    enemies.value = enemyList
    resetAbilityCooldowns()
    if (!config.isTraining) {
      audioManager.playMountainCombat()
    }

    if (config.isTraining) {
      addToLog(`¡Entrenamiento iniciado! Practica con el dummy de entrenamiento.`)
      addToLog(`El dummy tiene ${enemyList[0]?.maxHealth} de vida. Elige sus ataques desde el panel.`)
    } else {
      addToLog(`¡Combate iniciado! Te enfrentas a ${enemyList.length} enemigo${enemyList.length > 1 ? 's' : ''}.`)
    }
  }

  function cleanup() {
    audioManager.stopCurrentMusic()
  }

  return {
    player,
    heroes,
    enemies,
    selectedEnemy,
    combatLog,
    isPlayerTurn,
    isCombatEnded,
    isSelectingTarget,
    selectedAbility,
    currentAction,
    attackingEnemyId,
    combatLogRef,
    enemyHitPopups,
    playerHitPopups,
    showAbilitiesModal,
    abilityCooldowns,
    announcement,
    showAnnouncement,
    clearAnnouncement,
    announcer,
    abilities,
    aliveEnemies,
    abilityShortcuts,
    isPlayerInputLocked,

    isDefenseActive,
    defensePattern,
    defenseZones,
    defensePhaseIndex,
    defenseEnemyId,
    defenseIsCrit,
    handleDefensePhaseComplete,
    handleDefenseAllPhasesComplete,
    closeDefenseChallenge,

    openAbilitiesModal,
    closeAbilitiesModal,
    selectAbility,
    cancelAction,
    handleAbilitiesModalShortcuts,
    handleCombatShortcuts,
    endPlayerTurn,
    startPlayerTurn,
    enemyTurn,
    endCombat,
    endTraining,
    addToLog,
    getHealthPercentage,
    selectEnemy,
    selectAlly,
    selectAction,
    initializeCombat,
    cleanup,
    showEnemyHit,
    showPlayerHit,
    canTargetEnemies,
    canTargetAllies,
    actionRequiresTarget,
    executeAbility,
    revivePlayer,
    healPlayerToFull,
    clearAllStatusEffects,

    showItemsModal,
    selectedItem,
    inventory,
    usedItemThisTurn,
    openItemsModal,
    closeItemsModal,
    selectItem,
    selectItemAllyTarget,
    itemCanTargetAllies,
    itemRequiresTarget
  }
}