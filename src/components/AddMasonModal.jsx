import React, { useState } from 'react';
import { X, HardHat, Check, Users } from 'lucide-react';

export default function AddMasonModal({
  isOpen,
  onClose,
  onAddMason
}) {
  const [name, setName] = useState('');
  const [masonWage, setMasonWage] = useState('0');
  const [mHelperWage, setMHelperWage] = useState('0');
  const [fHelperWage, setFHelperWage] = useState('0');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddMason({
      name: name.trim(),
      masonWage: Math.max(0, parseFloat(masonWage) || 0),
      mHelperWage: Math.max(0, parseFloat(mHelperWage) || 0),
      fHelperWage: Math.max(0, parseFloat(fHelperWage) || 0)
    });

    onClose();
    setName('');
    setMasonWage('0');
    setMHelperWage('0');
    setFHelperWage('0');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon-box" style={{ width: '38px', height: '38px' }}>
              <HardHat size={20} color="#ffffff" />
            </div>
            <div>
              <h3>Add Employee</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Creates a group
              </p>
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
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 1. Employee Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="employee-name-input">
                Employee / Lead Name *
              </label>
              <input
                id="employee-name-input"
                type="text"
                className="form-input"
                required
                placeholder="Mason or Employee name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                This name will be displayed as the header above the group.
              </span>
            </div>

            {/* 2. Group Rows Preview & Wages */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Users size={15} color="var(--primary-600)" />
                <label className="form-label" style={{ marginBottom: 0 }}>
                  3 Rows in this Group (Default Wages per Work)
                </label>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                background: 'var(--bg-surface-elevated, #f8fafc)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-subtle, #e2e8f0)'
              }}>
                {/* Row 1: Manson */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Manson</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      className="form-input tabular-nums"
                      style={{ width: '90px', padding: '0.25rem 0.5rem', fontSize: '0.84rem', textAlign: 'right' }}
                      value={masonWage}
                      onChange={(e) => setMasonWage(e.target.value)}
                      title="Manson daily wage rate"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Row 2: M-Helper */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>M-Helper</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      className="form-input tabular-nums"
                      style={{ width: '90px', padding: '0.25rem 0.5rem', fontSize: '0.84rem', textAlign: 'right' }}
                      value={mHelperWage}
                      onChange={(e) => setMHelperWage(e.target.value)}
                      title="M-Helper daily wage rate"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Row 3: F-Helper */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>F-Helper</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      className="form-input tabular-nums"
                      style={{ width: '90px', padding: '0.25rem 0.5rem', fontSize: '0.84rem', textAlign: 'right' }}
                      value={fHelperWage}
                      onChange={(e) => setFHelperWage(e.target.value)}
                      title="F-Helper daily wage rate"
                      placeholder="0"
                    />
                  </div>
                </div>
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
              Add Employee (3 Rows)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

