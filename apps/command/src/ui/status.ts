import type { Incident, IncidentStatus, StaffStatus } from '../domain/types';

export type Tone = 'ok' | 'amber' | 'alert' | 'off' | 'info';

/** Is this incident still a live emergency (drives the red banner/tag)? */
export function isLiveEmergency(inc: Incident): boolean {
  return (inc.kind === 'sos' || inc.kind === 'duress' || inc.kind === 'man_down') && inc.status !== 'resolved';
}

/** Banner headline per emergency kind. */
export function emergencyHeadline(inc: Incident): string {
  if (inc.kind === 'duress') return 'SILENT DURESS';
  if (inc.kind === 'man_down') return 'MAN DOWN?';
  return 'SOS';
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
  if (inc.kind === 'sos' || inc.kind === 'duress' || inc.kind === 'man_down') return 'alert';
  if (inc.kind === 'lone_worker') return 'amber';
  if (inc.kind === 'shift') return 'ok';
  return 'info';
}
