// ============================================
// PARTS DATABASE IMPORT SCRIPT
// ============================================
// Run with: node import-parts.mjs
// ============================================

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config
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

// Read parts data
const partsFile = path.join(__dirname, 'parts.json');

async function importParts() {
  console.log('==========================================');
  console.log('   FIELDSYNC PARTS DATABASE IMPORT');
  console.log('==========================================\n');
  
  // Check if parts.json exists
  if (!fs.existsSync(partsFile)) {
    console.error('ERROR: parts.json not found!');
    console.log('Please ensure parts.json is in the same directory as this script.');
    process.exit(1);
  }
  
  // Read and parse parts data
  const partsData = JSON.parse(fs.readFileSync(partsFile, 'utf8'));
  console.log(`Found ${partsData.length} parts to import.\n`);
  
  let imported = 0;
  let errors = 0;
  const batchSize = 50;
  const startTime = Date.now();
  
  console.log('Starting import...\n');
  
  for (let i = 0; i < partsData.length; i += batchSize) {
    const batch = partsData.slice(i, i + batchSize);
    
    for (const part of batch) {
      try {
        await addDoc(collection(db, 'parts'), {
          partNumber: part.partNumber || '',
          description: part.description || '',
          category: part.category || '',
          manufacturer: part.manufacturer || '',
          price: part.price || 0,
          inStock: part.inStock || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        imported++;
      } catch (e) {
        console.error(`Error importing part ${part.partNumber}:`, e.message);
        errors++;
      }
    }
    
    // Progress update
    const progress = Math.min(100, Math.round((i + batchSize) / partsData.length * 100));
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\rProgress: ${progress}% | Imported: ${imported} | Errors: ${errors} | Time: ${elapsed}s`);
  }
  
  console.log('\n\n==========================================');
  console.log('   IMPORT COMPLETE');
  console.log('==========================================');
  console.log(`Total parts imported: ${imported}`);
  console.log(`Errors: ${errors}`);
  console.log(`Time elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)} seconds`);
  console.log('==========================================\n');
  
  process.exit(0);
}

// Run import
importParts().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
