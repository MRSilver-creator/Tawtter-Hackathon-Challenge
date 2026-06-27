import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Responder, LatLng, EmergencyType, ResponderType, Severity } from '../models/types';
import { GeolocationService } from './geolocation.service';

@Injectable({ providedIn: 'root' })
export class ResponderService implements OnDestroy {
  private respondersSubject = new BehaviorSubject<Responder[]>([]);
  responders$ = this.respondersSubject.asObservable();
  private simulatedResponders: Responder[] = [];
  private simulationTimer: ReturnType<typeof setInterval> | null = null;

  private responderProfiles: Array<{ name: string; type: ResponderType; skills: string[] }> = [
    { name: 'Ahmed Al Mansouri', type: 'volunteer', skills: ['First Aid', 'CPR'] },
    { name: 'Sara Al Hashimi', type: 'ambulance', skills: ['Advanced First Aid', 'CPR', 'Emergency Triage', 'Medical Response'] },
    { name: 'Khalid Al Falasi', type: 'police', skills: ['Search & Rescue', 'Fire Safety', 'Security Response'] },
    { name: 'Mona Al Shamsi', type: 'clinic', skills: ['Medical Response', 'Advanced First Aid', 'CPR', 'Emergency Triage'] },
    { name: 'Hamad Al Neyadi', type: 'volunteer', skills: ['First Aid', 'Water Rescue'] },
    { name: 'Noor Al Kaabi', type: 'ambulance', skills: ['Advanced First Aid', 'CPR', 'Medical Response'] },
    { name: 'Saeed Al Mazrouei', type: 'police', skills: ['Search & Rescue', 'Security Response'] },
    { name: 'Latifa Al Suwaidi', type: 'clinic', skills: ['Medical Response', 'Emergency Triage', 'First Aid'] },
    { name: 'Rashid Al Tunaiji', type: 'volunteer', skills: ['Fire Safety', 'Search & Rescue'] },
    { name: 'Mariam Al Qubaisi', type: 'volunteer', skills: ['First Aid', 'CPR'] },
    { name: 'Faisal Al Dhaheri', type: 'volunteer', skills: ['Water Rescue', 'Search & Rescue'] },
    { name: 'Amna Al Harthi', type: 'volunteer', skills: ['Advanced First Aid', 'CPR'] },
  ];

  constructor(
    private geolocation: GeolocationService,
    private ngZone: NgZone
  ) {
    this.generateSimulatedResponders();
    this.startSimulation();
  }

  private generateSimulatedResponders(): void {
    const base = this.geolocation.lastPosition || { lat: 25.2048, lng: 55.2708 };

    this.simulatedResponders = this.responderProfiles.map((profile, i) => {
      const offset = {
        lat: (Math.random() - 0.5) * 0.06,
        lng: (Math.random() - 0.5) * 0.06,
      };
      return {
        id: `resp_${i}_${Date.now()}`,
        name: profile.name,
        phone: `+971-50-${String(1000000 + Math.floor(Math.random() * 9000000)).slice(0, 7)}`,
        location: { lat: base.lat + offset.lat, lng: base.lng + offset.lng },
        isAvailable: true,
        lastActive: Date.now(),
        skills: profile.skills,
        responderType: profile.type,
      };
    });
    this.respondersSubject.next(this.simulatedResponders);
  }

  private startSimulation(): void {
    this.simulationTimer = setInterval(() => {
      this.ngZone.run(() => {
        const base = this.geolocation.lastPosition || { lat: 25.2048, lng: 55.2708 };
        for (let i = 0; i < this.simulatedResponders.length; i++) {
          const r = this.simulatedResponders[i];
          const drift = {
            lat: r.location.lat + (Math.random() - 0.5) * 0.002,
            lng: r.location.lng + (Math.random() - 0.5) * 0.002,
          };
          const maxDrift = 0.06;
          if (Math.abs(drift.lat - base.lat) > maxDrift || Math.abs(drift.lng - base.lng) > maxDrift) {
            this.simulatedResponders[i] = {
              ...r,
              location: { lat: base.lat + (Math.random() - 0.5) * 0.06, lng: base.lng + (Math.random() - 0.5) * 0.06 },
              lastActive: Date.now(),
            };
          } else {
            this.simulatedResponders[i] = { ...r, location: drift, lastActive: Date.now() };
          }
        }
        this.respondersSubject.next([...this.simulatedResponders]);
      });
    }, 5000);
  }

