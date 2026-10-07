import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GAME_CONFIG } from '../../core/config/game.config';
import { TEAMS } from '../../core/data/teams.config';
import { TeamId } from '../../core/models/game.models';
import { GameService } from '../../core/services/game.service';

/** Vista del presentador: ve las respuestas y controla el juego. */
@Component({
  selector: 'app-presenter',
  imports: [RouterLink],
  templateUrl: './presenter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresenterComponent {
  protected readonly game = inject(GameService);
  protected readonly teams = TEAMS;
  protected readonly maxStrikes = GAME_CONFIG.maxStrikes;
  protected readonly maxNameLength = GAME_CONFIG.maxTeamNameLength;

  constructor() {
    this.game.connect('host', inject(DestroyRef));
  }

  protected onRename(team: TeamId, event: Event): void {
    this.game.renameTeam(team, (event.target as HTMLInputElement).value);
  }
}