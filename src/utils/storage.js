// Storage and seed data management for Civil Worker Attendance (Clean Mason Structure)

const STORAGE_KEY_MASONS = 'rdn_civil_masons_v2';
const STORAGE_KEY_ATTENDANCE = 'rdn_civil_attendance_v2';
const STORAGE_KEY_CLOSED_WEEKS = 'rdn_civil_closed_weeks_v2';

export const DEFAULT_INDIVIDUAL_WORKERS = [
  { id: 'mason-suresh_mason', name: 'Manson', category: 'Manson', groupId: 'mason-suresh', groupName: 'Suresh', wage: 0 },
  { id: 'mason-suresh_mhelper', name: 'M-Helper', category: 'M-Helper', groupId: 'mason-suresh', groupName: 'Suresh', wage: 0 },
  { id: 'mason-suresh_fhelper', name: 'F-Helper', category: 'F-Helper', groupId: 'mason-suresh', groupName: 'Suresh', wage: 0 },
  { id: 'mason-ramesh_mason', name: 'Manson', category: 'Manson', groupId: 'mason-ramesh', groupName: 'Ramesh', wage: 0 },
  { id: 'mason-ramesh_mhelper', name: 'M-Helper', category: 'M-Helper', groupId: 'mason-ramesh', groupName: 'Ramesh', wage: 0 },
  { id: 'mason-ramesh_fhelper', name: 'F-Helper', category: 'F-Helper', groupId: 'mason-ramesh', groupName: 'Ramesh', wage: 0 }
];

export const DEFAULT_MASONS = DEFAULT_INDIVIDUAL_WORKERS;

export function normalizeToIndividualWorkers(items) {
  if (!Array.isArray(items)) return DEFAULT_INDIVIDUAL_WORKERS;
  
  const workers = [];
  items.forEach((item) => {
    const cleanWage = (item.wage !== undefined && item.wage !== 950 && item.wage !== 600 && item.wage !== 500) 
      ? Number(item.wage) 
      : 0;

    // If it's Suresh or Ramesh from previous format, normalize names
    if (item.id === 'mason-suresh_mason') {
      workers.push({
        id: item.id,
        name: 'Manson',
        category: 'Manson',
        groupId: 'mason-suresh',
        groupName: 'Suresh',
        wage: cleanWage
      });
    } else if (item.id === 'mason-suresh_mhelper') {
      workers.push({
        id: item.id,
        name: 'M-Helper',
        category: 'M-Helper',
        groupId: 'mason-suresh',
        groupName: 'Suresh',
        wage: cleanWage
      });
    } else if (item.id === 'mason-suresh_fhelper') {
      workers.push({
        id: item.id,
        name: 'F-Helper',
        category: 'F-Helper',
        groupId: 'mason-suresh',
        groupName: 'Suresh',
        wage: cleanWage
      });
    } else if (item.id === 'mason-ramesh_mason') {
      workers.push({
        id: item.id,
        name: 'Manson',
        category: 'Manson',
        groupId: 'mason-ramesh',
        groupName: 'Ramesh',
        wage: cleanWage
      });
    } else if (item.id === 'mason-ramesh_mhelper') {
      workers.push({
        id: item.id,
        name: 'M-Helper',
        category: 'M-Helper',
        groupId: 'mason-ramesh',
        groupName: 'Ramesh',
        wage: cleanWage
      });
    } else if (item.id === 'mason-ramesh_fhelper') {
      workers.push({
        id: item.id,
        name: 'F-Helper',
        category: 'F-Helper',
        groupId: 'mason-ramesh',
        groupName: 'Ramesh',
        wage: cleanWage
      });
    } else if (item.category && item.wage !== undefined && !item.hasMHelper && !item.masonWage) {
      // Individual worker object
      workers.push({
        ...item,
        groupId: item.groupId || item.id,
        groupName: item.groupName || item.name,
        wage: cleanWage
      });
    } else {
      // Old grouped structure: convert each into individual worker
      const gId = item.id || `group-${Date.now()}`;
      const gName = item.name || 'Employee';
      if (item.name) {
        workers.push({
          id: item.id?.endsWith('_mason') ? item.id : `${item.id}_mason`,
          groupId: gId,
          groupName: gName,
          name: 'Manson',
          category: 'Manson',
          wage: (item.masonWage !== undefined && item.masonWage !== 950) ? Number(item.masonWage) : 0
        });
      }
      if (item.hasMHelper !== false) {
        workers.push({
          id: `${item.id}_mhelper`,
          groupId: gId,
          groupName: gName,
          name: 'M-Helper',
          category: 'M-Helper',
          wage: (item.mHelperWage !== undefined && item.mHelperWage !== 600) ? Number(item.mHelperWage) : 0
        });
      }
      if (item.hasFHelper !== false) {
        workers.push({
          id: `${item.id}_fhelper`,
          groupId: gId,
          groupName: gName,
          name: 'F-Helper',
          category: 'F-Helper',
          wage: (item.fHelperWage !== undefined && item.fHelperWage !== 500) ? Number(item.fHelperWage) : 0
        });
      }
      if (Array.isArray(item.customWorkers)) {
        item.customWorkers.forEach((cw) => {
          workers.push({
            id: `${item.id}_cw_${cw.id}`,
            groupId: gId,
            groupName: gName,
            name: cw.name,
            category: cw.category,
            wage: cw.wage || 0
          });
        });
      }
    }
  });

  return workers.length > 0 ? workers : DEFAULT_INDIVIDUAL_WORKERS;
}

