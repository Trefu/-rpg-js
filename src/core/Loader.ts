import { Warrior } from './classes/Warrior'
import { Rogue } from './classes/Rogue'
import { Wizard } from './classes/Wizard'
import type { IClass } from './interfaces/IClass'

export class Loader {
  private static instance: Loader
  private loaded: boolean = false
  private loadingProgress: number = 0
  private readonly classes: Map<string, IClass> = new Map()

  private constructor() {
    // Inicializar las clases disponibles
    this.classes.set('warrior', new Warrior())
    this.classes.set('rogue', new Rogue())
    this.classes.set('wizard', new Wizard())
  }

  public static getInstance(): Loader {
    if (!Loader.instance) {
      Loader.instance = new Loader()
    }
    return Loader.instance
  }

  public async load(): Promise<void> {
    if (this.loaded) return

    try {
      // Simular carga de recursos
      await this.loadClasses()
      await this.loadAssets()
      await this.loadConfigurations()

      this.loaded = true
      this.loadingProgress = 100
    } catch (error) {
      console.error('Error loading game resources:', error)
      throw error
    }
  }

  private async loadClasses(): Promise<void> {
    // En el futuro, aquí se cargarían las clases dinámicamente
    this.loadingProgress = 30
  }

  private async loadAssets(): Promise<void> {
    // En el futuro, aquí se cargarían imágenes, sonidos, etc.
    this.loadingProgress = 60
  }

  private async loadConfigurations(): Promise<void> {
    // En el futuro, aquí se cargarían configuraciones del juego
    this.loadingProgress = 90
  }

  public getLoadingProgress(): number {
    return this.loadingProgress
  }

  public isLoaded(): boolean {
    return this.loaded
  }

  public getClass(name: string): IClass | undefined {
    return this.classes.get(name.toLowerCase())
  }

  public getAvailableClasses(): IClass[] {
    return Array.from(this.classes.values())
  }
} 