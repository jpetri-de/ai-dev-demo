import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./features/todos/todos.module').then(m => m.TodosModule) },
  { path: '**', redirectTo: '/' }
];