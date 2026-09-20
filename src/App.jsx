import React, { useState, useEffect, useMemo } from 'react';
import WeekHeader from './components/WeekHeader';
import AttendanceTable from './components/AttendanceTable';
import CellEditorModal from './components/CellEditorModal';
import AddMasonModal from './components/AddMasonModal';
import WholeWeekModal from './components/WholeWeekModal';
import ExportModal from './components/ExportModal';
import { 
  getDaysOfWeek, 
  CURRENT_WEEK_ID,
  formatWeekRange,
  isWorkerVisibleInWeek,
  getWorkerAssignedWeek
} from './utils/dateUtils';
import { 
  loadMasons, 
  saveMasons, 
  loadAttendance, 
  saveAttendance, 
  loadClosedWeeks,
  saveClosedWeeks
} from './utils/storage';
import { isSupabaseConfigured } from './utils/supabaseClient';
import { 
  fetchAllCloudData,
  saveAttendanceCellCloud,
  saveWholeWeekCloud,
  addEmployeeGroupCloud,
  updateWorkerWageCloud,
  deleteWorkerCloud,
  deleteGroupCloud,
  toggleClosedWeekCloud,
  subscribeToRealtimeChanges
} from './services/supabaseService';
import { 
  Download, 
  Check, 
  Search,
  Lock,
  Unlock,
  UserPlus,
  X
} from 'lucide-react';

