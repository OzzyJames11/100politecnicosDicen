import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'board',
    loadComponent: () =>
      import('./features/board/board.component').then((m) => m.BoardComponent),
  },
  {
    path: 'presenter',
    loadComponent: () =>
      import('./features/presenter/presenter.component').then((m) => m.PresenterComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'presenter' },
  { path: '**', redirectTo: 'presenter' },
];