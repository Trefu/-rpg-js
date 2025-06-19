import { ref, computed, nextTick } from 'vue'
import { useGameStore } from '@/stores/game'
import { IEnemy } from '@/core/interfaces/ICharacter'
import { AudioManager } from '@/core/AudioManager'
import { Ability } from '@/core/interfaces/IClass'

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
  const isCombatEnded = ref(false)
  const isSelectingTarget = ref(false)
  const selectedAction = ref<string>('')
  const audioManager = AudioManager.getInstance()
  const showTimingCircle = ref(false)
  const timingCircleRef = ref<any>(null)
  const timingResult = ref<'normal' | 'bonificado' | 'critico'>('normal')
  const currentAction = ref<string>('attack')
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

  const abilities = computed(() => {
    if (player.value && player.value.classRef && player.value.classRef.abilities) {
      return player.value.classRef.abilities
    }
    if (player.value && player.value.constructor.abilities) {
      return player.value.constructor.abilities
    }
    return player.value?.abilities || []
  })

  const aliveEnemies = computed(() => enemies.value.filter(enemy => enemy.isAlive))

  // Cooldowns
  function resetAbilityCooldowns() {
    abilityCooldowns.value = {}
    abilities.value.forEach((a: any) => {
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

  // Modal de habilidades
  function openAbilitiesModal() {
    if (!isPlayerTurn.value || isCombatEnded.value) return
    showAbilitiesModal.value = true
  }

  function closeAbilitiesModal() {
    showAbilitiesModal.value = false
  }

  function selectAbility(ability: any, idx?: number) {
    console.log(idx);
    if (abilityCooldowns.value[ability.type] > 0) return
    selectedAction.value = ability.type
    closeAbilitiesModal()
    isSelectingTarget.value = true
  }

  // Shortcuts
  const abilityShortcuts = ['q', 'w', 'e', 'r']

  function handleAbilitiesModalShortcuts(e: KeyboardEvent) {
    if (!showAbilitiesModal.value) return
    if (e.key.toLowerCase() === 'a') {
      closeAbilitiesModal()
      e.preventDefault()
      return
    }
    if (e.key.toLowerCase() === 'q') {
      selectAbility(abilities.value[0], 0)
      e.preventDefault()
      return
    }
    if (e.key.toLowerCase() === 'w' && abilities.value.length > 1) {
      selectAbility(abilities.value[1], 1)
      e.preventDefault()
      return
    }
    if (e.key.toLowerCase() === 'e' && abilities.value.length > 2) {
      selectAbility(abilities.value[2], 2)
      e.preventDefault()
      return
    }
    if (e.key.toLowerCase() === 'r' && abilities.value.length > 3) {
      selectAbility(abilities.value[3], 3)
      e.preventDefault()
      return
    }
  }

  function handleCombatShortcuts(e: KeyboardEvent) {
    if (isCombatEnded.value) return
    if (showAbilitiesModal.value) return
    if (e.key.toLowerCase() === 'a' && isPlayerTurn.value && !showAbilitiesModal.value) {
      openAbilitiesModal()
      e.preventDefault()
      return
    }
    
    // Seleccionar enemigo con 1, 2, 3 si está seleccionando objetivo
    if (isSelectingTarget.value && ['1', '2', '3'].includes(e.key) && actionRequiresTarget(selectedAction.value)) {
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

  // Utilidades
  function getPointerSpeed() {
    return player.value?.getPointerSpeed({ action: currentAction.value }) ?? 300
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

  function actionRequiresTarget(action: string): boolean {
    return true
  }

  function triggerTimingEffect(type: 'crit' | 'bonus') {
    timingEffect.value = type
    setTimeout(() => { timingEffect.value = '' }, 500)
  }

  function handleModalOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      closeAbilitiesModal()
    }
  }

  // Lógica de combate
  function executeActionWithTiming(timingType: 'normal' | 'bonificado' | 'critico') {
    if (!player.value || !selectedEnemy.value || !isPlayerTurn.value) return

    // Lógica para Golpe Aturdidor
    if (selectedAction.value === 'stunStrike') {
      let baseDamage = Math.round(player.value.attack() * 0.8)
      let stunTurns = 1
      let logMsg = ''
      let ability = abilities.value.find((a: Ability) => a.type === 'stunStrike')
      
      if (timingType === 'bonificado') {
        baseDamage = Math.round(baseDamage * 1.5)
        stunTurns = 2
        audioManager.playBonusSound()
        triggerTimingEffect('bonus')
        logMsg = `¡Golpe aturdidor bonificado! ${selectedEnemy.value.name} queda aturdido 2 turnos.`
      } else if (timingType === 'critico') {
        baseDamage = Math.round(baseDamage * 2)
        audioManager.playCritSound()
        triggerTimingEffect('crit')
        if (Math.random() < 0.5) {
          stunTurns = 3
          logMsg = `¡Golpe aturdidor crítico! 50% de probabilidad: ${selectedEnemy.value.name} queda aturdido 3 turnos.`
        } else {
          stunTurns = 2
          logMsg = `¡Golpe aturdidor crítico! Pero no se logró el 50% extra, aturdido 2 turnos.`
        }
      } else {
        logMsg = `Golpe aturdidor fallido. ${selectedEnemy.value.name} queda aturdido 1 turno.`
      }
      
      selectedEnemy.value.takeDamage(baseDamage)
      selectedEnemy.value.addStatusEffect && selectedEnemy.value.addStatusEffect({
        type: 'stun',
        name: 'Aturdido',
        icon: '/src/assets/icons/Splash icons/3.png',
        turns: stunTurns,
        description: 'No puede actuar en su turno.',
        turnLabel: '¡Está aturdido y pierde su turno!'
      })
      showEnemyHit(selectedEnemy.value.id, baseDamage)
      audioManager.playAttackSound()
      addToLog(`Usas Golpe Aturdidor en ${selectedEnemy.value.name} causando ${baseDamage} de daño (${timingType}).`)
      addToLog(logMsg)
      
      if (!selectedEnemy.value.isAlive) {
        audioManager.playHitSound()
        addToLog(`${selectedEnemy.value.name} ha sido derrotado!`)
        if (!config.isTraining) {
          const rewards = selectedEnemy.value.getRewards()
          player.value.gainExperience(rewards.experience)
          player.value.addGold(rewards.gold)
          setTimeout(() => {
            addToLog(`Ganas ${rewards.experience} experiencia y ${rewards.gold} oro.`)
          }, 1000)
        }
      } else {
        setTimeout(() => {
          audioManager.playHitSound()
        }, 200)
      }
      
      onAbilityUsed('stunStrike', ability?.cooldown || 0)
      selectedEnemy.value = null
      selectedAction.value = ''
      isSelectingTarget.value = false
      endPlayerTurn()
      return
    }

    // Lógica normal de ataque
    let damage = player.value.attack()
    if (timingType === 'bonificado') {
      damage = Math.round(damage * 1.5)
      audioManager.playBonusSound()
      triggerTimingEffect('bonus')
    }
    if (timingType === 'critico') {
      damage = Math.round(damage * 2)
      audioManager.playCritSound()
      triggerTimingEffect('crit')
    }

    selectedEnemy.value.takeDamage(damage)
    showEnemyHit(selectedEnemy.value.id, damage)
    audioManager.playAttackSound()
    addToLog(`Atacas a ${selectedEnemy.value.name} causando ${damage} de daño (${timingType}).`)

    if (!selectedEnemy.value.isAlive) {
      audioManager.playHitSound()
      addToLog(`${selectedEnemy.value.name} ha sido derrotado!`)
      if (!config.isTraining) {
        const rewards = selectedEnemy.value.getRewards()
        player.value.gainExperience(rewards.experience)
        player.value.addGold(rewards.gold)
        setTimeout(() => {
          addToLog(`Ganas ${rewards.experience} experiencia y ${rewards.gold} oro.`)
        }, 1000)
      }
    } else {
      setTimeout(() => {
        audioManager.playHitSound()
      }, 200)
    }

    selectedEnemy.value = null
    selectedAction.value = ''
    isSelectingTarget.value = false
    isPlayerTurn.value = false

    setTimeout(enemyTurn, config.isTraining ? 1000 : 2000)
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

      // Si el enemigo está aturdido, salta su turno
      if (enemy.isStunned && enemy.isStunned()) {
        addToLog(`${enemy.name} está aturdido y pierde su turno. (${enemy.statusEffects.find(e => e.type === 'stun')?.turns || 0} turno(s) restante(s))`)
        enemy.reduceStatusEffects && enemy.reduceStatusEffects()
        await delay(config.isTraining ? 1000 : 2000)
        continue
      }

      // En entrenamiento, el dummy no ataca
      if (config.isTraining) {
        addToLog('El dummy no ataca. Es tu turno de nuevo.')
        if (enemy.reduceStatusEffects) {
          enemy.reduceStatusEffects()
        }
        isPlayerTurn.value = true
        addToLog('Tu turno.')
        return
      }

      // Mostrar aviso de acción
      const enemyIndex = enemies.value.filter(e => e.name === enemy.name && e.isAlive).indexOf(enemy) + 1
      const enemyLabel = aliveEnemies.length > 1 ? `${enemy.name} ${enemyIndex}` : enemy.name
      attackingEnemyId.value = enemy.id
      attackingEnemyLabel.value = `${enemyLabel} va a atacar!`
      addToLog(`${enemyLabel} va a atacar`)
      await delay(2000)
      attackingEnemyId.value = null
      attackingEnemyLabel.value = null

      // Mostrar mensaje de ataque
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
    addToLog('Tu turno.')
  }

  async function showEnemyStatusSequence(enemy: any) {
    if (!enemy.statusEffects || !enemy.statusEffects.length) return
    for (const effect of enemy.statusEffects) {
      if (effect.turns > 0 && effect.turnLabel) {
        enemyStatusWarning.value = {
          enemyId: enemy.id,
          icon: effect.icon,
          text: effect.turnLabel,
          isBuff: !!effect.isBuff
        }
        await delay(1000)
        enemyStatusWarning.value = null
        await delay(200)
      }
    }
  }

  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
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

  function onTimingResult({ type }: { type: 'normal' | 'bonificado' | 'critico' }) {
    showTimingCircle.value = false
    timingResult.value = type
    executeActionWithTiming(type)
  }

  function selectEnemy(enemy: IEnemy) {
    if (!isPlayerTurn.value || !enemy.isAlive) return

    if (isSelectingTarget.value) {
      selectedEnemy.value = enemy
      showTimingCircle.value = true
      setTimeout(() => {
        timingCircleRef.value?.start()
      }, 100)
    }
  }

  type ActionType = 'attack' | 'skill' | 'spell' | 'stunStrike'

  function isActionType(action: string): action is ActionType {
    return action === 'attack' || action === 'skill' || action === 'spell' || action === 'stunStrike';
  }

  function selectAction(action: string) {
    if (!isPlayerTurn.value || isCombatEnded.value) return

    if (action === 'Huir') {
      if (config.isTraining) {
        addToLog('¡Has terminado el entrenamiento!')
        setTimeout(() => {
          if (config.onTrainingEnd) {
            config.onTrainingEnd()
          }
        }, 2000)
      } else {
        addToLog('¡Has huido del combate!')
        setTimeout(() => {
          if (config.onCombatEnd) {
            config.onCombatEnd(false)
          }
        }, 2000)
      }
      return
    }

    if (action === 'Objeto') {
      if (config.isTraining) {
        addToLog('No puedes usar objetos durante el entrenamiento.')
      } else {
        addToLog('No tienes objetos disponibles.')
      }
      return
    }

    if (isActionType(action)) {
      currentAction.value = action
      selectedAction.value = action
      isSelectingTarget.value = true
      addToLog(`Selecciona un objetivo para ${action.toLowerCase()}.`)
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
    // Estado
    player,
    enemies,
    selectedEnemy,
    combatLog,
    isPlayerTurn,
    isCombatEnded,
    isSelectingTarget,
    selectedAction,
    showTimingCircle,
    timingCircleRef,
    timingResult,
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

    // Métodos
    openAbilitiesModal,
    closeAbilitiesModal,
    selectAbility,
    handleAbilitiesModalShortcuts,
    handleCombatShortcuts,
    executeActionWithTiming,
    endPlayerTurn,
    enemyTurn,
    endCombat,
    endTraining,
    addToLog,
    getHealthPercentage,
    onTimingResult,
    selectEnemy,
    selectAction,
    initializeCombat,
    cleanup,
    triggerTimingEffect,
    handleModalOverlayClick,
    getPointerSpeed,
    showEnemyHit,
    showPlayerHit,
    actionRequiresTarget
  }
} 