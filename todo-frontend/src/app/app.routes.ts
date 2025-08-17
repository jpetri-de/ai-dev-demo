import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/all', pathMatch: 'full' },
  { path: 'all', loadChildren: () => import('./features/todos/todos.module').then(m => m.TodosModule) },
  { path: 'active', loadChildren: () => import('./features/todos/todos.module').then(m => m.TodosModule) },
  { path: 'completed', loadChildren: () => import('./features/todos/todos.module').then(m => m.TodosModule) },
  { path: '**', redirectTo: '/all' }
];