// PDF Export Utility using jsPDF and jspdf-autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatWeekRange } from './dateUtils';

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
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const monthObj = availableMonths.find((m) => m.id === selectedMonth) || availableMonths[0];
  const monthPrefix = selectedMonth;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(6, 78, 59);
  doc.text('RDN CREATORS - Monthly Attendance & Payroll Report', 40, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Month: ${monthObj.label}   |   Total Workers: ${masons.length}`, 40, 65);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 40, 80);

  const tableColumns = [
    { header: 'Employee\n(Group)', dataKey: 'group' },
    { header: 'Worker / Role', dataKey: 'name' },
    { header: 'Wage/Unit\n(Rs.)', dataKey: 'wage' },
    { header: 'Days Worked\n(Units)', dataKey: 'daysWorked' },
    { header: 'Total Advance\n(Rs.)', dataKey: 'advance' },
    { header: 'Gross Wages\n(Rs.)', dataKey: 'gross' },
    { header: 'Balance to Pay\n(Rs.)', dataKey: 'balance' }
  ];

  let grandTotalWork = 0;
  let grandTotalAdvance = 0;
  let grandTotalGross = 0;
  let grandTotalBalance = 0;

  const tableRows = masons.map((w) => {
    let totalWorkMonth = 0;
    let totalAdvanceMonth = 0;

    Object.keys(attendance).forEach((weekKey) => {
      const weekRows = attendance[weekKey] || {};
      const workerRow = weekRows[w.id] || {};

      Object.keys(workerRow).forEach((dateStr) => {
        if (dateStr.startsWith(monthPrefix)) {
          const rec = workerRow[dateStr];
          if (rec) {
            totalWorkMonth += (rec.attendance || 0);
            totalAdvanceMonth += (rec.borrowed || 0);
          }
        }
      });
    });

    const wage = w.wage || 0;
    const totalAmount = totalWorkMonth * wage;
    const netBalance = totalAmount - totalAdvanceMonth;

    grandTotalWork += totalWorkMonth;
    grandTotalAdvance += totalAdvanceMonth;
    grandTotalGross += totalAmount;
    grandTotalBalance += netBalance;

    return {
      group: w.groupName || w.name,
      name: w.name,
      category: w.category || 'Worker',
      wage: `Rs. ${wage}`,
      daysWorked: `${totalWorkMonth}`,
      advance: `Rs. ${totalAdvanceMonth.toLocaleString('en-IN')}`,
      gross: `Rs. ${totalAmount.toLocaleString('en-IN')}`,
      balance: `Rs. ${netBalance.toLocaleString('en-IN')}`
    };
  });

  const footerRow = {
    group: 'TOTAL',
    name: '',
    category: '',
    wage: '',
    daysWorked: `${grandTotalWork}`,
    advance: `Rs. ${grandTotalAdvance.toLocaleString('en-IN')}`,
    gross: `Rs. ${grandTotalGross.toLocaleString('en-IN')}`,
    balance: `Rs. ${grandTotalBalance.toLocaleString('en-IN')}`
  };

  autoTable(doc, {
    columns: tableColumns,
    body: tableRows,
    foot: [footerRow],
    startY: 95,
    margin: { left: 35, right: 35, bottom: 40 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 5,
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
      fontSize: 9
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      group: { fontStyle: 'bold', halign: 'left', minCellWidth: 70 },
      name: { halign: 'left', minCellWidth: 70 },
      wage: { halign: 'right', minCellWidth: 50 },
      daysWorked: { halign: 'center', fontStyle: 'bold', minCellWidth: 50 },
      advance: { halign: 'right', minCellWidth: 60 },
      gross: { halign: 'right', fontStyle: 'bold', minCellWidth: 65 },
      balance: { halign: 'right', fontStyle: 'bold', minCellWidth: 70 }
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} - RDN Workers Monthly Attendance & Payroll`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 20,
        { align: 'center' }
      );
    }
  });

  const filename = `Civil_Monthly_Attendance_${monthObj.label.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
