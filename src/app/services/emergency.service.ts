import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Emergency, EmergencyStatus, EmergencyType, EmergencyRecord, Responder, Severity, FIRST_AID_STEPS } from '../models/types';
import { GeolocationService } from './geolocation.service';
import { ResponderService } from './responder.service';
import { ConnectivityService } from './connectivity.service';
import { DashboardService } from './dashboard.service';
import { AiService } from './ai.service';

@Injectable({ providedIn: 'root' })
export class EmergencyService implements OnDestroy {
  private emergencySubject = new BehaviorSubject<Emergency | null>(null);
  emergency$ = this.emergencySubject.asObservable();

  private assignedResponderSubject = new BehaviorSubject<Responder | null>(null);
  assignedResponder$ = this.assignedResponderSubject.asObservable();

  private timelineSubject = new BehaviorSubject<{ label: string; time: number }[]>([]);
  timeline$ = this.timelineSubject.asObservable();

  private countdownSubject = new BehaviorSubject<number>(0);
  countdown$ = this.countdownSubject.asObservable();

  private firstAidSubject = new BehaviorSubject<string[]>([]);
  firstAid$ = this.firstAidSubject.asObservable();

  currentEmergency: Emergency | null = null;
  private statusTimeline: { label: string; time: number }[] = [];
  private responderPositionTimer: ReturnType<typeof setInterval> | null = null;

  private addressCache = new Map<string, string>();

  constructor(
    private geolocation: GeolocationService,
    private responderService: ResponderService,
    private connectivity: ConnectivityService,
    private dashboardService: DashboardService,
    private aiService: AiService,
    private ngZone: NgZone
  ) {}

