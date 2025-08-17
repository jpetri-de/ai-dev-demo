import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TodoAppComponent } from './components/todo-app/todo-app.component';

const routes: Routes = [
  { path: '', component: TodoAppComponent },
  { path: 'active', component: TodoAppComponent },
  { path: 'completed', component: TodoAppComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TodosRoutingModule { }