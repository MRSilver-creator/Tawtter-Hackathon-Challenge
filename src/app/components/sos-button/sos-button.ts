import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EmergencyService } from '../../services/emergency.service';
import { EmergencyStatus } from '../../models/types';

const CIRCUMFERENCE = 2 * Math.PI * 45;

@Component({
  selector: 'app-sos-button',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sos-wrapper" *ngIf="!showInput; else inputMode">
      <div class="sos-container" [class]="'status-' + status">
        <div class="sos-progress-ring" *ngIf="countdown > 0">
          <svg viewBox="0 0 100 100">
            <circle class="bg" cx="50" cy="50" r="45" />
            <circle class="fg" cx="50" cy="50" r="45"
              [style.stroke-dasharray]="CIRCUMFERENCE"
              [style.stroke-dashoffset]="countdownPercent" />
          </svg>
          <span class="countdown-number">{{ countdown }}</span>
        </div>

        <button
          class="sos-button"
          [class.active]="isActive"
          [class.pulse]="status === 'alerting' || status === 'awaiting_responder'"
          [disabled]="isActive"
          (click)="handlePress()"
          (touchstart)="handlePress()"
          aria-label="SOS Emergency Button">
          <span class="sos-text">{{ buttonLabel }}</span>
          <span class="sos-sub" *ngIf="!isActive">TAP TO DESCRIBE</span>
          <span class="sos-sub" *ngIf="status === 'responder_dispatched'">HELP IS COMING</span>
          <span class="sos-sub" *ngIf="status === 'responder_arrived'">RESPONDER ARRIVED</span>
        </button>
      </div>
    </div>

    <ng-template #inputMode>
      <div class="input-panel">
        <div class="input-header">
          <span class="input-title">Describe your emergency</span>
          <button class="voice-btn" (click)="startVoice()" [class.listening]="isListening" title="Voice input">
            🎤
          </button>
        </div>
        <textarea
          class="desc-input"
          [(ngModel)]="description"
          placeholder="e.g. My father collapsed and isn't breathing"
          rows="3"
          maxlength="200"
          (keydown.enter)="sendSOS()"
        ></textarea>
        <div class="input-actions">
          <button class="btn-cancel-input" (click)="showInput = false">Back</button>
          <button class="btn-send" (click)="sendSOS()" [disabled]="!description.trim()">
            Send SOS →
          </button>
        </div>
        <div class="char-count">{{ description.length }}/200</div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .sos-wrapper { display: flex; justify-content: center; }
    .sos-container { position: relative; display: flex; justify-content: center; align-items: center; }
    .sos-button {
      width: 140px; height: 140px; border-radius: 50%;
      border: 4px solid rgba(255,255,255,0.3);
      background: linear-gradient(135deg, #ff1744 0%, #d50000 100%);
      color: white; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(213,0,0,0.4);
      transition: all 0.3s ease; position: relative;
      font-family: inherit;
    }
    .sos-button:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 6px 30px rgba(213,0,0,0.6); }
    .sos-button:active:not(:disabled) { transform: scale(0.95); }
    .sos-button:disabled { cursor: default; }
    .sos-button.active { background: linear-gradient(135deg, #b71c1c 0%, #880e4f 100%); }
    .sos-text { font-size: 2rem; font-weight: 900; letter-spacing: 0.2em; line-height: 1; }
    .sos-sub { font-size: 0.65rem; opacity: 0.9; margin-top: 2px; letter-spacing: 0.05em; }
    .sos-button.pulse { animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(213,0,0,0.6); }
      50% { box-shadow: 0 0 0 20px rgba(213,0,0,0); }
      100% { box-shadow: 0 0 0 0 rgba(213,0,0,0); }
    }
    .sos-progress-ring { position: absolute; top: -10px; left: -10px; z-index: 2; }
    .sos-progress-ring svg { width: 160px; height: 160px; transform: rotate(-90deg); }
    .sos-progress-ring circle { fill: none; stroke-width: 4; }
    .sos-progress-ring .bg { stroke: rgba(255,255,255,0.15); }
    .sos-progress-ring .fg { stroke: #ff1744; stroke-linecap: round; transition: stroke-dashoffset 0.3s; }
    .countdown-number {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: 2.5rem; font-weight: 900; color: white;
    }
    .status-responder_arrived .sos-button { background: linear-gradient(135deg, #00c853 0%, #009624 100%); box-shadow: 0 4px 20px rgba(0,200,83,0.4); }
    .status-responder_arrived .sos-button.pulse { animation: pulse-green 1.5s ease-in-out infinite; }
    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(0,200,83,0.6); }
      50% { box-shadow: 0 0 0 20px rgba(0,200,83,0); }
      100% { box-shadow: 0 0 0 0 rgba(0,200,83,0); }
    }
    .status-resolved .sos-button { background: linear-gradient(135deg, #2979ff 0%, #1565c0 100%); }
    .input-panel {
      background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
      border-radius: 20px; padding: 16px; width: 300px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .input-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .input-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.8); }
    .voice-btn {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.08); cursor: pointer;
      font-size: 1.1rem; transition: all 0.25s; display: flex; align-items: center; justify-content: center;
    }
    .voice-btn:hover { background: rgba(255,255,255,0.15); }
    .voice-btn.listening { background: #ff1744; animation: pulse-voice 1s ease-in-out infinite; }
    @keyframes pulse-voice {
      0% { box-shadow: 0 0 0 0 rgba(255,23,68,0.6); }
      50% { box-shadow: 0 0 0 12px rgba(255,23,68,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,23,68,0); }
    }
    .desc-input {
      width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; padding: 10px; color: white; font-size: 0.85rem;
      font-family: inherit; resize: none; outline: none;
    }
    .desc-input:focus { border-color: rgba(255,23,68,0.4); }
    .desc-input::placeholder { color: rgba(255,255,255,0.25); }
    .input-actions { display: flex; gap: 8px; margin-top: 12px; }
    .input-actions button {
      flex: 1; padding: 10px; border-radius: 10px; border: none;
      font-weight: 600; font-size: 0.85rem; cursor: pointer;
      font-family: inherit; transition: opacity 0.2s;
    }
    .input-actions button:disabled { opacity: 0.4; cursor: default; }
    .btn-cancel-input { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
    .btn-send { background: linear-gradient(135deg, #ff1744, #d50000); color: white; }
    .char-count { text-align: right; font-size: 0.65rem; color: rgba(255,255,255,0.3); margin-top: 4px; }
  `]
})
export class SosButtonComponent implements OnInit, OnDestroy {
  protected readonly CIRCUMFERENCE = CIRCUMFERENCE;
  status: EmergencyStatus = 'idle';
  isActive = false;
  countdown = 0;
  countdownPercent = 0;
  buttonLabel = 'SOS';
  showInput = false;
  description = '';
  isListening = false;

  private subs: Subscription[] = [];
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private emergencyService: EmergencyService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.emergencyService.emergency$.subscribe((em) => {
        this.status = em?.status ?? 'idle';
        this.isActive = em !== null && em.status !== 'resolved' && em.status !== 'cancelled';
        this.buttonLabel = em ? (em.status === 'resolved' ? 'SAFE' : 'SOS') : 'SOS';
        this.showInput = false;
      })
    );
  }

  handlePress(): void {
    if (this.isActive) return;
    if (this.status === 'resolved' || this.status === 'cancelled') return;
    this.showInput = true;
  }

  sendSOS(): void {
    const desc = this.description.trim() || 'I need urgent help';
    this.showInput = false;
    this.description = '';
    this.runCountdown(desc);
  }

  private runCountdown(description: string): void {
    this.stopCountdown();
    let remaining = 3;
    this.countdown = remaining;
    this.countdownPercent = 0;

    this.countdownInterval = setInterval(() => {
      remaining--;
      this.ngZone.run(() => {
        this.countdown = remaining;
        this.countdownPercent = CIRCUMFERENCE * (1 - remaining / 3);
        if (remaining <= 0) {
          this.stopCountdown();
          this.emergencyService.activateSOS(description);
        }
      });
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  startVoice(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.description = '(Voice not supported in this browser)';
      return;
    }

    this.isListening = true;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.description = transcript;
      this.isListening = false;
    };

    recognition.onerror = () => {
      this.isListening = false;
    };

    recognition.onend = () => {
      this.isListening = false;
    };

    recognition.start();
  }

  ngOnDestroy(): void {
    this.stopCountdown();
    this.subs.forEach((s) => s.unsubscribe());
  }
}
