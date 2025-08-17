import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { TodosRoutingModule } from './todos-routing.module';
import { TodoAppComponent } from './components/todo-app/todo-app.component';
import { TodoListComponent } from './components/todo-list/todo-list.component';
import { TodoItemComponent } from './components/todo-item/todo-item.component';
import { TodoFilterComponent } from './components/todo-filter/todo-filter.component';
import { TodoCounterComponent } from './components/todo-counter/todo-counter.component';
import { ClearCompletedComponent } from './components/clear-completed/clear-completed.component';
import { ToggleAllComponent } from './components/toggle-all/toggle-all.component';

@NgModule({
  declarations: [
    TodoAppComponent,
    TodoListComponent,
    TodoItemComponent,
    TodoFilterComponent,
    TodoCounterComponent,
    ClearCompletedComponent,
    ToggleAllComponent
  ],
  imports: [
    SharedModule,
    TodosRoutingModule
  ],
  exports: [
    TodoAppComponent
  ]
})
export class TodosModule { }