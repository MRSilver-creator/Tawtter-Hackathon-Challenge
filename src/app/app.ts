import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `<router-outlet />`,
  styles: [`
    :host { display: block; width: 100%; height: 100dvh; }
  `]
})
export class App {}
