import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ResponderMapComponent } from '../responder-map/responder-map';
import { Emergency, Responder, LatLng, Severity, ResponderType } from '../../models/types';
import { EmergencyService } from '../../services/emergency.service';
import { ResponderService } from '../../services/responder.service';
import { GeolocationService } from '../../services/geolocation.service';

@Component({
  selector: 'app-responder-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ResponderMapComponent],
  template: `
    <div class="responder-view">
      <div class="map-layer">
        <app-responder-map [activeEmergencies]="activeEmergencies"></app-responder-map>
      </div>

      <div class="top-bar">
        <a class="home-link" routerLink="/">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </a>
        <div class="brand">
          <span class="brand-icon">🌾</span>
          <span class="brand-text">RuralResQ Responder</span>
        </div>
        <a class="dash-btn" routerLink="/dashboard" title="Dashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </a>
      </div>

      <div class="responder-stats-bar">
        <div class="rstat">
          <span class="rstat-val">{{ personalStats.responded }}</span>
          <span class="rstat-label">Responded</span>
        </div>
        <div class="rstat">
          <span class="rstat-val">{{ personalStats.avgTime }}s</span>
          <span class="rstat-label">Avg Time</span>
        </div>
        <div class="rstat">
          <span class="rstat-val">{{ personalStats.onDutyMin }}m</span>
          <span class="rstat-label">On Duty</span>
        </div>
        <button class="status-toggle" [class.available]="isAvailable" (click)="toggleAvailability()">
          <span class="status-dot-indicator" [class.on]="isAvailable"></span>
          {{ isAvailable ? 'Available' : 'Busy' }}
        </button>
      </div>

      <div class="bottom-panel">
        <div class="panel-header">
          <span class="panel-title">AI-Prioritized Emergencies</span>
          <span class="panel-count">{{ activeEmergencies.length }} nearby</span>
        </div>
        <div class="emergencies-list" *ngIf="activeEmergencies.length > 0; else noEmergencies">
          <div class="emergency-card" *ngFor="let em of activeEmergencies" [class]="'type-' + em.type + ' sev-' + em.severity">
            <div class="em-top">
              <div class="em-header">
                <span class="em-type">{{ typeIcon(em.type) }} {{ em.type | titlecase }}</span>
                <span class="em-sev" [class]="'sev-' + em.severity">{{ em.severity | uppercase }}</span>
              </div>
              <span class="em-distance">{{ formatDistance(em) }}</span>
            </div>
            <span class="em-addr">{{ em.address | slice:0:50 }}{{ em.address.length > 50 ? '…' : '' }}</span>
            <span class="em-desc">{{ em.description | slice:0:60 }}{{ em.description.length > 60 ? '…' : '' }}</span>
            <div class="em-footer">
              <span class="em-time">{{ getTimeAgo(em.timestamp) }}</span>
              <div class="em-actions">
                <span class="em-eta" *ngIf="em.etaMinutes">ETA ≈ {{ em.etaMinutes }}min</span>
                <button class="btn-accept" (click)="acceptEmergency(em)" [disabled]="!isAvailable">Accept →</button>
              </div>
            </div>
          </div>
        </div>
        <ng-template #noEmergencies>
          <div class="empty-emergencies">
            <p>No active emergencies in your area.</p>
            <p class="empty-sub">You'll be notified when someone needs help.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .responder-view { position: relative; width: 100%; height: 100dvh; overflow: hidden; background: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .map-layer { position: absolute; inset: 0; z-index: 0; }
    .top-bar {
      position: absolute; top: 0; left: 0; right: 0; z-index: 10;
      display: flex; align-items: center; gap: 10px;
      padding: 16px 20px; padding-top: max(16px, env(safe-area-inset-top));
      pointer-events: none;
    }
    .top-bar > * { pointer-events: auto; }
    .home-link { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); text-decoration: none; transition: all 0.2s; }
    .home-link:hover { color: white; background: rgba(255,255,255,0.1); }
    .brand { display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); padding: 6px 14px 6px 10px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); flex: 1; }
    .brand-icon { font-size: 1.1rem; }
    .brand-text { font-size: 0.8rem; font-weight: 700; color: white; letter-spacing: -0.01em; }
    .dash-btn { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); text-decoration: none; transition: all 0.2s; }
    .dash-btn:hover { color: white; background: rgba(255,255,255,0.1); }
    .responder-stats-bar {
      position: absolute; top: 60px; left: 16px; right: 16px; z-index: 10;
      display: flex; align-items: center; gap: 6px;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(12px);
      border-radius: 14px; padding: 10px 14px;
      border: 1px solid rgba(255,255,255,0.08);
      pointer-events: none;
    }
    .responder-stats-bar > * { pointer-events: auto; }
    .rstat { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .rstat-val { font-size: 1rem; font-weight: 800; color: white; }
    .rstat-label { font-size: 0.6rem; color: rgba(255,255,255,0.4); margin-top: 1px; }
    .status-toggle { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; border: none; font-size: 0.7rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.25s; background: rgba(255,23,68,0.2); color: #ff1744; }
    .status-toggle.available { background: rgba(0,200,83,0.15); color: #00c853; }
    .status-dot-indicator { width: 7px; height: 7px; border-radius: 50%; background: #ff1744; transition: background 0.25s; }
    .status-dot-indicator.on { background: #00c853; box-shadow: 0 0 6px rgba(0,200,83,0.6); }
    .bottom-panel {
      position: absolute; bottom: 20px; left: 16px; right: 16px; z-index: 10;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(12px);
      border-radius: 16px; padding: 14px;
      border: 1px solid rgba(255,255,255,0.06);
      max-height: 280px; overflow-y: auto;
      pointer-events: none;
    }
    .bottom-panel > * { pointer-events: auto; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .panel-title { font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.8); }
    .panel-count { font-size: 0.7rem; color: rgba(255,255,255,0.4); }
    .emergencies-list { display: flex; flex-direction: column; gap: 8px; }
    .emergency-card {
      background: rgba(255,255,255,0.04); border-radius: 12px;
      padding: 10px 12px; border: 1px solid rgba(255,255,255,0.06);
      border-left: 3px solid rgba(255,255,255,0.15);
    }
    .emergency-card.sev-critical { border-left-color: #ff1744; }
    .emergency-card.sev-medium { border-left-color: #ffab00; }
    .emergency-card.sev-low { border-left-color: #448aff; }
    .em-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .em-header { display: flex; align-items: center; gap: 6px; }
    .em-type { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.85); }
    .em-sev { font-size: 0.55rem; padding: 1px 6px; border-radius: 8px; font-weight: 800; letter-spacing: 0.05em; }
    .em-sev.sev-critical { background: rgba(255,23,68,0.2); color: #ff1744; }
    .em-sev.sev-medium { background: rgba(255,171,0,0.15); color: #ffab00; }
    .em-sev.sev-low { background: rgba(68,138,255,0.12); color: #448aff; }
    .em-distance { font-size: 0.7rem; color: #ffab00; font-weight: 600; }
    .em-addr { font-size: 0.7rem; color: rgba(255,255,255,0.4); display: block; margin: 2px 0 1px; }
    .em-desc { font-size: 0.65rem; color: rgba(255,255,255,0.3); display: block; margin-bottom: 4px; }
    .em-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
    .em-time { font-size: 0.65rem; color: rgba(255,255,255,0.3); }
    .em-actions { display: flex; align-items: center; gap: 8px; }
    .em-eta { font-size: 0.65rem; color: #ffab00; font-weight: 600; }
    .btn-accept { padding: 4px 14px; border-radius: 16px; border: none; background: linear-gradient(135deg, #00c853, #009624); color: white; font-size: 0.7rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity 0.2s; }
    .btn-accept:hover:not(:disabled) { opacity: 0.85; }
    .btn-accept:disabled { opacity: 0.3; cursor: default; }
    .empty-emergencies { text-align: center; padding: 20px 0; }
    .empty-emergencies p { font-size: 0.8rem; color: rgba(255,255,255,0.35); }
    .empty-sub { font-size: 0.7rem !important; margin-top: 4px; color: rgba(255,255,255,0.2) !important; }
  `]
})
export class ResponderPageComponent implements OnInit, OnDestroy {
  activeEmergencies: Emergency[] = [];
  isAvailable = true;
  personalStats = { responded: 0, avgTime: 0, onDutyMin: 0 };
  private responders: Responder[] = [];
  private subs: Subscription[] = [];
  private dutyTimer: ReturnType<typeof setInterval> | null = null;
  private dutyStart = Date.now();
  private acceptedIds = new Set<string>();

