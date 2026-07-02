import { ref, computed, nextTick } from 'vue'
import { useGameStore } from '@/stores/game'
import type { Player } from '@/core/Player'
import { AudioManager } from '@/core/AudioManager'
import { IEnemy } from '@/core/interfaces/ICharacter'
import type { IAbility } from '@/core/interfaces/IAbility'
import type { TimingResultData } from '@/types/timing'
import { TIMING_MULTIPLIERS } from '@/types/timing'

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
  const attackingEnemyLabel = ref<string | null>(null)
  const combatLogRef = ref<HTMLDivElement | null>(null)
  const enemyHitPopups = ref<{ id: string, value: number, key: number }[]>([])
  const playerHitPopups = ref<{ value: number, key: number }[]>([])
  const showAbilitiesModal = ref(false)
  const abilityCooldowns = ref<{ [type: string]: number }>({})
  const enemyStatusWarning = ref<{ enemyId: string, icon: string, text: string, isBuff: boolean } | null>(null)
  const timingEffect = ref('')
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
           showTimingOverlay.value
  })

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

  function getPointerSpeed() {
    return player.value?.getPointerSpeed({ action: currentAction.value?.ability.type || '' }) ?? 300
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
    setTimeout(enemyTurn, config.isTraining ? 1000 : 2000)
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

      if (config.isTraining) {
        addToLog('El dummy no ataca. Es tu turno de nuevo.')
        if (enemy.reduceStatusEffects) {
          enemy.reduceStatusEffects()
        }
        isPlayerTurn.value = true
        isExecutingAction.value = false
        addToLog('Tu turno.')
        return
      }

      const enemyIndex = enemies.value.filter(e => e.name === enemy.name && e.isAlive).indexOf(enemy) + 1
      const enemyLabel = aliveEnemies.length > 1 ? `${enemy.name} ${enemyIndex}` : enemy.name
      attackingEnemyId.value = enemy.id
      attackingEnemyLabel.value = `${enemyLabel} va a atacar!`
      addToLog(`${enemyLabel} va a atacar`)
      await delay(2000)
      attackingEnemyId.value = null
      attackingEnemyLabel.value = null

      const damage = enemy.attack()
      addToLog(`${enemyLabel} ataca causando ${damage} de daño.`)

      player.value.takeDamage(damage)
      showPlayerHit(damage)
      audioManager.playAttackSound()
      if (damage > 0) {
        audioManager.playHitSound()
      }

      if (!player.value.isAlive) {
        addToLog('¡Has sido derrotado!')
        endCombat(false)
        return
      }
      await delay(2500);
    }

    isPlayerTurn.value = true
    isExecutingAction.value = false
    addToLog('Tu turno.')
  }

  async function showEnemyStatusSequence(enemy: IEnemy) {
    if (enemy.isAlive && enemy.statusEffects.length > 0) {
      for (const effect of enemy.statusEffects) {
        if (effect.turns > 0 && effect.turnLabel) {
          enemyStatusWarning.value = {
            enemyId: enemy.id,
            text: effect.turnLabel,
            icon: effect.icon,
            isBuff: !!effect.isBuff
          }
          await delay(2000)
          enemyStatusWarning.value = null
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
          endPlayerTurn: () => {},
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
    audioManager.playMountainCombat()

    if (config.isTraining) {
      addToLog(`¡Entrenamiento iniciado! Practica con el dummy de entrenamiento.`)
      addToLog(`El dummy tiene ${enemyList[0]?.maxHealth} de vida y no te atacará.`)
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
    attackingEnemyLabel,
    combatLogRef,
    enemyHitPopups,
    playerHitPopups,
    showAbilitiesModal,
    abilityCooldowns,
    enemyStatusWarning,
    timingEffect,
    abilities,
    aliveEnemies,
    abilityShortcuts,
    isPlayerInputLocked,

    openAbilitiesModal,
    closeAbilitiesModal,
    selectAbility,
    handleAbilitiesModalShortcuts,
    handleCombatShortcuts,
    endPlayerTurn,
    enemyTurn,
    endCombat,
    endTraining,
    addToLog,
    getHealthPercentage,
    selectEnemy,
    selectAction,
    initializeCombat,
    cleanup,
    getPointerSpeed,
    showEnemyHit,
    showPlayerHit,
    actionRequiresTarget,
    handleTimingResult,
    executeAbility
  }
}