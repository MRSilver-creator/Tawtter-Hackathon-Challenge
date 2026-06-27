import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats, EmergencyRecord, Emergency, ResponderType } from '../../models/types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <header class="dash-header">
        <a class="back-link" routerLink="/">← Map</a>
        <h1 class="dash-title">Dashboard</h1>
        <span class="dash-mode">Community</span>
      </header>

      <div class="dash-scroll">
        <section class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats.totalEmergencies }}</span>
            <span class="stat-label">Total<br>Emergencies</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.availableResponders }}</span>
            <span class="stat-label">Available<br>Responders</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.averageResponseTime }}s</span>
            <span class="stat-label">Avg Response<br>Time</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.coverageRadiusKm }}km</span>
            <span class="stat-label">Coverage<br>Radius</span>
          </div>
        </section>

        <section class="alive-section" *ngIf="activeEmergencies.length > 0">
          <h2 class="section-title section-title--alert">🔴 Live Active Emergencies</h2>
          <div class="alive-list">
            <div class="alive-item" *ngFor="let e of activeEmergencies" [class]="'sev-' + e.severity">
              <span class="alive-type">{{ typeIcon(e.type) }} {{ e.type | titlecase }}</span>
              <span class="alive-sev" [class]="'sev-' + e.severity">{{ e.severity | uppercase }}</span>
              <span class="alive-desc">{{ e.description | slice:0:40 }}{{ e.description.length > 40 ? '…' : '' }}</span>
            </div>
          </div>
        </section>

        <section class="type-section" *ngIf="stats.responderTypeBreakdown.length > 0">
          <h2 class="section-title">Responder Fleet</h2>
          <div class="type-list">
            <div class="type-row" *ngFor="let r of stats.responderTypeBreakdown">
              <span class="type-icon">{{ typeEmoji(r.type) }}</span>
              <span class="type-name">{{ r.type | titlecase }}</span>
              <div class="type-bar-bg">
                <div class="type-bar-fg" [style.width.%]="typeBarPercent(r.count)"></div>
              </div>
              <span class="type-count">{{ r.count }}</span>
            </div>
          </div>
        </section>

        <section class="skills-section" *ngIf="stats.responderSkills.length > 0">
          <h2 class="section-title">Responder Skills</h2>
          <div class="skills-list">
            <div class="skill-row" *ngFor="let s of stats.responderSkills">
              <span class="skill-name">{{ s.skill }}</span>
              <div class="skill-bar-bg">
                <div class="skill-bar-fg" [style.width.%]="skillPercent(s.count)"></div>
              </div>
              <span class="skill-count">{{ s.count }}</span>
            </div>
          </div>
        </section>

        <section class="history-section" *ngIf="history.length > 0">
          <h2 class="section-title">Emergency History</h2>
          <div class="history-list">
            <div class="history-item" *ngFor="let h of history" [class]="'item-' + h.status">
              <div class="h-icon">{{ statusIcon(h) }}</div>
              <div class="h-body">
                <span class="h-type">{{ h.type | titlecase }}</span>
                <span class="h-addr">{{ h.address | slice:0:60 }}{{ h.address.length > 60 ? '…' : '' }}</span>
                <span class="h-meta">
                  {{ h.timestamp | date:'short' }}
                  <span *ngIf="h.responderName"> · {{ h.responderName }}</span>
                  <span *ngIf="h.responseTimeSec !== undefined"> · {{ h.responseTimeSec }}s response</span>
                </span>
              </div>
              <div class="h-status">
                <span class="h-badge" [class]="'badge-' + h.status">{{ statusBadge(h) }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="history-section" *ngIf="history.length === 0">
          <div class="empty-state">
            <p>No emergency history yet.</p>
            <p class="empty-sub">Emergencies resolved from the main screen will appear here.</p>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      height: 100dvh; overflow: hidden;
      background: #0a0a0f; color: white;
      display: flex; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .dash-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px; padding-top: max(16px, env(safe-area-inset-top));
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .back-link {
      color: rgba(255,255,255,0.6); text-decoration: none;
      font-size: 0.85rem; font-weight: 500; transition: color 0.2s;
    }
    .back-link:hover { color: white; }
    .dash-title { font-size: 1.1rem; font-weight: 700; flex: 1; }
    .dash-mode {
      font-size: 0.7rem; padding: 3px 10px; border-radius: 20px;
      background: rgba(41,121,255,0.15); color: #448aff;
      font-weight: 600;
    }
    .dash-scroll {
      flex: 1; overflow-y: auto; padding: 16px 20px 24px;
    }
    .stats-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;
    }
    .stat-card {
      background: rgba(255,255,255,0.04); border-radius: 14px;
      padding: 16px; border: 1px solid rgba(255,255,255,0.06);
      display: flex; flex-direction: column; gap: 6px;
    }
    .stat-value {
      font-size: 1.8rem; font-weight: 800; line-height: 1;
      background: linear-gradient(135deg, #448aff, #00c853);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .stat-card:nth-child(2) .stat-value { background: linear-gradient(135deg, #ffab00, #ff6d00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .stat-card:nth-child(3) .stat-value { background: linear-gradient(135deg, #ff1744, #d500f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .stat-card:nth-child(4) .stat-value { background: linear-gradient(135deg, #00e5ff, #448aff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .stat-label { font-size: 0.7rem; color: rgba(255,255,255,0.45); line-height: 1.3; }
    .section-title {
      font-size: 0.85rem; font-weight: 700; margin-bottom: 10px;
      color: rgba(255,255,255,0.7);
    }
    .skills-section { margin-bottom: 20px; }
    .skills-list { display: flex; flex-direction: column; gap: 8px; }
    .skill-row {
      display: flex; align-items: center; gap: 10px;
    }
    .skill-name { font-size: 0.75rem; width: 90px; flex-shrink: 0; color: rgba(255,255,255,0.6); }
    .skill-bar-bg {
      flex: 1; height: 8px; border-radius: 4px;
      background: rgba(255,255,255,0.08); overflow: hidden;
    }
    .alive-section { margin-bottom: 20px; }
    .section-title--alert { color: #ff1744 !important; }
    .alive-list { display: flex; flex-direction: column; gap: 6px; }
    .alive-item {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.03); border-radius: 10px;
      padding: 8px 10px; border-left: 3px solid rgba(255,255,255,0.15);
    }
    .alive-item.sev-critical { border-left-color: #ff1744; }
    .alive-item.sev-medium { border-left-color: #ffab00; }
    .alive-item.sev-low { border-left-color: #448aff; }
    .alive-type { font-size: 0.75rem; font-weight: 600; width: 70px; flex-shrink: 0; color: rgba(255,255,255,0.85); }
    .alive-sev { font-size: 0.55rem; padding: 1px 6px; border-radius: 8px; font-weight: 800; letter-spacing: 0.05em; }
    .alive-sev.sev-critical { background: rgba(255,23,68,0.2); color: #ff1744; }
    .alive-sev.sev-medium { background: rgba(255,171,0,0.15); color: #ffab00; }
    .alive-sev.sev-low { background: rgba(68,138,255,0.12); color: #448aff; }
    .alive-desc { font-size: 0.7rem; color: rgba(255,255,255,0.4); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .type-section { margin-bottom: 20px; }
    .type-list { display: flex; flex-direction: column; gap: 8px; }
    .type-row { display: flex; align-items: center; gap: 8px; }
    .type-icon { font-size: 1rem; width: 24px; text-align: center; }
    .type-name { font-size: 0.75rem; width: 70px; flex-shrink: 0; color: rgba(255,255,255,0.6); }
    .type-bar-bg { flex: 1; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; }
    .type-bar-fg { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #ffab00, #ff6d00); transition: width 0.4s ease; }
    .type-count { font-size: 0.75rem; width: 20px; text-align: right; color: rgba(255,255,255,0.5); }
    .skill-bar-fg {
      height: 100%; border-radius: 4px;
      background: linear-gradient(90deg, #448aff, #00c853);
      transition: width 0.4s ease;
    }
    .skill-count { font-size: 0.75rem; width: 20px; text-align: right; color: rgba(255,255,255,0.5); }
    .history-section { margin-bottom: 20px; }
    .history-list { display: flex; flex-direction: column; gap: 6px; }
    .history-item {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.03); border-radius: 12px;
      padding: 10px 12px; border: 1px solid rgba(255,255,255,0.04);
    }
    .history-item.item-resolved { border-left: 3px solid #00c853; }
    .history-item.item-responder_dispatched { border-left: 3px solid #ffab00; }
    .history-item.item-cancelled { border-left: 3px solid rgba(255,255,255,0.15); }
    .history-item.item-responder_arrived { border-left: 3px solid #00c853; }
    .h-icon { font-size: 1.1rem; flex-shrink: 0; }
    .h-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .h-type { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.85); }
    .h-addr { font-size: 0.7rem; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .h-meta { font-size: 0.65rem; color: rgba(255,255,255,0.3); }
    .h-status { flex-shrink: 0; }
    .h-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      font-size: 0.6rem; font-weight: 600;
    }
    .badge-resolved { background: rgba(0,200,83,0.15); color: #00c853; }
    .badge-responder_dispatched { background: rgba(255,171,0,0.15); color: #ffab00; }
    .badge-responder_arrived { background: rgba(0,200,83,0.15); color: #00c853; }
    .badge-cancelled { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.35); }
    .badge-alerting, .badge-awaiting_responder { background: rgba(255,23,68,0.15); color: #ff1744; }
    .badge-idle { display: none; }
    .empty-state { text-align: center; padding: 32px 0; }
    .empty-state p { font-size: 0.85rem; color: rgba(255,255,255,0.4); }
    .empty-sub { font-size: 0.75rem !important; margin-top: 6px; color: rgba(255,255,255,0.25) !important; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = null!;
  history: EmergencyRecord[] = [];
  activeEmergencies: Emergency[] = [];
  private subs: Subscription[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.subs.push(
      this.dashboardService.stats$.subscribe((s) => {
        this.stats = s;
      })
    );
    this.subs.push(
      this.dashboardService.history$.subscribe((h) => {
        this.history = h;
      })
    );
    this.subs.push(
      this.dashboardService.activeEmergencies$.subscribe((a) => {
        this.activeEmergencies = a;
      })
    );
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = { medical: '🔴', fire: '🔥', security: '🔒', accident: '💥', other: '⚠️' };
    return map[type] ?? '⚠️';
  }

  typeEmoji(type: ResponderType): string {
    const map: Record<ResponderType, string> = { volunteer: '🚶', ambulance: '🚑', police: '🚔', clinic: '🏥' };
    return map[type] ?? '👤';
  }

  typeBarPercent(count: number): number {
    const max = Math.max(...this.stats.responderTypeBreakdown.map((t) => t.count), 1);
    return (count / max) * 100;
  }

  skillPercent(count: number): number {
    const max = Math.max(...this.stats.responderSkills.map((s) => s.count), 1);
    return (count / max) * 100;
  }

  statusIcon(h: EmergencyRecord): string {
    const map: Record<string, string> = {
      resolved: '✅', cancelled: '⏹️',
      responder_dispatched: '🚑', responder_arrived: '✅',
      alerting: '🔴', awaiting_responder: '🟡',
    };
    return map[h.status] ?? '📋';
  }

  statusBadge(h: EmergencyRecord): string {
    const map: Record<string, string> = {
      resolved: 'Resolved', cancelled: 'Cancelled',
      responder_dispatched: 'En Route', responder_arrived: 'Arrived',
      alerting: 'Alerting', awaiting_responder: 'Searching',
    };
    return map[h.status] ?? h.status;
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
