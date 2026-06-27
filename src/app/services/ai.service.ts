import { Injectable } from '@angular/core';
import { Severity, EmergencyType } from '../models/types';

interface ClassificationResult {
  severity: Severity;
  type: EmergencyType;
  confidence: number;
  label: string;
}

interface KeywordRule {
  patterns: RegExp[];
  severity: Severity;
  type: EmergencyType;
  label: string;
}

const RULES: KeywordRule[] = [
  {
    patterns: [/collapsed/i, /not breathing/i, /heart/i, /cardiac/i, /unconscious/i, /severe bleeding/i, /gushing blood/i, /snake bite/i, /poison/i, /not moving/i, /turned blue/i],
    severity: 'critical',
    type: 'medical',
    label: 'Critical Medical Emergency',
  },
  {
    patterns: [/fire/i, /flames/i, /smoke/i, /burning/i, /on fire/i, /wildfire/i],
    severity: 'critical',
    type: 'fire',
    label: 'Fire Emergency',
  },
  {
    patterns: [/gun/i, /weapon/i, /attack/i, /threat/i, /intruder/i, /violent/i, /fighting/i, /assault/i],
    severity: 'critical',
    type: 'security',
    label: 'Security Threat',
  },
  {
    patterns: [/car crash/i, /vehicle accident/i, /rolled over/i, /collision/i, /hit by/i],
    severity: 'critical',
    type: 'accident',
    label: 'Critical Accident',
  },
  {
    patterns: [/stuck/i, /stranded/i, /lost/i, /can't move/i, /cannot move/i, /stuck in sand/i],
    severity: 'medium',
    type: 'accident',
    label: 'Stranded / Stuck',
  },
  {
    patterns: [/dehydrat/i, /heat stroke/i, /dizzy/i, /faint/i, /weak/i, /sunstroke/i],
    severity: 'medium',
    type: 'medical',
    label: 'Dehydration / Heat Exhaustion',
  },
  {
    patterns: [/twisted/i, /sprain/i, /minor bleed/i, /cut/i, /wound/i, /bruise/i, /fell/i, /fall/i],
    severity: 'medium',
    type: 'medical',
    label: 'Minor Injury',
  },
  {
    patterns: [/small fire/i, /contained fire/i, /campfire/i, /smoke smell/i],
    severity: 'medium',
    type: 'fire',
    label: 'Minor Fire',
  },
  {
    patterns: [/suspicious/i, /strange noise/i, /unlocked/i, /broken window/i],
    severity: 'medium',
    type: 'security',
    label: 'Suspicious Activity',
  },
];

@Injectable({ providedIn: 'root' })
export class AiService {
  classifyEmergency(description: string): ClassificationResult {
    const desc = description || '';

    for (const rule of RULES) {
      const matches = rule.patterns.filter((p) => p.test(desc));
      if (matches.length > 0) {
        const confidence = Math.min(1, 0.5 + matches.length * 0.1);
        return { severity: rule.severity, type: rule.type, confidence, label: rule.label };
      }
    }

    if (desc.length > 10) {
      return {
        severity: 'low',
        type: 'other',
        confidence: 0.3,
        label: 'Unspecified Issue (Low Priority)',
      };
    }

    return {
      severity: 'medium',
      type: 'other',
      confidence: 0.2,
      label: 'General Assistance Needed',
    };
  }
}
