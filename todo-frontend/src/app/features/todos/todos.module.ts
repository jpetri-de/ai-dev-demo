import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { TodoAppComponent } from './components/todo-app/todo-app.component';
import { TodoListComponent } from './components/todo-list/todo-list.component';
import { TodoItemComponent } from './components/todo-item/todo-item.component';
import { TodoFilterComponent } from './components/todo-filter/todo-filter.component';

@NgModule({
  declarations: [
    TodoAppComponent,
    TodoListComponent,
    TodoItemComponent,
    TodoFilterComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    TodoAppComponent
  ]
})
export class TodosModule { }