export const DEFAULT_ATTENDANCE = {
  // 08 Sep – 14 Sep 2026
  '2026-09-08': {
    // Suresh's team
    'mason-suresh_mason': {
      '2026-09-08': { attendance: 1, borrowed: 500 },
      '2026-09-09': { attendance: 1, borrowed: 0 },
      '2026-09-10': { attendance: 1, borrowed: 500 },
      '2026-09-11': { attendance: 1, borrowed: 0 },
      '2026-09-12': { attendance: 1, borrowed: 0 },
      '2026-09-13': { attendance: 1, borrowed: 300 },
      '2026-09-14': { attendance: 1, borrowed: 0 }
    },
    'mason-suresh_mhelper': {
      '2026-09-08': { attendance: 4, borrowed: 500 }, // Example: 4 M-Helper, B = ₹500
      '2026-09-09': { attendance: 4, borrowed: 0 },
      '2026-09-10': { attendance: 4, borrowed: 800 },
      '2026-09-11': { attendance: 3, borrowed: 0 },
      '2026-09-12': { attendance: 4, borrowed: 400 },
      '2026-09-13': { attendance: 4, borrowed: 0 },
      '2026-09-14': { attendance: 2, borrowed: 0 }
    },
    'mason-suresh_fhelper': {
      '2026-09-08': { attendance: 4, borrowed: 500 }, // Example: 4 F-Helper, B = ₹500
      '2026-09-09': { attendance: 4, borrowed: 0 },
      '2026-09-10': { attendance: 3, borrowed: 300 },
      '2026-09-11': { attendance: 4, borrowed: 0 },
      '2026-09-12': { attendance: 4, borrowed: 500 },
      '2026-09-13': { attendance: 3, borrowed: 0 },
      '2026-09-14': { attendance: 1, borrowed: 0 }
    },

    // Ramesh's team (Joined mid-week on 2026-09-10)
    'mason-ramesh_mason': {
      '2026-09-10': { attendance: 1, borrowed: 300 },
      '2026-09-11': { attendance: 1, borrowed: 0 },
      '2026-09-12': { attendance: 1, borrowed: 0 },
      '2026-09-13': { attendance: 1, borrowed: 0 },
      '2026-09-14': { attendance: 1, borrowed: 0 }
    },
    'mason-ramesh_mhelper': {
      '2026-09-10': { attendance: 3, borrowed: 400 },
      '2026-09-11': { attendance: 3, borrowed: 0 },
      '2026-09-12': { attendance: 3, borrowed: 0 },
      '2026-09-13': { attendance: 2, borrowed: 200 },
      '2026-09-14': { attendance: 2, borrowed: 0 }
    },
    'mason-ramesh_fhelper': {
      '2026-09-10': { attendance: 2, borrowed: 200 },
      '2026-09-11': { attendance: 2, borrowed: 0 },
      '2026-09-12': { attendance: 2, borrowed: 0 },
      '2026-09-13': { attendance: 2, borrowed: 0 },
      '2026-09-14': { attendance: 1, borrowed: 0 }
    }
  },
  '2026-09-01': {
    'mason-suresh_mason': {
      '2026-09-01': { attendance: 1, borrowed: 200 },
      '2026-09-02': { attendance: 1, borrowed: 0 },
      '2026-09-03': { attendance: 1, borrowed: 0 },
      '2026-09-04': { attendance: 1, borrowed: 400 },
      '2026-09-05': { attendance: 1, borrowed: 0 },
      '2026-09-06': { attendance: 1, borrowed: 0 },
      '2026-09-07': { attendance: 1, borrowed: 0 }
    },
    'mason-suresh_mhelper': {
      '2026-09-01': { attendance: 4, borrowed: 600 },
      '2026-09-02': { attendance: 4, borrowed: 0 },
      '2026-09-03': { attendance: 3, borrowed: 300 },
      '2026-09-04': { attendance: 4, borrowed: 0 },
      '2026-09-05': { attendance: 4, borrowed: 500 },
      '2026-09-06': { attendance: 3, borrowed: 0 },
      '2026-09-07': { attendance: 1, borrowed: 0 }
    },
    'mason-suresh_fhelper': {
      '2026-09-01': { attendance: 3, borrowed: 400 },
      '2026-09-02': { attendance: 3, borrowed: 0 },
      '2026-09-03': { attendance: 3, borrowed: 0 },
      '2026-09-04': { attendance: 3, borrowed: 300 },
      '2026-09-05': { attendance: 3, borrowed: 0 },
      '2026-09-06': { attendance: 2, borrowed: 0 },
      '2026-09-07': { attendance: 0, borrowed: 0 }
    }
  }
};

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
  return DEFAULT_INDIVIDUAL_WORKERS;
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
