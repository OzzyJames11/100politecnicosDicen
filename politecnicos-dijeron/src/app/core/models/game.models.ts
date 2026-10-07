export interface Respuesta { texto: string; puntos: number; }
export interface Pregunta { id: number; pregunta: string; respuestas: Respuesta[]; }
export interface Corpus { preguntas: Pregunta[]; }

export type TeamId = 'A' | 'B';
export type Role = 'host' | 'viewer';

/** Estado serializable del juego: única fuente de verdad (la mantiene el presentador). */
export interface GameState {
  questionIndex: number;
  /** Índices de las respuestas reveladas. */
  revealed: number[];
  scores: Record<TeamId, number>;
  /** Nombres editables de los equipos (puede quedar vacío: se usa el nombre por defecto). */
  teamNames: Record<TeamId, string>;
  /** Puntos acumulados de la ronda, aún sin asignar a un equipo. */
  roundPoints: number;
  strikes: number;
  timerSeconds: number;
  timerRunning: boolean;
}

/** Eventos efímeros (no son estado): disparan sonido/overlay en el board. */
export type GameEvent =
  | { kind: 'reveal'; index: number }
  | { kind: 'strike'; count: number }
  | { kind: 'timeUp' };

/** Protocolo de mensajes entre vistas (mismo contrato servirá para WebSockets). */
export type SyncMessage =
  | { type: 'STATE'; state: GameState }
  | { type: 'REQUEST_STATE' }
  | { type: 'EVENT'; event: GameEvent };