import { ref, computed, nextTick } from 'vue'
import { useGameStore } from '@/stores/game'
import type { Player } from '@/core/Player'
import { AudioManager } from '@/core/AudioManager'
import type { IEnemy } from '@/core/interfaces/ICharacter'
import type { IAbility } from '@/core/interfaces/IAbility'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import type { TimingResultData } from '@/types/timing'
import { TIMING_MULTIPLIERS } from '@/types/timing'
import { StatusEffects, applyFailureEffect } from '@/core/StatusEffects'
import type {
  DefenseChallengeResult,
  DefensePatternConfig,
  DefensePhaseResult,
  DefensePhaseZone
} from '@/core/defense/types'
import {
  applyModifiersToPattern,
  buildDefenseResult,
  pickZonesForPhases
} from '@/core/defense/DefenseEngine'
import { getDefenseModifiers } from '@/core/defense/modifiers'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface CombatConfig {
  isTraining?: boolean
  onCombatEnd?: (victory: boolean) => void
  onTrainingEnd?: () => void
}

export function useCombat(config: CombatConfig = {}) {
  const gameStore = useGameStore()
  const player = ref<any>(gameStore.player)
  const enemies = ref<IEnemy[]>([])
  const selectedEnemy = ref<IEnemy | null>(null)
  const combatLog = ref<string[]>([])
  const isPlayerTurn = ref(true)
  const isExecutingAction = ref(false)
  const isCombatEnded = ref(false)
  const isSelectingTarget = ref(false)
  const selectedAbility = ref<IAbility | null>(null)
  const audioManager = AudioManager.getInstance()
  const showTimingOverlay = ref(false)
  const currentAction = ref<{ ability: IAbility, target: IEnemy } | null>(null)
  const attackingEnemyId = ref<string | null>(null)
  const combatLogRef = ref<HTMLDivElement | null>(null)
  const enemyHitPopups = ref<{ id: string, value: number, key: number }[]>([])
  const playerHitPopups = ref<{ value: number, key: number }[]>([])
  const showAbilitiesModal = ref(false)
  const abilityCooldowns = ref<{ [type: string]: number }>({})
  const timingEffect = ref('')

  const announcement = ref<{ text: string, variant: string, key: number } | null>(null)
  let announcementKey = 0
  let announcementTimer: ReturnType<typeof setTimeout> | null = null

  function showAnnouncement(
    text: string,
    variant: 'info' | 'attack' | 'status' | 'turn' | 'crit' = 'info',
    duration: number = 2000
  ) {
    if (announcementTimer) clearTimeout(announcementTimer)
    announcement.value = { text, variant, key: ++announcementKey }
    announcementTimer = setTimeout(() => {
      announcement.value = null
      announcementTimer = null
    }, duration)
  }

  const isDefenseActive = ref(false)
  const defensePattern = ref<DefensePatternConfig | null>(null)
  const defenseZones = ref<DefensePhaseZone[]>([])
  const defensePhaseIndex = ref(0)
  const defenseEnemyId = ref<string | null>(null)
  let pendingDefenseResolve: ((result: DefenseChallengeResult | null) => void) | null = null
  let pendingDefensePattern: DefensePatternConfig | null = null
  let pendingDefenseAttackDamage = 0
  let pendingDefenseEnemy: IEnemy | null = null
  let popupKey = 0

  const timingResultCallback = ref<((result: TimingResultData) => void) | null>(null)

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
           showTimingOverlay.value ||
           isDefenseActive.value
  })

  function startDefenseChallenge(enemy: IEnemy, attackDamage: number, preSelectedPattern?: DefensePatternConfig): Promise<DefenseChallengeResult | null> {
    return new Promise((resolve) => {
      const modifiers = getDefenseModifiers(player.value)
      const selectedPattern = preSelectedPattern ?? enemy.selectAttackPattern(player.value)
      const adjusted = applyModifiersToPattern(selectedPattern, modifiers)
      const zones = pickZonesForPhases(adjusted)
      pendingDefenseResolve = resolve
      pendingDefensePattern = adjusted
      pendingDefenseAttackDamage = attackDamage
      pendingDefenseEnemy = enemy
      defensePattern.value = adjusted
      defenseZones.value = zones
      defensePhaseIndex.value = 0
      defenseEnemyId.value = enemy.id
      isDefenseActive.value = true
    })
  }

  function handleDefensePhaseComplete(_result: DefensePhaseResult) {
    if (defensePhaseIndex.value < (defensePattern.value?.phaseCount ?? 1) - 1) {
      defensePhaseIndex.value++
    }
  }

  function handleDefenseAllPhasesComplete(results: DefensePhaseResult[]) {
    const pattern = pendingDefensePattern
    const enemy = pendingDefenseEnemy
    const attackDamage = pendingDefenseAttackDamage
    const resolve = pendingDefenseResolve
    pendingDefenseResolve = null
    pendingDefensePattern = null
    pendingDefenseEnemy = null
    isDefenseActive.value = false
    defensePattern.value = null
    defenseZones.value = []
    defenseEnemyId.value = null

    if (!pattern || !enemy || !resolve) return

    const modifiers = getDefenseModifiers(player.value)
    const result = buildDefenseResult(pattern, results, modifiers, attackDamage)

    const finalDamage = Math.max(0, result.totalDamage)
    if (finalDamage > 0) {
      player.value.takeDamage(finalDamage)
      showPlayerHit(finalDamage)
      audioManager.playAttackSound()
      audioManager.playHitSound()
      addToLog(`Recibes ${finalDamage} de daño.`)
    } else {
      addToLog(`¡Bloqueaste el ataque completamente!`)
      audioManager.playBonusSound()
    }

    if (result.appliedOnFailureEffect && pattern.onFailureEffect) {
      applyOnFailureEffectToPlayer(player.value, pattern.onFailureEffect)
    }

    resolve(result)
  }

  function applyOnFailureEffectToPlayer(p: any, fx: { statusType: string; duration: number; stacks?: number }) {
    const template = StatusEffects.getByType(fx.statusType)
    if (!template) {
      throw new Error(
        `[useCombat] Attack references unknown status effect "${fx.statusType}". Registered: ${StatusEffects.getRegisteredTypes().join(', ')}`
      )
    }

    applyFailureEffect(p, fx)

    const applied = p.statusEffects.find((e: IStatusEffect) => e.type === template.type)
    const stackLabel = (applied?.stacks ?? 1) > 1 ? ` x${applied?.stacks}` : ''
    addToLog(`¡Sufres el efecto: ${template.name}${stackLabel}!`)
    showAnnouncement(`¡${template.name}${stackLabel}!`, 'status', 1800)
  }

  function closeDefenseChallenge() {
    if (pendingDefenseResolve) {
      pendingDefenseResolve(null)
      pendingDefenseResolve = null
    }
    pendingDefensePattern = null
    pendingDefenseEnemy = null
    isDefenseActive.value = false
    defensePattern.value = null
    defenseZones.value = []
    defenseEnemyId.value = null
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
    if (cooldown > 0) abilityCooldowns.value[type] = cooldown
  }

  function openAbilitiesModal() {
    if (!isPlayerTurn.value || isCombatEnded.value || showTimingOverlay.value || isExecutingAction.value) return
    showAbilitiesModal.value = true
  }

  function closeAbilitiesModal() {
    showAbilitiesModal.value = false
  }

  function selectAbility(ability: IAbility, index: number) {
    console.log(index);
    if (abilityCooldowns.value[ability.type] > 0) return
    selectedAbility.value = ability
    closeAbilitiesModal()
    isSelectingTarget.value = true
  }

  const abilityShortcuts = ['q', 'w', 'e', 'r']

  function handleAbilitiesModalShortcuts(e: KeyboardEvent) {
    if (!showAbilitiesModal.value) {
      if (e.key.toLowerCase() === 'a' && isPlayerTurn.value && !showTimingOverlay.value && !isExecutingAction.value) {
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

    if (isSelectingTarget.value && ['1', '2', '3'].includes(e.key) && actionRequiresTarget(selectedAbility.value)) {
      const idx = parseInt(e.key, 10) - 1
      const alive = aliveEnemies.value
      if (alive[idx]) {
        selectEnemy(alive[idx])
        e.preventDefault()
      } else {
        addToLog(`No hay enemigo en la posición ${e.key}.`)
        e.preventDefault()
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
    return !!ability
  }

  function endPlayerTurn() {
    isPlayerTurn.value = false
    decrementAbilityCooldowns()
    if (typeof player.value?.reduceStatusEffects === 'function') {
      player.value.reduceStatusEffects()
    }
    if (typeof player.value?.restoreEnergy === 'function') {
      player.value.restoreEnergy(10)
    }
    setTimeout(enemyTurn, config.isTraining ? 1000 : 2000)
  }

  async function startPlayerTurn() {
    if (!player.value) return
    if (isCombatEnded.value) return
    if (!isPlayerTurn.value) return
    await applyPlayerStatusTick()
  }

  async function enemyTurn() {
    if (!player.value) return

    const aliveEnemies = enemies.value.filter(enemy => enemy.isAlive)
    if (aliveEnemies.length === 0) {
      endCombat(true)
      return
    }

    for (let i = 0; i < aliveEnemies.length; i++) {
      const enemy = aliveEnemies[i]
      if (!player.value || !player.value.isAlive) break

      await showEnemyStatusSequence(enemy)

      const stunEffect = enemy.statusEffects.find(e => e.type === 'stun')
      if (stunEffect && stunEffect.turns > 0) {
        addToLog(`${enemy.name} está aturdido y pierde su turno. (${stunEffect.turns} turno(s) restante(s))`)
        enemy.reduceStatusEffects && enemy.reduceStatusEffects()
        await delay(config.isTraining ? 1000 : 2000)
        continue
      }

      const selectedPattern = enemy.selectAttackPattern(player.value)
      const attackName = selectedPattern.name ?? 'atacar'
      const enemyIndex = enemies.value.filter(e => e.name === enemy.name && e.isAlive).indexOf(enemy) + 1
      const enemyLabel = aliveEnemies.length > 1 ? `${enemy.name} ${enemyIndex}` : enemy.name
      attackingEnemyId.value = enemy.id
      showAnnouncement(`${enemyLabel} va a usar ${attackName}!`, 'attack', config.isTraining ? 800 : 1400)
      addToLog(`${enemyLabel} va a usar ${attackName}`)
      await delay(config.isTraining ? 800 : 1200)
      attackingEnemyId.value = null

      const rawDamage = enemy.attack()
      const damage = Math.floor(rawDamage * selectedPattern.damageMultiplier)
      await startDefenseChallenge(enemy, damage, selectedPattern)

      if (!player.value.isAlive) {
        if (config.isTraining) {
          addToLog('¡Has caído en el entrenamiento! Usa "Revivir" en el panel para continuar.')
          isPlayerTurn.value = true
          isExecutingAction.value = false
          return
        }
        addToLog('¡Has sido derrotado!')
        endCombat(false)
        return
      }
      await delay(config.isTraining ? 600 : 1500);
    }

    isPlayerTurn.value = true
    isExecutingAction.value = false
    addToLog('Tu turno.')
    showAnnouncement('Tu turno', 'turn', 1400)
    await startPlayerTurn()
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

  async function applyPlayerStatusTick() {
    const p = player.value
    if (!p || !Array.isArray(p.statusEffects) || p.statusEffects.length === 0) return

    const active = p.statusEffects.filter(e => e.turns > 0 && typeof e.damagePerTurn === 'number' && (e.damagePerTurn as number) > 0)
    for (const effect of active) {
      const stacks = effect.stacks ?? 1
      const dmg = (effect.damagePerTurn as number) * stacks
      p.takeDamage(dmg)
      showPlayerHit(dmg)
      audioManager.playHitSound()
      if (effect.turnLabel) {
        const stackSuffix = stacks > 1 ? ` (x${stacks})` : ''
        showAnnouncement(`${effect.turnLabel}${stackSuffix}`, 'status', 1800)
        addToLog(`${effect.name}${stackSuffix}: recibes ${dmg} de daño.`)
        await delay(1800)
      }
    }

    if (typeof p.reduceStatusEffects === 'function') {
      p.reduceStatusEffects()
    }
  }

  async function showEnemyStatusSequence(enemy: IEnemy) {
    if (enemy.isAlive && enemy.statusEffects.length > 0) {
      for (const effect of enemy.statusEffects) {
        if (effect.turns > 0 && effect.turnLabel) {
          showAnnouncement(effect.turnLabel, 'status', 2000)
          await delay(2000)
          await delay(200)
        }
      }
    }
  }

  function endCombat(victory: boolean) {
    isCombatEnded.value = true

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

  const performTimingChallenge = (): Promise<TimingResultData['result']> => {
    return new Promise((resolve) => {
      const handleResult = (result: TimingResultData) => {
        showTimingOverlay.value = false
        timingResultCallback.value = null
        resolve(result.result)
      }

      timingResultCallback.value = handleResult
      showTimingOverlay.value = true
    })
  }

  const handleTimingResult = (result: TimingResultData) => {
    if (timingResultCallback.value) {
      timingResultCallback.value(result)
    }
  }

  const executeAbility = async (damageMultiplier: number = 1, timingResult?: TimingResultData['result']) => {
    isExecutingAction.value = true

    if (currentAction.value) {
      const { ability, target } = currentAction.value
      const playerChar = player.value as Player

      if (ability.execute) {
        await ability.execute({
          caster: playerChar,
          target,
          addToLog,
          showEnemyHit,
          showAnnouncement: (text, variant, duration) => showAnnouncement(text, variant ?? 'info', duration),
          performTimingChallenge,
          audioManager,
          damageMultiplier,
          timingResult
        })
        onAbilityUsed(ability.type, ability.cooldown)
      }
    }

    isSelectingTarget.value = false
    selectedAbility.value = null
    selectedEnemy.value = null
    currentAction.value = null

    endPlayerTurn()
  }

  function selectEnemy(enemy: IEnemy) {
    if (!isPlayerTurn.value || !enemy.isAlive || isPlayerInputLocked.value) return

    if (isSelectingTarget.value && selectedAbility.value) {
      selectedEnemy.value = enemy
      currentAction.value = { ability: selectedAbility.value, target: enemy }

      performTimingChallenge().then((timingResult) => {
        const multiplier = TIMING_MULTIPLIERS[timingResult as keyof typeof TIMING_MULTIPLIERS]
        executeAbility(multiplier, timingResult)
      })
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
      } else {
        addToLog('No tienes objetos disponibles.')
      }
      return
    }

    if (isActionType(action)) {
      const ability = abilities.value.find((a: IAbility) => a.type === action)
      if (ability) {
        selectedAbility.value = ability
        isSelectingTarget.value = true
        addToLog(`Selecciona un objetivo para ${action.toLowerCase()}.`)
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
    enemies,
    selectedEnemy,
    combatLog,
    isPlayerTurn,
    isCombatEnded,
    isSelectingTarget,
    selectedAbility,
    showTimingOverlay,
    currentAction,
    attackingEnemyId,
    combatLogRef,
    enemyHitPopups,
    playerHitPopups,
    showAbilitiesModal,
    abilityCooldowns,
    timingEffect,
    announcement,
    showAnnouncement,
    abilities,
    aliveEnemies,
    abilityShortcuts,
    isPlayerInputLocked,

    isDefenseActive,
    defensePattern,
    defenseZones,
    defensePhaseIndex,
    defenseEnemyId,
    handleDefensePhaseComplete,
    handleDefenseAllPhasesComplete,
    closeDefenseChallenge,

    openAbilitiesModal,
    closeAbilitiesModal,
    selectAbility,
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
    selectAction,
    initializeCombat,
    cleanup,
    showEnemyHit,
    showPlayerHit,
    actionRequiresTarget,
    handleTimingResult,
    executeAbility,
    revivePlayer,
    healPlayerToFull,
    clearAllStatusEffects
  }
}