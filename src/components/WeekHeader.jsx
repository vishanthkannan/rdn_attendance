import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Lock } from 'lucide-react';
import { formatWeekRange, getRecentWeeks, getCurrentWeekStart, shiftWeek } from '../utils/dateUtils';

export default function WeekHeader({ 
  currentWeekStart, 
  onSelectWeek,
  isWeekClosed,
  closedWeeks = []
}) {
  const currentWeekId = getCurrentWeekStart();
  const isCurrentWeek = currentWeekStart === currentWeekId;
  const formattedRange = formatWeekRange(currentWeekStart);

  // Dynamically generate rolling recent weeks (2 past weeks, current week, 1 next week)
  const recentWeeks = useMemo(() => {
    return getRecentWeeks(2, 1);
  }, []);

  const handlePrev = () => {
    const prev = shiftWeek(currentWeekStart, -1);
    onSelectWeek(prev);
  };

  const handleNext = () => {
    const next = shiftWeek(currentWeekStart, 1);
    onSelectWeek(next);
  };

  return (
    <div className={`week-navigator-card ${isWeekClosed ? 'is-closed-week' : ''}`}>
      <div className="week-nav-main">
        {/* Previous Week Navigation */}
        <button 
          className="week-arrow-btn" 
          onClick={handlePrev}
          title="Previous Week"
          aria-label="Previous Week"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Selected Week Display */}
        <div className="week-center-info">
          <div className="week-tag">WEEK</div>
          <div className="week-range-text">{formattedRange}</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            {isCurrentWeek && (
              <span className="current-week-indicator">Current Week</span>
            )}

            {!isCurrentWeek && (
              <button 
                className="btn btn-outline-blue btn-sm" 
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.74rem' }}
                onClick={() => onSelectWeek(currentWeekId)}
              >
                Back to Current Week
              </button>
            )}
          </div>
        </div>

        {/* Next Week Navigation */}
        <button 
          className="week-arrow-btn" 
          onClick={handleNext}
          title="Next Week"
          aria-label="Next Week"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dynamic Selectable Recent Weeks */}
      <div className="recent-weeks-container">
        <span className="recent-weeks-label">
          <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          Recent Weeks:
        </span>
        {recentWeeks.map((preset) => {
          const isActive = preset.startDate === currentWeekStart;
          const isPresetClosed = closedWeeks.includes(preset.startDate);
          return (
            <button
              key={preset.id}
              className={`week-pill ${isActive ? 'active' : ''} ${isPresetClosed ? 'pill-closed' : ''}`}
              onClick={() => onSelectWeek(preset.startDate)}
            >
              {isPresetClosed && <Lock size={12} style={{ color: isActive ? '#ffffff' : '#dc2626' }} />}
              {preset.label}
              {preset.isCurrent && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(Current)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
