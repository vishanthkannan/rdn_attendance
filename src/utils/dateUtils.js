// Date utilities for Monday to Sunday civil workers weekly attendance

export const PRESET_WEEKS = [
  { id: '2026-08-25', label: '25 Aug - 31 Aug', startDate: '2026-08-25', endDate: '2026-08-31', year: 2026 },
  { id: '2026-09-01', label: '01 Sep - 07 Sep', startDate: '2026-09-01', endDate: '2026-09-07', year: 2026 },
  { id: '2026-09-08', label: '08 Sep - 14 Sep', startDate: '2026-09-08', endDate: '2026-09-14', year: 2026, isCurrent: true },
  { id: '2026-09-15', label: '15 Sep - 21 Sep', startDate: '2026-09-15', endDate: '2026-09-21', year: 2026 }
];

export const CURRENT_WEEK_ID = '2026-09-08';

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD into a local Date object
 */
export function parseDateISO(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Month names short
 */
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Generate 7 days for a given week starting from startDate (YYYY-MM-DD)
 */
export function getDaysOfWeek(startDateStr) {
  const start = parseDateISO(startDateStr);
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = formatDateISO(d);
    const dayName = DAY_NAMES[i];
    const dateNumber = String(d.getDate()).padStart(2, '0');
    const monthName = MONTH_NAMES[d.getMonth()];
    
    days.push({
      index: i,
      dayName,
      dateNumber,
      monthName,
      formattedDay: `${dayName} ${dateNumber} ${monthName}`,
      shortLabel: `${dayName} (${dateNumber})`,
      isoDate: dateStr
    });
  }
  
  return days;
}

/**
 * Generate formatted range string: "08 Sep - 14 Sep 2026"
 */
export function formatWeekRange(startDateStr) {
  const start = parseDateISO(startDateStr);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const startD = String(start.getDate()).padStart(2, '0');
  const startM = MONTH_NAMES[start.getMonth()];
  const endD = String(end.getDate()).padStart(2, '0');
  const endM = MONTH_NAMES[end.getMonth()];
  const endY = end.getFullYear();
  
  return `${startD} ${startM} - ${endD} ${endM} ${endY}`;
}

/**
 * Shift week by N weeks (-1 for prev, +1 for next)
 */
export function shiftWeek(startDateStr, weeksDelta) {
  const d = parseDateISO(startDateStr);
  d.setDate(d.getDate() + (weeksDelta * 7));
  return formatDateISO(d);
}

/**
 * Generate all days for a given month (e.g. "2026-09")
 */
export function getDaysInMonth(yearMonthStr) {
  const [y, m] = yearMonthStr.split('-').map(Number);
  const totalDays = new Date(y, m, 0).getDate();
  const days = [];
  
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(y, m - 1, i);
    const dateStr = formatDateISO(d);
    const dayOfWeekIdx = (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const dayName = DAY_NAMES[dayOfWeekIdx];
    const dateNumber = String(i).padStart(2, '0');
    const monthName = MONTH_NAMES[m - 1];
    
    days.push({
      dayNumber: i,
      dayName,
      dateNumber,
      monthName,
      isoDate: dateStr,
      shortLabel: `${dayName} (${dateNumber})`,
      pdfHeader: `${dateNumber}\n${dayName.slice(0, 2)}`
    });
  }
  return days;
}

/**
 * Determines whether a worker should be displayed in a given week.
 *
 * Rules:
 * 1. If the worker has ANY non-zero attendance or advance in this week, they MUST be visible (historical data integrity).
 * 2. If the worker was deleted in or before this week (worker.deletedAtWeek <= weekStart), they are hidden.
 * 3. Week-specific assignment:
 *    When a user adds an employee to a week, they belong ONLY to that specific week.
 *    They are not automatically moved or carried over to the next week (for the next week the user creates newly).
 * 4. Legacy fallback: if neither assignedWeek nor createdAtWeek is set, visible if not deleted.
 */
export function isWorkerVisibleInWeek(worker, weekStart, weekAttendance = {}) {
  if (!worker) return false;

  // 1. Any recorded attendance or advance in this week keeps worker visible
  const workerWeekRecords = weekAttendance[worker.id];
  if (workerWeekRecords) {
    const hasAnyRecord = Object.values(workerWeekRecords).some(
      (rec) => (Number(rec?.attendance) || 0) > 0 || (Number(rec?.borrowed) || 0) > 0
    );
    if (hasAnyRecord) return true;
  }

  // 2. If worker was deleted in or before this week, hide from this week onwards
  if (worker.deletedAtWeek && worker.deletedAtWeek <= weekStart) {
    return false;
  }

  // 3. Week-specific assignment: employee added to a week belongs ONLY to that week
  const targetWeek = worker.assignedWeek || worker.createdAtWeek;
  if (targetWeek) {
    return targetWeek === weekStart;
  }

  // 4. Legacy fallback
  return true;
}

/**
 * Determines whether a worker should be included in a given month's report.
 *
 * Rules:
 * 1. If the worker has ANY non-zero attendance or advance across any day of that month, they MUST be included.
 * 2. If the worker was deleted BEFORE this month started (worker.deletedAtWeek < monthFirstDay), they are excluded.
 * 3. If the worker was assigned/created in a week, check if that week falls within this month.
 * 4. Otherwise, included if active.
 */
export function isWorkerVisibleInMonth(worker, yearMonthStr, attendance = {}) {
  if (!worker) return false;

  const monthDays = getDaysInMonth(yearMonthStr);
  const firstDayStr = `${yearMonthStr}-01`;
  const lastDayStr = monthDays.length > 0 ? monthDays[monthDays.length - 1].isoDate : `${yearMonthStr}-31`;

  // 1. Check if worker has any attendance or advance anywhere in this month
  for (const weekKey of Object.keys(attendance)) {
    const workerAtt = attendance[weekKey]?.[worker.id];
    if (workerAtt) {
      for (const d of monthDays) {
        const rec = workerAtt[d.isoDate];
        if (rec && ((Number(rec.attendance) || 0) > 0 || (Number(rec.borrowed) || 0) > 0)) {
          return true;
        }
      }
    }
  }

  // 2. If worker was deleted before this month started (i.e. deletedAtWeek < month first day)
  if (worker.deletedAtWeek && worker.deletedAtWeek < firstDayStr) {
    return false;
  }

  // 3. If worker was assigned/created for a specific week, check if that week falls within this month
  const targetWeek = worker.assignedWeek || worker.createdAtWeek;
  if (targetWeek) {
    return targetWeek >= firstDayStr && targetWeek <= lastDayStr;
  }

  return true;
}

