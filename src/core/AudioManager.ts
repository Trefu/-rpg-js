import { Howl, Howler } from 'howler'

export class AudioManager {
  private static instance: AudioManager
  private currentMusic: Howl | null = null
  private musicVolume: number = 0.1
  private sfxVolume: number = 1
  private isMuted: boolean = false

  // Música de la montaña
  private mountainMusic = {
    exploration: new Howl({
      src: ['/src/assets/music/mountain_ost_1.mp3'],
      loop: true,
      volume: this.musicVolume,
      html5: true
    }),
    combat: new Howl({
      src: ['/src/assets/music/mountain_ost_2.mp3'],
      loop: true,
      volume: this.musicVolume,
      html5: true
    }),
    boss: new Howl({
      src: ['/src/assets/music/mountain_ost_boss.mp3'],
      loop: true,
      volume: this.musicVolume,
      html5: true
    })
  }

  // Efectos de sonido 
  private soundEffects = {
    attack: new Howl({
      src: ['/src/assets/sounds/Stab 4-1.wav'],
      volume: this.sfxVolume
    }),
    hit: new Howl({
      src: ['/src/assets/sounds/Hit Generic 2-1.wav'],
      volume: this.sfxVolume
    }),
    victory: new Howl({
      src: ['/src/assets/sounds/Special Collectible 26-1.wav'],
      volume: this.sfxVolume
    }),
    crit: new Howl({
      src: ['/src/assets/sounds/Explosion Large 1-1.wav'],
      volume: this.sfxVolume
    }),
    bonus: new Howl({
      src: ['/src/assets/sounds/Explosion Medium 2-1.wav'],
      volume: this.sfxVolume
    })
  }

  private constructor() {
    Howler.volume(this.musicVolume)
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  public playMountainExploration(): void {
    this.stopCurrentMusic()
    this.currentMusic = this.mountainMusic.exploration
    this.currentMusic.play()
  }

  public playMountainCombat(): void {
    this.stopCurrentMusic()
    this.currentMusic = this.mountainMusic.combat
    this.currentMusic.play()
  }

  public playMountainBoss(): void {
    this.stopCurrentMusic()
    this.currentMusic = this.mountainMusic.boss
    this.currentMusic.play()
  }

  public stopCurrentMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop()
      this.currentMusic = null
    }
  }

  public pauseMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause()
    }
  }

  public resumeMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.play()
    }
  }

  // Métodos para efectos de sonido
  public playAttackSound(): void {
    if (!this.isMuted) {
      this.soundEffects.attack.play()
    }
  }

  public playHitSound(): void {
    if (!this.isMuted) {
      this.soundEffects.hit.play()
    }
  }

  public playVictorySound(): void {
    if (!this.isMuted) {
      this.soundEffects.victory.play()
    }
  }

  public playCritSound(): void {
    if (!this.isMuted) {
      this.soundEffects.crit.play()
    }
  }

  public playBonusSound(): void {
    if (!this.isMuted) {
      this.soundEffects.bonus.play()
    }
  }

  // Control de volumen
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    Object.values(this.mountainMusic).forEach(music => {
      music.volume(this.musicVolume)
    })
  }

  public setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    Object.values(this.soundEffects).forEach(sound => {
      sound.volume(this.sfxVolume)
    })
  }

  public getMusicVolume(): number {
    return this.musicVolume
  }

  public getSFXVolume(): number {
    return this.sfxVolume
  }

  // Control de mute
  public toggleMute(): void {
    this.isMuted = !this.isMuted
    if (this.isMuted) {
      Howler.volume(0)
    } else {
      Howler.volume(1)
    }
  }

  public isAudioMuted(): boolean {
    return this.isMuted
  }

  // Limpieza
  public destroy(): void {
    this.stopCurrentMusic()
    Object.values(this.mountainMusic).forEach(music => {
      music.unload()
    })
    Object.values(this.soundEffects).forEach(sound => {
      sound.unload()
    })
  }
} 