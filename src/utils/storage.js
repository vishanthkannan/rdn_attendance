// Storage and seed data management for Civil Worker Attendance (Clean Mason Structure)

const STORAGE_KEY_MASONS = 'rdn_civil_masons_v2';
const STORAGE_KEY_ATTENDANCE = 'rdn_civil_attendance_v3';
const STORAGE_KEY_CLOSED_WEEKS = 'rdn_civil_closed_weeks_v2';

export const DEFAULT_INDIVIDUAL_WORKERS = [];
export const DEFAULT_MASONS = [];

export function normalizeToIndividualWorkers(items) {
  if (!Array.isArray(items)) return [];
  
  const workers = [];
  items.forEach((item) => {
    // Purge old demo workers (Suresh / Ramesh)
    const gName = (item.groupName || item.name || '').trim().toLowerCase();
    const gId = (item.groupId || item.id || '').toLowerCase();
    if (
      gName === 'suresh' || 
      gName === 'ramesh' || 
      gId.includes('suresh') || 
      gId.includes('ramesh')
    ) {
      return;
    }

    const cleanWage = Number(item.wage) || 0;

    if (item.category && item.wage !== undefined && !item.hasMHelper && !item.masonWage) {
      // Standard individual worker
      workers.push({
        ...item,
        groupId: item.groupId || item.id,
        groupName: item.groupName || item.name,
        wage: cleanWage
      });
    } else {
      // Legacy grouped structure conversion
      const groupId = item.groupId || item.id || `group-${Date.now()}`;
      const groupName = item.groupName || item.name || 'Employee';
      if (item.name) {
        workers.push({
          id: item.id?.endsWith('_mason') ? item.id : `${item.id}_mason`,
          groupId,
          groupName,
          name: 'Manson',
          category: 'Manson',
          wage: Number(item.masonWage) || 0
        });
      }
      if (item.hasMHelper !== false) {
        workers.push({
          id: `${item.id}_mhelper`,
          groupId,
          groupName,
          name: 'M-Helper',
          category: 'M-Helper',
          wage: Number(item.mHelperWage) || 0
        });
      }
      if (item.hasFHelper !== false) {
        workers.push({
          id: `${item.id}_fhelper`,
          groupId,
          groupName,
          name: 'F-Helper',
          category: 'F-Helper',
          wage: Number(item.fHelperWage) || 0
        });
      }
      if (Array.isArray(item.customWorkers)) {
        item.customWorkers.forEach((cw) => {
          workers.push({
            id: `${item.id}_cw_${cw.id}`,
            groupId,
            groupName,
            name: cw.name,
            category: cw.category,
            wage: Number(cw.wage) || 0
          });
        });
      }
    }
  });

  return workers;
}

export const DEFAULT_ATTENDANCE = {};

export function loadMasons() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MASONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeToIndividualWorkers(parsed);
    }
  } catch (e) {
    console.error('Failed to load workers', e);
  }
  return [];
}

export function saveMasons(masons) {
  try {
    localStorage.setItem(STORAGE_KEY_MASONS, JSON.stringify(masons));
  } catch (e) {
    console.error('Failed to save masons', e);
  }
}

export function loadAttendance() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load attendance', e);
  }
  return DEFAULT_ATTENDANCE;
}

export function saveAttendance(attendance) {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendance));
  } catch (e) {
    console.error('Failed to save attendance', e);
  }
}

export function loadClosedWeeks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLOSED_WEEKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load closed weeks', e);
  }
  return [];
}

export function saveClosedWeeks(closedWeeks) {
  try {
    localStorage.setItem(STORAGE_KEY_CLOSED_WEEKS, JSON.stringify(closedWeeks));
  } catch (e) {
    console.error('Failed to save closed weeks', e);
  }
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY_MASONS);
  localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
  localStorage.removeItem(STORAGE_KEY_CLOSED_WEEKS);
  return {
    masons: DEFAULT_MASONS,
    attendance: DEFAULT_ATTENDANCE,
    closedWeeks: []
  };
}
