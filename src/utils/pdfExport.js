// PDF Export Utility using jsPDF and jspdf-autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatWeekRange, getDaysInMonth } from './dateUtils';

/**
 * Export Weekly Attendance and Payroll as an openable, standard PDF file
 */
export function exportWeeklyPDF({ selectedWeek, daysOfWeek, masons, attendance, closedWeeks = [] }) {
  // Use landscape orientation for weekly view with 7 days and financial columns
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const rangeStr = formatWeekRange(selectedWeek).replace(/–/g, '-');
  const isClosed = closedWeeks.includes(selectedWeek);
  const statusStr = isClosed ? 'WEEK CLOSED' : 'ACTIVE / OPEN';

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(6, 78, 59); // Forest emerald matching RDN CREATORS logo
  doc.text('RDN CREATORS - Civil Workers Weekly Attendance & Payroll', 40, 40);

  // Subtitle / Info Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Week Range: ${rangeStr}   |   Status: ${statusStr}   |   Total Workers: ${masons.length}`, 40, 58);
  doc.text(`Exported on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 40, 72);

  // Prepare Table Columns
  const tableColumns = [
    { header: 'Employee\n(Group)', dataKey: 'group' },
    { header: 'Worker\nRole', dataKey: 'name' },
    { header: 'Wage/Unit', dataKey: 'wage' },
    ...daysOfWeek.map((d) => ({
      header: `${d.dayName}\n${d.dateNumber}`,
      dataKey: d.isoDate
    })),
    { header: 'Advance\n(Rs.)', dataKey: 'advance' },
    { header: 'Total\nWork', dataKey: 'totalWork' },
    { header: 'Total Amt\n(Rs.)', dataKey: 'totalAmount' },
    { header: 'Balance\n(Rs.)', dataKey: 'balance' }
  ];

  // Prepare Rows & compute totals
  const weekData = attendance[selectedWeek] || {};
  let grandTotalWork = 0;
  let grandTotalAdvance = 0;
  let grandTotalAmount = 0;
  let grandTotalBalance = 0;

  const tableRows = masons.map((w) => {
    const rowAtt = weekData[w.id] || {};
    let totalWork = 0;
    let totalAdvance = 0;

    const rowObj = {
      group: w.groupName || w.name,
      name: w.name,
      category: w.category || 'Worker',
      wage: `Rs. ${w.wage || 0}`
    };

    daysOfWeek.forEach((day) => {
      const rec = rowAtt[day.isoDate];
      if (!rec) {
        rowObj[day.isoDate] = '0';
      } else {
        const att = rec.attendance || 0;
        const bor = rec.borrowed || 0;
        totalWork += att;
        totalAdvance += bor;
        if (bor > 0) {
          rowObj[day.isoDate] = `${att}\n(B: ${bor})`;
        } else {
          rowObj[day.isoDate] = `${att}`;
        }
      }
    });

    const wage = w.wage || 0;
    const totalAmount = totalWork * wage;
    const balance = totalAmount - totalAdvance;

    grandTotalWork += totalWork;
    grandTotalAdvance += totalAdvance;
    grandTotalAmount += totalAmount;
    grandTotalBalance += balance;

    rowObj.advance = `Rs. ${totalAdvance.toLocaleString('en-IN')}`;
    rowObj.totalWork = `${totalWork}`;
    rowObj.totalAmount = `Rs. ${totalAmount.toLocaleString('en-IN')}`;
    rowObj.balance = `Rs. ${balance.toLocaleString('en-IN')}`;

    return rowObj;
  });

  // Footer Row
  const footerRow = {
    group: 'TOTAL',
    name: '',
    category: '',
    wage: '',
    advance: `Rs. ${grandTotalAdvance.toLocaleString('en-IN')}`,
    totalWork: `${grandTotalWork}`,
    totalAmount: `Rs. ${grandTotalAmount.toLocaleString('en-IN')}`,
    balance: `Rs. ${grandTotalBalance.toLocaleString('en-IN')}`
  };
  daysOfWeek.forEach((day) => {
    footerRow[day.isoDate] = '';
  });

  // Generate AutoTable
  autoTable(doc, {
    columns: tableColumns,
    body: tableRows,
    foot: [footerRow],
    startY: 85,
    margin: { left: 30, right: 30, bottom: 35 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      valign: 'middle',
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Zebra striping in PDF matching the app UI!
    },
    columnStyles: {
      group: { fontStyle: 'bold', halign: 'left', minCellWidth: 60 },
      name: { halign: 'left', minCellWidth: 55 },
      wage: { halign: 'right', minCellWidth: 45 },
      advance: { halign: 'right', minCellWidth: 45 },
      totalWork: { halign: 'center', fontStyle: 'bold', minCellWidth: 35 },
      totalAmount: { halign: 'right', fontStyle: 'bold', minCellWidth: 50 },
      balance: { halign: 'right', fontStyle: 'bold', minCellWidth: 55 }
    },
    didDrawPage: (data) => {
      // Footer page number
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} - RDN CREATORS Attendance Management`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 15,
        { align: 'center' }
      );
    }
  });

  const filename = `Civil_Weekly_Attendance_${selectedWeek}.pdf`;
  doc.save(filename);
}

