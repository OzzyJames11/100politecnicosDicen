import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GAME_CONFIG } from '../../core/config/game.config';
import { TEAMS } from '../../core/data/teams.config';
import { GameEvent } from '../../core/models/game.models';
import { AudioService } from '../../core/services/audio.service';
import { GameService } from '../../core/services/game.service';

interface Point {
  x: number;
  y: number;
}

// ── Geometría del arco (sistema de coordenadas 1600×900 = escenario 16:9) ──
const VIEW_W = 1600;
const VIEW_H = 900;
const ARCH = { cx: 800, cy: 470, rx: 500, ry: 380 } as const;
const BULB_COUNT = 28;
/** Altura (y) donde terminan los focos en las patas del arco. */
const BULB_BOTTOM = 850;
/** Separación entre la línea dorada y la línea azul interior. */
const INNER_INSET = 22;

/** Path del arco: pata izquierda → semielipse → pata derecha. `inset` lo estrecha hacia el centro. */
const archPath = (inset = 0): string => {
  const rx = ARCH.rx - inset;
  const ry = ARCH.ry - inset;
  return `M${ARCH.cx - rx} ${VIEW_H} V${ARCH.cy} A${rx} ${ry} 0 0 1 ${ARCH.cx + rx} ${ARCH.cy} V${VIEW_H}`;
};

/** Reparte los focos con separación uniforme a lo largo de toda la curva del arco. */
const buildBulbs = (): Point[] => {
  const { cx, cy, rx, ry } = ARCH;
  const legSteps = 40;
  const arcSteps = 240;
  const path: Point[] = [];

  for (let i = 0; i <= legSteps; i++) {
    path.push({ x: cx - rx, y: BULB_BOTTOM + ((cy - BULB_BOTTOM) * i) / legSteps });
  }
  for (let i = 1; i <= arcSteps; i++) {
    const angle = Math.PI + (Math.PI * i) / arcSteps;
    path.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
  }
  for (let i = 1; i <= legSteps; i++) {
    path.push({ x: cx + rx, y: cy + ((BULB_BOTTOM - cy) * i) / legSteps });
  }

  const cumulative = [0];
  for (let i = 1; i < path.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
  }
  const total = cumulative[cumulative.length - 1];

  const bulbs: Point[] = [];
  let seg = 1;
  for (let k = 0; k < BULB_COUNT; k++) {
    const target = (total * k) / (BULB_COUNT - 1);
    while (seg < path.length - 1 && cumulative[seg] < target) seg++;
    const t = (target - cumulative[seg - 1]) / (cumulative[seg] - cumulative[seg - 1]);
    bulbs.push({
      x: path[seg - 1].x + (path[seg].x - path[seg - 1].x) * t,
      y: path[seg - 1].y + (path[seg].y - path[seg - 1].y) * t,
    });
  }
  return bulbs;
};

/** Vista pública (proyector). Solo lectura: refleja lo que decide el presentador. */
@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  protected readonly game = inject(GameService);
  protected readonly audio = inject(AudioService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly teams = TEAMS;
  protected readonly maxStrikes = GAME_CONFIG.maxStrikes;
  protected readonly strikeSlots = Array.from({ length: GAME_CONFIG.maxStrikes }, (_, i) => i);

  // Arco
  protected readonly archViewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  protected readonly archOuter = archPath();
  protected readonly archInner = archPath(INNER_INSET);
  protected readonly bulbs = buildBulbs();

  /** Filas del tablero: cada respuesta o `null` para una fila vacía. */
  protected readonly slots = computed(() => {
    const answers = this.game.answers();
    return Array.from(
      { length: Math.max(GAME_CONFIG.minBoardSlots, answers.length) },
      (_, i) => answers[i] ?? null,
    );
  });

  /** Cantidad de X mostradas en el overlay; null = overlay oculto. */
  protected readonly strikeOverlay = signal<number | null>(null);
  protected readonly overlayXs = computed(() =>
    Array.from({ length: this.strikeOverlay() ?? 0 }, (_, i) => i),
  );

  protected readonly timerCritical = computed(
    () =>
      this.game.state().timerRunning &&
      this.game.state().timerSeconds <= GAME_CONFIG.timerWarningSeconds,
  );

  private overlayTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.game.events$
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.onGameEvent(event));
    this.game.connect('viewer', this.destroyRef);
    this.destroyRef.onDestroy(() => clearTimeout(this.overlayTimeout));
  }

  private onGameEvent(event: GameEvent): void {
    switch (event.kind) {
      case 'reveal':
        this.audio.play('reveal');
        break;
      case 'strike':
        this.audio.play('strike');
        this.showStrikeOverlay(event.count);
        break;
      case 'timeUp':
        this.audio.play('timeUp');
        break;
    }
  }

  private showStrikeOverlay(count: number): void {
    clearTimeout(this.overlayTimeout);
    this.strikeOverlay.set(count);
    this.overlayTimeout = setTimeout(
      () => this.strikeOverlay.set(null),
      GAME_CONFIG.strikeOverlayMs,
    );
  }
}