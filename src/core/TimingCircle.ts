import type { TimingCircleConfig, TimingResult, TimingResultData } from '@/types/timing'

export class TimingCircle {
  outerRadius: number
  innerRadius: number
  bonusRadius: number
  shrinkPerMs: number
  isShrinking: boolean
  config: TimingCircleConfig
  startTime: number | null

  constructor(config: TimingCircleConfig) {
    this.config = config
    this.outerRadius = config.outerRadius
    this.innerRadius = config.outerRadius
    this.bonusRadius = config.bonusZoneSize
    this.shrinkPerMs = config.outerRadius / config.closeDurationMs
    this.isShrinking = false
    this.startTime = null
  }

  startShrinking(): void {
    this.isShrinking = true
    this.innerRadius = this.outerRadius
    this.startTime = performance.now()
  }

  stopShrinking(): void {
    this.isShrinking = false
  }

  getCurrentRadius(): number {
    return this.innerRadius
  }

  /**
   * Avanza el radio hasta el momento actual usando tiempo absoluto.
   * Asi no se acumula drift por deltas de RAF y la deteccion coincide
   * exactamente con la posicion visual en el instante del input.
   */
  syncToNow(): void {
    if (!this.isShrinking || this.startTime === null) return
    const elapsed = performance.now() - this.startTime
    this.innerRadius = Math.max(0, this.outerRadius - this.shrinkPerMs * elapsed)
  }

  update(deltaMs: number): void {
    if (!this.isShrinking) return
    this.syncToNow()
  }

  checkHit(playerRadius?: number): TimingResultData {
    this.stopShrinking()

    if (playerRadius === undefined && this.startTime !== null) {
      const elapsed = performance.now() - this.startTime
      this.innerRadius = Math.max(0, this.outerRadius - this.shrinkPerMs * elapsed)
    }

    const hitRadius = playerRadius ?? this.innerRadius
    const timePressed = this.startTime ? performance.now() - this.startTime : 0

    const criticalRadius = this.config.criticalRadius
    const bonusRadius = this.bonusRadius
    const outerRadius = this.outerRadius

    let result: TimingResult
    let accuracy: number

    if (hitRadius <= criticalRadius) {
      result = 'critical'
      accuracy = 100
    } else if (hitRadius <= bonusRadius) {
      const bonusRange = bonusRadius - criticalRadius
      accuracy = 100 - ((hitRadius - criticalRadius) / bonusRange) * 20
      result = 'bonus'
    } else if (hitRadius <= outerRadius) {
      accuracy = 100 - ((hitRadius - bonusRadius) / (outerRadius - bonusRadius)) * 100
      result = 'normal'
    } else {
      result = 'miss'
      accuracy = 0
    }

    return {
      result,
      accuracy: Math.max(0, Math.min(100, accuracy)),
      timePressed
    }
  }

  reset(): void {
    this.innerRadius = this.outerRadius
    this.isShrinking = false
    this.startTime = null
  }
}