  activateSOS(description = 'I need urgent help'): void {
    const classification = this.aiService.classifyEmergency(description);

    this.geolocation.getCurrentPosition().subscribe((location) => {
      const emergency: Emergency = {
        id: `em_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: classification.type,
        severity: classification.severity,
        status: 'alerting',
        location,
        address: 'Fetching address...',
        description,
        victimName: 'User',
        victimPhone: '+971-XX-XXXXXXX',
        timestamp: Date.now(),
      };

      this.currentEmergency = emergency;
      this.emergencySubject.next(emergency);
      this.addTimelineEvent(`🚨 ${classification.label} (${classification.severity.toUpperCase()})`);
      this.updateStatus('alerting');

      this.firstAidSubject.next(FIRST_AID_STEPS[emergency.type]);

      this.reverseGeocode(location);

      this.connectivity.addToQueue(() => {
        this.dispatchResponder(emergency);
      });
      this.dispatchResponder(emergency);
    });
  }

  private dispatchResponder(emergency: Emergency): void {
    this.updateStatus('awaiting_responder');
    this.addTimelineEvent('AI is selecting the best responder...');

    setTimeout(() => {
      const best = this.responderService.findBestResponder(
        emergency.location,
        emergency.type,
        emergency.severity
      );

      if (best) {
        const distance = best.distance ?? this.responderService['calculateDistance'](emergency.location, best.location);
        const eta = this.responderService.calculateETA(distance, best.responderType);

        this.responderService.assignResponder(emergency.id, best);

        const typedBest = { ...best, distance, emergencyId: emergency.id };
        this.addTimelineEvent(`✅ AI assigned: ${best.name} (${best.responderType}) — ETA ${eta} min`);
        this.updateStatus('responder_dispatched');

        const updated: Emergency = {
          ...emergency,
          status: 'responder_dispatched',
          responderId: best.id,
          etaMinutes: eta,
        };
        this.currentEmergency = updated;
        this.emergencySubject.next(updated);
        this.assignedResponderSubject.next(typedBest);

        this.simulateResponderMovement(typedBest);

        const arrivalDelay = Math.max(4000, eta * 500);
        setTimeout(() => {
          this.addTimelineEvent(`${best.name} has arrived`);
          this.updateStatus('responder_arrived');
          const arrivedEmerg = { ...this.currentEmergency!, status: 'responder_arrived' as EmergencyStatus };
          this.currentEmergency = arrivedEmerg;
          this.emergencySubject.next(arrivedEmerg);
        }, arrivalDelay);
      } else {
        this.addTimelineEvent('⚠️ No available responders, escalating...');
        setTimeout(() => this.dispatchResponder(emergency), 3000);
      }
    }, 1500);
  }

  private simulateResponderMovement(responder: Responder): void {
    if (this.responderPositionTimer) clearInterval(this.responderPositionTimer);

    const emergencyLoc = this.currentEmergency?.location;
    if (!emergencyLoc) return;

    const steps = 12;
    let currentStep = 0;
    const startLat = responder.location.lat;
    const startLng = responder.location.lng;
    const latStep = (emergencyLoc.lat - startLat) / steps;
    const lngStep = (emergencyLoc.lng - startLng) / steps;

    this.responderPositionTimer = setInterval(() => {
      this.ngZone.run(() => {
        currentStep++;
        if (currentStep >= steps) {
          if (this.responderPositionTimer) clearInterval(this.responderPositionTimer);
          this.responderPositionTimer = null;
          return;
        }
        const current = this.assignedResponderSubject.value;
        if (current) {
          this.assignedResponderSubject.next({
            ...current,
            location: {
              lat: startLat + latStep * currentStep,
              lng: startLng + lngStep * currentStep,
            },
          });
        }
      });
    }, 1000);
  }

  cancelEmergency(): void {
    if (this.currentEmergency?.responderId) {
      this.responderService.releaseResponder(this.currentEmergency.responderId);
    }
    this.updateStatus('cancelled');
    this.addTimelineEvent('Emergency cancelled');
    this.recordToDashboard();
    this.resetState();
  }

  resolveEmergency(): void {
    this.addTimelineEvent('Emergency resolved');
    if (this.currentEmergency?.responderId) {
      this.responderService.releaseResponder(this.currentEmergency.responderId);
    }
    const resolved = { ...this.currentEmergency!, status: 'resolved' as EmergencyStatus, resolvedAt: Date.now() };
    this.currentEmergency = resolved;
    this.emergencySubject.next(resolved);
    this.updateStatus('resolved');
    this.recordToDashboard();

    setTimeout(() => this.resetState(), 5000);
  }

  private recordToDashboard(): void {
    const em = this.currentEmergency;
    if (!em) return;

    const responder = this.assignedResponderSubject.value;
    const record: EmergencyRecord = {
      id: em.id,
      type: em.type,
      severity: em.severity,
      status: em.status,
      address: em.address,
      description: em.description,
      responderName: responder?.name,
      responderType: responder?.responderType,
      timestamp: em.timestamp,
      resolvedAt: em.resolvedAt ?? (em.status === 'cancelled' ? Date.now() : undefined),
      responseTimeSec: responder ? Math.round((Date.now() - em.timestamp) / 1000) : undefined,
      etaMinutes: em.etaMinutes,
      firstAidSteps: FIRST_AID_STEPS[em.type],
    };
    this.dashboardService.recordEmergency(record);
  }

  private updateStatus(status: EmergencyStatus): void {
    if (this.currentEmergency) {
      this.currentEmergency = { ...this.currentEmergency, status };
      this.emergencySubject.next(this.currentEmergency);
    }
  }

  private addTimelineEvent(label: string): void {
    this.statusTimeline.push({ label, time: Date.now() });
    this.timelineSubject.next([...this.statusTimeline]);
  }

  private resetState(): void {
    this.currentEmergency = null;
    this.emergencySubject.next(null);
    this.assignedResponderSubject.next(null);
    this.firstAidSubject.next([]);
    if (this.responderPositionTimer) {
      clearInterval(this.responderPositionTimer);
      this.responderPositionTimer = null;
    }
    setTimeout(() => {
      this.statusTimeline = [];
      this.timelineSubject.next([]);
    }, 3000);
  }

  private reverseGeocode(location: { lat: number; lng: number }): void {
    const key = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
    if (this.addressCache.has(key)) {
      this.updateAddress(this.addressCache.get(key)!);
      return;
    }

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=16`,
      { headers: { 'Accept-Language': 'en' } }
    )
      .then((r) => r.json())
      .then((data) => {
        const addr = data?.display_name || 'Unknown location';
        this.addressCache.set(key, addr);
        this.updateAddress(addr);
      })
      .catch(() => {
        this.updateAddress('Location acquired (address unavailable offline)');
      });
  }

  private updateAddress(address: string): void {
    if (this.currentEmergency) {
      this.currentEmergency = { ...this.currentEmergency, address };
      this.emergencySubject.next(this.currentEmergency);
    }
  }

  startCountdown(durationSec = 3): Observable<number> {
    return new Observable((sub) => {
      let remaining = durationSec;
      this.countdownSubject.next(remaining);
      sub.next(remaining);

      const interval = setInterval(() => {
        remaining--;
        this.ngZone.run(() => {
          this.countdownSubject.next(remaining);
          sub.next(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
            sub.complete();
          }
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        this.countdownSubject.next(0);
      };
    });
  }

  ngOnDestroy(): void {
    if (this.responderPositionTimer) clearInterval(this.responderPositionTimer);
  }
}
