import React from 'react';
import AttendanceCell from './AttendanceCell';
import { Trash2, Zap } from 'lucide-react';

export default function AttendanceTable({
  daysOfWeek,
  workers,
  weekAttendance,
  onCellClick,
  onDeleteWorker,
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

  // Daily totals for bottom footer
  const dayColumnTotals = daysOfWeek.map((day) => {
    let workSum = 0;
    let advanceSum = 0;

    workers.forEach((worker) => {
      const rowAtt = weekAttendance[worker.id] || {};
      const cell = rowAtt[day.isoDate];
      if (cell) {
        workSum += (parseFloat(cell.attendance) || 0);
        advanceSum += (parseFloat(cell.borrowed) || 0);
      }
    });

    return {
      isoDate: day.isoDate,
      workSum,
      advanceSum
    };
  });

  return (
    <div className="table-responsive-wrapper">
      <table className="attendance-table">
        <thead>
          {/* Main Top Header */}
          <tr className="table-main-header">
            <th className="col-worker-header">
              Worker / Category
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
          {workers.map((worker) => {
            const stats = getWorkerStats(worker.id, worker.wage);
            const rowAtt = weekAttendance[worker.id] || {};

            // Synthetic worker object for the cell editor / whole week modals
            const workerObj = {
              id: worker.id,
              name: worker.name,
              role: worker.category,
              category: worker.category,
              wagePerWork: worker.wage
            };

            return (
              <tr key={worker.id} className="table-row">
                {/* Individual Worker Identity Column */}
                <td className="worker-cell">
                  <div className="worker-identity">
                    <div className="worker-name-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span className="worker-name">{worker.name}</span>
                        <span className={`role-badge ${worker.category ? worker.category.replace(/\s+/g, '') : ''}`}>
                          {worker.category || 'Worker'}
                        </span>
                      </div>
                      {!isWeekClosed && onDeleteWorker && (
                        <button
                          type="button"
                          className="btn-delete-worker"
                          onClick={() => onDeleteWorker(worker.id, worker.name)}
                          title={`Delete ${worker.name}`}
                          aria-label={`Delete ${worker.name}`}
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
                        title="Fill or edit attendance for the whole week"
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
                      title={`Enter wages per work for ${worker.name}`}
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
        </tbody>

        {/* Footer Totals Row */}
        <tfoot>
          <tr className="table-footer-row">
            <td className="footer-total-cell">
              Daily Totals
            </td>

            {/* Daily Total Columns */}
            {dayColumnTotals.map((tot) => (
              <td key={tot.isoDate} className="footer-day-total">
                <div className="day-sum-work tabular-nums">{tot.workSum}</div>
                {tot.advanceSum > 0 && (
                  <div className="day-sum-adv tabular-nums">B: ₹{tot.advanceSum.toLocaleString('en-IN')}</div>
                )}
              </td>
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
