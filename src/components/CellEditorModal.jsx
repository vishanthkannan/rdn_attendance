import React, { useState, useEffect } from 'react';
import { X, Check, Banknote, Calendar, User, Plus } from 'lucide-react';

export default function CellEditorModal({ 
  isOpen, 
  onClose, 
  worker, 
  dayInfo, 
  currentData, 
  onSave 
}) {
  const [attendance, setAttendance] = useState('0');
  const [borrowed, setBorrowed] = useState('0');
  const [showBorrow, setShowBorrow] = useState(false);
  const [applyToWholeWeek, setApplyToWholeWeek] = useState(false);

  useEffect(() => {
    if (isOpen && currentData) {
      setAttendance(currentData.attendance !== undefined ? String(currentData.attendance) : '0');
      const existingBor = currentData.borrowed !== undefined ? String(currentData.borrowed) : '0';
      setBorrowed(existingBor);
      setShowBorrow(parseFloat(existingBor) > 0);
      setApplyToWholeWeek(false);
    } else if (isOpen) {
      setAttendance('0');
      setBorrowed('0');
      setShowBorrow(false);
      setApplyToWholeWeek(false);
    }
  }, [isOpen, currentData]);

  if (!isOpen || !worker || !dayInfo) return null;

  const handleSave = (e) => {
    e?.preventDefault();
    const attNum = Math.max(0, parseFloat(attendance) || 0);
    const borNum = Math.max(0, parseFloat(borrowed) || 0);
    onSave({
      attendance: attNum,
      borrowed: borNum,
      applyToWholeWeek
    });
    onClose();
  };

  const handleClear = () => {
    setAttendance('0');
    setBorrowed('0');
    onSave({
      attendance: 0,
      borrowed: 0
    });
    onClose();
  };

  // Quick attendance options
  const attendanceChips = [0, 0.5, 1, 2, 3, 4];
  const advanceChips = [0, 200, 500, 1000, 1500, 2000];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3>Daily Attendance & Borrowed Advance</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <Calendar size={14} />
              <span>{dayInfo.formattedDay}</span>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Worker Info Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <User size={18} color="var(--accent-amber)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {worker.groupName && worker.groupName !== worker.name ? (
                      <>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{worker.groupName} • </span>
                        <span>{worker.name}</span>
                      </>
                    ) : (
                      worker.name
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Wage Rate: ₹{worker.wagePerWork} / work
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="att-input">
                Attendance Count / Units
              </label>
              <input
                id="att-input"
                type="number"
                step="0.5"
                min="0"
                className="form-input tabular-nums"
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
                placeholder="e.g. 1 or 4"
                autoFocus
              />
              <div className="quick-btn-grid">
                {attendanceChips.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`quick-chip ${parseFloat(attendance) === val ? 'selected' : ''}`}
                    onClick={() => setAttendance(String(val))}
                  >
                    {val === 0 ? '0 (Absent)' : val === 1 ? '1 (Full)' : val === 0.5 ? '½ (Half)' : `${val}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Borrowed Advance Section: Toggle with + Button */}
            {!showBorrow ? (
              <div style={{ marginTop: '0.2rem' }}>
                <button
                  type="button"
                  className="btn-add-borrow-action"
                  onClick={() => {
                    setShowBorrow(true);
                    if (!borrowed || borrowed === '0') setBorrowed('500');
                  }}
                >
                  <Plus size={16} color="var(--color-advance)" />
                  <span>+ Add Borrow / Advance</span>
                </button>
              </div>
            ) : (
              <div className="borrow-active-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" htmlFor="borrowed-input" style={{ margin: 0, color: 'var(--color-advance)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Banknote size={15} />
                    Borrowed Advance Amount (₹)
                  </label>
                  <button
                    type="button"
                    className="btn btn-outline-red btn-sm"
                    style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}
                    onClick={() => {
                      setBorrowed('0');
                      setShowBorrow(false);
                    }}
                  >
                    ✕ Remove Borrow
                  </button>
                </div>
                <div className="input-with-symbol">
                  <span className="input-symbol">₹</span>
                  <input
                    id="borrowed-input"
                    type="number"
                    step="50"
                    min="0"
                    className="form-input tabular-nums"
                    value={borrowed}
                    onChange={(e) => setBorrowed(e.target.value)}
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <div className="quick-btn-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '0.4rem' }}>
                  {advanceChips.filter(c => c > 0).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`quick-chip ${parseFloat(borrowed) === amt ? 'selected' : ''}`}
                      onClick={() => setBorrowed(String(amt))}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Will appear as <strong style={{ color: 'var(--color-advance)' }}>B = ₹{borrowed || 0}</strong> in the cell.
                </div>
              </div>
            )}

            {/* Whole Week Shortcut Checkbox */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <input
                id="apply-whole-week-chk"
                type="checkbox"
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                checked={applyToWholeWeek}
                onChange={(e) => setApplyToWholeWeek(e.target.checked)}
              />
              <label 
                htmlFor="apply-whole-week-chk" 
                style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                Apply this attendance ({attendance} units) to all 7 days of this week
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-outline-red" 
              onClick={handleClear}
            >
              Clear Day
            </button>
            <button 
              type="submit" 
              className="btn btn-green"
            >
              <Check size={16} />
              Save Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
