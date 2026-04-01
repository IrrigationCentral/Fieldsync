// ============================================
// PDF INVOICE GENERATION SERVICE
// Matches Hardluck Irrigation Job Sheet Format
// Supports multi-day serviceEntries, multi-vehicle, proper hours
// ============================================
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Format time (HH:MM AM/PM)
const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Calculate hours - use pre-calculated hours first, then compute
const getEntryHours = (entry) => {
  if (entry.hours && entry.hours > 0) return entry.hours;
  if (!entry.startTime || !entry.endTime) return 0;
  const start = new Date(entry.startTime);
  const end = new Date(entry.endTime);
  const diff = (end - start) / (1000 * 60 * 60);
  return Math.max(0, diff - (entry.lunchTaken ? 0.5 : 0));
};

// Generate Service Call Job Sheet PDF
export const generateJobSheetPDF = (job, pivot, farmer, tech, settings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor = [45, 80, 22]; // #2D5016
  const headerBg = [240, 240, 235];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HARDLUCK IRRIGATION', 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Service Call Job Sheet', pageWidth - 14, 15, { align: 'right' });

  // Date
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Date: ${formatDate(job.completedAt || job.createdAt)}`, pageWidth - 14, 35, { align: 'right' });

  // Customer Info Section
  let yPos = 40;
  doc.setFillColor(...headerBg);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER INFORMATION', 16, yPos + 6);
  yPos += 12;

  doc.setFont('helvetica', 'normal');
  const customerData = [
    ['Customer:', farmer?.name || 'N/A', 'Bill To:', farmer?.name || 'Same'],
    ['Location:', pivot?.address || 'N/A', 'Equipment Rental:', job.equipmentRental || 'N/A'],
    ['PVT/ENG Serial #:', pivot?.serialNumber || 'N/A', 'Sales Order Number:', job.soNumber || 'N/A']
  ];

  customerData.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], 16, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row[1]), 55, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], 110, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row[3]), 160, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Gather service entries or build legacy data
  const serviceEntries = job.serviceEntries && job.serviceEntries.length > 0
    ? job.serviceEntries : null;

  let allVehicles = [];
  let grandTotalHours = 0;
  let grandTotalMiles = 0;
  let grandTotalCost = 0;

  if (serviceEntries) {
    serviceEntries.forEach(e => {
      grandTotalHours += e.hoursWorked || 0;
      grandTotalMiles += e.milesDriven || 0;
      grandTotalCost += e.totalCost || 0;
      // Collect vehicles - support new array format and legacy flat fields
      if (e.vehicles && e.vehicles.length > 0) {
        e.vehicles.forEach(v => allVehicles.push({ ...v, serviceDate: e.date }));
      } else if (e.vehicleNumber) {
        allVehicles.push({
          vehicleNumber: e.vehicleNumber,
          odometerBegin: e.odometerBegin || 0,
          odometerEnd: e.odometerEnd || 0,
          milesDriven: e.milesDriven || 0,
          serviceDate: e.date
        });
      }
    });
  } else {
    grandTotalHours = job.hoursWorked || 0;
    grandTotalMiles = job.milesDriven || 0;
    grandTotalCost = job.totalCost || 0;
    if (job.vehicleNumber) {
      allVehicles.push({
        vehicleNumber: job.vehicleNumber,
        odometerBegin: job.odometerStart || job.odometerBegin || 0,
        odometerEnd: job.odometerEnd || 0,
        milesDriven: job.milesDriven || 0
      });
    }
  }

  // Vehicle/Mileage Section
  doc.setFillColor(...headerBg);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('VEHICLES & MILEAGE', 16, yPos + 6);
  yPos += 12;

  if (allVehicles.length > 0) {
    const vehicleData = allVehicles.map(v => [
      `#${v.vehicleNumber || '-'}`,
      v.serviceDate ? formatDate(v.serviceDate) : '-',
      v.odometerBegin || '-',
      v.odometerEnd || '-',
      v.milesDriven ? `${v.milesDriven} mi` : '-'
    ]);
    const computedTotalMiles = allVehicles.reduce((sum, v) => sum + (v.milesDriven || 0), 0);
    vehicleData.push(['', '', '', 'Total:', `${computedTotalMiles} mi`]);

    doc.autoTable({
      startY: yPos,
      head: [['Vehicle #', 'Date', 'Odom Begin', 'Odom End', 'Miles']],
      body: vehicleData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.row.index === vehicleData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
  } else {
    doc.autoTable({
      startY: yPos,
      head: [['Vehicle #', 'Odometer (Begin)', 'Odometer (End)', 'Total Mileage']],
      body: [['No vehicles recorded', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: primaryColor, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });
  }

  yPos = doc.lastAutoTable.finalY + 10;

  // Time Tracking Section
  doc.setFillColor(...headerBg);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('TIME TRACKING', 16, yPos + 6);
  yPos += 12;

  const timeData = [];
  let computedHours = 0;

  if (serviceEntries) {
    serviceEntries.forEach((sEntry, dayIdx) => {
      const dayEntries = sEntry.timeEntries || [];
      if (dayEntries.length > 0) {
        dayEntries.forEach(te => {
          const hrs = getEntryHours(te);
          computedHours += hrs;
          const techName = te.techName || (typeof sEntry.completedBy === 'object' ? (sEntry.completedBy?.name || 'Unknown') : 'Unknown');
          timeData.push([
            techName,
            formatDate(te.startTime || sEntry.date),
            formatTime(te.startTime),
            te.lunchTaken ? 'Yes' : 'No',
            formatTime(te.endTime),
            `${hrs.toFixed(2)} hrs`
          ]);
        });
      } else if (sEntry.hoursWorked) {
        computedHours += sEntry.hoursWorked;
        const fallbackTechName = typeof sEntry.completedBy === 'object' ? (sEntry.completedBy?.name || 'Unknown') : 'Unknown';
        timeData.push([
          fallbackTechName,
          `Day ${dayIdx + 1} (${formatDate(sEntry.date)})`,
          '-', '-', '-',
          `${sEntry.hoursWorked.toFixed(2)} hrs`
        ]);
      }
    });
  } else {
    // Legacy single entry
    if (tech) {
      timeData.push([
        tech.name || 'Technician',
        formatDate(job.completedAt || job.createdAt),
        job.startTime || '-',
        job.lunchBreak || 'No',
        job.endTime || '-',
        job.hoursWorked ? `${job.hoursWorked.toFixed(2)} hrs` : '-'
      ]);
      computedHours = job.hoursWorked || 0;
    }
  }

  while (timeData.length < 2) {
    timeData.push(['', '', '', '', '', '']);
  }

  const totalHrs = computedHours > 0 ? computedHours : grandTotalHours;
  timeData.push(['', '', '', '', 'Total Man Hours:', `${totalHrs.toFixed(2)} hrs`]);

  doc.autoTable({
    startY: yPos,
    head: [['Employee', 'Date', 'Start', 'Lunch', 'End', 'Hours']],
    body: timeData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.index === timeData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // === SERVICE ENTRY DETAILS (multi-day) ===
  if (serviceEntries && serviceEntries.length > 0) {
    if (yPos > 220) { doc.addPage(); yPos = 20; }

    doc.setFillColor(...headerBg);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(`SERVICE ENTRIES (${serviceEntries.length})`, 16, yPos + 6);
    yPos += 12;

    serviceEntries.forEach((entry, idx) => {
      if (yPos > 250) { doc.addPage(); yPos = 20; }

      const isFinal = idx === serviceEntries.length - 1 && !entry.needsFollowUp;
      const label = isFinal ? 'COMPLETED' : 'Follow-up Required';
      const techName = typeof entry.completedBy === 'object' ? (entry.completedBy?.name || 'Unknown') : 'Unknown';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Day ${idx + 1} — ${label}  •  ${formatDate(entry.date)}`, 16, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Tech: ${techName}`, 140, yPos);
      yPos += 6;

      // Vehicles for this entry
      const entryVehicles = entry.vehicles && entry.vehicles.length > 0
        ? entry.vehicles
        : (entry.vehicleNumber ? [{ vehicleNumber: entry.vehicleNumber, milesDriven: entry.milesDriven }] : []);

      if (entryVehicles.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Vehicles:', 16, yPos);
        doc.setFont('helvetica', 'normal');
        const vStr = entryVehicles.map(v => `#${v.vehicleNumber} (${v.milesDriven || 0} mi)`).join(', ');
        doc.text(vStr, 40, yPos);
        yPos += 5;
      }

      // Work description
      if (entry.workDescription) {
        doc.setFont('helvetica', 'bold');
        doc.text('Work:', 16, yPos);
        doc.setFont('helvetica', 'normal');
        const splitWork = doc.splitTextToSize(entry.workDescription, pageWidth - 50);
        doc.text(splitWork, 35, yPos);
        yPos += splitWork.length * 4 + 3;
      }

      // Parts
      if (entry.partsUsed && entry.partsUsed.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Parts:', 16, yPos);
        doc.setFont('helvetica', 'normal');
        const partsStr = entry.partsUsed.map(p => {
          if (typeof p === 'object') {
            let s = `${p.quantity || 1}x ${p.partNumber || ''} ${p.description || p.name || ''}`.trim();
            if (p.truckLocationName) s += ` [${p.truckLocationName}]`;
            return s;
          }
          return p;
        }).join(', ');
        const splitParts = doc.splitTextToSize(partsStr, pageWidth - 50);
        doc.text(splitParts, 35, yPos);
        yPos += splitParts.length * 4 + 3;
      }

      // Day summary
      doc.setFont('helvetica', 'normal');
      doc.text(`Hours: ${(entry.hoursWorked || 0).toFixed(2)}  |  Miles: ${entry.milesDriven || 0}  |  Cost: $${(entry.totalCost || 0).toFixed(2)}`, 16, yPos);
      yPos += 5;

      // Follow-up notes
      if (entry.needsFollowUp && entry.followUpNotes) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(200, 100, 0);
        const splitNotes = doc.splitTextToSize(`Follow-up: ${entry.followUpNotes}`, pageWidth - 32);
        doc.text(splitNotes, 16, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += splitNotes.length * 4 + 3;
      }

      yPos += 4; // spacer between entries
    });

    // Running totals
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Totals: ${totalHrs.toFixed(2)} hrs  |  ${grandTotalMiles} mi  |  $${grandTotalCost.toFixed(2)}`, 16, yPos);
    yPos += 10;
  } else {
    // Legacy: Notes/Work Performed
    doc.setFillColor(...headerBg);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES / WORK PERFORMED', 16, yPos + 6);
    yPos += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const notesText = job.completionNotes || job.workDescription || job.description || 'No notes provided.';
    const splitNotes = doc.splitTextToSize(notesText, pageWidth - 32);
    doc.text(splitNotes, 16, yPos);
    yPos += splitNotes.length * 5 + 10;
  }

  // Parts Section (combined from all entries or legacy)
  const allParts = serviceEntries
    ? serviceEntries.flatMap(e => e.partsUsed || [])
    : (job.partsUsed || []);

  if (allParts.length > 0) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFillColor(...headerBg);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('PARTS USED', 16, yPos + 6);
    yPos += 12;

    const partsData = allParts.map(part => {
      if (typeof part === 'object') {
        return [part.quantity || 1, part.partNumber || '-', part.description || part.name || '-', part.truckLocationName || '-', part.cost ? `$${part.cost.toFixed(2)}` : '-'];
      }
      return [1, '-', part, '-', '-'];
    });

    doc.autoTable({
      startY: yPos,
      head: [['Qty', 'Part Number', 'Description', 'Location', 'Cost']],
      body: partsData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Cost Summary Section
  if (yPos > 240) { doc.addPage(); yPos = 20; }
  doc.setFillColor(...headerBg);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('COST SUMMARY', 16, yPos + 6);
  yPos += 12;

  const laborCost = totalHrs * (settings?.hourlyRate || 75);
  const mileageCost = grandTotalMiles * (settings?.mileageRate || 0.65);
  const partsCost = job.partsCost || 0;
  const partsWithMarkup = partsCost * (1 + (settings?.partsMarkup || 0) / 100);
  const totalCost = grandTotalCost > 0 ? grandTotalCost : (laborCost + mileageCost + partsWithMarkup);

  const costData = [
    ['Labor', `${totalHrs.toFixed(2)} hrs × $${settings?.hourlyRate || 75}/hr`, `$${laborCost.toFixed(2)}`],
    ['Mileage', `${grandTotalMiles} mi × $${settings?.mileageRate || 0.65}/mi`, `$${mileageCost.toFixed(2)}`],
    ['Parts', settings?.partsMarkup ? `+ ${settings.partsMarkup}% markup` : '', `$${partsWithMarkup.toFixed(2)}`],
    ['', '', ''],
    ['', 'TOTAL', `$${totalCost.toFixed(2)}`]
  ];

  doc.autoTable({
    startY: yPos,
    body: costData,
    theme: 'plain',
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 80 },
      2: { halign: 'right', cellWidth: 40 }
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.index === 4) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 12;
      }
    }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Signature Section
  if (yPos < 250) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Customer Signature: _______________________________', 16, yPos);
    doc.text('Date: _______________', 130, yPos);
    yPos += 10;
    doc.text('Technician Signature: _______________________________', 16, yPos);
    doc.text('Date: _______________', 130, yPos);
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(...primaryColor);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Hardluck Irrigation • Service Excellence Since Day One', pageWidth / 2, pageHeight - 7, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}  •  Generated: ${new Date().toLocaleString()}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  return doc;
};

// Download the PDF
export const downloadJobSheetPDF = (job, pivot, farmer, tech, settings) => {
  const doc = generateJobSheetPDF(job, pivot, farmer, tech, settings);
  const fileName = `JobSheet_${job.soNumber || job.id}_${formatDate(job.completedAt || job.createdAt).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

// Get PDF as blob for preview
export const getJobSheetBlob = (job, pivot, farmer, tech, settings) => {
  const doc = generateJobSheetPDF(job, pivot, farmer, tech, settings);
  return doc.output('blob');
};

// Get PDF as data URL for preview
export const getJobSheetDataUrl = (job, pivot, farmer, tech, settings) => {
  const doc = generateJobSheetPDF(job, pivot, farmer, tech, settings);
  return doc.output('dataurlstring');
};
