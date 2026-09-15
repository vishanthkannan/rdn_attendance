import React, { useMemo } from 'react';
import AttendanceCell from './AttendanceCell';
import { Trash2, Zap, HardHat } from 'lucide-react';

export default function AttendanceTable({
  daysOfWeek,
  workers,
  weekAttendance,
  onCellClick,
  onDeleteWorker,
  onDeleteGroup,
  isWeekClosed,
  onFillWholeWeek,
  onUpdateWorkerWage
}) {
  // Compute calculation metrics for a specific worker
  const getWorkerStats = (workerId, wageRate) => {
    const rowAtt = weekAttendance[workerId] || {};
    let totalWork = 0;
    let totalAdvance = 0;

    daysOfWeek.forEach((day) => {
      const record = rowAtt[day.isoDate];
      if (record) {
        totalWork += (parseFloat(record.attendance) || 0);
        totalAdvance += (parseFloat(record.borrowed) || 0);
      }
    });

    const totalAmount = totalWork * (wageRate || 0);
    const balanceToBePaid = totalAmount - totalAdvance;

    return {
      totalWork,
      totalAdvance,
      wage: wageRate || 0,
      totalAmount,
      balanceToBePaid
    };
  };

  // Group workers by groupId (or groupName)
  const groupedWorkers = useMemo(() => {
    const map = new Map();
    workers.forEach((worker) => {
      const gId = worker.groupId || worker.id;
      const gName = worker.groupName || worker.name;
      if (!map.has(gId)) {
        map.set(gId, {
          groupId: gId,
          groupName: gName,
          workers: []
        });
      }
      map.get(gId).workers.push(worker);
    });
    return Array.from(map.values());
  }, [workers]);

  // Grand totals across all individual workers
  let grandTotalWork = 0;
  let grandTotalAdvance = 0;
  let grandTotalAmount = 0;
  let grandTotalBalance = 0;

  workers.forEach((worker) => {
    const stats = getWorkerStats(worker.id, worker.wage);
    grandTotalWork += stats.totalWork;
    grandTotalAdvance += stats.totalAdvance;
    grandTotalAmount += stats.totalAmount;
    grandTotalBalance += stats.balanceToBePaid;
  });

  return (
    <div className="table-responsive-wrapper">
      <table className="attendance-table">
        <thead>
          {/* Main Top Header */}
          <tr className="table-main-header">
            <th className="col-worker-header" title="Worker / Category">
              <div className="th-worker-title">Worker / Category</div>
            </th>
            {daysOfWeek.map((day) => (
              <th key={day.isoDate} className="col-day-header">
                <div className="day-name">{day.dayName}</div>
                <div className="day-date">{day.dateNumber}</div>
              </th>
            ))}
            <th className="col-stat col-stat-advance" title="Total borrowed advances this week">
              <div className="th-stat-title">Advance</div>
              <div className="th-stat-sub">Amount</div>
            </th>
            <th className="col-stat col-stat-work" title="Total attendance units Mon - Sun">
              <div className="th-stat-title">Total</div>
              <div className="th-stat-sub">Work</div>
            </th>
            <th className="col-stat col-stat-wage" title="Daily Wage rate per Work unit">
              <div className="th-stat-title">Wages per</div>
              <div className="th-stat-sub">Work</div>
            </th>
            <th className="col-stat col-stat-amount" title="Total Work × Wages per Work">
              <div className="th-stat-title">Total</div>
              <div className="th-stat-sub">Amount</div>
            </th>
            <th className="col-stat col-stat-balance" title="Total Amount − Advance Amount">
              <div className="th-stat-title">Balance</div>
              <div className="th-stat-sub">to be Paid</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {groupedWorkers.length === 0 ? (
            <tr>
              <td colSpan={daysOfWeek.length + 6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                <HardHat size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.35, display: 'block' }} />
                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>No employees registered yet</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.3rem', color: 'var(--text-secondary)' }}>
                  Click <strong>&quot;+ Add Employee&quot;</strong> in the top bar to add your worker groups.
                </div>
              </td>
            </tr>
          ) : (
            groupedWorkers.map((group) => {
            let groupAdvance = 0;
            let groupAmount = 0;
            let groupBalance = 0;

            group.workers.forEach((w) => {
              const s = getWorkerStats(w.id, w.wage);
              groupAdvance += s.totalAdvance;
              groupAmount += s.totalAmount;
              groupBalance += s.balanceToBePaid;
            });

            return (
              <React.Fragment key={`group-${group.groupId}`}>
                {/* Group Header Row: Employee name entered by the user placed above the group */}
                <tr className="mason-group-header">
                  <td colSpan={daysOfWeek.length + 6} className="mason-group-header-cell">
                    <div className="mason-header-content">
                      <div className="mason-group-left">
                        <div className="mason-badge-tag">
                          <HardHat size={15} color="#b45309" />
                          <span className="mason-group-name">{group.groupName}</span>
                        </div>
                      </div>

                      <div className="mason-group-right">
                        <div className="group-summary-stats">
                          <span className="group-stat-item">
                            Total: <strong className="group-stat-total-val">₹{groupAmount.toLocaleString('en-IN')}</strong>
                          </span>
                          <span className="group-stat-sep">•</span>
                          <span className="group-stat-item">
                            Advance: <strong className="group-stat-adv-val">₹{groupAdvance.toLocaleString('en-IN')}</strong>
                          </span>
                          <span className="group-stat-sep">•</span>
                          <span className="group-stat-item">
                            Balance: <strong className="group-stat-bal-val">₹{groupBalance.toLocaleString('en-IN')}</strong>
                          </span>
                        </div>

                        {!isWeekClosed && onDeleteGroup && (
                          <button
                            type="button"
                            className="btn-delete-group"
                            onClick={() => onDeleteGroup(group.groupId, group.groupName)}
                            title={`Delete employee group "${group.groupName}"`}
                          >
                            <Trash2 size={12} />
                            <span>Delete Group</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>

                {/* The 3 Worker Rows under this Group (Manson, M-Helper, F-Helper) */}
                {group.workers.map((worker, wIndex) => {
                  const isLastWorker = wIndex === group.workers.length - 1;
                  const stats = getWorkerStats(worker.id, worker.wage);
                  const rowAtt = weekAttendance[worker.id] || {};

                  // Synthetic worker object for the cell editor / whole week modals
                  const workerObj = {
                    id: worker.id,
                    groupId: group.groupId,
                    groupName: group.groupName,
                    name: worker.name,
                    role: worker.category || worker.name,
                    category: worker.category || worker.name,
                    wagePerWork: worker.wage
                  };

                  return (
                    <tr key={worker.id} className={`table-row ${isLastWorker ? 'group-last-row' : ''}`}>
                      {/* Individual Worker Identity Column */}
                      <td className="worker-cell">
                        <div className="worker-identity">
                          <div className="worker-name-row">
                            <span className="worker-name">{worker.name}</span>
                            {!isWeekClosed && onDeleteWorker && (
                              <button
                                type="button"
                                className="btn-delete-worker"
                                onClick={() => onDeleteWorker(worker.id, `${group.groupName} - ${worker.name}`)}
                                title={`Delete ${worker.name} row`}
                                aria-label={`Delete ${worker.name} row`}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          {!isWeekClosed && onFillWholeWeek && (
                            <button
                              type="button"
                              className="btn-fill-week btn-outline-blue"
                              onClick={() => onFillWholeWeek(workerObj)}
                              title={`Fill whole week for ${group.groupName} - ${worker.name}`}
                            >
                              <Zap size={11} />
                              Fill Week
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Mon to Sun Daily Cells */}
                      {daysOfWeek.map((day) => {
                        const dayData = rowAtt[day.isoDate];
                        return (
                          <td key={day.isoDate} className="col-day-cell">
                            <AttendanceCell
                              worker={workerObj}
                              dayInfo={day}
                              dayData={dayData}
                              onClick={() => onCellClick(workerObj, day, dayData)}
                              isLocked={isWeekClosed}
                            />
                          </td>
                        );
                      })}

                      {/* 1. Advance Amount Column (Sum of borrowed amounts) */}
                      <td className="col-stat col-stat-advance col-advance-val tabular-nums">
                        {stats.totalAdvance > 0 ? `₹${stats.totalAdvance.toLocaleString('en-IN')}` : '₹0'}
                      </td>

                      {/* 2. Total Work Column */}
                      <td className="col-stat col-stat-work col-work-val tabular-nums">
                        {stats.totalWork}
                      </td>

                      {/* 3. Wages per Work Input Column */}
                      <td className="col-stat col-stat-wage">
                        <div className="table-wage-input-wrapper">
                          <span className="wage-input-prefix">₹</span>
                          <input
                            type="number"
                            step="10"
                            min="0"
                            className="table-wage-input tabular-nums"
                            value={worker.wage !== undefined ? worker.wage : ''}
                            onChange={(e) => onUpdateWorkerWage && onUpdateWorkerWage(worker.id, e.target.value)}
                            disabled={isWeekClosed}
                            title={`Enter wages per work for ${group.groupName} - ${worker.name}`}
                            placeholder="0"
                          />
                        </div>
                      </td>

                      {/* 4. Total Amount Column (Total Work × Wages per Work) */}
                      <td className="col-stat col-stat-amount col-amount-val tabular-nums">
                        ₹{stats.totalAmount.toLocaleString('en-IN')}
                      </td>

                      {/* 5. Balance to be Paid Column (Total Amount − Advance) */}
                      <td className="col-stat col-stat-balance col-balance-val tabular-nums">
                        ₹{stats.balanceToBePaid.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })
        )}
      </tbody>

        {/* Footer Totals Row */}
        <tfoot>
          <tr className="table-footer-row">
            <td className="footer-total-cell">
              Total
            </td>

            {/* Empty Day Columns (Daily total fields removed) */}
            {daysOfWeek.map((day) => (
              <td key={day.isoDate} className="footer-day-empty" />
            ))}

            {/* Grand Total Advance */}
            <td className="col-stat col-stat-advance col-advance-val tabular-nums" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              ₹{grandTotalAdvance.toLocaleString('en-IN')}
            </td>

            {/* Grand Total Work */}
            <td className="col-stat col-stat-work col-work-val tabular-nums" style={{ fontSize: '1rem', fontWeight: 800 }}>
              {grandTotalWork}
            </td>

            {/* Wages per Work Column Footer */}
            <td className="col-stat col-stat-wage" style={{ color: '#94a3b8', textAlign: 'right', fontWeight: 700 }}>
              —
            </td>

            {/* Grand Total Amount */}
            <td className="col-stat col-stat-amount col-amount-val tabular-nums" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              ₹{grandTotalAmount.toLocaleString('en-IN')}
            </td>

            {/* Grand Total Balance to be Paid */}
            <td className="col-stat col-stat-balance col-balance-val tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              ₹{grandTotalBalance.toLocaleString('en-IN')}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
