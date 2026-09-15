import React, { useState } from 'react';
import { X, HardHat, Check, Tag } from 'lucide-react';

const CATEGORY_DEFAULT_WAGES = {
  'Mason': 0,
  'M - Helper': 0,
  'F - Helper': 0,
  'Other': 0
};

export default function AddWorkerModal({ 
  isOpen, 
  onClose, 
  onAddWorker 
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Mason');
  const [otherCategory, setOtherCategory] = useState('');

  if (!isOpen) return null;

  const currentWage = CATEGORY_DEFAULT_WAGES[category] || 700;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (category === 'Other' && !otherCategory.trim()) {
      alert('Please enter the name of the category');
      return;
    }

    const finalCategory = category === 'Other' ? otherCategory.trim() : category;

    onAddWorker({
      name: name.trim(),
      category: finalCategory,
      wage: currentWage
    });

    onClose();
    setName('');
    setCategory('Mason');
    setOtherCategory('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon-box" style={{ width: '38px', height: '38px' }}>
              <HardHat size={20} color="#ffffff" />
            </div>
            <div>
              <h3>Add Employee</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Add worker to the weekly attendance
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
              <label className="form-label" htmlFor="worker-name-input">
                Employee Name *
              </label>
              <input
                id="worker-name-input"
                type="text"
                className="form-input"
                required
                placeholder="Enter employee name (e.g. Suresh, Ramesh, Mani)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* 2. Category Selection Dropdown: Mason, M - Helper, F - Helper, Other */}
            <div className="form-group">
              <label className="form-label" htmlFor="worker-category-select">
                Category *
              </label>
              <select
                id="worker-category-select"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Mason">Mason</option>
                <option value="M - Helper">M - Helper</option>
                <option value="F - Helper">F - Helper</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* 3. Dynamic Text Field if Other is Selected */}
            {category === 'Other' && (
              <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-in' }}>
                <label className="form-label" htmlFor="other-category-input">
                  Specify Category Name *
                </label>
                <div className="input-with-symbol" style={{ position: 'relative' }}>
                  <span className="input-symbol">
                    <Tag size={15} />
                  </span>
                  <input
                    id="other-category-input"
                    type="text"
                    className="form-input"
                    required
                    placeholder="Enter category name (e.g. Carpenter, Painter, Bar Bender)"
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            )}
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
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
