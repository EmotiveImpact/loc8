import type { Incident, IncidentStatus, StaffStatus } from '../domain/types';

export type Tone = 'ok' | 'amber' | 'alert' | 'off' | 'info';

/** Is this incident still a live emergency (drives the red SOS banner/tag)? */
export function isLiveEmergency(inc: Incident): boolean {
  return inc.kind === 'sos' && inc.status !== 'resolved';
}

export function incidentStatusLabel(status: IncidentStatus): string {
  return status.toUpperCase();
}

export function incidentStatusTone(status: IncidentStatus): Tone {
  switch (status) {
    case 'active':
      return 'alert';
    case 'escalated':
      return 'alert';
    case 'acknowledged':
      return 'info';
    case 'resolved':
      return 'ok';
  }
}

export function staffTone(status: StaffStatus): Tone {
  switch (status) {
    case 'on_post':
      return 'ok';
    case 'responding':
    case 'lone':
      return 'amber';
    case 'sos':
      return 'alert';
    case 'no_signal':
      return 'off';
  }
}

export function staffStatusLabel(status: StaffStatus): string {
  switch (status) {
    case 'on_post':
      return 'ON POST';
    case 'responding':
      return 'RESPONDING';
    case 'lone':
      return 'LONE';
    case 'sos':
      return 'SOS';
    case 'no_signal':
      return 'NO SIGNAL';
  }
}

/** Map dot tone (map has an extra 'info'/'sos' vocabulary). */
export function staffDotTone(status: StaffStatus): 'ok' | 'info' | 'caution' | 'sos' | 'off' {
  switch (status) {
    case 'sos':
      return 'sos';
    case 'responding':
    case 'lone':
      return 'caution';
    case 'no_signal':
      return 'off';
    default:
      return 'ok';
  }
}

export function incidentTone(inc: Incident): Tone {
  if (inc.kind === 'sos') return 'alert';
  if (inc.kind === 'lone_worker') return 'amber';
  if (inc.kind === 'shift') return 'ok';
  return 'info';
}