export default function App() {
  // Ensure light mode is always active and clear any saved dark theme
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('rdn_theme');
  }, []);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Active Week State (Defaults to current week Monday dynamically)
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

  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Online / Offline Detection
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('🟢 Attendance is live');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('🔴 You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOpenAddWorker = () => {
    if (isCurrentWeekClosed) return;
    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet to add employees.');
      showToast('⚠️ Attendance is not saved! You are offline.');
      return;
    }
    setIsAddWorkerOpen(true);
  };

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Load from Supabase Cloud on initial mount (if credentials are set in .env)
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchAllCloudData()
        .then((cloudData) => {
          if (cloudData) {
            if (Array.isArray(cloudData.masons)) {
              setMasons(cloudData.masons);
              saveMasons(cloudData.masons);
            }
            if (cloudData.attendance !== undefined && cloudData.attendance !== null) setAttendance(cloudData.attendance);
            if (cloudData.closedWeeks) setClosedWeeks(cloudData.closedWeeks);
            showToast('Connected & synced with Supabase Cloud');
          }
        })
        .catch((err) => console.warn('Supabase fetch failed:', err));
    }
  }, []);

  // Live Real-Time Multi-Device Sync: updates state instantly when another phone/computer makes changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const unsubscribe = subscribeToRealtimeChanges({
      onAttendanceChange: (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          if (!row || !row.worker_id || !row.attendance_date) return;
          const weekKey = row.week_start;
          const workerId = row.worker_id;
          const dateStr = row.attendance_date;
          const newAtt = Number(row.attendance) || 0;
          const newBor = Number(row.borrowed) || 0;

          setAttendance((prev) => {
            const prevWeek = prev[weekKey] || {};
            const prevWorker = prevWeek[workerId] || {};
            const existing = prevWorker[dateStr];
            if (existing && existing.attendance === newAtt && existing.borrowed === newBor) {
              return prev;
            }
            return {
              ...prev,
              [weekKey]: {
                ...prevWeek,
                [workerId]: {
                  ...prevWorker,
                  [dateStr]: {
                    attendance: newAtt,
                    borrowed: newBor
                  }
                }
              }
            };
          });
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old;
          if (!old || !old.worker_id || !old.attendance_date) return;
          const weekKey = old.week_start;
          const workerId = old.worker_id;
          const dateStr = old.attendance_date;

          setAttendance((prev) => {
            if (!prev[weekKey]?.[workerId]?.[dateStr]) return prev;
            const updatedWorker = { ...prev[weekKey][workerId] };
            delete updatedWorker[dateStr];
            return {
              ...prev,
              [weekKey]: {
                ...prev[weekKey],
                [workerId]: updatedWorker
              }
            };
          });
        }
      },
      onWorkerChange: (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const w = payload.new;
          if (!w || !w.id) return;
          const assignedWeek = w.assigned_week || w.created_at_week || getWorkerAssignedWeek({ id: w.id, groupId: w.group_id });
          const updatedWorker = {
            id: w.id,
            groupId: w.group_id,
            groupName: w.group_name,
            name: w.name,
            category: w.category,
            wage: Number(w.wage) || 0,
            assignedWeek: assignedWeek,
            createdAtWeek: assignedWeek,
            deletedAtWeek: w.deleted_at_week || null,
            deletedAt: w.deleted_at || null
          };
          setMasons((prev) => {
            const index = prev.findIndex((m) => m.id === w.id);
            if (index >= 0) {
              const current = prev[index];
              if (
                current.wage === updatedWorker.wage &&
                current.name === updatedWorker.name &&
                current.groupName === updatedWorker.groupName &&
                current.category === updatedWorker.category &&
                current.deletedAtWeek === updatedWorker.deletedAtWeek &&
                current.createdAtWeek === updatedWorker.createdAtWeek &&
                current.assignedWeek === updatedWorker.assignedWeek
              ) {
                return prev;
              }
              const next = [...prev];
              next[index] = updatedWorker;
              return next;
            }
            return [...prev, updatedWorker];
          });
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            setMasons((prev) => prev.filter((m) => m.id !== oldId));
          }
        }
      },
      onGroupChange: (payload) => {
        if (payload.eventType === 'DELETE' && payload.old?.id) {
          const groupId = payload.old.id;
          setMasons((prev) => prev.filter((m) => m.groupId !== groupId));
        }
      },
      onClosedWeekChange: (payload) => {
        if (payload.eventType === 'INSERT') {
          const weekId = payload.new?.week_id;
          if (weekId) {
            setClosedWeeks((prev) => (prev.includes(weekId) ? prev : [...prev, weekId]));
          }
        } else if (payload.eventType === 'DELETE') {
          const weekId = payload.old?.week_id;
          if (weekId) {
            setClosedWeeks((prev) => prev.filter((w) => w !== weekId));
          }
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

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

  // Workers visible in the currently viewed week (preserves historical workers when viewing past weeks)
  const visibleMasonsForCurrentWeek = useMemo(() => {
    return masons.filter((worker) => 
      isWorkerVisibleInWeek(worker, currentWeekStart, attendance[currentWeekStart])
    );
  }, [masons, currentWeekStart, attendance]);

  // Filtered masons based on search (searches groupName, worker name, category)
  const filteredMasons = useMemo(() => {
    if (!searchTerm.trim()) return visibleMasonsForCurrentWeek;
    const term = searchTerm.toLowerCase();
    return visibleMasonsForCurrentWeek.filter((m) => 
      (m.groupName && m.groupName.toLowerCase().includes(term)) ||
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.category && m.category.toLowerCase().includes(term))
    );
  }, [visibleMasonsForCurrentWeek, searchTerm]);

  // Toggle Week Close / Reopen
  const handleToggleCloseWeek = () => {
    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet.');
      showToast('⚠️ You are offline.');
      return;
    }
    const nextClosed = !isCurrentWeekClosed;
    if (isCurrentWeekClosed) {
      setClosedWeeks((prev) => prev.filter((w) => w !== currentWeekStart));
    } else {
      setClosedWeeks((prev) => [...prev, currentWeekStart]);
    }
    toggleClosedWeekCloud(currentWeekStart, nextClosed);
  };

  // Cell Click Handler
  const handleCellClick = (worker, dayInfo, currentData) => {
    if (isCurrentWeekClosed) return;
    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet to mark attendance.');
      showToast('⚠️ Attendance is not saved! You are offline.');
      return;
    }
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
    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet to mark attendance.');
      showToast('⚠️ Attendance is not saved! You are offline.');
      return;
    }
    setWholeWeekModalState({
      isOpen: true,
      worker
    });
  };

  // Save Attendance & Borrowed Amount for a Cell (with whole-week shortcut option)
  const handleSaveCell = ({ attendance: attVal, borrowed: borVal, applyToWholeWeek }) => {
    const { worker, dayInfo } = cellModalState;
    if (!worker || !dayInfo || isCurrentWeekClosed) return;

    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet to mark attendance.');
      showToast('⚠️ Attendance is not saved! You are offline.');
      return;
    }

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

    // Cloud Sync
    if (applyToWholeWeek) {
      const dayValues = {};
      daysOfWeek.forEach((d) => {
        dayValues[d.isoDate] = {
          attendance: attVal,
          borrowed: d.isoDate === dayInfo.isoDate ? borVal : (weekAttendance[worker.id]?.[d.isoDate]?.borrowed || 0)
        };
      });
      saveWholeWeekCloud({ weekStart: currentWeekStart, workerId: worker.id, dayValues });
      showToast(`Applied ${attVal} attendance to all 7 days for ${worker.name}`);
    } else {
      saveAttendanceCellCloud({
        weekStart: currentWeekStart,
        workerId: worker.id,
        attendanceDate: dayInfo.isoDate,
        attendance: attVal,
        borrowed: borVal
      });
      showToast(`Updated ${worker.name} on ${dayInfo.dayName}`);
    }
  };

  // Save Whole Week from WholeWeekModal
  const handleSaveWholeWeek = (worker, dayValues) => {
    if (isCurrentWeekClosed) return;

    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet to mark attendance.');
      showToast('⚠️ Attendance is not saved! You are offline.');
      return;
    }

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

    saveWholeWeekCloud({ weekStart: currentWeekStart, workerId: worker.id, dayValues });
    showToast(`Updated whole week attendance for ${worker.name}`);
  };

  // Add Employee Handler (Adds 3 rows: Manson, M-Helper, F-Helper grouped by entered name)
  const handleAddEmployee = ({ name, masonWage, mHelperWage, fHelperWage }) => {
    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet to add employees.');
      showToast('⚠️ Attendance is not saved! You are offline.');
      return;
    }
    const groupName = name.trim();
    const groupId = `group_${currentWeekStart}_${Date.now()}`;
    const newWorkers = [
      {
        id: `${groupId}_mason`,
        groupId,
        groupName,
        name: 'Manson',
        category: 'Manson',
        wage: Math.max(0, parseFloat(masonWage) || 0),
        assignedWeek: currentWeekStart,
        createdAtWeek: currentWeekStart,
        deletedAtWeek: null
      },
      {
        id: `${groupId}_mhelper`,
        groupId,
        groupName,
        name: 'M-Helper',
        category: 'M-Helper',
        wage: Math.max(0, parseFloat(mHelperWage) || 0),
        assignedWeek: currentWeekStart,
        createdAtWeek: currentWeekStart,
        deletedAtWeek: null
      },
      {
        id: `${groupId}_fhelper`,
        groupId,
        groupName,
        name: 'F-Helper',
        category: 'F-Helper',
        wage: Math.max(0, parseFloat(fHelperWage) || 0),
        assignedWeek: currentWeekStart,
        createdAtWeek: currentWeekStart,
        deletedAtWeek: null
      }
    ];

    setMasons((prev) => [...prev, ...newWorkers]);
    addEmployeeGroupCloud({ groupId, groupName, workers: newWorkers });
    showToast(`Added employee ${groupName} with 3 rows (Manson, M-Helper, F-Helper)`);
  };

  // Delete Individual Worker Row (soft-deletes starting from current week onwards, safely preserves past weeks)
  const handleDeleteWorker = (workerId, workerName) => {
    if (isCurrentWeekClosed) return;
    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet.');
      showToast('⚠️ You are offline.');
      return;
    }

    const currentRange = formatWeekRange(currentWeekStart);
    if (window.confirm(`Delete ${workerName} from this week (${currentRange})?\n\nNote: Any past weeks and previous months records will remain safely preserved!`)) {
      // 1. Mark worker as deleted from currentWeekStart onwards
      setMasons((prev) => {
        const updated = prev.map((w) => {
          if (w.id === workerId) {
            return {
              ...w,
              deletedAtWeek: currentWeekStart,
              deletedAt: new Date().toISOString()
            };
          }
          return w;
        });
        saveMasons(updated);
        return updated;
      });

      // 2. Clear current week draft attendance for this worker
      setAttendance((prev) => {
        if (!prev[currentWeekStart]?.[workerId]) return prev;
        const updatedWeek = { ...prev[currentWeekStart] };
        delete updatedWeek[workerId];
        const next = {
          ...prev,
          [currentWeekStart]: updatedWeek
        };
        saveAttendance(next);
        return next;
      });

      // 3. Update Supabase
      deleteWorkerCloud(workerId, currentWeekStart);
      showToast(`Removed row ${workerName} from this week onwards (past records preserved)`);
    }
  };

  // Delete Entire Employee Group (soft-deletes group from current week onwards, safely preserves past weeks)
  const handleDeleteGroup = (groupId, groupName) => {
    if (isCurrentWeekClosed) return;
    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet.');
      showToast('⚠️ You are offline.');
      return;
    }

    const currentRange = formatWeekRange(currentWeekStart);
    if (window.confirm(`Delete employee group "${groupName}" from this week (${currentRange})?\n\nNote: Any past weeks and previous months records will remain safely preserved!`)) {
      // 1. Mark all workers in this group as deleted from currentWeekStart onwards
      setMasons((prev) => {
        const updated = prev.map((w) => {
          if ((w.groupId || w.id) === groupId) {
            return {
              ...w,
              deletedAtWeek: currentWeekStart,
              deletedAt: new Date().toISOString()
            };
          }
          return w;
        });
        saveMasons(updated);
        return updated;
      });

      // 2. Clear current week attendance for workers in this group
      setAttendance((prev) => {
        const weekData = prev[currentWeekStart];
        if (!weekData) return prev;
        const groupWorkerIds = masons
          .filter((w) => (w.groupId || w.id) === groupId)
          .map((w) => w.id);
        
        let changed = false;
        const updatedWeek = { ...weekData };
        groupWorkerIds.forEach((wId) => {
          if (updatedWeek[wId]) {
            delete updatedWeek[wId];
            changed = true;
          }
        });

        if (!changed) return prev;
        const next = {
          ...prev,
          [currentWeekStart]: updatedWeek
        };
        saveAttendance(next);
        return next;
      });

      // 3. Update Supabase
      deleteGroupCloud(groupId, currentWeekStart);
      showToast(`Removed employee group ${groupName} from this week (past records preserved)`);
    }
  };

  // Update Worker Wage per Work
  const handleUpdateWorkerWage = (workerId, newWage) => {
    if (isCurrentWeekClosed) return;
    if (!isOnline) {
      alert('Attendance is not saved! You are currently offline. Please connect to the internet.');
      showToast('⚠️ You are offline.');
      return;
    }
    const parsedWage = Math.max(0, parseFloat(newWage) || 0);
    setMasons((prev) => 
      prev.map((w) => w.id === workerId ? { ...w, wage: parsedWage } : w)
    );
    updateWorkerWageCloud(workerId, parsedWage);
  };


  // Count unique employee groups in currently viewed week
  const groupCount = useMemo(() => {
    return new Set(visibleMasonsForCurrentWeek.map((m) => m.groupId || m.groupName || m.name)).size;
  }, [visibleMasonsForCurrentWeek]);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="brand-badge">
          <img 
            src="/rdn_logo.png" 
            alt="RDN CREATORS" 
            className="brand-logo-img" 
          />
          <div className="brand-divider" />
          <div className="brand-title-group">
            <div className="brand-title-row">
              <h1>RDN CREATORS</h1>            </div>
            <p>Workers Weekly Attendance &amp; Payroll</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Top Right Live Attendance Indicator - Just a Green Dot */}
          <div 
            className={`live-status-dot-indicator ${isOnline ? 'online' : 'offline'}`}
            title={isOnline ? 'Attendance is live (Online)' : 'You are offline (Attendance not saved)'}
            aria-label={isOnline ? 'Attendance is live' : 'You are offline'}
            onClick={() => showToast(isOnline ? '🟢 Attendance is live' : '🔴 You are offline - Attendance is not saved')}
          >
            <span className={`live-dot ${isOnline ? 'green' : 'red'}`} />
          </div>
        </div>
      </header>

      {/* Offline Alert Notification Banner */}
      {!isOnline && (
        <div className="offline-alert-banner" role="alert">
          <span className="offline-banner-icon">⚠️</span>
          <span>
            <strong>You are offline:</strong> Attendance is not saved! Please connect to the internet to record attendance.
          </span>
        </div>
      )}

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
          <div className="table-toolbar-left">
            <div className="table-toolbar-title">
              <h3>Site Attendance</h3>
              <span className="table-count-badge">
                {groupCount} {groupCount === 1 ? 'Group' : 'Groups'} • {masons.length} Rows
              </span>
            </div>
          </div>

          <div className="table-toolbar-actions">
            {/* Search Filter */}
            <div className="table-search-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="table-search-input"
                placeholder="Search employee"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Export Report / CSV Button */}
            <button 
              type="button"
              className="btn btn-export" 
              onClick={() => setIsExportModalOpen(true)}
              title="Export weekly or monthly attendance & payroll (CSV / PDF)"
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            {/* Add Employee CTA Button */}
            <button 
              type="button"
              className="btn btn-add-employee"
              onClick={() => handleOpenAddWorker()}
              title="Add a new employee group (Mason, M-Helper, F-Helper)"
            >
              <UserPlus size={15} />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* The Weekly Attendance Table */}
        <AttendanceTable 
          daysOfWeek={daysOfWeek}
          workers={filteredMasons}
          weekAttendance={weekAttendance}
          onCellClick={handleCellClick}
          onDeleteWorker={handleDeleteWorker}
          onDeleteGroup={handleDeleteGroup}
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
        isOnline={isOnline}
      />

      {/* Whole Week Attendance Modal */}
      <WholeWeekModal
        isOpen={wholeWeekModalState.isOpen}
        onClose={() => setWholeWeekModalState({ isOpen: false, worker: null })}
        worker={wholeWeekModalState.worker}
        daysOfWeek={daysOfWeek}
        currentWeekAttendance={wholeWeekModalState.worker ? (weekAttendance[wholeWeekModalState.worker.id] || {}) : {}}
        onSaveWholeWeek={handleSaveWholeWeek}
        isOnline={isOnline}
      />

      {/* Add Employee Modal */}
      <AddMasonModal 
        isOpen={isAddWorkerOpen}
        onClose={() => setIsAddWorkerOpen(false)}
        onAddMason={handleAddEmployee}
      />

      {/* Export Report Modal (Weekly or Monthly Choice with UTF-8 BOM encoding) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentWeekStart={currentWeekStart}
        masons={masons}
        attendance={attendance}
        closedWeeks={closedWeeks}
        daysOfWeek={daysOfWeek}
        onExportDone={(msg) => showToast(msg)}
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
