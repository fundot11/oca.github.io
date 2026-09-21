import { Responder, TrainingSession, LocationType, OverseasCategory } from '../types';

export function toRocDate(dateStr: string | undefined | null): string {
  if (!dateStr || dateStr === '—') return '—';
  const cleaned = dateStr.trim();
  const parts = cleaned.split(/[-/.]/);
  if (parts.length !== 3) return dateStr;
  
  let y = parseInt(parts[0], 10);
  const m = String(parseInt(parts[1], 10)).padStart(2, '0');
  const d = String(parseInt(parts[2], 10)).padStart(2, '0');
  
  if (isNaN(y)) return dateStr;
  if (y > 1900) {
    y = y - 1911;
  }
  return `${y}.${m}.${d}`;
}

/**
 * Calculates the retraining date (回訓日) as 3 years after the training end date.
 * @param endDateStr YYYY-MM-DD or ROC date
 * @returns ROC date or YYYY-MM-DD
 */
export function calculateRetrainDate(endDateStr: string): string {
  if (!endDateStr) return '';
  const parts = endDateStr.split(/[-/.]/);
  if (parts.length !== 3) return '';
  let y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';
  
  if (y < 1900) {
    y = y + 1911; // convert ROC to Gregorian temporarily for Date calculation
  }
  
  const targetDate = new Date(y + 3, m, d);
  const targetY = targetDate.getFullYear() - 1911;
  const targetM = String(targetDate.getMonth() + 1).padStart(2, '0');
  const targetD = String(targetDate.getDate()).padStart(2, '0');
  return `${targetY}.${targetM}.${targetD}`;
}

export function getTrainingSessions(r: Partial<Responder>): TrainingSession[] {
  if (r.trainingSessions && r.trainingSessions.length > 0) {
    return [...r.trainingSessions].map(s => ({
      ...s,
      locationType: s.locationType || r.locationType || '國內',
      overseasCategory: s.locationType ? s.overseasCategory : (s.locationType === '國外' || (!s.locationType && r.locationType === '國外') ? (s.overseasCategory || r.overseasCategory) : undefined),
      overseasNote: s.locationType ? s.overseasNote : (s.locationType === '國外' || (!s.locationType && r.locationType === '國外') ? (s.overseasNote || r.overseasNote) : undefined),
    })).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
  
  // Fallback if no trainingSessions array yet
  const start = r.trainStartDate || r.trainDate || '';
  const end = r.trainEndDate || r.trainStartDate || r.trainDate || '';
  const reTrain = r.reTrainDate || r.expireDate || (end ? calculateRetrainDate(end) : '');
  
  if (!start && !end) return [];
  
  return [{
    id: 'default-1',
    startDate: start,
    endDate: end,
    reTrainDate: reTrain,
    locationType: r.locationType || '國內',
    overseasCategory: r.overseasCategory,
    overseasNote: r.overseasNote,
    note: '初訓紀錄'
  }];
}

export function getLatestSession(r: Partial<Responder>): TrainingSession | null {
  const sessions = getTrainingSessions(r);
  if (sessions.length === 0) return null;
  return sessions[sessions.length - 1]; // Return the latest session
}

export function getLatestLocationType(r: Partial<Responder>): LocationType {
  const latest = getLatestSession(r);
  if (latest?.locationType) return latest.locationType;
  return r.locationType || '國內';
}

export function getLatestOverseasCategory(r: Partial<Responder>): OverseasCategory | undefined {
  const latest = getLatestSession(r);
  if (latest) {
    if (latest.locationType === '國外') return latest.overseasCategory;
    if (latest.locationType === '國內') return undefined;
  }
  return r.locationType === '國外' ? r.overseasCategory : undefined;
}

export function getLatestOverseasNote(r: Partial<Responder>): string | undefined {
  const latest = getLatestSession(r);
  if (latest) {
    if (latest.locationType === '國外') return latest.overseasNote;
    if (latest.locationType === '國內') return undefined;
  }
  return r.locationType === '國外' ? r.overseasNote : undefined;
}

export function getTrainStartDate(r: Partial<Responder>): string {
  const latest = getLatestSession(r);
  if (latest?.startDate) return latest.startDate;
  return r.trainStartDate || r.trainDate || '';
}

export function getTrainEndDate(r: Partial<Responder>): string {
  const latest = getLatestSession(r);
  if (latest?.endDate) return latest.endDate;
  return r.trainEndDate || r.trainStartDate || r.trainDate || '';
}

export function getReTrainDate(r: Partial<Responder>): string {
  const latest = getLatestSession(r);
  if (latest?.reTrainDate) return latest.reTrainDate;
  if (r.reTrainDate) return r.reTrainDate;
  if (r.expireDate) return r.expireDate;
  const endDate = getTrainEndDate(r);
  return calculateRetrainDate(endDate);
}

export function formatTrainingPeriod(r: Partial<Responder>): string {
  const start = getTrainStartDate(r);
  const end = getTrainEndDate(r);
  if (!start && !end) return '—';
  if (!start) return end;
  if (!end || start === end) return start;
  return `${start} ~ ${end}`;
}

export function isReTrainDue(reTrainDateStr: string): boolean {
  if (!reTrainDateStr || reTrainDateStr === '—') return false;
  const parts = reTrainDateStr.split(/[-/.]/);
  if (parts.length !== 3) return false;
  let y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  
  if (y < 1900) {
    y = y + 1911;
  }
  
  const targetDate = new Date(y, m, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return targetDate <= thirtyDaysFromNow;
}

