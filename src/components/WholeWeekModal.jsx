import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Zap, IndianRupee, Banknote, Plus } from 'lucide-react';

export default function WholeWeekModal({
  isOpen,
  onClose,
  worker,
  daysOfWeek,
  currentWeekAttendance,
  onSaveWholeWeek
}) {
  // State for all 7 days: { [isoDate]: { attendance: number, borrowed: number } }
  const [dayValues, setDayValues] = useState({});
  const [quickAttVal, setQuickAttVal] = useState('1');

  useEffect(() => {
    if (isOpen && daysOfWeek && daysOfWeek.length > 0) {
      const initial = {};
      daysOfWeek.forEach((day) => {
        const existing = currentWeekAttendance?.[day.isoDate] || {};
        initial[day.isoDate] = {
          attendance: existing.attendance !== undefined ? existing.attendance : 0,
          borrowed: existing.borrowed !== undefined ? existing.borrowed : 0
        };
      });
      setDayValues(initial);
    }
  }, [isOpen, daysOfWeek, currentWeekAttendance]);

  if (!isOpen || !worker || !daysOfWeek) return null;

  const handleDayChange = (isoDate, field, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setDayValues((prev) => ({
      ...prev,
      [isoDate]: {
        ...prev[isoDate],
        [field]: num
      }
    }));
  };

  // Quick Apply to all 7 days
  const handleApplyToAllDays = (val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setDayValues((prev) => {
      const updated = { ...prev };
      daysOfWeek.forEach((day) => {
        updated[day.isoDate] = {
          ...(updated[day.isoDate] || { borrowed: 0 }),
          attendance: num
        };
      });
      return updated;
    });
  };

  // Calculate totals
  let totalAtt = 0;
  let totalBor = 0;
  daysOfWeek.forEach((day) => {
    const d = dayValues[day.isoDate];
    if (d) {
      totalAtt += d.attendance || 0;
      totalBor += d.borrowed || 0;
    }
  });

  const wage = worker.wagePerWork || 0;
  const totalAmount = totalAtt * wage;
  const balance = totalAmount - totalBor;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveWholeWeek(worker, dayValues);
    onClose();
  };

  const quickChips = [0, 0.5, 1, 2, 3, 4];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3>Whole Week Attendance</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Set attendance &amp; advances for <strong>{worker.groupName && worker.groupName !== worker.name ? `${worker.groupName} • ${worker.name}` : worker.name}</strong> across all 7 days
            </p>
          </div>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Quick Fill Box */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Zap size={16} color="var(--text-primary)" />
                  Quick Fill Attendance for All 7 Days:
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Wage: ₹{wage}/work
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {quickChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ minWidth: '42px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontWeight: 700 }}
                    onClick={() => {
                      setQuickAttVal(String(chip));
                      handleApplyToAllDays(chip);
                    }}
                  >
                    {chip}
                  </button>
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="form-input"
                    style={{ width: '70px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                    value={quickAttVal}
                    onChange={(e) => setQuickAttVal(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleApplyToAllDays(quickAttVal)}
                  >
                    Apply All
                  </button>
                </div>
              </div>
            </div>

            {/* 7 Days List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <div className="whole-week-grid-header">
                <span>Day</span>
                <span>Attendance Units</span>
                <span>Advance Borrowed (₹)</span>
              </div>

              {daysOfWeek.map((day) => {
                const cur = dayValues[day.isoDate] || { attendance: 0, borrowed: 0 };
                return (
                  <div key={day.isoDate} className="whole-week-row">
                    <div className="whole-week-day-col">
                      <div className="day-name-bold">
                        {day.dayName}
                      </div>
                      <div className="day-date-sub">
                        {day.dateNumber} {day.monthName}
                      </div>
                    </div>

                    {/* Attendance Input */}
                    <div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className="form-input tabular-nums"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.88rem' }}
                        value={cur.attendance}
                        onChange={(e) => handleDayChange(day.isoDate, 'attendance', e.target.value)}
                        placeholder="Units"
                      />
                    </div>

                    {/* Advance Input or + Button */}
                    <div>
                      {cur.borrowed > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div className="input-with-symbol" style={{ flex: 1 }}>
                            <span className="input-symbol" style={{ fontSize: '0.8rem', left: '0.5rem' }}>₹</span>
                            <input
                              type="number"
                              step="100"
                              min="0"
                              className="form-input tabular-nums"
                              style={{ padding: '0.4rem 0.4rem 0.4rem 1.4rem', fontSize: '0.85rem' }}
                              value={cur.borrowed}
                              onChange={(e) => handleDayChange(day.isoDate, 'borrowed', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            style={{ width: '30px', height: '30px', flexShrink: 0, color: 'var(--color-advance)', padding: 0 }}
                            onClick={() => handleDayChange(day.isoDate, 'borrowed', 0)}
                            title="Remove borrow"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-add-borrow-day"
                          onClick={() => handleDayChange(day.isoDate, 'borrowed', 500)}
                          title="Add advance borrow for this day"
                        >
                          <Plus size={13} color="var(--color-advance)" />
                          <span>+ Borrow</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Week Summary Box */}
            <div className="whole-week-summary-grid">
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Units</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--role-mhelper)' }}>{totalAtt}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Advance</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-advance)' }}>₹{totalBor.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Amount</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Balance</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-success)' }}>₹{balance.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-outline-red" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-green"
            >
              <Check size={16} />
              Save Whole Week
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
