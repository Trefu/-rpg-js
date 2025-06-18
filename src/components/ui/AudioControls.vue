<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AudioManager } from '@/core/AudioManager'

const audioManager = AudioManager.getInstance()
const isMuted = ref(false)
const musicVolume = ref(0.3)
const sfxVolume = ref(0.5)
const showControls = ref(false)

onMounted(() => {
  isMuted.value = audioManager.isAudioMuted()
  musicVolume.value = audioManager.getMusicVolume()
  sfxVolume.value = audioManager.getSFXVolume()
})

const toggleMute = () => {
  audioManager.toggleMute()
  isMuted.value = audioManager.isAudioMuted()
}

const toggleControls = () => {
  showControls.value = !showControls.value
}

const updateMusicVolume = (event: Event) => {
  const target = event.target as HTMLInputElement
  const volume = parseFloat(target.value)
  audioManager.setMusicVolume(volume)
  musicVolume.value = volume
}

const updateSFXVolume = (event: Event) => {
  const target = event.target as HTMLInputElement
  const volume = parseFloat(target.value)
  audioManager.setSFXVolume(volume)
  sfxVolume.value = volume
}
</script>

<template>
  <div class="audio-controls">
    <button class="audio-btn" @click="toggleControls" :class="{ muted: isMuted }">
      {{ isMuted ? '🔇' : '🔊' }}
    </button>
    
    <div class="volume-panel" v-if="showControls">
      <div class="volume-header">
        <span>Audio</span>
        <button class="close-btn" @click="showControls = false">×</button>
      </div>
      
      <div class="volume-controls">
        <div class="volume-group">
          <label>🎵 Música</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            :value="musicVolume"
            @input="updateMusicVolume"
            class="volume-slider"
          />
          <span class="volume-value">{{ Math.round(musicVolume * 100) }}%</span>
        </div>
        
        <div class="volume-group">
          <label>🔊 Efectos</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            :value="sfxVolume"
            @input="updateSFXVolume"
            class="volume-slider"
          />
          <span class="volume-value">{{ Math.round(sfxVolume * 100) }}%</span>
        </div>
        
        <button class="mute-btn" @click="toggleMute" :class="{ muted: isMuted }">
          {{ isMuted ? '🔇 Silenciado' : '🔊 Activar Sonido' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-controls {
  position: relative;
  display: inline-block;
}

.audio-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  color: white;
}

.audio-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.audio-btn.muted {
  opacity: 0.5;
}

.volume-panel {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: rgba(0, 0, 0, 0.95);
  border: 2px solid #4CAF50;
  border-radius: 8px;
  padding: 1rem;
  min-width: 250px;
  z-index: 1001;
  margin-top: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.volume-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #4CAF50;
}

.volume-header span {
  color: white;
  font-weight: bold;
  font-size: 1rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.volume-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.volume-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.volume-group label {
  color: white;
  font-size: 0.9rem;
  min-width: 60px;
}

.volume-slider {
  flex: 1;
  height: 4px;
  background: #333;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.volume-value {
  color: white;
  font-size: 0.8rem;
  min-width: 30px;
  text-align: right;
}

.mute-btn {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.mute-btn:hover {
  background-color: #45a049;
}

.mute-btn.muted {
  background-color: #f44336;
}

.mute-btn.muted:hover {
  background-color: #da190b;
}
</style> 