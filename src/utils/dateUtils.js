// Date utilities for Monday to Sunday civil workers weekly attendance

export const PRESET_WEEKS = [
  { id: '2026-08-25', label: '25 Aug – 31 Aug', startDate: '2026-08-25', endDate: '2026-08-31', year: 2026 },
  { id: '2026-09-01', label: '01 Sep – 07 Sep', startDate: '2026-09-01', endDate: '2026-09-07', year: 2026 },
  { id: '2026-09-08', label: '08 Sep – 14 Sep', startDate: '2026-09-08', endDate: '2026-09-14', year: 2026, isCurrent: true },
  { id: '2026-09-15', label: '15 Sep – 21 Sep', startDate: '2026-09-15', endDate: '2026-09-21', year: 2026 }
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
 * Generate formatted range string: "08 Sep – 14 Sep 2026"
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
  
  return `${startD} ${startM} – ${endD} ${endM} ${endY}`;
}

/**
 * Shift week by N weeks (-1 for prev, +1 for next)
 */
export function shiftWeek(startDateStr, weeksDelta) {
  const d = parseDateISO(startDateStr);
  d.setDate(d.getDate() + (weeksDelta * 7));
  return formatDateISO(d);
}