  findBestResponder(origin: LatLng, emergencyType: EmergencyType, severity: Severity): Responder | null {
    const scored = this.simulatedResponders
      .filter((r) => r.isAvailable)
      .map((r) => {
        const distance = this.calculateDistance(origin, r.location);

        const skillBonus = r.skills.filter((s) => this.skillMatchesType(s, emergencyType)).length;
        const maxSkillBonus = 4;
        const skillScore = skillBonus / maxSkillBonus;

        const maxDist = 0.1;
        const proximityScore = Math.max(0, 1 - distance / maxDist);

        const typeSpeedBonus = this.typePriorityBonus(r.responderType, severity, emergencyType);

        const availabilityBonus = 1.0;

        const score = skillScore * 0.35 + proximityScore * 0.30 + typeSpeedBonus * 0.20 + availabilityBonus * 0.15;

        return { responder: { ...r, distance }, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored.length > 0 ? scored[0].responder : null;
  }

  assignResponder(emergencyId: string, responder: Responder): void {
    const idx = this.simulatedResponders.findIndex((r) => r.id === responder.id);
    if (idx !== -1) {
      this.simulatedResponders[idx] = { ...responder, isAvailable: false, emergencyId };
      this.respondersSubject.next([...this.simulatedResponders]);
    }
  }

  releaseResponder(responderId: string): void {
    const idx = this.simulatedResponders.findIndex((r) => r.id === responderId);
    if (idx !== -1) {
      this.simulatedResponders[idx] = { ...this.simulatedResponders[idx], isAvailable: true, emergencyId: undefined };
      this.respondersSubject.next([...this.simulatedResponders]);
    }
  }

  respondToEmergency(responderId: string): void {
    const idx = this.simulatedResponders.findIndex((r) => r.id === responderId);
    if (idx !== -1) {
      this.simulatedResponders[idx] = { ...this.simulatedResponders[idx], isAvailable: false };
      this.respondersSubject.next([...this.simulatedResponders]);
    }
  }

  getRespondersByType(type: ResponderType): Responder[] {
    return this.simulatedResponders.filter((r) => r.responderType === type);
  }

  private skillMatchesType(skill: string, type: EmergencyType): boolean {
    const map: Record<EmergencyType, string[]> = {
      medical: ['first aid', 'cpr', 'medical', 'triage'],
      fire: ['fire', 'rescue'],
      security: ['security', 'rescue'],
      accident: ['rescue', 'first aid', 'medical', 'water'],
      other: ['first aid', 'rescue'],
    };
    const keywords = map[type] ?? ['first aid'];
    return keywords.some((k) => skill.toLowerCase().includes(k));
  }

  private typePriorityBonus(type: ResponderType, severity: Severity, emergencyType: EmergencyType): number {
    if (severity === 'critical' && emergencyType === 'medical') {
      if (type === 'ambulance') return 1.0;
      if (type === 'clinic') return 0.8;
      if (type === 'volunteer') return 0.6;
      if (type === 'police') return 0.3;
    }
    if (severity === 'critical' && emergencyType === 'fire') {
      if (type === 'police') return 0.9;
      if (type === 'ambulance') return 0.7;
      if (type === 'volunteer') return 0.5;
    }
    if (severity === 'critical' && emergencyType === 'security') {
      if (type === 'police') return 1.0;
    }
    if (type === 'volunteer') return 0.4;
    return 0.3;
  }

  getNearbyResponders(origin: LatLng, maxCount = 5): Observable<Responder[]> {
    const sorted = [...this.simulatedResponders]
      .filter((r) => r.isAvailable)
      .map((r) => ({ ...r, distance: this.calculateDistance(origin, r.location) }))
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
      .slice(0, maxCount);
    return of(sorted);
  }

  calculateETA(distanceKm: number, type: ResponderType): number {
    const speedKmh: Record<ResponderType, number> = {
      volunteer: 5,
      ambulance: 60,
      police: 80,
      clinic: 40,
    };
    const speed = speedKmh[type] ?? 30;
    return Math.round((distanceKm / speed) * 60);
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
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
    }
  }
}
