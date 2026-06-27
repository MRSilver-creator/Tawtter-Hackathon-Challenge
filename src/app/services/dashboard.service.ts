import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DashboardStats, EmergencyRecord, Emergency, ResponderType } from '../models/types';
import { ResponderService } from './responder.service';

const STORAGE_KEY = 'ruralresq_history';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private historySubject = new BehaviorSubject<EmergencyRecord[]>([]);
  history$ = this.historySubject.asObservable();

  private statsSubject = new BehaviorSubject<DashboardStats>(this.emptyStats());
  stats$ = this.statsSubject.asObservable();

  private activeEmergenciesSubject = new BehaviorSubject<Emergency[]>([]);
  activeEmergencies$ = this.activeEmergenciesSubject.asObservable();

  constructor(private responderService: ResponderService) {
    this.loadHistory();
    this.responderService.responders$.subscribe(() => this.computeStats());
    this.simulateActiveEmergencies();
  }

  recordEmergency(record: EmergencyRecord): void {
    const history = this.loadFromStorage();
    history.unshift(record);
    this.saveToStorage(history);
    this.historySubject.next(history);
    this.computeStats();
  }

  getHistory(): EmergencyRecord[] {
    return this.historySubject.value;
  }

  setActiveEmergencies(emergencies: Emergency[]): void {
    this.activeEmergenciesSubject.next(emergencies);
  }

  private computeStats(): void {
    const responders = (this.responderService as any)['simulatedResponders'] ?? [];
    const available = responders.filter((r: { isAvailable: boolean }) => r.isAvailable).length;
    const busy = responders.length - available;

    const typeCount = new Map<ResponderType, number>();
    for (const r of responders) {
      const rt = (r as { responderType: ResponderType }).responderType;
      typeCount.set(rt, (typeCount.get(rt) ?? 0) + 1);
    }
    const responderTypeBreakdown = [...typeCount.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const history = this.historySubject.value;
    const completed = history.filter((r) => r.status === 'resolved');
    const avgTime = completed.length > 0
      ? Math.round(completed.reduce((s, r) => s + (r.responseTimeSec ?? 30), 0) / completed.length)
      : 0;

    const skillMap = new Map<string, number>();
    for (const r of responders) {
      for (const skill of (r as { skills: string[] }).skills) {
        skillMap.set(skill, (skillMap.get(skill) ?? 0) + 1);
      }
    }
    const responderSkills = [...skillMap.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    this.statsSubject.next({
      totalEmergencies: history.length,
      availableResponders: available,
      busyResponders: busy,
      averageResponseTime: avgTime,
      coverageRadiusKm: Math.round((2 + Math.random() * 3) * 10) / 10,
      responderSkills,
      responderTypeBreakdown,
      emergencyHistory: history,
      activeEmergencies: this.activeEmergenciesSubject.value,
    });
  }

  private simulateActiveEmergencies(): void {
    setInterval(() => {
      const base = { lat: 25.2048, lng: 55.2708 };
      const virtual: Emergency[] = Array.from({ length: 2 }, (_, i) => ({
        id: `live_${Date.now()}_${i}`,
        type: (['medical', 'fire', 'accident'] as const)[Math.floor(Math.random() * 3)],
        severity: (['critical', 'medium', 'low'] as const)[Math.floor(Math.random() * 3)],
        status: 'alerting',
        location: { lat: base.lat + (Math.random() - 0.5) * 0.04, lng: base.lng + (Math.random() - 0.5) * 0.04 },
        address: 'Live simulated emergency',
        description: 'Community member needs assistance',
        victimName: 'Resident',
        victimPhone: '+971-XX-XXXXXXX',
        timestamp: Date.now() - Math.floor(Math.random() * 60000),
      }));
      this.activeEmergenciesSubject.next(virtual);
    }, 10000);
  }

  private emptyStats(): DashboardStats {
    return {
      totalEmergencies: 0,
      availableResponders: 0,
      busyResponders: 0,
      averageResponseTime: 0,
      coverageRadiusKm: 0,
      responderSkills: [],
      responderTypeBreakdown: [],
      emergencyHistory: [],
      activeEmergencies: [],
    };
  }

  private loadHistory(): void {
    const history = this.loadFromStorage();
    this.historySubject.next(history);
    this.computeStats();
  }

  private loadFromStorage(): EmergencyRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(history: EmergencyRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 100)));
    } catch { /* quota exceeded */ }
  }
}
