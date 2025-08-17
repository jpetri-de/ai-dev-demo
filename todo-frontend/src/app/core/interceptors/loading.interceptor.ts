import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingCount = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.incrementLoading();

    return next.handle(req).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Request completed successfully
        }
      }),
      finalize(() => {
        this.decrementLoading();
      })
    );
  }

  private incrementLoading(): void {
    this.loadingCount++;
    this.loadingSubject.next(this.loadingCount > 0);
  }

  private decrementLoading(): void {
    this.loadingCount--;
    this.loadingSubject.next(this.loadingCount > 0);
  }
}