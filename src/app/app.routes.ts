import { Routes } from '@angular/router';
import { HomepageComponent } from './components/homepage/homepage';
import { CivilianPageComponent } from './components/civilian-page/civilian-page';
import { ResponderPageComponent } from './components/responder-page/responder-page';
import { DashboardComponent } from './components/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'civilian', component: CivilianPageComponent },
  { path: 'responder', component: ResponderPageComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: '' },
];
