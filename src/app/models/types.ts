export interface LatLng {
  lat: number;
  lng: number;
}

export type EmergencyType = 'medical' | 'fire' | 'security' | 'accident' | 'other';

export type EmergencyStatus =
  | 'idle'
  | 'alerting'
  | 'awaiting_responder'
  | 'responder_dispatched'
  | 'responder_arrived'
  | 'resolved'
  | 'cancelled';

export type Severity = 'critical' | 'medium' | 'low';

export type ResponderType = 'volunteer' | 'ambulance' | 'police' | 'clinic';

export type UserMode = 'victim' | 'responder';

export interface Emergency {
  id: string;
  type: EmergencyType;
  severity: Severity;
  status: EmergencyStatus;
  location: LatLng;
  address: string;
  description: string;
  victimName: string;
  victimPhone: string;
  timestamp: number;
  resolvedAt?: number;
  responderId?: string;
  etaMinutes?: number;
}

export interface Responder {
  id: string;
  name: string;
  phone: string;
  location: LatLng;
  isAvailable: boolean;
  distance?: number;
  emergencyId?: string;
  lastActive: number;
  skills: string[];
  responderType: ResponderType;
}

export interface EmergencyEvent {
  type: 'victim_alert' | 'responder_assigned' | 'responder_en_route' | 'responder_arrived' | 'resolved';
  emergencyId: string;
  timestamp: number;
  data?: unknown;
}

export interface DashboardStats {
  totalEmergencies: number;
  availableResponders: number;
  busyResponders: number;
  averageResponseTime: number;
  coverageRadiusKm: number;
  responderSkills: { skill: string; count: number }[];
  responderTypeBreakdown: { type: ResponderType; count: number }[];
  emergencyHistory: EmergencyRecord[];
  activeEmergencies: Emergency[];
}

export interface EmergencyRecord {
  id: string;
  type: EmergencyType;
  severity: Severity;
  status: EmergencyStatus;
  address: string;
  description: string;
  responderName?: string;
  responderType?: ResponderType;
  timestamp: number;
  resolvedAt?: number;
  responseTimeSec?: number;
  etaMinutes?: number;
  firstAidSteps?: string[];
}

export const FIRST_AID_STEPS: Record<EmergencyType, string[]> = {
  medical: [
    'Call for medical help immediately',
    'Check if the person is conscious and breathing',
    'If not breathing, begin CPR: 30 chest compressions, 2 breaths',
    'Keep the person warm and still until help arrives',
  ],
  fire: [
    ' evacuate the area immediately',
    'Cover your nose and mouth with a wet cloth',
    'If safe, use a fire extinguisher on small fires',
    'Do not re-enter the building until declared safe',
  ],
  security: [
    'Stay calm and do not confront the person',
    'Lock yourself in a safe room if possible',
    'Keep your phone silent and text your location',
    'Follow instructions from security personnel',
  ],
  accident: [
    'Do not move the injured person unless in immediate danger',
    'Control bleeding by applying firm pressure with a clean cloth',
    'Keep the person calm and warm',
    'Wait for trained responders to arrive',
  ],
  other: [
    'Stay where you are and conserve energy',
    'Drink water if available and keep cool',
    'Make yourself visible and audible to rescuers',
    'Follow any instructions from the dispatched responder',
  ],
};
