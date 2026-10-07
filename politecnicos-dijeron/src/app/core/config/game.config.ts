// Archivo de configuración del juego. Contiene constantes y tipos que definen la lógica del juego, como la duración de los turnos, el número máximo de strikes, etc.

import { TeamId } from '../models/game.models';

export type SoundId = 'reveal' | 'strike' | 'timeUp';

export interface SoundConfig {
  /** Ruta del archivo (relativa a `public/`). */
  src: string;
  /** Volumen individual, de 0 a 1. */
  volume: number;
}

export interface GameConfig {
  /** Duración del temporizador de cada ronda, en segundos. */
  timerSeconds: number;
  /** En los últimos N segundos el timer del board parpadea en rojo. */
  timerWarningSeconds: number;
  /** Cantidad de strikes que dispara el aviso de "máximo de strikes". */
  maxStrikes: number;
  /** Tiempo que permanece el overlay de la X gigante, en milisegundos. */
  strikeOverlayMs: number;
  /** Largo máximo del nombre de un equipo. */
  maxTeamNameLength: number;
  /** Nombres por defecto de los equipos (se usan si el campo queda vacío). */
  defaultTeamNames: Record<TeamId, string>;
  /** Filas mínimas del tablero; las sobrantes se muestran vacías. */
  minBoardSlots: number;
  /** Multiplicador global de volumen (0 = silencio total, 1 = normal). */
  masterVolume: number;
  sounds: Record<SoundId, SoundConfig>;
}

export const GAME_CONFIG: GameConfig = {
  timerSeconds: 30,
  timerWarningSeconds: 5,
  maxStrikes: 3,
  strikeOverlayMs: 2000,
  maxTeamNameLength: 16,
  defaultTeamNames: { A: 'EQUIPO A', B: 'EQUIPO B' },
  minBoardSlots: 6,
  masterVolume: 1,
  sounds: {
    reveal: { src: 'assets/sounds/reveal.mp3', volume: 1 },
    strike: { src: 'assets/sounds/strike.mp3', volume: 1 },
    timeUp: { src: 'assets/sounds/time-up.mp3', volume: 1 },
  },
};