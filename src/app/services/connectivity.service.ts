import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  online$ = this.onlineSubject.asObservable();
  isOnline = navigator.onLine;

  private pendingQueue: (() => void)[] = [];

  constructor(private ngZone: NgZone) {
    window.addEventListener('online', () => {
      this.ngZone.run(() => {
        this.isOnline = true;
        this.onlineSubject.next(true);
        this.flushQueue();
      });
    });
    window.addEventListener('offline', () => {
      this.ngZone.run(() => {
        this.isOnline = false;
        this.onlineSubject.next(false);
      });
    });
  }

  addToQueue(fn: () => void): void {
    this.pendingQueue.push(fn);
    if (this.isOnline) {
      this.flushQueue();
    }
  }

  private flushQueue(): void {
    while (this.pendingQueue.length > 0) {
      const fn = this.pendingQueue.shift();
      fn?.();
    }
  }
}
