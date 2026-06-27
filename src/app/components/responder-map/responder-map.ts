import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GeolocationService } from '../../services/geolocation.service';
import { EmergencyService } from '../../services/emergency.service';
import { ResponderService } from '../../services/responder.service';
import { Emergency, Responder, LatLng } from '../../models/types';

declare const L: any;

const victimIcon = L.divIcon({
  className: 'victim-marker',
  html: '<div class="victim-pulse"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const activeEmergIcon = L.divIcon({
  className: 'victim-marker',
  html: '<div class="victim-pulse" style="background:#ffab00;box-shadow:0 0 0 rgba(255,171,0,0.6);animation:marker-pulse 2s ease-in-out infinite;"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function responderIconForType(type: string): any {
  const emoji: Record<string, string> = {
    volunteer: '🚶', ambulance: '🚑', police: '🚔', clinic: '🏥',
  };
  return L.divIcon({
    className: 'responder-marker',
    html: `<div class="responder-dot">${emoji[type] ?? '🚑'}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const userIcon = L.divIcon({
  className: 'user-marker',
  html: '<div class="user-dot">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

@Component({
  selector: 'app-responder-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div id="emergency-map" class="map-container"></div>`,
  styles: [`
    .map-container { width: 100%; height: 100%; }
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class ResponderMapComponent implements OnInit, OnDestroy, OnChanges {
  @Output() mapReady = new EventEmitter<void>();
  @Input() activeEmergencies: Emergency[] | null = null;

  private map: any = null;
  private userMarker: any = null;
  private victimMarker: any = null;
  private responderMarkers: Map<string, any> = new Map();
  private activeEmergMarkers: Map<string, any> = new Map();
  private subs: Subscription[] = [];
  private userPath: any = null;
  private mapInitialized = false;

  constructor(
    private geolocation: GeolocationService,
    private emergencyService: EmergencyService,
    private responderService: ResponderService
  ) {}

  ngOnInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeEmergencies'] && this.mapInitialized && this.map) {
      this.updateActiveEmergencyMarkers();
    }
  }

  private initMap(): void {
    const el = document.getElementById('emergency-map');
    if (!el || el.clientWidth === 0) {
      setTimeout(() => this.initMap(), 200);
      return;
    }

    const pos = this.geolocation.lastPosition || { lat: 25.2048, lng: 55.2708 };

    this.map = L.map('emergency-map', {
      center: [pos.lat, pos.lng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.geolocation.startWatching();
    this.setupSubscriptions();
    this.map.invalidateSize();
    this.mapInitialized = true;
    if (this.activeEmergencies) {
      this.updateActiveEmergencyMarkers();
    }
    this.mapReady.emit();
  }

  private setupSubscriptions(): void {
    this.subs.push(
      this.geolocation.position$.subscribe((pos) => {
        if (!pos || !this.map) return;
        if (!this.userMarker) {
          this.userMarker = L.marker([pos.lat, pos.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(this.map);
        } else {
          this.userMarker.setLatLng([pos.lat, pos.lng]);
        }
        if (!this.victimMarker && !this.emergencyService.currentEmergency) {
          this.map.setView([pos.lat, pos.lng], this.map.getZoom());
        }
      })
    );

    this.subs.push(
      this.emergencyService.emergency$.subscribe((em) => {
        if (!this.map) return;
        this.updateEmergencyMarker(em);
      })
    );

    this.subs.push(
      this.emergencyService.assignedResponder$.subscribe((responder) => {
        if (!this.map) return;
        if (responder && this.emergencyService.currentEmergency) {
          const emLoc = this.emergencyService.currentEmergency.location;
          this.drawRoute(responder.location, emLoc);
        }
      })
    );

    this.subs.push(
      this.responderService.responders$.subscribe((responders) => {
        if (!this.map) return;
        this.updateResponderMarkers(responders);
      })
    );
  }

  private updateEmergencyMarker(em: Emergency | null): void {
    if (!em || em.status === 'resolved' || em.status === 'cancelled') {
      if (this.victimMarker) {
        this.map?.removeLayer(this.victimMarker);
        this.victimMarker = null;
      }
      if (this.userPath) {
        this.map?.removeLayer(this.userPath);
        this.userPath = null;
      }
      return;
    }

    const loc = em.location;
    if (!this.victimMarker) {
      this.victimMarker = L.marker([loc.lat, loc.lng], { icon: victimIcon, zIndexOffset: 500 })
        .addTo(this.map)
        .bindPopup('🚨 Emergency Here');
      this.map.setView([loc.lat, loc.lng], 15);
    } else {
      this.victimMarker.setLatLng([loc.lat, loc.lng]);
    }
  }

  private updateActiveEmergencyMarkers(): void {
    if (!this.map) return;

    const active = this.activeEmergencies ?? [];

    const currentIds = new Set(active.map((e) => e.id));
    for (const [id, marker] of this.activeEmergMarkers) {
      if (!currentIds.has(id)) {
        this.map.removeLayer(marker);
        this.activeEmergMarkers.delete(id);
      }
    }

    for (const em of active) {
      if (this.activeEmergMarkers.has(em.id)) {
        this.activeEmergMarkers.get(em.id)!.setLatLng([em.location.lat, em.location.lng]);
      } else {
        const m = L.marker([em.location.lat, em.location.lng], { icon: activeEmergIcon })
          .addTo(this.map)
          .bindPopup(`
            <strong>${em.type.toUpperCase()} Emergency</strong><br>
            ${em.address}<br>
            <span style="color:#ffab00">${this.getTimeAgo(em.timestamp)}</span>
          `);
        this.activeEmergMarkers.set(em.id, m);
      }
    }
  }

  private updateResponderMarkers(responders: Responder[]): void {
    if (!this.map) return;

    const currentIds = new Set(responders.map((r) => r.id));

    for (const [id, marker] of this.responderMarkers) {
      if (!currentIds.has(id)) {
        this.map.removeLayer(marker);
        this.responderMarkers.delete(id);
      }
    }

    for (const r of responders) {
      if (this.responderMarkers.has(r.id)) {
        this.responderMarkers.get(r.id)!.setLatLng([r.location.lat, r.location.lng]);
      } else {
        const m = L.marker([r.location.lat, r.location.lng], { icon: responderIconForType(r.responderType) })
          .addTo(this.map)
          .bindPopup(`
            <strong>${r.name}</strong><br>
            <span style="color:#ffab00">${r.responderType.toUpperCase()}</span><br>
            ${r.skills.join(' · ')}<br>
            <span style="color:${r.isAvailable ? '#00c853' : '#ff1744'}">
              ${r.isAvailable ? '✅ Available' : '⛑ Responding'}
            </span>
          `);
        this.responderMarkers.set(r.id, m);
      }
    }
  }

  private drawRoute(from: LatLng, to: LatLng): void {
    if (this.userPath) {
      this.map?.removeLayer(this.userPath);
    }
    this.userPath = L.polyline(
      [[from.lat, from.lng], [to.lat, to.lng]],
      { color: '#2979ff', weight: 3, dashArray: '8, 8', opacity: 0.7 }
    ).addTo(this.map);
  }

  private getTimeAgo(ts: number): string {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    return `${Math.floor(sec / 3600)}h ago`;
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.map?.remove();
  }
}
