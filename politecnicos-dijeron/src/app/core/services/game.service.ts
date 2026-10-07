import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { GAME_CONFIG } from '../config/game.config';
import { CORPUS_MOCK } from '../data/corpus.mock';
import { GameEvent, GameState, Role, SyncMessage, TeamId } from '../models/game.models';
import { SyncService } from './sync.service';

const createInitialState = (): GameState => ({
  questionIndex: 0,
  revealed: [],
  scores: { A: 0, B: 0 },
  teamNames: { ...GAME_CONFIG.defaultTeamNames },
  roundPoints: 0,
  strikes: 0,
  timerSeconds: GAME_CONFIG.timerSeconds,
  timerRunning: false,
});

/**
 * Estado del juego con Signals.
 * - `host` (presenter): ejecuta acciones, es la fuente de verdad y publica el estado.
 * - `viewer` (board): solo recibe estado/eventos; las acciones son no-ops.
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly sync = inject(SyncService);
  private readonly questions = CORPUS_MOCK.preguntas;

  private readonly _state = signal<GameState>(createInitialState());
  private readonly eventsSubject = new Subject<GameEvent>();

  private role: Role | null = null;
  private unlisten?: () => void;
  private timerId?: ReturnType<typeof setInterval>;

  // ── Lectura ───────────────────────────────────────────────
  readonly state = this._state.asReadonly();
  /** Eventos efímeros (reveal/strike/timeUp) recibidos del presentador. */
  readonly events$ = this.eventsSubject.asObservable();

  readonly totalQuestions = this.questions.length;
  readonly question = computed(() => this.questions[this._state().questionIndex]);
  readonly answers = computed(() => this.question().respuestas);
  readonly questionNumber = computed(() => this._state().questionIndex + 1);
  readonly isLastQuestion = computed(() => this._state().questionIndex >= this.questions.length - 1);
  readonly strikesMaxed = computed(() => this._state().strikes >= GAME_CONFIG.maxStrikes);
  private readonly revealedSet = computed(() => new Set(this._state().revealed));
  readonly timerLabel = computed(() => {
    const s = this._state().timerSeconds;
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });

  isRevealed(index: number): boolean {
    return this.revealedSet().has(index);
  }

  /** Nombre a mostrar del equipo; si el campo está vacío se usa el nombre por defecto. */
  teamName(team: TeamId): string {
    return this._state().teamNames[team].trim() || GAME_CONFIG.defaultTeamNames[team];
  }

  // ── Conexión ──────────────────────────────────────────────
  connect(role: Role, destroyRef: DestroyRef): void {
    this.disconnect();
    this.role = role;
    this.unlisten = this.sync.listen((msg) => this.handleMessage(msg));
    destroyRef.onDestroy(() => this.disconnect());

    if (role === 'host') {
      this.publish();
    } else {
      this.sync.send({ type: 'REQUEST_STATE' });
    }
  }

  disconnect(): void {
    this.unlisten?.();
    this.unlisten = undefined;
    this.stopTimerLoop();
    if (this._state().timerRunning) {
      this._state.update((s) => ({ ...s, timerRunning: false }));
    }
    this.role = null;
  }

  // ── Acciones del presentador ──────────────────────────────
  reveal(index: number): void {
    if (!this.isHost || index < 0 || index >= this.answers().length || this.isRevealed(index)) return;
    const puntos = this.answers()[index].puntos;
    this.commit((s) => ({
      ...s,
      revealed: [...s.revealed, index],
      roundPoints: s.roundPoints + puntos,
    }));
    this.emit({ kind: 'reveal', index });
  }

  /** Suma los puntos acumulados de la ronda al equipo y los reinicia a 0. */
  assignPoints(team: TeamId): void {
    if (!this.isHost || this._state().roundPoints === 0) return;
    this.commit((s) => ({
      ...s,
      scores: { ...s.scores, [team]: s.scores[team] + s.roundPoints },
      roundPoints: 0,
    }));
  }

  /** Cambia el nombre del equipo (se refleja en el board en tiempo real). */
  renameTeam(team: TeamId, name: string): void {
    if (!this.isHost) return;
    const value = name.slice(0, GAME_CONFIG.maxTeamNameLength);
    this.commit((s) => ({ ...s, teamNames: { ...s.teamNames, [team]: value } }));
  }

  strike(): void {
    if (!this.isHost || this.strikesMaxed()) return;
    this.commit((s) => ({ ...s, strikes: s.strikes + 1 }));
    this.emit({ kind: 'strike', count: this._state().strikes });
  }

  /** Limpia respuestas, puntos de ronda, strikes y temporizador. Conserva puntajes y nombres. */
  clearBoard(): void {
    if (!this.isHost) return;
    this.stopTimerLoop();
    this.commit((s) => this.resetRound(s));
  }

  nextQuestion(): void {
    if (!this.isHost || this.isLastQuestion()) return;
    this.stopTimerLoop();
    this.commit((s) => ({ ...this.resetRound(s), questionIndex: s.questionIndex + 1 }));
  }

  startTimer(): void {
    const { timerRunning, timerSeconds } = this._state();
    if (!this.isHost || timerRunning || timerSeconds <= 0) return;
    this.commit((s) => ({ ...s, timerRunning: true }));
    this.timerId = setInterval(() => this.tick(), 1000);
  }

  pauseTimer(): void {
    if (!this.isHost) return;
    this.stopTimerLoop();
    this.commit((s) => ({ ...s, timerRunning: false }));
  }

  resetTimer(): void {
    if (!this.isHost) return;
    this.stopTimerLoop();
    this.commit((s) => ({ ...s, timerSeconds: GAME_CONFIG.timerSeconds, timerRunning: false }));
  }

  // ── Internos ──────────────────────────────────────────────
  private get isHost(): boolean {
    return this.role === 'host';
  }

  private resetRound(s: GameState): GameState {
    return {
      ...s,
      revealed: [],
      roundPoints: 0,
      strikes: 0,
      timerSeconds: GAME_CONFIG.timerSeconds,
      timerRunning: false,
    };
  }

  private tick(): void {
    const seconds = Math.max(0, this._state().timerSeconds - 1);
    const finished = seconds === 0;
    if (finished) this.stopTimerLoop();
    this.commit((s) => ({ ...s, timerSeconds: seconds, timerRunning: !finished }));
    if (finished) this.emit({ kind: 'timeUp' });
  }

  private stopTimerLoop(): void {
    if (this.timerId !== undefined) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  /** Aplica un cambio de estado y lo publica a las demás vistas. */
  private commit(update: (s: GameState) => GameState): void {
    this._state.update(update);
    this.publish();
  }

  private publish(): void {
    this.sync.send({ type: 'STATE', state: this._state() });
  }

  private emit(event: GameEvent): void {
    this.sync.send({ type: 'EVENT', event });
  }

  private handleMessage(msg: SyncMessage): void {
    switch (msg.type) {
      case 'REQUEST_STATE':
        if (this.isHost) this.publish();
        break;
      case 'STATE':
        if (this.role === 'viewer') this._state.set(msg.state);
        break;
      case 'EVENT':
        if (this.role === 'viewer') this.eventsSubject.next(msg.event);
        break;
    }
  }
}