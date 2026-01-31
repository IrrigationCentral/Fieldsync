// ============================================
// EXCEL EXPORT SERVICE - Service Call Job Sheet
// ============================================
import ExcelJS from 'exceljs';

// Format date as mm.dd.yyyy
const formatDateForFilename = (date) => {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}.${dd}.${yyyy}`;
};

// Get tech initials from name
const getTechInitials = (name) => {
  if (!name) return 'XX';
  return name.split(' ').map(n => n[0]?.toUpperCase() || '').join('');
};

// Format time for Excel (HH:MM AM/PM)
const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Format date for Excel (MM/DD/YYYY)
const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

// Calculate hours between two times
const calculateHours = (start, end, lunchTaken = false) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = (endDate - startDate) / (1000 * 60 * 60);
  const lunchDeduction = lunchTaken ? 0.5 : 0;
  return Math.max(0, diff - lunchDeduction);
};

export const exportJobToExcel = async (job, pivot, farmer, techs, pricingSettings) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Service Call');

  // Set column widths
  sheet.columns = [
    { width: 18 },  // A - Employee/Date
    { width: 14 },  // B - Start Time
    { width: 10 },  // C - Lunch
    { width: 14 },  // D - End Time
    { width: 12 },  // E - Hours
    { width: 18 },  // F - Notes/SO#
  ];

  // === HEADER SECTION ===
  // Title
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'SERVICE CALL JOB SHEET';
  sheet.getCell('A1').font = { bold: true, size: 18 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  // Date
  sheet.getCell('E3').value = 'Date:';
  sheet.getCell('E3').font = { bold: true };
  sheet.getCell('F3').value = job.completedAt ? formatDate(job.completedAt) : formatDate(new Date().toISOString());

  // SO Number
  sheet.getCell('E4').value = 'SO#:';
  sheet.getCell('E4').font = { bold: true };
  sheet.getCell('F4').value = job.soNumber || '';

  // Customer
  sheet.getCell('A5').value = 'Customer:';
  sheet.getCell('A5').font = { bold: true };
  sheet.getCell('B5').value = farmer?.name || 'Unknown Customer';
  sheet.mergeCells('B5:C5');

  // Bill To
  sheet.getCell('D5').value = 'Bill To:';
  sheet.getCell('D5').font = { bold: true };
  sheet.getCell('E5').value = farmer?.billingAddress || farmer?.company || farmer?.name || '';
  sheet.mergeCells('E5:F5');

  // Location
  sheet.getCell('A6').value = 'Location:';
  sheet.getCell('A6').font = { bold: true };
  sheet.getCell('B6').value = pivot?.name || job.pivotName || '';
  sheet.mergeCells('B6:C6');

  // Address
  sheet.getCell('D6').value = 'Address:';
  sheet.getCell('D6').font = { bold: true };
  sheet.getCell('E6').value = pivot?.address || `${pivot?.lat || ''}, ${pivot?.lng || ''}`;
  sheet.mergeCells('E6:F6');

  // Serial # 
  sheet.getCell('A7').value = 'Serial #:';
  sheet.getCell('A7').font = { bold: true };
  sheet.getCell('B7').value = pivot?.serialNumber || '';
  sheet.mergeCells('B7:C7');

  // Equipment Rental
  sheet.getCell('D7').value = 'Equipment Rental:';
  sheet.getCell('D7').font = { bold: true };
  sheet.getCell('E7').value = job.equipmentRental || '';
  sheet.mergeCells('E7:F7');

  // === VEHICLE SECTION ===
  sheet.getCell('A9').value = 'Vehicle #';
  sheet.getCell('B9').value = 'Odometer Begin';
  sheet.getCell('C9').value = 'Odometer End';
  sheet.getCell('D9').value = 'Total Miles';
  ['A9', 'B9', 'C9', 'D9'].forEach(cell => {
    sheet.getCell(cell).font = { bold: true };
    sheet.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });

  sheet.getCell('A10').value = job.vehicleNumber || '';
  sheet.getCell('B10').value = job.odometerBegin || '';
  sheet.getCell('C10').value = job.odometerEnd || '';
  sheet.getCell('D10').value = job.milesDriven || '';

  // === EMPLOYEE TIME SECTION ===
  sheet.mergeCells('A12:F12');
  sheet.getCell('A12').value = 'EMPLOYEE TIME LOG';
  sheet.getCell('A12').font = { bold: true, size: 12 };
  sheet.getCell('A12').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A90A4' } };
  sheet.getCell('A12').font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A12').alignment = { horizontal: 'center' };

  // Time entry headers
  sheet.getCell('A13').value = 'Employee';
  sheet.getCell('B13').value = 'Date';
  sheet.getCell('C13').value = 'Start Time';
  sheet.getCell('D13').value = 'End Time';
  sheet.getCell('E13').value = 'Lunch';
  sheet.getCell('F13').value = 'Hours';
  ['A13', 'B13', 'C13', 'D13', 'E13', 'F13'].forEach(cell => {
    sheet.getCell(cell).font = { bold: true };
    sheet.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E4D9' } };
    sheet.getCell(cell).border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // Process time entries
  const timeEntries = job.timeEntries || [];
  let currentRow = 14;
  
  // Group entries by tech for subtotals
  const techTotals = {};
  let grandTotalHours = 0;

  // Add each time entry as a line item
  timeEntries.forEach((entry) => {
    const techName = techs?.find(t => t.id === entry.techId)?.name || entry.techName || 'Unknown';
    const hours = calculateHours(entry.startTime, entry.endTime, entry.lunchTaken);
    
    // Track totals by tech
    if (!techTotals[entry.techId]) {
      techTotals[entry.techId] = { name: techName, hours: 0, entries: 0 };
    }
    techTotals[entry.techId].hours += hours;
    techTotals[entry.techId].entries += 1;
    grandTotalHours += hours;

    // Add entry row
    sheet.getCell(`A${currentRow}`).value = techName;
    sheet.getCell(`B${currentRow}`).value = formatDate(entry.startTime);
    sheet.getCell(`C${currentRow}`).value = formatTime(entry.startTime);
    sheet.getCell(`D${currentRow}`).value = formatTime(entry.endTime);
    sheet.getCell(`E${currentRow}`).value = entry.lunchTaken ? 'Yes (-30m)' : 'No';
    sheet.getCell(`F${currentRow}`).value = hours.toFixed(2);
    
    // Light alternating row colors
    if (currentRow % 2 === 0) {
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
        sheet.getCell(`${col}${currentRow}`).fill = { 
          type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } 
        };
      });
    }
    
    currentRow++;
  });

  // If no time entries but we have hoursWorked, add a single row
  if (timeEntries.length === 0 && job.hoursWorked) {
    const techName = techs?.find(t => t.id === job.assignedTo)?.name || 'Unknown';
    sheet.getCell(`A${currentRow}`).value = techName;
    sheet.getCell(`B${currentRow}`).value = formatDate(job.completedAt || job.createdAt);
    sheet.getCell(`C${currentRow}`).value = '';
    sheet.getCell(`D${currentRow}`).value = '';
    sheet.getCell(`E${currentRow}`).value = '';
    sheet.getCell(`F${currentRow}`).value = job.hoursWorked;
    grandTotalHours = job.hoursWorked;
    techTotals['unknown'] = { name: techName, hours: job.hoursWorked, entries: 1 };
    currentRow++;
  }

  // Add blank row
  currentRow++;

  // === TECH SUBTOTALS SECTION ===
  if (Object.keys(techTotals).length > 1) {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'HOURS BY TECHNICIAN';
    sheet.getCell(`A${currentRow}`).font = { bold: true };
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E4D9' } };
    currentRow++;

    Object.values(techTotals).forEach(tech => {
      sheet.getCell(`A${currentRow}`).value = tech.name;
      sheet.getCell(`E${currentRow}`).value = `${tech.entries} entries`;
      sheet.getCell(`F${currentRow}`).value = tech.hours.toFixed(2);
      sheet.getCell(`F${currentRow}`).font = { bold: true };
      currentRow++;
    });
    currentRow++;
  }

  // === GRAND TOTAL ===
  sheet.getCell(`D${currentRow}`).value = 'TOTAL MAN HOURS:';
  sheet.getCell(`D${currentRow}`).font = { bold: true };
  sheet.mergeCells(`D${currentRow}:E${currentRow}`);
  sheet.getCell(`F${currentRow}`).value = grandTotalHours.toFixed(2);
  sheet.getCell(`F${currentRow}`).font = { bold: true, size: 14 };
  sheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF52C41A' } };
  sheet.getCell(`F${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };

  currentRow += 2;

  // === NOTES/WORK PERFORMED ===
  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  sheet.getCell(`A${currentRow}`).value = 'WORK PERFORMED / NOTES';
  sheet.getCell(`A${currentRow}`).font = { bold: true };
  sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A90A4' } };
  sheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  currentRow++;

  const workDescription = job.workDescription || job.description || '';
  const notesStartRow = currentRow;
  sheet.mergeCells(`A${currentRow}:F${currentRow + 8}`);
  sheet.getCell(`A${currentRow}`).value = workDescription;
  sheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
  sheet.getCell(`A${currentRow}`).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };
  currentRow = notesStartRow + 9;

  currentRow++;

  // === PARTS SECTION ===
  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  sheet.getCell(`A${currentRow}`).value = 'PARTS USED';
  sheet.getCell(`A${currentRow}`).font = { bold: true };
  sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A90A4' } };
  sheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  currentRow++;

  sheet.getCell(`A${currentRow}`).value = 'Qty';
  sheet.getCell(`B${currentRow}`).value = 'Part Number';
  sheet.getCell(`C${currentRow}`).value = 'Description';
  sheet.mergeCells(`C${currentRow}:D${currentRow}`);
  sheet.getCell(`E${currentRow}`).value = 'Location';
  sheet.mergeCells(`E${currentRow}:F${currentRow}`);
  ['A', 'B', 'C', 'E'].forEach(col => {
    sheet.getCell(`${col}${currentRow}`).font = { bold: true };
    sheet.getCell(`${col}${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E4D9' } };
  });
  currentRow++;

  // Parts used
  const partsUsed = job.partsUsed || [];
  partsUsed.forEach((part) => {
    if (typeof part === 'object') {
      sheet.getCell(`A${currentRow}`).value = part.quantity || 1;
      sheet.getCell(`B${currentRow}`).value = part.partNumber || '';
      sheet.getCell(`C${currentRow}`).value = part.description || part.name || '';
      sheet.mergeCells(`C${currentRow}:D${currentRow}`);
      sheet.getCell(`E${currentRow}`).value = part.truckLocationName || part.location || '';
      sheet.mergeCells(`E${currentRow}:F${currentRow}`);
    } else {
      sheet.getCell(`A${currentRow}`).value = 1;
      sheet.getCell(`C${currentRow}`).value = part;
      sheet.mergeCells(`C${currentRow}:D${currentRow}`);
      sheet.mergeCells(`E${currentRow}:F${currentRow}`);
    }
    currentRow++;
  });

  // === GENERATE FILE ===
  // File name format: Customer name.SO#.mm.dd.yyyy.tech initials
  const customerName = (farmer?.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
  const soNumber = job.soNumber || 'NoSO';
  const dateStr = formatDateForFilename(job.completedAt || new Date());
  const primaryTech = techs?.find(t => t.id === job.assignedTo);
  const techInitials = getTechInitials(primaryTech?.name);
  
  const fileName = `${customerName}.${soNumber}.${dateStr}.${techInitials}.xlsx`;

  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return { success: true, fileName };
};

export default exportJobToExcel;
