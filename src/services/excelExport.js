// ============================================
// EXCEL EXPORT SERVICE - Service Call Job Sheet
// Supports multi-day serviceEntries, multi-vehicle, proper hours
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

// Calculate hours - use pre-calculated hours field first, then compute from times
const getEntryHours = (entry) => {
  if (entry.hours && entry.hours > 0) return entry.hours;
  if (!entry.startTime || !entry.endTime) return 0;
  const start = new Date(entry.startTime);
  const end = new Date(entry.endTime);
  const diff = (end - start) / (1000 * 60 * 60);
  return Math.max(0, diff - (entry.lunchTaken ? 0.5 : 0));
};

// Style constants
const PRIMARY_BG = 'FF4A90A4';
const HEADER_BG = 'FFE8E4D9';
const LIGHT_ROW = 'FFF5F5F5';
const SUCCESS_BG = 'FF52C41A';
const SECTION_FONT = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };

// Helper: apply section header styling
const applySectionHeader = (sheet, row, lastCol = 'F') => {
  sheet.mergeCells(`A${row}:${lastCol}${row}`);
  sheet.getCell(`A${row}`).font = SECTION_FONT;
  sheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_BG } };
  sheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
};

// Helper: apply column header styling
const applyColumnHeaders = (sheet, row, cols) => {
  cols.forEach(col => {
    sheet.getCell(`${col}${row}`).font = { bold: true };
    sheet.getCell(`${col}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    sheet.getCell(`${col}${row}`).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
  });
};

export const exportJobToExcel = async (job, pivot, farmer, techs, pricingSettings) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Service Call');

  // Set column widths — wide enough for descriptions, part numbers, times
  sheet.columns = [
    { width: 22 },  // A - labels, employee names
    { width: 18 },  // B - dates, values
    { width: 16 },  // C - times, descriptions
    { width: 16 },  // D - times, values
    { width: 14 },  // E - lunch, location
    { width: 22 },  // F - hours, costs, descriptions
  ];

  // === HEADER SECTION ===
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'SERVICE CALL JOB SHEET';
  sheet.getCell('A1').font = { bold: true, size: 18 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  // Date & SO#
  sheet.getCell('E3').value = 'Date:';
  sheet.getCell('E3').font = { bold: true };
  sheet.getCell('F3').value = job.completedAt ? formatDate(job.completedAt) : formatDate(new Date().toISOString());
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

  // Gather all service entries or build legacy
  const serviceEntries = job.serviceEntries && job.serviceEntries.length > 0
    ? job.serviceEntries : null;

  // Collect ALL data across service entries
  let allTimeEntries = [];
  let allPartsUsed = [];
  let allVehicles = [];
  let grandTotalHours = 0;
  let grandTotalMiles = 0;
  let grandTotalCost = 0;

  if (serviceEntries) {
    serviceEntries.forEach(entry => {
      // Time entries
      if (entry.timeEntries && entry.timeEntries.length > 0) {
        allTimeEntries.push(...entry.timeEntries.map(te => ({ ...te, serviceDate: entry.date })));
      }
      // Parts
      if (entry.partsUsed) allPartsUsed.push(...entry.partsUsed);
      // Vehicles - support new array format and legacy flat fields
      if (entry.vehicles && entry.vehicles.length > 0) {
        entry.vehicles.forEach(v => allVehicles.push({ ...v, serviceDate: entry.date }));
      } else if (entry.vehicleNumber) {
        allVehicles.push({
          vehicleNumber: entry.vehicleNumber,
          odometerBegin: entry.odometerBegin || 0,
          odometerEnd: entry.odometerEnd || 0,
          milesDriven: entry.milesDriven || 0,
          serviceDate: entry.date
        });
      }
      grandTotalHours += entry.hoursWorked || 0;
      grandTotalMiles += entry.milesDriven || 0;
      grandTotalCost += entry.totalCost || 0;
    });
  } else {
    // Legacy: use flat job fields
    allTimeEntries = (job.timeEntries || []).map(te => ({ ...te }));
    allPartsUsed = job.partsUsed || [];
    if (job.vehicleNumber) {
      allVehicles.push({
        vehicleNumber: job.vehicleNumber,
        odometerBegin: job.odometerBegin || job.odometerStart || 0,
        odometerEnd: job.odometerEnd || 0,
        milesDriven: job.milesDriven || 0
      });
    }
    grandTotalHours = job.hoursWorked || 0;
    grandTotalMiles = job.milesDriven || 0;
    grandTotalCost = job.totalCost || 0;
  }

  // === VEHICLE / MILEAGE SECTION ===
  applySectionHeader(sheet, 9);
  sheet.getCell('A9').value = 'VEHICLES & MILEAGE';
  let currentRow = 10;

  if (allVehicles.length > 0) {
    sheet.getCell(`A${currentRow}`).value = 'Vehicle #';
    sheet.getCell(`B${currentRow}`).value = 'Date';
    sheet.getCell(`C${currentRow}`).value = 'Odom Begin';
    sheet.getCell(`D${currentRow}`).value = 'Odom End';
    sheet.getCell(`E${currentRow}`).value = 'Miles';
    applyColumnHeaders(sheet, currentRow, ['A', 'B', 'C', 'D', 'E']);
    currentRow++;

    allVehicles.forEach(v => {
      sheet.getCell(`A${currentRow}`).value = `#${v.vehicleNumber}`;
      sheet.getCell(`B${currentRow}`).value = v.serviceDate ? formatDate(v.serviceDate) : '';
      sheet.getCell(`C${currentRow}`).value = v.odometerBegin || '';
      sheet.getCell(`D${currentRow}`).value = v.odometerEnd || '';
      sheet.getCell(`E${currentRow}`).value = v.milesDriven || 0;
      currentRow++;
    });

    // Total miles row
    sheet.getCell(`D${currentRow}`).value = 'Total Miles:';
    sheet.getCell(`D${currentRow}`).font = { bold: true };
    const computedTotalMiles = allVehicles.reduce((sum, v) => sum + (v.milesDriven || 0), 0);
    sheet.getCell(`E${currentRow}`).value = computedTotalMiles;
    sheet.getCell(`E${currentRow}`).font = { bold: true };
    currentRow++;
  } else {
    sheet.getCell(`A${currentRow}`).value = 'No vehicles recorded';
    sheet.getCell(`A${currentRow}`).font = { italic: true, color: { argb: 'FF999999' } };
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    currentRow++;
  }
  currentRow++;

  // === EMPLOYEE TIME SECTION ===
  applySectionHeader(sheet, currentRow);
  sheet.getCell(`A${currentRow}`).value = 'EMPLOYEE TIME LOG';
  currentRow++;

  sheet.getCell(`A${currentRow}`).value = 'Employee';
  sheet.getCell(`B${currentRow}`).value = 'Date';
  sheet.getCell(`C${currentRow}`).value = 'Start Time';
  sheet.getCell(`D${currentRow}`).value = 'End Time';
  sheet.getCell(`E${currentRow}`).value = 'Lunch';
  sheet.getCell(`F${currentRow}`).value = 'Hours';
  applyColumnHeaders(sheet, currentRow, ['A', 'B', 'C', 'D', 'E', 'F']);
  currentRow++;

  // Track per-tech totals
  const techTotals = {};
  let computedTotalHours = 0;

  if (serviceEntries && serviceEntries.length > 0) {
    serviceEntries.forEach((sEntry, dayIdx) => {
      const dayEntries = sEntry.timeEntries || [];
      if (dayEntries.length > 0) {
        dayEntries.forEach(entry => {
          const techName = techs?.find(t => t.id === entry.techId)?.name || entry.techName || 'Unknown';
          const hours = getEntryHours(entry);
          const techKey = entry.techId || 'unknown';
          if (!techTotals[techKey]) techTotals[techKey] = { name: techName, hours: 0, entries: 0 };
          techTotals[techKey].hours += hours;
          techTotals[techKey].entries += 1;
          computedTotalHours += hours;

          sheet.getCell(`A${currentRow}`).value = techName;
          sheet.getCell(`B${currentRow}`).value = formatDate(entry.startTime || sEntry.date);
          sheet.getCell(`C${currentRow}`).value = formatTime(entry.startTime);
          sheet.getCell(`D${currentRow}`).value = formatTime(entry.endTime);
          sheet.getCell(`E${currentRow}`).value = entry.lunchTaken ? 'Yes (-30m)' : 'No';
          sheet.getCell(`F${currentRow}`).value = hours.toFixed(2);

          if (currentRow % 2 === 0) {
            ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
              sheet.getCell(`${col}${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_ROW } };
            });
          }
          currentRow++;
        });
      } else if (sEntry.hoursWorked) {
        // No detailed time entries but has hours summary
        const techName = typeof sEntry.completedBy === 'object' ? (sEntry.completedBy?.name || 'Unknown') : 'Unknown';
        const techKey = sEntry.completedBy?.id || 'unknown';
        if (!techTotals[techKey]) techTotals[techKey] = { name: techName, hours: 0, entries: 0 };
        techTotals[techKey].hours += sEntry.hoursWorked;
        techTotals[techKey].entries += 1;
        computedTotalHours += sEntry.hoursWorked;

        sheet.getCell(`A${currentRow}`).value = techName;
        sheet.getCell(`B${currentRow}`).value = `Day ${dayIdx + 1} — ${formatDate(sEntry.date)}`;
        sheet.getCell(`F${currentRow}`).value = sEntry.hoursWorked.toFixed(2);
        currentRow++;
      }
    });
  } else {
    // Legacy time entries
    allTimeEntries.forEach(entry => {
      const techName = techs?.find(t => t.id === entry.techId)?.name || entry.techName || 'Unknown';
      const hours = getEntryHours(entry);
      const techKey = entry.techId || 'unknown';
      if (!techTotals[techKey]) techTotals[techKey] = { name: techName, hours: 0, entries: 0 };
      techTotals[techKey].hours += hours;
      techTotals[techKey].entries += 1;
      computedTotalHours += hours;

      sheet.getCell(`A${currentRow}`).value = techName;
      sheet.getCell(`B${currentRow}`).value = formatDate(entry.startTime);
      sheet.getCell(`C${currentRow}`).value = formatTime(entry.startTime);
      sheet.getCell(`D${currentRow}`).value = formatTime(entry.endTime);
      sheet.getCell(`E${currentRow}`).value = entry.lunchTaken ? 'Yes (-30m)' : 'No';
      sheet.getCell(`F${currentRow}`).value = hours.toFixed(2);
      currentRow++;
    });

    // Fallback: no time entries but has hoursWorked on job
    if (allTimeEntries.length === 0 && job.hoursWorked) {
      const assignees = Array.isArray(job.assignedTo) ? job.assignedTo.filter(Boolean) : [job.assignedTo].filter(Boolean);
      const primaryAssignee = assignees[0] || null;
      const techName = primaryAssignee ? (techs?.find(t => t.id === primaryAssignee)?.name || 'Unknown') : 'Unknown';
      sheet.getCell(`A${currentRow}`).value = techName;
      sheet.getCell(`B${currentRow}`).value = formatDate(job.completedAt || job.createdAt);
      sheet.getCell(`F${currentRow}`).value = (job.hoursWorked || 0).toFixed(2);
      computedTotalHours = job.hoursWorked;
      techTotals[primaryAssignee || 'unknown'] = { name: techName, hours: job.hoursWorked, entries: 1 };
      currentRow++;
    }
  }
  currentRow++;

  // === TECH SUBTOTALS ===
  if (Object.keys(techTotals).length > 1) {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'HOURS BY TECHNICIAN';
    sheet.getCell(`A${currentRow}`).font = { bold: true };
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
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

  // Use computed hours from time entries, fall back to sum of entry.hoursWorked
  const displayTotalHours = computedTotalHours > 0 ? computedTotalHours : grandTotalHours;

  // === GRAND TOTAL HOURS ===
  sheet.getCell(`D${currentRow}`).value = 'TOTAL MAN HOURS:';
  sheet.getCell(`D${currentRow}`).font = { bold: true };
  sheet.mergeCells(`D${currentRow}:E${currentRow}`);
  sheet.getCell(`F${currentRow}`).value = displayTotalHours.toFixed(2);
  sheet.getCell(`F${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  sheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUCCESS_BG } };
  currentRow += 2;

  // === SERVICE DETAILS (combined work + vehicles + parts per day) ===
  applySectionHeader(sheet, currentRow);
  sheet.getCell(`A${currentRow}`).value = serviceEntries
    ? `SERVICE DETAILS (${serviceEntries.length} ${serviceEntries.length === 1 ? 'visit' : 'visits'})`
    : 'WORK PERFORMED / NOTES';
  currentRow++;

  if (serviceEntries && serviceEntries.length > 0) {
    serviceEntries.forEach((entry, idx) => {
      const isFinal = idx === serviceEntries.length - 1 && !entry.needsFollowUp;
      const techName = typeof entry.completedBy === 'object' ? entry.completedBy?.name : null;
      const dayLabel = isFinal ? `DAY ${idx + 1} - COMPLETED` : `DAY ${idx + 1}`;

      // Day sub-header
      sheet.mergeCells(`A${currentRow}:F${currentRow}`);
      sheet.getCell(`A${currentRow}`).value = `${dayLabel}  |  ${formatDate(entry.date)}${techName ? '  |  ' + techName : ''}`;
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
      sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
      currentRow++;

      // Work description — dynamic row height based on text length
      const desc = entry.workDescription || '(No description recorded)';
      const estimatedLines = Math.max(1, Math.ceil(desc.length / 80));
      const descRows = Math.max(2, Math.min(estimatedLines, 12));
      sheet.mergeCells(`A${currentRow}:F${currentRow + descRows - 1}`);
      sheet.getCell(`A${currentRow}`).value = desc;
      sheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
      sheet.getCell(`A${currentRow}`).border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      currentRow += descRows;

      // Vehicles for this entry
      const entryVehicles = entry.vehicles && entry.vehicles.length > 0
        ? entry.vehicles
        : (entry.vehicleNumber ? [{ vehicleNumber: entry.vehicleNumber, odometerBegin: entry.odometerBegin, odometerEnd: entry.odometerEnd, milesDriven: entry.milesDriven }] : []);

      if (entryVehicles.length > 0) {
        entryVehicles.forEach(v => {
          sheet.getCell(`A${currentRow}`).value = 'Vehicle:';
          sheet.getCell(`A${currentRow}`).font = { bold: true };
          sheet.getCell(`B${currentRow}`).value = `#${v.vehicleNumber || 'N/A'}  |  ${v.odometerBegin || '-'} to ${v.odometerEnd || '-'}  |  ${v.milesDriven || 0} miles`;
          sheet.mergeCells(`B${currentRow}:F${currentRow}`);
          currentRow++;
        });
      }

      // Parts used this day
      if (entry.partsUsed && entry.partsUsed.length > 0) {
        sheet.getCell(`A${currentRow}`).value = 'Parts:';
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        const partsStr = entry.partsUsed.map(p => {
          if (typeof p === 'object') {
            let s = `${p.quantity || 1}x ${p.partNumber || ''} ${p.description || p.name || ''}`.trim();
            if (p.truckLocationName) s += ` [${p.truckLocationName}]`;
            return s;
          }
          return p;
        }).join(', ');
        sheet.mergeCells(`B${currentRow}:F${currentRow}`);
        sheet.getCell(`B${currentRow}`).value = partsStr;
        sheet.getCell(`B${currentRow}`).alignment = { wrapText: true };
        currentRow++;
      }

      // Follow-up notes if any
      if (entry.needsFollowUp && entry.followUpNotes) {
        sheet.getCell(`A${currentRow}`).value = 'Follow-up:';
        sheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFFF6600' } };
        sheet.mergeCells(`B${currentRow}:F${currentRow}`);
        sheet.getCell(`B${currentRow}`).value = entry.followUpNotes;
        sheet.getCell(`B${currentRow}`).alignment = { wrapText: true };
        currentRow++;
      }

      // Day totals
      sheet.getCell(`A${currentRow}`).value = 'Day Totals:';
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      sheet.getCell(`B${currentRow}`).value = `${(entry.hoursWorked || 0).toFixed(2)} hrs`;
      sheet.getCell(`C${currentRow}`).value = `${entry.milesDriven || 0} mi`;
      if (entry.totalCost) {
        sheet.getCell(`D${currentRow}`).value = `$${entry.totalCost.toFixed(2)}`;
      }
      currentRow++;

      currentRow++; // spacer between days
    });

    // Running totals summary
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'TOTALS ACROSS ALL VISITS';
    sheet.getCell(`A${currentRow}`).font = { bold: true };
    sheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Total Hours:';
    sheet.getCell(`A${currentRow}`).font = { bold: true };
    sheet.getCell(`B${currentRow}`).value = displayTotalHours.toFixed(2);
    sheet.getCell(`C${currentRow}`).value = 'Total Miles:';
    sheet.getCell(`C${currentRow}`).font = { bold: true };
    sheet.getCell(`D${currentRow}`).value = grandTotalMiles;
    sheet.getCell(`E${currentRow}`).value = 'Total Cost:';
    sheet.getCell(`E${currentRow}`).font = { bold: true };
    sheet.getCell(`F${currentRow}`).value = grandTotalCost > 0 ? `$${grandTotalCost.toFixed(2)}` : '';
    currentRow += 2;
  } else {
    // Legacy single job — work description with dynamic sizing
    const workDescription = job.workDescription || job.description || '';
    const estimatedLines = Math.max(1, Math.ceil(workDescription.length / 80));
    const descRows = Math.max(3, Math.min(estimatedLines, 15));
    sheet.mergeCells(`A${currentRow}:F${currentRow + descRows - 1}`);
    sheet.getCell(`A${currentRow}`).value = workDescription;
    sheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getCell(`A${currentRow}`).border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    currentRow += descRows + 1;
  }

  // === PARTS SECTION (combined from all entries) ===
  applySectionHeader(sheet, currentRow);
  sheet.getCell(`A${currentRow}`).value = 'PARTS USED';
  currentRow++;

  sheet.getCell(`A${currentRow}`).value = 'Qty';
  sheet.getCell(`B${currentRow}`).value = 'Part Number';
  sheet.getCell(`C${currentRow}`).value = 'Description';
  sheet.mergeCells(`C${currentRow}:D${currentRow}`);
  sheet.getCell(`E${currentRow}`).value = 'Location';
  sheet.mergeCells(`E${currentRow}:F${currentRow}`);
  applyColumnHeaders(sheet, currentRow, ['A', 'B', 'C', 'E']);
  currentRow++;

  allPartsUsed.forEach((part) => {
    if (typeof part === 'object') {
      sheet.getCell(`A${currentRow}`).value = part.quantity || 1;
      sheet.getCell(`B${currentRow}`).value = part.partNumber || '';
      sheet.getCell(`C${currentRow}`).value = part.description || part.name || '';
      sheet.mergeCells(`C${currentRow}:D${currentRow}`);
      sheet.getCell(`E${currentRow}`).value = part.truckLocationName || '';
      sheet.mergeCells(`E${currentRow}:F${currentRow}`);
    } else {
      sheet.getCell(`A${currentRow}`).value = 1;
      sheet.getCell(`C${currentRow}`).value = part;
      sheet.mergeCells(`C${currentRow}:F${currentRow}`);
    }
    currentRow++;
  });

  if (allPartsUsed.length === 0) {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'No parts recorded';
    sheet.getCell(`A${currentRow}`).font = { italic: true, color: { argb: 'FF999999' } };
    currentRow++;
  }

  // === GENERATE FILE ===
  const customerName = (farmer?.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
  const soNumber = job.soNumber || 'NoSO';
  const dateStr = formatDateForFilename(job.completedAt || new Date());

  const assignees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo].filter(Boolean);
  const primaryAssignee = assignees[0];
  const primaryTech = techs?.find(t => t.id === primaryAssignee);
  const techInitials = getTechInitials(primaryTech?.name);

  const fileName = `${customerName}.${soNumber}.${dateStr}.${techInitials}.xlsx`;

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
