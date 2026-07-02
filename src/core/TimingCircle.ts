import type { TimingCircleConfig, TimingResult, TimingResultData } from '@/types/timing'

export class TimingCircle {
  outerRadius: number
  innerRadius: number
  criticalRadius: number
  shrinkSpeed: number
  isShrinking: boolean
  config: TimingCircleConfig
  startTime: number | null

  constructor(config: TimingCircleConfig) {
    this.config = config
    this.outerRadius = config.outerRadius
    this.innerRadius = config.outerRadius
    this.criticalRadius = config.criticalZoneSize
    this.shrinkSpeed = config.shrinkSpeed
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

  update(deltaMs: number): void {
    if (!this.isShrinking) return

    const shrinkPerMs = this.shrinkSpeed / 1000
    this.innerRadius = Math.max(0, this.innerRadius - shrinkPerMs * deltaMs)
  }

  checkHit(playerRadius?: number): TimingResultData {
    this.stopShrinking()

    const hitRadius = playerRadius ?? this.innerRadius
    const timePressed = this.startTime ? performance.now() - this.startTime : 0

    const centerDotRadius = this.config.centerDotRadius
    const criticalRadius = this.criticalRadius
    const outerRadius = this.outerRadius

    let result: TimingResult
    let accuracy: number

    if (hitRadius <= centerDotRadius) {
      result = 'critical'
      accuracy = 100
    } else if (hitRadius <= criticalRadius) {
      const bonusRange = criticalRadius - centerDotRadius
      accuracy = 100 - ((hitRadius - centerDotRadius) / bonusRange) * 20
      result = 'bonus'
    } else if (hitRadius <= outerRadius) {
      accuracy = 100 - ((hitRadius - criticalRadius) / (outerRadius - criticalRadius)) * 100
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