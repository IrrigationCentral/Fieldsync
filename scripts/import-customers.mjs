// ============================================
// CUSTOMER BULK IMPORT SCRIPT
// ============================================
// Run with: node import-customers.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import ExcelJS from 'exceljs';

// Firebase config (from your project)
const firebaseConfig = {
  apiKey: "AIzaSyB2_veGmiiask_IBUqspw9wmYcPbVrfTxc",
  authDomain: "fieldsync-2768a.firebaseapp.com",
  projectId: "fieldsync-2768a",
  storageBucket: "fieldsync-2768a.firebasestorage.app",
  messagingSenderId: "1071854844469",
  appId: "1:1071854844469:web:0ab89170730a0900a44f7c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "hardluck");

// Path to your Excel file
const EXCEL_FILE = './CustomersProjects711.xlsx';

async function importCustomers() {
  console.log('📖 Reading Excel file...');
  
  // Read the Excel file with ExcelJS
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.worksheets[0];
  
  // Get header row to map columns
  const headers = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value;
  });
  
  // Count rows (excluding header)
  const rowCount = worksheet.rowCount - 1;
  console.log(`📊 Found ${rowCount} customers to import\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Process each row (skip header row 1)
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    
    // Get values by column name
    const getValue = (colName) => {
      const colIndex = headers.indexOf(colName);
      if (colIndex === -1) return '';
      const cell = row.getCell(colIndex);
      return cell.value ? String(cell.value).trim() : '';
    };
    
    const name = getValue('Name');
    const company = getValue('Company Name');
    const phone = getValue('Phone');
    const email = getValue('Email');
    
    // Skip empty rows
    if (!name && !company) {
      continue;
    }
    
    // Create customer document
    const customerData = {
      name: name || company, // Use company name if no personal name
      company: company || '',
      email: email || '',
      phone: phone || '',
      role: 'farmer',
      avatar: '👩‍🌾',
      isActive: true,
      createdAt: new Date().toISOString(),
      importedAt: new Date().toISOString(),
      importSource: 'CustomersProjects711.xlsx'
    };
    
    try {
      await addDoc(collection(db, 'users'), customerData);
      successCount++;
      
      // Progress indicator every 50 records
      if (successCount % 50 === 0) {
        console.log(`✅ Imported ${successCount} customers...`);
      }
    } catch (error) {
      errorCount++;
      errors.push({ row: rowNum, name: name || company, error: error.message });
      console.error(`❌ Row ${rowNum} (${name || company}): ${error.message}`);
    }
  }
  
  // Final summary
  console.log('\n========================================');
  console.log('📋 IMPORT COMPLETE');
  console.log('========================================');
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\nFailed records:');
    errors.forEach(e => console.log(`  - Row ${e.row}: ${e.name} - ${e.error}`));
  }
  
  console.log('\n🎉 Done! Your customers are now in FieldSync.');
  process.exit(0);
}

// Run the import
importCustomers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
