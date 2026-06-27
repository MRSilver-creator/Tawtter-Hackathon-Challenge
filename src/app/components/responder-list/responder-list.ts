import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ResponderService } from '../../services/responder.service';
import { GeolocationService } from '../../services/geolocation.service';
import { Responder, LatLng } from '../../models/types';

@Component({
  selector: 'app-responder-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="responder-list" *ngIf="responders.length > 0">
      <div class="list-header">
        <span class="list-title">Nearby Responders</span>
        <span class="list-count">{{ responders.length }} available</span>
      </div>
      <div class="list-scroll">
        <div class="responder-row" *ngFor="let r of responders">
          <div class="row-avatar">{{ r.name.charAt(0) }}</div>
          <div class="row-info">
            <span class="row-name">{{ r.name }}</span>
            <span class="row-skills">{{ r.skills.join(' · ') }}</span>
          </div>
          <div class="row-distance">
            <span class="dist-value">{{ r.distance !== undefined ? formatDistance(r.distance) : '--' }}</span>
          </div>
          <div class="row-status" [class.available]="r.isAvailable"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .responder-list {
      background: rgba(0,0,0,0.8); backdrop-filter: blur(12px);
      border-radius: 16px; padding: 12px; margin: 0 16px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .list-title { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.8); }
    .list-count { font-size: 0.7rem; color: rgba(255,255,255,0.4); }
    .list-scroll { display: flex; flex-direction: column; gap: 6px; max-height: 140px; overflow-y: auto; }
    .responder-row {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border-radius: 10px;
      background: rgba(255,255,255,0.05); transition: background 0.2s;
    }
    .responder-row:hover { background: rgba(255,255,255,0.1); }
    .row-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #2979ff, #1565c0);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem; color: white; flex-shrink: 0;
    }
    .row-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .row-name { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.9); }
    .row-skills { font-size: 0.65rem; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row-distance { text-align: right; }
    .dist-value { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.6); }
    .row-status {
      width: 8px; height: 8px; border-radius: 50%; background: #ff1744; flex-shrink: 0;
    }
    .row-status.available { background: #00c853; }
  `]
})
export class ResponderListComponent implements OnInit, OnDestroy {
  responders: Responder[] = [];
  private subs: Subscription[] = [];

  constructor(
    private responderService: ResponderService,
    private geolocation: GeolocationService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.responderService.responders$.subscribe((responders) => {
        const origin = this.geolocation.lastPosition || { lat: 25.2048, lng: 55.2708 };
        this.responders = responders
          .filter((r) => r.isAvailable)
          .map((r) => ({ ...r, distance: this.calculateDistance(origin, r.location) }))
          .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
          .slice(0, 5);
      })
    );
  }

  private calculateDistance(a: LatLng, b: LatLng): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const aVal = sinDLat * sinDLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinDLng * sinDLng;
    return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  }

  formatDistance(km: number): string {
    return km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`;
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
