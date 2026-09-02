import { Howl, Howler } from 'howler'

type MusicTrack = 'menu' | 'combat' | 'boss'
type SfxName = 'attack' | 'hit' | 'victory' | 'block'

const MENU_SRC = '/assets/music/menu_ost.mp3'
const COMBAT_SOURCES = [
    '/assets/music/mountain_ost_1.mp3',
    '/assets/music/mountain_ost_2.mp3'
]
const BOSS_SRC = '/assets/music/mountain_ost_boss.mp3'

const SFX_SRC: Record<SfxName, string> = {
    attack: '/assets/sounds/Stab 4-1.wav',
    hit: '/assets/sounds/Hit Generic 2-1.wav',
    victory: '/assets/sounds/Special Collectible 26-1.wav',
    block: '/assets/sounds/Battle_SFX/Impact_flesh.wav'
}

/**
 * Multiplicador de volumen por SFX, relativo al `sfxVolume` maestro.
 * Se usa para que sonidos cortos como el `block` (que compiten con el
 * `hit` del mismo impacto) se escuchen por encima del resto.
 */
const SFX_VOLUME_MULT: Record<SfxName, number> = {
    attack: 1,
    hit: 0.9,
    victory: 1,
    block: 1.6
}

interface CombatPool {
    howls: Howl[]
    currentIndex: number
}

export class AudioManager {
    private static instance: AudioManager
    private currentMusic: MusicTrack | null = null
    private menuHowl: Howl | null = null
    private bossHowl: Howl | null = null
    private combatPool: CombatPool = { howls: [], currentIndex: 0 }
    private soundEffects: Partial<Record<SfxName, Howl>> = {}
    //pa no fakin escuchar la musica cuando desarrollo
    private musicVolume: number = import.meta.env.DEV ? 0 : 0.3;
    private sfxVolume: number = 1
    private isMuted: boolean = false
    private unlocked: boolean = false

    private constructor() {
        this.unlocked = true
        Howler.ctx?.resume().catch(() => { })
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
            if (this.currentMusic === 'menu') {
                this.tryPlay(this.getMenuHowl())
            }
        }
        window.addEventListener('pointerdown', unlock)
        window.addEventListener('keydown', unlock)
        window.addEventListener('touchstart', unlock)
    }

    private getMenuHowl(): Howl {
        if (!this.menuHowl) {
            this.menuHowl = new Howl({
                src: [MENU_SRC],
                loop: true,
                volume: this.musicVolume
            })
        }
        return this.menuHowl
    }

    private getBossHowl(): Howl {
        if (!this.bossHowl) {
            this.bossHowl = new Howl({
                src: [BOSS_SRC],
                loop: true,
                volume: this.musicVolume
            })
        }
        return this.bossHowl
    }

    private getCombatHowls(): Howl[] {
        if (this.combatPool.howls.length === 0) {
            this.combatPool.howls = COMBAT_SOURCES.map(src => new Howl({
                src: [src],
                loop: true,
                volume: this.musicVolume
            }))
        }
        return this.combatPool.howls
    }

    private getSfx(name: SfxName): Howl {
        if (!this.soundEffects[name]) {
            this.soundEffects[name] = new Howl({
                src: [SFX_SRC[name]],
                volume: this.sfxVolume * SFX_VOLUME_MULT[name]
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

    public playMenuMusic(): void {
        this.stopCurrentHowl()
        this.currentMusic = 'menu'
        this.tryPlay(this.getMenuHowl())
    }

    public playMountainCombat(): void {
        const pool = this.getCombatHowls()
        const index = Math.floor(Math.random() * pool.length)
        this.stopCurrentHowl()
        this.combatPool.currentIndex = index
        this.currentMusic = 'combat'
        this.tryPlay(pool[index])
    }

    public playMountainBoss(): void {
        this.stopCurrentHowl()
        this.currentMusic = 'boss'
        this.tryPlay(this.getBossHowl())
    }

    private stopCurrentHowl(): void {
        if (!this.currentMusic) return
        let howl: Howl | undefined
        if (this.currentMusic === 'menu') howl = this.menuHowl ?? undefined
        else if (this.currentMusic === 'boss') howl = this.bossHowl ?? undefined
        else if (this.currentMusic === 'combat') howl = this.combatPool.howls[this.combatPool.currentIndex]
        if (howl) howl.stop()
    }

    public stopCurrentMusic(): void {
        this.stopCurrentHowl()
        this.currentMusic = null
    }

    public pauseMusic(): void {
        this.stopCurrentHowl()
    }

    public resumeMusic(): void {
        if (!this.currentMusic) return
        if (this.currentMusic === 'menu') this.tryPlay(this.getMenuHowl())
        else if (this.currentMusic === 'boss') this.tryPlay(this.getBossHowl())
        else if (this.currentMusic === 'combat') this.tryPlay(this.combatPool.howls[this.combatPool.currentIndex])
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

    public playBlockSound(): void {
        this.tryPlay(this.getSfx('block'))
    }

    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume))
        if (this.menuHowl) this.menuHowl.volume(this.musicVolume)
        if (this.bossHowl) this.bossHowl.volume(this.musicVolume)
        this.combatPool.howls.forEach(h => h.volume(this.musicVolume))
    }

    public setSFXVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume))
        const entries = Object.entries(this.soundEffects) as [SfxName, Howl][]
        for (const [name, sound] of entries) {
            sound.volume(this.sfxVolume * SFX_VOLUME_MULT[name])
        }
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
        this.menuHowl?.unload()
        this.bossHowl?.unload()
        this.combatPool.howls.forEach(h => h.unload())
        Object.values(this.soundEffects).forEach(sound => sound.unload())
    }
}
