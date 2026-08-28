import { Howl, Howler } from 'howler'

type MountainTrack = 'combat' | 'boss'
type SfxName = 'attack' | 'hit' | 'victory' | 'crit' | 'bonus'

const MUSIC_SRC: Record<MountainTrack, string> = {
    combat: '/assets/music/mountain_ost_boss.mp3',
    boss: '/assets/music/mountain_ost_boss.mp3'
}

const SFX_SRC: Record<SfxName, string> = {
    attack: '/assets/sounds/Stab 4-1.wav',
    hit: '/assets/sounds/Hit Generic 2-1.wav',
    victory: '/assets/sounds/Special Collectible 26-1.wav',
    crit: '/assets/sounds/Explosion Large 1-1.wav',
    bonus: '/assets/sounds/Explosion Medium 2-1.wav'
}

export class AudioManager {
    private static instance: AudioManager
    private currentMusic: MountainTrack | null = null
    private mountainMusic: Partial<Record<MountainTrack, Howl>> = {}
    private soundEffects: Partial<Record<SfxName, Howl>> = {}
    private musicVolume: number = 0.0
    private sfxVolume: number = 1
    private isMuted: boolean = false
    private unlocked: boolean = false

    private constructor() {
        this.bindAutoplayUnlock()
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager()
        }
        return AudioManager.instance
    }

    private bindAutoplayUnlock(): void {
        const unlock = () => {
            this.unlocked = true
            const ctx = Howler.ctx
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => { })
            }
        }
        window.addEventListener('pointerdown', unlock)
        window.addEventListener('keydown', unlock)
        window.addEventListener('touchstart', unlock)
    }

    private getMusic(track: MountainTrack): Howl {
        if (!this.mountainMusic[track]) {
            this.mountainMusic[track] = new Howl({
                src: [MUSIC_SRC[track]],
                loop: true,
                volume: this.musicVolume
            })
        }
        return this.mountainMusic[track]!
    }

    private getSfx(name: SfxName): Howl {
        if (!this.soundEffects[name]) {
            this.soundEffects[name] = new Howl({
                src: [SFX_SRC[name]],
                volume: this.sfxVolume
            })
        }
        return this.soundEffects[name]!
    }

    private tryPlay(howl: Howl): void {
        if (!this.unlocked) return
        const ctx = Howler.ctx
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => { })
        }
        if (!howl.playing()) howl.play()
    }

    public playMountainExploration(): void {
        this.playTrack('exploration')
    }

    public playMountainCombat(): void {
        this.playTrack('combat')
    }

    public playMountainBoss(): void {
        this.playTrack('boss')
    }

    private playTrack(track: MountainTrack): void {
        if (this.currentMusic && this.currentMusic !== track) {
            const prev = this.mountainMusic[this.currentMusic]
            if (prev) prev.stop()
        }
        this.currentMusic = track
        this.tryPlay(this.getMusic(track))
    }

    public stopCurrentMusic(): void {
        if (this.currentMusic) {
            const howl = this.mountainMusic[this.currentMusic]
            if (howl) howl.stop()
            this.currentMusic = null
        }
    }

    public pauseMusic(): void {
        if (this.currentMusic) {
            const howl = this.mountainMusic[this.currentMusic]
            if (howl) howl.pause()
        }
    }

    public resumeMusic(): void {
        if (this.currentMusic) {
            this.tryPlay(this.mountainMusic[this.currentMusic]!)
        }
    }

    public playAttackSound(): void {
        this.tryPlay(this.getSfx('attack'))
    }

    public playHitSound(): void {
        this.tryPlay(this.getSfx('hit'))
    }

    public playVictorySound(): void {
        this.tryPlay(this.getSfx('victory'))
    }

    public playCritSound(): void {
        this.tryPlay(this.getSfx('crit'))
    }

    public playBonusSound(): void {
        this.tryPlay(this.getSfx('bonus'))
    }

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

    public toggleMute(): void {
        this.isMuted = !this.isMuted
        Howler.volume(this.isMuted ? 0 : 1)
    }

    public isAudioMuted(): boolean {
        return this.isMuted
    }

    public destroy(): void {
        this.stopCurrentMusic()
        Object.values(this.mountainMusic).forEach(music => music.unload())
        Object.values(this.soundEffects).forEach(sound => sound.unload())
    }
}