  constructor(
    private emergencyService: EmergencyService,
    private responderService: ResponderService,
    private geolocation: GeolocationService
  ) {}

  ngOnInit(): void {
    this.generateActiveEmergencies();
    setInterval(() => this.generateActiveEmergencies(), 15000);

    this.subs.push(
      this.responderService.responders$.subscribe((r) => {
        this.responders = r;
      })
    );

    this.dutyTimer = setInterval(() => {
      this.personalStats = {
        ...this.personalStats,
        onDutyMin: Math.round((Date.now() - this.dutyStart) / 60000),
      };
    }, 30000);
  }

  private generateActiveEmergencies(): void {
    const base = this.geolocation.lastPosition || { lat: 25.2048, lng: 55.2708 };
    const types: Array<Emergency['type']> = ['medical', 'fire', 'security', 'accident', 'other'];
    const severities: Severity[] = ['critical', 'medium', 'low'];
    const descriptions = [
      'My father collapsed and is not breathing',
      'I see smoke coming from the barn',
      'A stranger is trying to break into my house',
      'My car got stuck in the sand',
      'I twisted my ankle while walking',
      'There is a small fire in the kitchen',
      'Someone is unconscious after falling',
      'I am lost and dehydrated',
    ];

    const simulated: Emergency[] = Array.from({ length: 4 }, (_, i) => {
      const t = types[Math.floor(Math.random() * types.length)];
      const sv = severities[Math.floor(Math.random() * severities.length)];
      const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
      const loc: LatLng = {
        lat: base.lat + (Math.random() - 0.5) * 0.05,
        lng: base.lng + (Math.random() - 0.5) * 0.05,
      };
      const dist = this.calculateDistance(base, loc);
      const responderType: ResponderType = 'volunteer';
      const eta = this.responderService.calculateETA(dist, responderType);
      return {
        id: `sim_${Date.now()}_${i}`,
        type: t,
        severity: sv,
        status: 'alerting',
        location: loc,
        address: this.randomAddress(),
        description: desc,
        victimName: 'Community Member',
        victimPhone: '+971-XX-XXXXXXX',
        timestamp: Date.now() - Math.floor(Math.random() * 300000),
        etaMinutes: eta,
      };
    });

    this.activeEmergencies = simulated.filter((e) => !this.acceptedIds.has(e.id));
    if (this.activeEmergencies.length === 0) {
      this.activeEmergencies = simulated;
    }
  }

