import React from 'react';
import { parseDateISO } from '../utils/dateUtils';

export default function AttendanceCell({ 
  worker, 
  dayInfo, 
  dayData, 
  onClick,
  isLocked
}) {
  const isAvailable = !worker.joinedDate || dayInfo.isoDate >= worker.joinedDate;
  
  if (!isAvailable) {
    // Determine the day name they joined
    let joinedText = 'Not Joined';
    try {
      const joinD = parseDateISO(worker.joinedDate);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      joinedText = `Joined ${days[joinD.getDay()]}`;
    } catch (e) {
      // fallback
    }

    return (
      <button 
        type="button"
        className="day-cell-btn disabled-cell" 
        disabled
        title={`Worker joined on ${worker.joinedDate} (${joinedText}). Not available before this day.`}
      >
        <span className="not-joined-label">{joinedText}</span>
      </button>
    );
  }

  const attendance = dayData?.attendance;
  const borrowed = dayData?.borrowed;
  
  const hasAttendance = attendance !== undefined && attendance !== null && attendance > 0;
  const hasBorrowed = borrowed !== undefined && borrowed !== null && borrowed > 0;

  return (
    <button
      type="button"
      className={`day-cell-btn ${isLocked ? 'locked-cell' : ''}`}
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      title={isLocked ? '' : 'Click to edit attendance & borrowed advance'}
    >
      {/* Attendance Count */}
      {hasAttendance ? (
        <span className="cell-att-count tabular-nums">{attendance}</span>
      ) : hasBorrowed ? (
        <span className="cell-att-count zero tabular-nums">0</span>
      ) : (
        <span className="cell-att-count zero tabular-nums">-</span>
      )}

      {/* Borrowed Advance: exact format "B = ₹500" */}
      {hasBorrowed && (
        <span className="cell-borrowed-tag tabular-nums">
          B = ₹{borrowed.toLocaleString('en-IN')}
        </span>
      )}
    </button>
  );
}
