import React, { useState, useEffect, useMemo } from 'react';
import WeekHeader from './components/WeekHeader';
import AttendanceTable from './components/AttendanceTable';
import CellEditorModal from './components/CellEditorModal';
import AddMasonModal from './components/AddMasonModal';
import AddWorkerModal from './components/AddWorkerModal';
import WholeWeekModal from './components/WholeWeekModal';
import { 
  getDaysOfWeek, 
  formatWeekRange, 
  CURRENT_WEEK_ID 
} from './utils/dateUtils';
import { 
  loadMasons, 
  saveMasons, 
  loadAttendance, 
  saveAttendance, 
  loadClosedWeeks,
  saveClosedWeeks,
  resetAllData 
} from './utils/storage';
import { 
  Building2, 
  HardHat, 
  Download, 
  RotateCcw, 
  Check, 
  Search,
  Lock,
  Unlock,
  UserPlus
} from 'lucide-react';

export default function App() {
  // Active Week State (Defaults to 08 Sep - 14 Sep 2026)
  const [currentWeekStart, setCurrentWeekStart] = useState(CURRENT_WEEK_ID);

  // Data States
  const [masons, setMasons] = useState(loadMasons);
  const [attendance, setAttendance] = useState(loadAttendance);
  const [closedWeeks, setClosedWeeks] = useState(loadClosedWeeks);

  // Modal States
  const [cellModalState, setCellModalState] = useState({
    isOpen: false,
    worker: null,
    dayInfo: null,
    currentData: null
  });

  const [wholeWeekModalState, setWholeWeekModalState] = useState({
    isOpen: false,
    worker: null
  });

  const [isAddMasonOpen, setIsAddMasonOpen] = useState(false);
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [targetMasonIdForWorker, setTargetMasonIdForWorker] = useState(null);

  const handleOpenAddWorker = (masonId = null) => {
    if (isCurrentWeekClosed) return;
    setTargetMasonIdForWorker(masonId);
    setIsAddWorkerOpen(true);
  };

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync to localStorage
  useEffect(() => {
    saveMasons(masons);
  }, [masons]);

  useEffect(() => {
    saveAttendance(attendance);
  }, [attendance]);

  useEffect(() => {
    saveClosedWeeks(closedWeeks);
  }, [closedWeeks]);

  // Days of currently viewed week
  const daysOfWeek = useMemo(() => {
    return getDaysOfWeek(currentWeekStart);
  }, [currentWeekStart]);

  // Check if active week is locked/closed
  const isCurrentWeekClosed = useMemo(() => {
    return closedWeeks.includes(currentWeekStart);
  }, [closedWeeks, currentWeekStart]);

  // Current week's attendance map
  const weekAttendance = useMemo(() => {
    return attendance[currentWeekStart] || {};
  }, [attendance, currentWeekStart]);

  // Filtered masons based on search
  const filteredMasons = useMemo(() => {
    if (!searchTerm.trim()) return masons;
    return masons.filter((m) => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [masons, searchTerm]);

  // Toggle Week Close / Reopen
  const handleToggleCloseWeek = () => {
    if (isCurrentWeekClosed) {
      setClosedWeeks((prev) => prev.filter((w) => w !== currentWeekStart));
    } else {
      setClosedWeeks((prev) => [...prev, currentWeekStart]);
    }
  };

  // Cell Click Handler
  const handleCellClick = (worker, dayInfo, currentData) => {
    if (isCurrentWeekClosed) return;
    setCellModalState({
      isOpen: true,
      worker,
      dayInfo,
      currentData
    });
  };

  // Open Whole Week Attendance Modal
  const handleOpenWholeWeek = (worker) => {
    if (isCurrentWeekClosed) return;
    setWholeWeekModalState({
      isOpen: true,
      worker
    });
  };

  // Save Attendance & Borrowed Amount for a Cell (with whole-week shortcut option)
  const handleSaveCell = ({ attendance: attVal, borrowed: borVal, applyToWholeWeek }) => {
    const { worker, dayInfo } = cellModalState;
    if (!worker || !dayInfo || isCurrentWeekClosed) return;

    setAttendance((prev) => {
      const prevWeek = prev[currentWeekStart] || {};
      const prevRow = prevWeek[worker.id] || {};

      let updatedRow;
      if (applyToWholeWeek) {
        updatedRow = { ...prevRow };
        daysOfWeek.forEach((d) => {
          const prevDay = prevRow[d.isoDate] || {};
          updatedRow[d.isoDate] = {
            attendance: attVal,
            borrowed: d.isoDate === dayInfo.isoDate ? borVal : (prevDay.borrowed || 0)
          };
        });
      } else {
        updatedRow = {
          ...prevRow,
          [dayInfo.isoDate]: {
            attendance: attVal,
            borrowed: borVal
          }
        };
      }

      return {
        ...prev,
        [currentWeekStart]: {
          ...prevWeek,
          [worker.id]: updatedRow
        }
      };
    });

    if (applyToWholeWeek) {
      showToast(`Applied ${attVal} attendance to all 7 days for ${worker.name}`);
    } else {
      showToast(`Updated ${worker.name} on ${dayInfo.dayName}`);
    }
  };

  // Save Whole Week from WholeWeekModal
  const handleSaveWholeWeek = (worker, dayValues) => {
    if (isCurrentWeekClosed) return;

    setAttendance((prev) => {
      const prevWeek = prev[currentWeekStart] || {};
      const prevRow = prevWeek[worker.id] || {};

      const updatedRow = {
        ...prevRow,
        ...dayValues
      };

      return {
        ...prev,
        [currentWeekStart]: {
          ...prevWeek,
          [worker.id]: updatedRow
        }
      };
    });

    showToast(`Updated whole week attendance for ${worker.name}`);
  };

  // Add Employee Handler (Individual Worker: Name, Category, Wage)
  const handleAddEmployee = ({ name, category, wage }) => {
    const newWorker = {
      id: `worker-${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      wage: Math.max(0, parseFloat(wage) || 0)
    };
    setMasons((prev) => [...prev, newWorker]);
    showToast(`Added ${newWorker.category} (${newWorker.name})`);
  };

  // Delete Individual Worker
  const handleDeleteWorker = (workerId, workerName) => {
    if (isCurrentWeekClosed) return;

    if (window.confirm(`Delete ${workerName}?`)) {
      setMasons((prev) => prev.filter((w) => w.id !== workerId));
      showToast(`Removed ${workerName}`);
    }
  };

  // Update Worker Wage per Work
  const handleUpdateWorkerWage = (workerId, newWage) => {
    if (isCurrentWeekClosed) return;
    const parsedWage = Math.max(0, parseFloat(newWage) || 0);
    setMasons((prev) => 
      prev.map((w) => w.id === workerId ? { ...w, wage: parsedWage } : w)
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const rangeStr = formatWeekRange(currentWeekStart);
    const lockStatus = isCurrentWeekClosed ? 'CLOSED / LOCKED' : 'ACTIVE / OPEN';
    let csv = `Civil Workers Weekly Attendance Sheet\nWeek: ${rangeStr}\nStatus: ${lockStatus}\n\n`;
    
    // Headers
    const dayHeaders = daysOfWeek.map((d) => `"${d.dayName} (${d.dateNumber})"`).join(',');
    csv += `"Worker Name","Category","Wage Rate",${dayHeaders},"Advance (B)","Total Work","Total Amount","Balance to be Paid"\n`;

    masons.forEach((w) => {
      const rowAtt = weekAttendance[w.id] || {};
      let totalWork = 0;
      let totalAdvance = 0;

      const dayCols = daysOfWeek.map((day) => {
        const rec = rowAtt[day.isoDate];
        if (!rec) return '"0"';
        const att = rec.attendance || 0;
        const bor = rec.borrowed || 0;
        totalWork += att;
        totalAdvance += bor;
        return bor > 0 ? `"${att} (B: ₹${bor})"` : `"${att}"`;
      });

      const totalAmount = totalWork * (w.wage || 0);
      const balance = totalAmount - totalAdvance;

      csv += `"${w.name}","${w.category}",${w.wage},${dayCols.join(',')},${totalAdvance},${totalWork},${totalAmount},${balance}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Civil_Weekly_Attendance_${currentWeekStart}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported weekly muster roll to CSV');
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="brand-badge">
          <div className="brand-icon-box">
            <Building2 size={24} />
          </div>
          <div className="brand-title-group">
            <h1>RDN Workers Weekly Attendance</h1>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleExportCSV}
            title="Export CSV spreadsheet"
          >
            <Download size={14} />
            Export CSV
          </button>

          {/* Add Employee Option */}
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenAddWorker()}
            title="Add employee (Mason, M - Helper, F - Helper, Other) to roster"
          >
            <UserPlus size={16} />
            Add Employee
          </button>
        </div>
      </header>

      {/* 1. Week Header with Close/Reopen option and Recent Weeks */}
      <WeekHeader 
        currentWeekStart={currentWeekStart} 
        onSelectWeek={(newWeek) => setCurrentWeekStart(newWeek)} 
        isWeekClosed={isCurrentWeekClosed}
        onToggleCloseWeek={handleToggleCloseWeek}
        closedWeeks={closedWeeks}
      />



      {/* 2. Attendance Table Container */}
      <div className="table-container">
        {/* Table Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-title">
            <h3>Site Attendance &amp; Wages Roster</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              ({masons.length} Employees hired)
            </span>
          </div>

          {/* Search Filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.35rem', paddingBottom: '0.35rem', fontSize: '0.82rem', width: '200px' }}
              placeholder="Search employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* The Weekly Attendance Table */}
        <AttendanceTable 
          daysOfWeek={daysOfWeek}
          workers={filteredMasons}
          weekAttendance={weekAttendance}
          onCellClick={handleCellClick}
          onDeleteWorker={handleDeleteWorker}
          isWeekClosed={isCurrentWeekClosed}
          onFillWholeWeek={handleOpenWholeWeek}
          onUpdateWorkerWage={handleUpdateWorkerWage}
        />

        {/* Under-Table Action: Close Week / Reopen Week Button Only */}
        <div className="table-bottom-bar">
          <button
            type="button"
            className={`btn btn-sm ${isCurrentWeekClosed ? 'btn-green' : 'btn-red'}`}
            onClick={handleToggleCloseWeek}
            title={isCurrentWeekClosed ? 'Reopen this week' : 'Close and lock attendance for this week'}
          >
            {isCurrentWeekClosed ? (
              <>
                <Unlock size={14} />
                Reopen Week
              </>
            ) : (
              <>
                <Lock size={14} />
                Close Week
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cell Editor Modal (Daily Attendance & Advance B = ₹, with whole week checkbox) */}
      <CellEditorModal 
        isOpen={cellModalState.isOpen}
        onClose={() => setCellModalState((prev) => ({ ...prev, isOpen: false }))}
        worker={cellModalState.worker}
        dayInfo={cellModalState.dayInfo}
        currentData={cellModalState.currentData}
        onSave={handleSaveCell}
      />

      {/* Whole Week Attendance Modal */}
      <WholeWeekModal
        isOpen={wholeWeekModalState.isOpen}
        onClose={() => setWholeWeekModalState({ isOpen: false, worker: null })}
        worker={wholeWeekModalState.worker}
        daysOfWeek={daysOfWeek}
        currentWeekAttendance={wholeWeekModalState.worker ? (weekAttendance[wholeWeekModalState.worker.id] || {}) : {}}
        onSaveWholeWeek={handleSaveWholeWeek}
      />

      {/* Add Employee Modal (Employee Name, Category: Mason, M - Helper, F - Helper, Other, Wage) */}
      <AddMasonModal 
        isOpen={isAddWorkerOpen}
        onClose={() => setIsAddWorkerOpen(false)}
        onAddMason={handleAddEmployee}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <Check size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
