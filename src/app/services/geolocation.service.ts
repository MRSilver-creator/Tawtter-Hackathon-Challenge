import { Injectable, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, Subscriber } from 'rxjs';
import { LatLng } from '../models/types';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private positionSubject = new BehaviorSubject<LatLng | null>(null);
  private watchId: number | null = null;
  private subscriber: Subscriber<LatLng> | null = null;

  position$ = this.positionSubject.asObservable();
  lastPosition: LatLng | null = null;

  constructor(private ngZone: NgZone) {
    const saved = localStorage.getItem('lastPosition');
    if (saved) {
      try {
        this.lastPosition = JSON.parse(saved);
        this.positionSubject.next(this.lastPosition);
      } catch { /* ignore */ }
    }
  }

  startWatching(): void {
    if (!navigator.geolocation || this.watchId !== null) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.ngZone.run(() => {
          const ll: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.lastPosition = ll;
          this.positionSubject.next(ll);
          localStorage.setItem('lastPosition', JSON.stringify(ll));
        });
      },
      () => {
        const cached = localStorage.getItem('lastPosition');
        if (cached && !this.lastPosition) {
          try {
            this.lastPosition = JSON.parse(cached);
            this.positionSubject.next(this.lastPosition);
          } catch { /* ignore */ }
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getCurrentPosition(): Observable<LatLng> {
    return new Observable((sub) => {
      if (this.lastPosition) {
        sub.next(this.lastPosition);
      }
      this.subscriber = sub;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const ll: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            this.lastPosition = ll;
            this.positionSubject.next(ll);
            localStorage.setItem('lastPosition', JSON.stringify(ll));
            sub.next(ll);
            sub.complete();
          },
          () => {
            if (this.lastPosition) {
              sub.next(this.lastPosition);
            }
            sub.complete();
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        if (this.lastPosition) {
          sub.next(this.lastPosition);
        }
        sub.complete();
      }
    });
  }
}
