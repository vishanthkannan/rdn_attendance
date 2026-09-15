import React, { useState } from 'react';
import { Download, Calendar, FileSpreadsheet, FileText, X, CheckCircle2 } from 'lucide-react';
import { PRESET_WEEKS, formatWeekRange, getDaysInMonth } from '../utils/dateUtils';
import { exportWeeklyPDF, exportMonthlyPDF } from '../utils/pdfExport';

export default function ExportModal({
  isOpen,
  onClose,
  currentWeekStart,
  masons,
  attendance,
  closedWeeks = [],
  daysOfWeek = [],
  onExportDone
}) {
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'csv'
  const [reportType, setReportType] = useState('weekly'); // 'weekly' | 'monthly'
  const [selectedWeek, setSelectedWeek] = useState(currentWeekStart);

  // Available months
  const availableMonths = [
    { id: '2026-09', label: 'September 2026', year: 2026, month: 8 },
    { id: '2026-08', label: 'August 2026', year: 2026, month: 7 },
    { id: '2026-10', label: 'October 2026', year: 2026, month: 9 }
  ];
  const [selectedMonth, setSelectedMonth] = useState('2026-09');

  if (!isOpen) return null;

  // CSV trigger with UTF-8 BOM so Excel opens it with ₹ properly without â‚¹
  const triggerCSVDownload = (csvContent, filename) => {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate Weekly CSV
  const handleExportWeeklyCSV = () => {
    const rangeStr = formatWeekRange(selectedWeek).replace(/–/g, '-');
    const isClosed = closedWeeks.includes(selectedWeek);
    const lockStatus = isClosed ? 'CLOSED' : 'OPEN';

    let csv = `RDN CREATORS - Civil Workers Weekly Attendance Sheet\n`;
    csv += `Week: ${rangeStr}\n`;
    csv += `Status: ${lockStatus}\n\n`;

    const dayHeaders = daysOfWeek.map((d) => `"${d.dayName} (${d.dateNumber})"`).join(',');
    csv += `"Employee (Group)","Worker / Role","Wage Rate",${dayHeaders},"Advance (B)","Total Work","Total Amount","Balance to be Paid"\n`;

    const weekData = attendance[selectedWeek] || {};

    masons.forEach((w) => {
      const rowAtt = weekData[w.id] || {};
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

      const wage = w.wage || 0;
      const totalAmount = totalWork * wage;
      const balance = totalAmount - totalAdvance;

      csv += `"${w.groupName || w.name}","${w.name}",${wage},${dayCols.join(',')},${totalAdvance},${totalWork},${totalAmount},${balance}\n`;
    });

    const filename = `Civil_Weekly_Attendance_${selectedWeek}.csv`;
    triggerCSVDownload(csv, filename);
  };

  // Generate Monthly CSV with all-day attendance (Day 1 to 30/31)
  const handleExportMonthlyCSV = () => {
    const monthObj = availableMonths.find((m) => m.id === selectedMonth) || availableMonths[0];
    const monthDays = getDaysInMonth(selectedMonth);

    let csv = `RDN CREATORS - Civil Workers Monthly Attendance & Payroll Register\n`;
    csv += `Month: ${monthObj.label}\n`;
    csv += `Total Days: ${monthDays.length}\n`;
    csv += `Total Workers: ${masons.length}\n\n`;

    // Headers for all individual days of the month
    const dayHeaders = monthDays.map((d) => `"${d.dateNumber} ${d.monthName} (${d.dayName})"`).join(',');
    csv += `"Employee (Group)","Worker","Wage Rate (₹)",${dayHeaders},"Advance (₹)","Total Work","Total Amount (₹)","Balance to be Paid (₹)"\n`;

    let grandTotalWork = 0;
    let grandTotalAdvance = 0;
    let grandTotalAmount = 0;
    let grandTotalBalance = 0;
    const dailyTotals = {};
    monthDays.forEach((d) => { dailyTotals[d.isoDate] = 0; });

    masons.forEach((w) => {
      let totalWorkMonth = 0;
      let totalAdvanceMonth = 0;

      const dayCols = monthDays.map((d) => {
        let att = 0;
        let bor = 0;

        for (const weekKey of Object.keys(attendance)) {
          const rec = attendance[weekKey]?.[w.id]?.[d.isoDate];
          if (rec) {
            att += (rec.attendance || 0);
            bor += (rec.borrowed || 0);
          }
        }

        totalWorkMonth += att;
        totalAdvanceMonth += bor;
        dailyTotals[d.isoDate] += att;

        if (att > 0 && bor > 0) {
          return `"${att} (B: ₹${bor})"`;
        } else if (att > 0) {
          return `"${att}"`;
        } else if (bor > 0) {
          return `"B: ₹${bor}"`;
        } else {
          return '"0"';
        }
      });

      const wage = w.wage || 0;
      const totalAmount = totalWorkMonth * wage;
      const netBalance = totalAmount - totalAdvanceMonth;

      grandTotalWork += totalWorkMonth;
      grandTotalAdvance += totalAdvanceMonth;
      grandTotalAmount += totalAmount;
      grandTotalBalance += netBalance;

      csv += `"${w.groupName || w.name}","${w.name}",${wage},${dayCols.join(',')},${totalAdvanceMonth},${totalWorkMonth},${totalAmount},${netBalance}\n`;
    });

    // Grand total row across every day and payroll summary
    const dailyTotalCols = monthDays.map((d) => `"${dailyTotals[d.isoDate]}"`).join(',');
    csv += `"TOTAL","—",—,${dailyTotalCols},${grandTotalAdvance},${grandTotalWork},${grandTotalAmount},${grandTotalBalance}\n`;

    const filename = `Civil_Monthly_Attendance_${monthObj.label.replace(/\s+/g, '_')}.csv`;
    triggerCSVDownload(csv, filename);
  };

  // Main Export Handler
  const handleExecuteExport = () => {
    try {
      if (exportFormat === 'pdf') {
        if (reportType === 'weekly') {
          exportWeeklyPDF({
            selectedWeek,
            daysOfWeek,
            masons,
            attendance,
            closedWeeks
          });
        } else {
          exportMonthlyPDF({
            selectedMonth,
            availableMonths,
            masons,
            attendance
          });
        }
        if (onExportDone) {
          onExportDone(`Exported ${reportType === 'weekly' ? 'Weekly' : 'Monthly'} PDF file successfully`);
        }
      } else {
        if (reportType === 'weekly') {
          handleExportWeeklyCSV();
        } else {
          handleExportMonthlyCSV();
        }
        if (onExportDone) {
          onExportDone(`Exported ${reportType === 'weekly' ? 'Weekly' : 'Monthly'} CSV file`);
        }
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate export file: ' + err.message);
    }
  };

  const periodLabel = reportType === 'weekly' ? 'Weekly' : 'Monthly';
  const formatLabel = exportFormat === 'pdf' ? 'PDF' : 'CSV';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', width: '92%' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            {exportFormat === 'pdf' ? (
              <FileText size={20} color="#dc2626" />
            ) : (
              <FileSpreadsheet size={20} color="#16a34a" />
            )}
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Export Attendance &amp; Payroll
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-icon-close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* 1. Format Selection (PDF vs CSV) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              1. Select File Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {/* PDF Card */}
              <div
                onClick={() => setExportFormat('pdf')}
                className={`export-card-option ${exportFormat === 'pdf' ? 'active-pdf' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span className="export-card-title" style={{ color: exportFormat === 'pdf' ? '#dc2626' : undefined }}>
                    <FileText size={16} color={exportFormat === 'pdf' ? '#dc2626' : '#64748b'} />
                    PDF Document
                  </span>
                  {exportFormat === 'pdf' && <CheckCircle2 size={16} color="#dc2626" />}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Standard openable PDF, formatted for print &amp; sharing
                </div>
              </div>

              {/* Excel / CSV Card */}
              <div
                onClick={() => setExportFormat('csv')}
                className={`export-card-option ${exportFormat === 'csv' ? 'active-csv' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span className="export-card-title" style={{ color: exportFormat === 'csv' ? '#16a34a' : undefined }}>
                    <FileSpreadsheet size={16} color={exportFormat === 'csv' ? '#16a34a' : '#64748b'} />
                    Excel Spreadsheet
                  </span>
                  {exportFormat === 'csv' && <CheckCircle2 size={16} color="#16a34a" />}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  CSV spreadsheet for Excel, Google Sheets
                </div>
              </div>
            </div>
          </div>

          {/* 2. Report Period (Weekly vs Monthly) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              2. Select Report Period
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {/* Weekly Option */}
              <div
                onClick={() => setReportType('weekly')}
                className={`export-card-option ${reportType === 'weekly' ? 'active-blue' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span className="export-card-title" style={{ color: reportType === 'weekly' ? '#2563eb' : undefined }}>
                    <Calendar size={16} color={reportType === 'weekly' ? '#2563eb' : '#64748b'} />
                    Weekly Report
                  </span>
                  {reportType === 'weekly' && <CheckCircle2 size={16} color="#2563eb" />}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Mon-Sun daily breakdown + borrow advances
                </div>
              </div>

              {/* Monthly Option */}
              <div
                onClick={() => setReportType('monthly')}
                className={`export-card-option ${reportType === 'monthly' ? 'active-blue' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span className="export-card-title" style={{ color: reportType === 'monthly' ? '#2563eb' : undefined }}>
                    <FileSpreadsheet size={16} color={reportType === 'monthly' ? '#2563eb' : '#64748b'} />
                    Monthly Report
                  </span>
                  {reportType === 'monthly' && <CheckCircle2 size={16} color="#2563eb" />}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  All-day attendance (Day 1-31) + advances &amp; balance
                </div>
              </div>
            </div>
          </div>

          {/* 3. Range Selector */}
          <div className="export-range-container">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              {reportType === 'weekly' ? 'Target Week:' : 'Target Month:'}
            </label>
            {reportType === 'weekly' ? (
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="export-select-input"
              >
                {PRESET_WEEKS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label} {w.id === currentWeekStart ? '(Currently Active)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="export-select-input"
              >
                {availableMonths.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExecuteExport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: exportFormat === 'pdf' ? '#dc2626' : '#16a34a',
              color: '#ffffff',
              borderColor: exportFormat === 'pdf' ? '#b91c1c' : '#15803d'
            }}
          >
            <Download size={14} />
            Download {periodLabel} {formatLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