/**
 * Export Monthly Consolidated Attendance and Payroll as a PDF file
 */
export function exportMonthlyPDF({ selectedMonth, availableMonths, masons, attendance }) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const monthObj = availableMonths.find((m) => m.id === selectedMonth) || availableMonths[0];
  const monthDays = getDaysInMonth(selectedMonth);

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(6, 78, 59); // Forest emerald
  doc.text('RDN CREATORS - Civil Workers Monthly Attendance & Payroll Register', 25, 30);

  // Subtitle / Info Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Month: ${monthObj.label}   |   Days: ${monthDays.length}   |   Total Workers: ${masons.length}`, 25, 45);
  doc.text(`Exported on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 25, 57);

  // Day columns across the month
  const dayColumns = monthDays.map((d) => ({
    header: `${d.dateNumber}\n${d.dayName.slice(0, 2)}`,
    dataKey: d.isoDate
  }));

  const tableColumns = [
    { header: 'Employee\n(Group)', dataKey: 'group' },
    { header: 'Worker', dataKey: 'name' },
    { header: 'Wage\n(Rs.)', dataKey: 'wage' },
    ...dayColumns,
    { header: 'Advance\n(Rs.)', dataKey: 'advance' },
    { header: 'Total\nWork', dataKey: 'totalWork' },
    { header: 'Gross\n(Rs.)', dataKey: 'gross' },
    { header: 'Balance\n(Rs.)', dataKey: 'balance' }
  ];

  let grandTotalWork = 0;
  let grandTotalAdvance = 0;
  let grandTotalGross = 0;
  let grandTotalBalance = 0;
  const dailyTotals = {};
  monthDays.forEach((d) => { dailyTotals[d.isoDate] = 0; });

  const tableRows = masons.map((w) => {
    let totalWorkMonth = 0;
    let totalAdvanceMonth = 0;

    const rowObj = {
      group: w.groupName || w.name,
      name: w.name,
      wage: `${w.wage || 0}`
    };

    monthDays.forEach((d) => {
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
        rowObj[d.isoDate] = `${att}\n(B:${bor})`;
      } else if (att > 0) {
        rowObj[d.isoDate] = `${att}`;
      } else if (bor > 0) {
        rowObj[d.isoDate] = `B:${bor}`;
      } else {
        rowObj[d.isoDate] = '0';
      }
    });

    const wage = w.wage || 0;
    const totalAmount = totalWorkMonth * wage;
    const netBalance = totalAmount - totalAdvanceMonth;

    grandTotalWork += totalWorkMonth;
    grandTotalAdvance += totalAdvanceMonth;
    grandTotalGross += totalAmount;
    grandTotalBalance += netBalance;

    rowObj.advance = `${totalAdvanceMonth.toLocaleString('en-IN')}`;
    rowObj.totalWork = `${totalWorkMonth}`;
    rowObj.gross = `${totalAmount.toLocaleString('en-IN')}`;
    rowObj.balance = `${netBalance.toLocaleString('en-IN')}`;

    return rowObj;
  });

  // Footer Row
  const footerRow = {
    group: 'TOTAL',
    name: '—',
    wage: '—',
    advance: `${grandTotalAdvance.toLocaleString('en-IN')}`,
    totalWork: `${grandTotalWork}`,
    gross: `${grandTotalGross.toLocaleString('en-IN')}`,
    balance: `${grandTotalBalance.toLocaleString('en-IN')}`
  };

  monthDays.forEach((d) => {
    footerRow[d.isoDate] = `${dailyTotals[d.isoDate]}`;
  });

  // Column style overrides
  const columnStyles = {
    group: { fontStyle: 'bold', halign: 'left', minCellWidth: 46 },
    name: { halign: 'left', minCellWidth: 42 },
    wage: { halign: 'right', minCellWidth: 26 },
    advance: { halign: 'right', minCellWidth: 36 },
    totalWork: { halign: 'center', fontStyle: 'bold', minCellWidth: 26 },
    gross: { halign: 'right', fontStyle: 'bold', minCellWidth: 42 },
    balance: { halign: 'right', fontStyle: 'bold', minCellWidth: 44 }
  };

  monthDays.forEach((d) => {
    columnStyles[d.isoDate] = { halign: 'center', minCellWidth: 15 };
  });

  autoTable(doc, {
    columns: tableColumns,
    body: tableRows,
    foot: [footerRow],
    startY: 68,
    margin: { left: 15, right: 15, bottom: 25 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6,
      cellPadding: 1.5,
      valign: 'middle',
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.4
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 6
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 6.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles,
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} - RDN CREATORS Monthly Attendance & Payroll Register`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  });

  const filename = `Civil_Monthly_Attendance_${monthObj.label.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