  acceptEmergency(em: Emergency): void {
    if (!this.isAvailable) return;
    this.acceptedIds.add(em.id);
    this.activeEmergencies = this.activeEmergencies.filter((e) => e.id !== em.id);
    this.isAvailable = false;

    this.personalStats = {
      ...this.personalStats,
      responded: this.personalStats.responded + 1,
      avgTime: this.personalStats.avgTime > 0
        ? Math.round((this.personalStats.avgTime + Math.floor(Math.random() * 60 + 30)) / 2)
        : Math.floor(Math.random() * 60 + 30),
    };

    const responderId = this.responders[0]?.id ?? 'resp_0';
    this.responderService.respondToEmergency(responderId);
    this.emergencyService.activateSOS(em.description);
  }

  toggleAvailability(): void {
    this.isAvailable = !this.isAvailable;
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = { medical: '🔴', fire: '🔥', security: '🔒', accident: '💥', other: '⚠️' };
    return map[type] ?? '⚠️';
  }

  formatDistance(em: Emergency): string {
    const origin = this.geolocation.lastPosition || { lat: 25.2048, lng: 55.2708 };
    const km = this.calculateDistance(origin, em.location);
    return km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`;
  }

  getTimeAgo(ts: number): string {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    return `${Math.floor(sec / 3600)}h ago`;
  }

  private randomAddress(): string {
    const streets = ['Al Wasl Road', 'Sheikh Zayed Road', 'Jumeirah Beach Road', 'Al Khail Road', 'Hessa Street', 'Al Marabea Street', 'Al Safa Street', 'Umm Suqeim Road'];
    const areas = ['Dubai Marina', 'JLT', 'Palm Jumeirah', 'Downtown Dubai', 'Dubai Hills', 'Al Barsha', 'Jumeirah', 'Business Bay'];
    return `${Math.floor(Math.random() * 50) + 1} ${streets[Math.floor(Math.random() * streets.length)]}, ${areas[Math.floor(Math.random() * areas.length)]}`;
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

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.dutyTimer) clearInterval(this.dutyTimer);
  }
}
