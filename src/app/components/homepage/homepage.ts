import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="homepage">
      <div class="hero">
        <div class="brand-icon">🌾</div>
        <h1 class="title">RuralResQ AI</h1>
        <p class="subtitle">Connecting the nearest help when every minute matters.</p>
      </div>

      <div class="role-cards">
        <a class="role-card civilian" routerLink="/civilian">
          <span class="role-emoji">🆘</span>
          <span class="role-label">I Need Help</span>
          <span class="role-desc">AI-classified SOS to the nearest qualified responder</span>
          <span class="role-arrow">→</span>
        </a>

        <a class="role-card responder" routerLink="/responder">
          <span class="role-emoji">🚑</span>
          <span class="role-label">I Can Help</span>
          <span class="role-desc">View and respond to AI-prioritized emergencies</span>
          <span class="role-arrow">→</span>
        </a>
      </div>

      <div class="footer-links">
        <a class="dash-link" routerLink="/dashboard">Dashboard &amp; Analytics</a>
      </div>
    </div>
  `,
  styles: [`
    .homepage {
      height: 100dvh; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #0a0a0f; color: white; padding: 32px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
    }
    .hero { margin-bottom: 40px; }
    .brand-icon { font-size: 3.5rem; margin-bottom: 8px; }
    .title { font-size: 2.4rem; font-weight: 900; letter-spacing: -0.03em; margin: 0 0 6px; background: linear-gradient(135deg, #00e676, #00bcd4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .subtitle { font-size: 0.9rem; color: rgba(255,255,255,0.4); font-weight: 500; margin: 0; max-width: 280px; }
    .role-cards { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 320px; }
    .role-card {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 24px 20px; border-radius: 20px; text-decoration: none; color: white;
      border: 1px solid rgba(255,255,255,0.08); cursor: pointer;
      transition: all 0.25s ease; position: relative;
    }
    .role-card:hover { transform: translateY(-2px); }
    .role-card.civilian {
      background: linear-gradient(135deg, rgba(255,23,68,0.15), rgba(213,0,0,0.08));
      border-color: rgba(255,23,68,0.25);
    }
    .role-card.civilian:hover { background: linear-gradient(135deg, rgba(255,23,68,0.25), rgba(213,0,0,0.15)); box-shadow: 0 8px 30px rgba(255,23,68,0.15); }
    .role-card.responder {
      background: linear-gradient(135deg, rgba(41,121,255,0.15), rgba(21,101,192,0.08));
      border-color: rgba(41,121,255,0.25);
    }
    .role-card.responder:hover { background: linear-gradient(135deg, rgba(41,121,255,0.25), rgba(21,101,192,0.15)); box-shadow: 0 8px 30px rgba(41,121,255,0.15); }
    .role-emoji { font-size: 2.2rem; margin-bottom: 4px; }
    .role-label { font-size: 1.2rem; font-weight: 700; }
    .role-desc { font-size: 0.75rem; color: rgba(255,255,255,0.45); }
    .role-arrow {
      position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
      font-size: 1.2rem; color: rgba(255,255,255,0.3);
    }
    .footer-links { margin-top: 32px; }
    .dash-link {
      color: rgba(255,255,255,0.3); text-decoration: none;
      font-size: 0.8rem; font-weight: 500; transition: color 0.2s;
    }
    .dash-link:hover { color: rgba(255,255,255,0.6); }
  `]
})
export class HomepageComponent {}
