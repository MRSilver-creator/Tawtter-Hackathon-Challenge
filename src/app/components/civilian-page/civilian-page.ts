import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SosButtonComponent } from '../sos-button/sos-button';
import { EmergencyPanelComponent } from '../emergency-panel/emergency-panel';
import { ResponderMapComponent } from '../responder-map/responder-map';
import { ResponderListComponent } from '../responder-list/responder-list';

@Component({
  selector: 'app-civilian-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SosButtonComponent,
    EmergencyPanelComponent,
    ResponderMapComponent,
    ResponderListComponent,
  ],
  template: `
    <div class="civilian-view">
      <div class="map-layer">
        <app-responder-map></app-responder-map>
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
          <span class="brand-text">RuralResQ AI</span>
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

      <div class="bottom-stack">
        <app-emergency-panel></app-emergency-panel>
        <app-responder-list></app-responder-list>
      </div>

      <div class="sos-layer">
        <app-sos-button></app-sos-button>
      </div>

      <div class="status-bar">
        <div class="status-dot online"></div>
        <span class="status-text">System Ready</span>
      </div>
    </div>
  `,
  styles: [`
    .civilian-view { position: relative; width: 100%; height: 100dvh; overflow: hidden; background: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .map-layer { position: absolute; inset: 0; z-index: 0; }
    .top-bar {
      position: absolute; top: 0; left: 0; right: 0; z-index: 10;
      display: flex; align-items: center; gap: 10px;
      padding: 16px 20px; padding-top: max(16px, env(safe-area-inset-top));
      pointer-events: none;
    }
    .top-bar > * { pointer-events: auto; }
    .home-link {
      display: flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.6); text-decoration: none; transition: all 0.2s;
    }
    .home-link:hover { color: white; background: rgba(255,255,255,0.1); }
    .brand { display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); padding: 6px 14px 6px 10px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); flex: 1; }
    .brand-icon { font-size: 1.1rem; }
    .brand-text { font-size: 0.85rem; font-weight: 700; color: white; letter-spacing: -0.01em; }
    .dash-btn {
      display: flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.6); text-decoration: none; transition: all 0.2s;
    }
    .dash-btn:hover { color: white; background: rgba(255,255,255,0.1); }
    .bottom-stack { position: absolute; bottom: 130px; left: 0; right: 0; z-index: 10; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
    .bottom-stack > * { pointer-events: auto; }
    .sos-layer { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 20; }
    .status-bar { position: absolute; top: 0; right: 0; z-index: 5; display: flex; align-items: center; gap: 6px; padding: 6px 12px; margin: 16px; margin-top: max(16px, env(safe-area-inset-top)); background: rgba(0,0,0,0.3); backdrop-filter: blur(8px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); visibility: hidden; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-dot.online { background: #00c853; box-shadow: 0 0 6px rgba(0,200,83,0.6); }
    .status-text { font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 500; }
  `]
})
export class CivilianPageComponent {}
