import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { EmergencyService } from '../../services/emergency.service';
import { Emergency, EmergencyStatus, Responder } from '../../models/types';

@Component({
  selector: 'app-emergency-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="emergency-panel" *ngIf="emergency" [class]="'status-' + emergency.status + ' sev-' + emergency.severity">
      <div class="panel-header">
        <div class="header-left">
          <span class="status-badge">{{ statusLabel }}</span>
          <span class="sev-badge" [class]="'sev-' + emergency.severity">{{ emergency.severity | uppercase }}</span>
        </div>
        <span class="time-elapsed">{{ elapsed }}</span>
      </div>

      <div class="panel-body" *ngIf="emergency.status !== 'idle' && emergency.status !== 'cancelled'">
        <div class="severity-bar" [class]="emergency.severity">
          <div class="sev-fill"></div>
        </div>

        <div class="eta-info" *ngIf="emergency.etaMinutes">
          <span class="eta-icon">⏱</span>
          <span class="eta-text">Responder ETA: <strong>{{ emergency.etaMinutes }} minutes</strong></span>
        </div>

        <div class="location-info" *ngIf="emergency.address">
          <span class="label">Location</span>
          <span class="value">{{ emergency.address }}</span>
        </div>

        <div class="responder-info" *ngIf="responder">
          <div class="responder-card">
            <div class="responder-avatar" [class]="'rtype-' + responder.responderType">
              {{ responder.name.charAt(0) }}
            </div>
            <div class="responder-details">
              <span class="responder-name">{{ responder.name }}</span>
              <span class="responder-type-badge" [class]="'rtype-' + responder.responderType">
                {{ responder.responderType | titlecase }}
              </span>
              <span class="responder-status" [class]="emergency.status">
                {{ responderStatusLabel }}
              </span>
            </div>
            <div class="responder-meta">
              <div class="responder-distance" *ngIf="responder.distance !== undefined">
                {{ responder.distance < 1 ? (responder.distance * 1000 | number:'1.0-0') + 'm' : (responder.distance | number:'1.1-1') + 'km' }}
              </div>
              <div class="responder-eta" *ngIf="emergency.etaMinutes">ETA {{ emergency.etaMinutes }}min</div>
            </div>
          </div>
        </div>

        <div class="first-aid-section" *ngIf="firstAidSteps.length > 0 && (emergency.status === 'responder_dispatched' || emergency.status === 'awaiting_responder')">
          <span class="first-aid-title">📋 First Aid While You Wait</span>
          <div class="first-aid-step" *ngFor="let step of firstAidSteps; let i = index">
            <span class="step-num">{{ i + 1 }}</span>
            <span class="step-text">{{ step }}</span>
          </div>
        </div>

        <div class="timeline" *ngIf="timeline.length > 0">
          <div class="timeline-item" *ngFor="let event of timeline">
            <div class="timeline-dot"></div>
            <span class="timeline-label">{{ event.label }}</span>
            <span class="timeline-time">{{ event.time | date:'HH:mm:ss' }}</span>
          </div>
        </div>
      </div>

      <div class="panel-actions" *ngIf="emergency.status === 'responder_arrived' || emergency.status === 'responder_dispatched'">
        <button class="btn-resolve" (click)="resolve()">Mark as Resolved</button>
        <button class="btn-cancel" (click)="cancel()">Cancel</button>
      </div>
      <div class="panel-actions" *ngIf="emergency.status === 'alerting' || emergency.status === 'awaiting_responder'">
        <button class="btn-cancel" (click)="cancel()">Cancel SOS</button>
      </div>
    </div>
  `,
  styles: [`
    .emergency-panel {
      background: rgba(0,0,0,0.85); color: white;
      border-radius: 16px; padding: 16px; margin: 0 16px;
      backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1);
      max-height: 320px; overflow-y: auto; transition: all 0.3s;
    }
    .emergency-panel.status-resolved { border-color: #2979ff; }
    .emergency-panel.status-responder_arrived { border-color: #00c853; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .header-left { display: flex; align-items: center; gap: 6px; }
    .status-badge {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 0.75rem; font-weight: 600;
      background: rgba(255,23,68,0.2); color: #ff1744;
    }
    .status-responder_arrived .status-badge { background: rgba(0,200,83,0.2); color: #00c853; }
    .status-resolved .status-badge { background: rgba(41,121,255,0.2); color: #2979ff; }
    .sev-badge {
      display: inline-block; padding: 2px 8px; border-radius: 12px;
      font-size: 0.6rem; font-weight: 800; letter-spacing: 0.05em;
    }
    .sev-badge.sev-critical { background: rgba(255,23,68,0.25); color: #ff1744; }
    .sev-badge.sev-medium { background: rgba(255,171,0,0.2); color: #ffab00; }
    .sev-badge.sev-low { background: rgba(41,121,255,0.15); color: #448aff; }
    .time-elapsed { font-size: 0.75rem; opacity: 0.6; font-variant-numeric: tabular-nums; }
    .severity-bar { height: 3px; border-radius: 2px; background: rgba(255,255,255,0.06); margin-bottom: 10px; overflow: hidden; }
    .severity-bar.critical .sev-fill { width: 100%; height: 100%; background: #ff1744; }
    .severity-bar.medium .sev-fill { width: 60%; height: 100%; background: #ffab00; }
    .severity-bar.low .sev-fill { width: 30%; height: 100%; background: #448aff; }
    .eta-info { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; background: rgba(255,171,0,0.1); border-radius: 8px; padding: 6px 10px; }
    .eta-icon { font-size: 0.9rem; }
    .eta-text { font-size: 0.75rem; color: #ffab00; }
    .eta-text strong { color: white; }
    .location-info { margin-bottom: 8px; }
    .label { display: block; font-size: 0.65rem; opacity: 0.5; margin-bottom: 2px; }
    .value { font-size: 0.8rem; line-height: 1.3; display: block; }
    .responder-card {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.08); border-radius: 12px; padding: 10px;
      margin-bottom: 8px;
    }
    .responder-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #2979ff, #1565c0);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.1rem; flex-shrink: 0;
    }
    .responder-avatar.rtype-ambulance { background: linear-gradient(135deg, #00c853, #009624); }
    .responder-avatar.rtype-police { background: linear-gradient(135deg, #2979ff, #0d47a1); }
    .responder-avatar.rtype-clinic { background: linear-gradient(135deg, #9c27b0, #6a1b9a); }
    .responder-avatar.rtype-volunteer { background: linear-gradient(135deg, #ff6d00, #e65100); }
    .responder-details { display: flex; flex-direction: column; flex: 1; }
    .responder-name { font-size: 0.85rem; font-weight: 600; }
    .responder-type-badge { font-size: 0.6rem; padding: 1px 6px; border-radius: 8px; margin: 2px 0; display: inline-block; width: fit-content; }
    .responder-type-badge.rtype-ambulance { background: rgba(0,200,83,0.15); color: #00c853; }
    .responder-type-badge.rtype-police { background: rgba(41,121,255,0.15); color: #448aff; }
    .responder-type-badge.rtype-clinic { background: rgba(156,39,176,0.15); color: #ce93d8; }
    .responder-type-badge.rtype-volunteer { background: rgba(255,109,0,0.15); color: #ffab00; }
    .responder-status { font-size: 0.7rem; opacity: 0.7; }
    .responder-status.responder_dispatched { color: #ffab00; }
    .responder-status.responder_arrived { color: #00c853; }
    .responder-meta { text-align: right; }
    .responder-distance { font-size: 0.8rem; font-weight: 600; color: #ffab00; }
    .responder-eta { font-size: 0.65rem; color: rgba(255,255,255,0.5); }
    .first-aid-section { margin-bottom: 8px; background: rgba(41,121,255,0.08); border-radius: 10px; padding: 10px; }
    .first-aid-title { font-size: 0.75rem; font-weight: 700; color: #448aff; display: block; margin-bottom: 6px; }
    .first-aid-step { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 3px; }
    .step-num { width: 16px; height: 16px; border-radius: 50%; background: rgba(41,121,255,0.2); color: #448aff; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .step-text { font-size: 0.7rem; color: rgba(255,255,255,0.7); line-height: 1.3; }
    .timeline { margin-top: 6px; }
    .timeline-item { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
    .timeline-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.3); flex-shrink: 0; }
    .timeline-label { font-size: 0.75rem; flex: 1; }
    .timeline-time { font-size: 0.65rem; opacity: 0.4; font-variant-numeric: tabular-nums; }
    .panel-actions { display: flex; gap: 8px; margin-top: 10px; }
    .panel-actions button {
      flex: 1; padding: 10px; border-radius: 10px; border: none;
      font-weight: 600; font-size: 0.85rem; cursor: pointer;
      font-family: inherit; transition: opacity 0.2s;
    }
    .panel-actions button:hover { opacity: 0.85; }
    .btn-resolve { background: #00c853; color: white; }
    .btn-cancel { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
  `]
})
export class EmergencyPanelComponent implements OnInit, OnDestroy {
  emergency: Emergency | null = null;
  responder: Responder | null = null;
  timeline: { label: string; time: number }[] = [];
  firstAidSteps: string[] = [];
  elapsed = '00:00';
  statusLabel = '';

  private subs: Subscription[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

  constructor(private emergencyService: EmergencyService) {}

  ngOnInit(): void {
    this.subs.push(
      this.emergencyService.emergency$.subscribe((em) => {
        this.emergency = em;
        if (em && em.status !== 'idle' && em.status !== 'cancelled' && em.status !== 'resolved') {
          this.startTime = em.timestamp;
          this.startTimer();
        }
        this.statusLabel = this.getStatusLabel(em?.status ?? 'idle');
      })
    );

    this.subs.push(
      this.emergencyService.assignedResponder$.subscribe((r) => {
        this.responder = r;
      })
    );

    this.subs.push(
      this.emergencyService.timeline$.subscribe((t) => {
        this.timeline = t;
      })
    );

    this.subs.push(
      this.emergencyService.firstAid$.subscribe((steps) => {
        this.firstAidSteps = steps;
      })
    );
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - this.startTime) / 1000);
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      this.elapsed = `${m}:${s}`;
    }, 1000);
  }

  private getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      idle: 'Standby', alerting: 'ALERTING',
      awaiting_responder: 'AI MATCHING',
      responder_dispatched: 'HELP EN ROUTE',
      responder_arrived: 'HELP ARRIVED',
      resolved: 'RESOLVED', cancelled: 'CANCELLED'
    };
    return map[status] ?? status;
  }

  get responderStatusLabel(): string {
    const map: Record<string, string> = {
      responder_dispatched: 'En route to you',
      responder_arrived: 'Arrived at your location'
    };
    return map[this.emergency?.status ?? ''] ?? '';
  }

  resolve(): void {
    this.emergencyService.resolveEmergency();
  }

  cancel(): void {
    this.emergencyService.cancelEmergency();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.timer) clearInterval(this.timer);
  }
}
