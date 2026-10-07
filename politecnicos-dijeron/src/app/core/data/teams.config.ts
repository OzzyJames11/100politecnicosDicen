import { GAME_CONFIG } from '../config/game.config';
import { TeamId } from '../models/game.models';

export interface TeamInfo {
  id: TeamId;
  /** Nombre por defecto (viene de GAME_CONFIG). */
  defaultName: string;
  /** Clases Tailwind del botón de asignación de puntos (presentador). */
  buttonClass: string;
}

export const TEAMS: readonly [TeamInfo, TeamInfo] = [
  { id: 'A', defaultName: GAME_CONFIG.defaultTeamNames.A, buttonClass: 'bg-sky-600 hover:bg-sky-500' },
  { id: 'B', defaultName: GAME_CONFIG.defaultTeamNames.B, buttonClass: 'bg-rose-600 hover:bg-rose-500' },
];