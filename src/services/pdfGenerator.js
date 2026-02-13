// ============================================
// PDF INVOICE GENERATION SERVICE
// Matches Hardluck Irrigation Job Sheet Format
// ============================================
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { BUSINESS, PRICING_DEFAULTS } from '../config/businessConfig';

// Generate Service Call Job Sheet PDF
export const generateJobSheetPDF = (job, pivot, farmer, tech, settings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor = [45, 80, 22]; // #2D5016
  const headerBg = [240, 240, 235];
  
  // Header with Logo Area
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(BUSINESS.name, 14, 15);
  
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
  
  // Customer details grid
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
  
  // Vehicle/Mileage Section
  doc.setFillColor(...headerBg);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('VEHICLE & MILEAGE', 16, yPos + 6);
  yPos += 12;
  
  doc.autoTable({
    startY: yPos,
    head: [['Vehicle #', 'Odometer (Begin)', 'Odometer (End)', 'Total Mileage']],
    body: [[
      job.vehicleNumber || 'Hardluck #1',
      job.odometerStart || '-',
      job.odometerEnd || '-',
      job.milesDriven ? `${job.milesDriven} mi` : '-'
    ]],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 }
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Time Tracking Section
  doc.setFillColor(...headerBg);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('TIME TRACKING', 16, yPos + 6);
  yPos += 12;

  // Time entries
  const timeData = [];
  if (tech) {
    timeData.push([
      tech.name || 'Technician',
      job.startTime || '-',
      job.lunchBreak || 'No',
      job.endTime || '-',
      job.hoursWorked ? `${job.hoursWorked.toFixed(2)} hrs` : '-'
    ]);
  }
  
  // Add empty rows if needed
  while (timeData.length < 3) {
    timeData.push(['', '', '', '', '']);
  }
  
  // Add total row
  timeData.push(['', '', '', 'Total Man Hours:', job.hoursWorked ? `${job.hoursWorked.toFixed(2)} hrs` : '-']);
  
  doc.autoTable({
    startY: yPos,
    head: [['Employee', 'Start Time', 'Lunch', 'End Time', 'Total Hours']],
    body: timeData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 }
  });
  
  yPos = doc.lastAutoTable.finalY + 10;

  // Notes/Work Performed Section
  doc.setFillColor(...headerBg);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('NOTES / WORK PERFORMED', 16, yPos + 6);
  yPos += 12;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const notesText = job.completionNotes || job.description || 'No notes provided.';
  const splitNotes = doc.splitTextToSize(notesText, pageWidth - 32);
  doc.text(splitNotes, 16, yPos);
  yPos += splitNotes.length * 5 + 10;
  
  // Parts Section
  if (job.partsUsed && job.partsUsed.length > 0) {
    doc.setFillColor(...headerBg);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('PARTS USED', 16, yPos + 6);
    yPos += 12;
    
    const partsData = job.partsUsed.map(part => [
      part.quantity || 1,
      part.partNumber || '-',
      part.description || '-',
      part.cost ? `$${part.cost.toFixed(2)}` : '-'
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Qty', 'Part Number', 'Description', 'Cost']],
      body: partsData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Cost Summary Section
  doc.setFillColor(...headerBg);
  doc.rect(14, yPos, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('COST SUMMARY', 16, yPos + 6);
  yPos += 12;
  
  const laborCost = (job.hoursWorked || 0) * (settings?.hourlyRate || PRICING_DEFAULTS.hourlyRate);
  const mileageCost = (job.milesDriven || 0) * (settings?.mileageRate || PRICING_DEFAULTS.mileageRate);
  const partsCost = job.partsCost || 0;
  const partsWithMarkup = partsCost * (1 + (settings?.partsMarkup || 0) / 100);
  const totalCost = job.totalCost || (laborCost + mileageCost + partsWithMarkup);
  
  const costData = [
    ['Labor', `${(job.hoursWorked || 0).toFixed(2)} hrs × $${settings?.hourlyRate || PRICING_DEFAULTS.hourlyRate}/hr`, `$${laborCost.toFixed(2)}`],
    ['Mileage', `${job.milesDriven || 0} mi × $${settings?.mileageRate || PRICING_DEFAULTS.mileageRate}/mi`, `$${mileageCost.toFixed(2)}`],
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
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`${BUSINESS.displayName} • ${BUSINESS.tagline}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  
  return doc;
};

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
