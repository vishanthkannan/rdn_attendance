// Date utilities for Monday to Sunday civil workers weekly attendance

/**
 * Month names short and full
 */
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Returns Monday (YYYY-MM-DD) of the week containing the given date.
 * Civil work week starts on Monday and ends on Sunday.
 */
export function getMondayOfWeek(date = new Date()) {
  const d = (date instanceof Date) ? new Date(date) : parseDateISO(date);
  const day = d.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDateISO(d);
}

/**
 * Returns Monday (YYYY-MM-DD) of the current real calendar week.
 */
export function getCurrentWeekStart() {
  return getMondayOfWeek(new Date());
}

/**
 * Current week ID dynamically computed from today's real date
 */
export const CURRENT_WEEK_ID = getCurrentWeekStart();

/**
 * Format range short e.g. "08 Sep - 14 Sep"
 */
export function formatWeekRangeShort(startDateStr) {
  const start = parseDateISO(startDateStr);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const startD = String(start.getDate()).padStart(2, '0');
  const startM = MONTH_NAMES[start.getMonth()];
  const endD = String(end.getDate()).padStart(2, '0');
  const endM = MONTH_NAMES[end.getMonth()];
  
  return `${startD} ${startM} - ${endD} ${endM}`;
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
 * Dynamically generate rolling recent weeks around currentWeekStart
 * e.g. 2 past weeks, current week, and 1 next week (4 weeks total)
 */
export function getRecentWeeks(countPast = 2, countFuture = 1, referenceDate = getCurrentWeekStart()) {
  const currentMonday = (typeof referenceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(referenceDate))
    ? referenceDate
    : getMondayOfWeek(referenceDate);

  const realCurrentMonday = getCurrentWeekStart();
  const weeks = [];

  for (let delta = -countPast; delta <= countFuture; delta++) {
    const startStr = shiftWeek(currentMonday, delta);
    const startObj = parseDateISO(startStr);
    const endObj = new Date(startObj);
    endObj.setDate(startObj.getDate() + 6);
    const endStr = formatDateISO(endObj);

    weeks.push({
      id: startStr,
      label: formatWeekRangeShort(startStr),
      startDate: startStr,
      endDate: endStr,
      year: startObj.getFullYear(),
      isCurrent: (startStr === realCurrentMonday)
    });
  }

  return weeks;
}

/**
 * Preset weeks initialized dynamically from current week
 */
export const PRESET_WEEKS = getRecentWeeks();

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
    const dayOfWeekIdx = (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const dayName = DAY_NAMES[dayOfWeekIdx];
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
 * Dynamically generates list of months available for export/reporting:
 * Past 6 months, current month, next month, plus any month found in attendance.
 */
export function getAvailableMonths(attendance = {}) {
  const monthMap = new Map();
  const now = new Date();

  // 1. Rolling window of past 6 months to next 1 month
  for (let offset = -6; offset <= 1; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES_FULL[d.getMonth()]} ${d.getFullYear()}`;
    monthMap.set(ym, { id: ym, label, year: d.getFullYear(), month: d.getMonth() });
  }

  // 2. Also include any month recorded in attendance
  if (attendance) {
    Object.keys(attendance).forEach((weekKey) => {
      if (weekKey && weekKey.length >= 7) {
        const ym = weekKey.slice(0, 7);
        if (!monthMap.has(ym)) {
          const [y, m] = ym.split('-').map(Number);
          const monthIdx = m - 1;
          const label = `${MONTH_NAMES_FULL[monthIdx] || ym} ${y}`;
          monthMap.set(ym, { id: ym, label, year: y, month: monthIdx });
        }
      }
    });
  }

  return Array.from(monthMap.values()).sort((a, b) => b.id.localeCompare(a.id));
}

/**
 * Resolves which week a worker was assigned to.
 * Checks assignedWeek, createdAtWeek, embedded ID week, or defaults to dynamic current week.
 */
export function getWorkerAssignedWeek(worker) {
  if (!worker) return null;

  // 1. Explicit properties
  if (worker.assignedWeek) return worker.assignedWeek;
  if (worker.createdAtWeek) return worker.createdAtWeek;

  // 2. Embedded in ID or groupId: e.g. "group_2026-09-08_..." or "group_2026-09-15_..."
  const idStr = `${worker.groupId || ''} ${worker.id || ''}`;
  const match = idStr.match(/\d{4}-\d{2}-\d{2}/);
  if (match) {
    return match[0];
  }

  // 3. Dynamic fallback for legacy workers that don't have the date in ID
  return getCurrentWeekStart();
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
 * 4. A worker is never displayed in another week unless they have recorded attendance or were assigned to it.
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
  const assignedWeek = getWorkerAssignedWeek(worker);
  if (assignedWeek) {
    return assignedWeek === weekStart;
  }

  // 4. If no week can be determined, hide from this week
  return false;
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
  const assignedWeek = getWorkerAssignedWeek(worker);
  if (assignedWeek) {
    return assignedWeek >= firstDayStr && assignedWeek <= lastDayStr;
  }

  return false;
}

