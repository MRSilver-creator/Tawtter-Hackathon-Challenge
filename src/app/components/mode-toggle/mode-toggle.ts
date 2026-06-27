import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { UserMode } from '../../models/types';

@Component({
  selector: 'app-mode-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mode-toggle">
      <button
        class="mode-btn"
        [class.active]="(mode$ | async) === 'victim'"
        (click)="setMode('victim')">
        🆘 Need Help
      </button>
      <button
        class="mode-btn"
        [class.active]="(mode$ | async) === 'responder'"
        (click)="setMode('responder')">
        🚑 I Can Help
      </button>
    </div>
  `,
  styles: [`
    .mode-toggle {
      display: flex; gap: 4px;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
      border-radius: 24px; padding: 4px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .mode-btn {
      padding: 6px 14px; border-radius: 20px; border: none;
      background: transparent; color: rgba(255,255,255,0.5);
      font-size: 0.75rem; font-weight: 600; cursor: pointer;
      transition: all 0.25s; font-family: inherit;
      white-space: nowrap;
    }
    .mode-btn:hover { color: rgba(255,255,255,0.8); }
    .mode-btn.active {
      background: linear-gradient(135deg, #2979ff, #1565c0);
      color: white; box-shadow: 0 2px 8px rgba(41,121,255,0.3);
    }
  `]
})
export class ModeToggleComponent {
  mode$ = new BehaviorSubject<UserMode>('victim');

  setMode(mode: UserMode): void {
    this.mode$.next(mode);
  }
}
