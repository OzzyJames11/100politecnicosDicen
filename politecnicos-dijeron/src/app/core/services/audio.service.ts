import { Injectable, signal } from '@angular/core';
import { GAME_CONFIG, SoundId } from '../config/game.config';

const SOUND_IDS = Object.keys(GAME_CONFIG.sounds) as SoundId[];
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly cache = new Map<SoundId, HTMLAudioElement>();

  /** true cuando el usuario ya interactuó con la página (política de autoplay). */
  readonly unlocked = signal(false);

  constructor() {
    // Precarga: evita retraso en la primera reproducción.
    SOUND_IDS.forEach((id) => this.get(id));
  }

  play(id: SoundId): void {
    const audio = this.get(id);
    audio.currentTime = 0;
    audio.play().catch((err) => console.warn(`[Audio] No se pudo reproducir "${id}"`, err));
  }

  /** Invocar desde un gesto del usuario (click) para habilitar audio sin interacción posterior. */
  unlock(): void {
    const probes = SOUND_IDS.map(async (id) => {
      const audio = this.get(id);
      audio.muted = true;
      try {
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
      } finally {
        audio.muted = false;
      }
    });
    // El click ya otorga activación de usuario aunque falte algún archivo.
    Promise.allSettled(probes).then(() => this.unlocked.set(true));
  }

  private get(id: SoundId): HTMLAudioElement {
    let audio = this.cache.get(id);
    if (!audio) {
      const { src, volume } = GAME_CONFIG.sounds[id];
      audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = clamp01(volume * GAME_CONFIG.masterVolume);
      this.cache.set(id, audio);
    }
    return audio;
  }
}