import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorSubject = new Subject<string>();
  public error$ = this.errorSubject.asObservable();

  handleError(error: any): void {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error('Error occurred:', error);
    this.errorSubject.next(errorMessage);
  }

  clearError(): void {
    this.errorSubject.next('');
  }
}