import { Injectable, ElementRef } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface UIState {
  showMain: boolean;
  showFooter: boolean;
  inputFocused: boolean;
  isLoading: boolean;
  currentFilter: 'all' | 'active' | 'completed';
}

@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  private uiStateSubject = new BehaviorSubject<UIState>({
    showMain: false,
    showFooter: false,
    inputFocused: false,
    isLoading: false,
    currentFilter: 'all'
  });

  public uiState$ = this.uiStateSubject.asObservable();

  // Individual state observables for optimized component subscriptions
  public showMain$ = this.uiState$.pipe(
    map(state => state.showMain),
    distinctUntilChanged()
  );

  public showFooter$ = this.uiState$.pipe(
    map(state => state.showFooter),
    distinctUntilChanged()
  );

  public inputFocused$ = this.uiState$.pipe(
    map(state => state.inputFocused),
    distinctUntilChanged()
  );

  public isLoading$ = this.uiState$.pipe(
    map(state => state.isLoading),
    distinctUntilChanged()
  );

  public currentFilter$ = this.uiState$.pipe(
    map(state => state.currentFilter),
    distinctUntilChanged()
  );

  constructor() {
    // Initialize with default state
    this.updateState({ showMain: false, showFooter: false });
  }

  // Update visibility based on todos count
  updateVisibility(hasTodos: boolean): void {
    this.updateState({ 
      showMain: hasTodos, 
      showFooter: hasTodos 
    });
  }

  // Update loading state
  setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  // Update input focus state
  setInputFocused(focused: boolean): void {
    this.updateState({ inputFocused: focused });
  }

  // Update current filter
  setCurrentFilter(filter: 'all' | 'active' | 'completed'): void {
    this.updateState({ currentFilter: filter });
  }

  // Auto-focus management for TodoMVC specification compliance
  focusNewTodoInput(inputElement?: ElementRef<HTMLInputElement>): void {
    if (inputElement?.nativeElement) {
      setTimeout(() => {
        try {
          inputElement.nativeElement.focus();
          inputElement.nativeElement.select();
          this.setInputFocused(true);
        } catch (error) {
          console.warn('Failed to focus input:', error);
        }
      }, 0);
    }
  }

  // Focus management for edit inputs
  focusEditInput(inputElement?: ElementRef<HTMLInputElement>): void {
    if (inputElement?.nativeElement) {
      setTimeout(() => {
        try {
          inputElement.nativeElement.focus();
          inputElement.nativeElement.select();
        } catch (error) {
          console.warn('Failed to focus edit input:', error);
        }
      }, 0);
    }
  }

  // Handle keyboard navigation per TodoMVC specification
  setupKeyboardNavigation(inputElement: ElementRef<HTMLInputElement>): void {
    if (!inputElement?.nativeElement) {
      return;
    }

    // Listen for focus/blur events
    fromEvent(inputElement.nativeElement, 'focus').subscribe(() => {
      this.setInputFocused(true);
    });

    fromEvent(inputElement.nativeElement, 'blur').subscribe(() => {
      this.setInputFocused(false);
    });

    // Auto-focus on page load per specification
    this.focusNewTodoInput(inputElement);
  }

  // Get current state snapshot
  getCurrentState(): UIState {
    return this.uiStateSubject.value;
  }

  // Get specific state value
  getStateValue<K extends keyof UIState>(key: K): UIState[K] {
    return this.uiStateSubject.value[key];
  }

  // Utility method to check if main/footer should be visible
  shouldShowMainAndFooter(todosCount: number): boolean {
    return todosCount > 0;
  }

  // Reset UI state (useful for testing or app reset)
  resetState(): void {
    this.uiStateSubject.next({
      showMain: false,
      showFooter: false,
      inputFocused: false,
      isLoading: false,
      currentFilter: 'all'
    });
  }

  // Private helper to update state immutably
  private updateState(partialState: Partial<UIState>): void {
    const currentState = this.uiStateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.uiStateSubject.next(newState);
  }
}