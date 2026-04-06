// Seed truck locations from NetSuite export
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB2_veGmiiask_IBUqspw9wmYcPbVrfTxc",
  authDomain: "fieldsync-2768a.firebaseapp.com",
  projectId: "fieldsync-2768a",
  storageBucket: "fieldsync-2768a.firebasestorage.app",
  messagingSenderId: "1071854844469",
  appId: "1:1071854844469:web:0ab89170730a0900a44f7c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "hardluck");

const locations = [
  { name: 'ELECTRICAL TRAILER', type: 'truck' },
  { name: 'Irrigation Central HQ', type: 'hq' },
  { name: 'Truck 09', type: 'truck' },
  { name: 'TRUCK 14 CRANE', type: 'truck' },
  { name: 'TRUCK 30 CRANE', type: 'truck' },
  { name: 'TRUCK 56 DANNY', type: 'truck' },
  { name: 'TRUCK 57 GLENN', type: 'truck' },
  { name: 'TRUCK 58 JOSH', type: 'truck' },
  { name: 'TRUCK 59 JASON', type: 'truck' },
  { name: 'TRUCK 60 WELL', type: 'truck' },
  { name: 'TRUCK 67 KATIE', type: 'truck' },
  { name: 'TRUCK 68 JOE', type: 'truck' },
  { name: 'TRUCK 70 ROPE CRANE', type: 'truck' },
  { name: 'Truck 79-Lee new truck', type: 'truck' },
];

async function seed() {
  // Check if any already exist
  const existing = await getDocs(collection(db, 'truckLocations'));
  if (existing.size > 0) {
    console.log(`Found ${existing.size} existing locations. Skipping duplicates...`);
    const existingNames = existing.docs.map(d => d.data().name);
    const toAdd = locations.filter(l => !existingNames.includes(l.name));
    if (toAdd.length === 0) {
      console.log('All locations already exist. Nothing to add.');
      process.exit(0);
    }
    console.log(`Adding ${toAdd.length} new locations...`);
    for (const loc of toAdd) {
      await addDoc(collection(db, 'truckLocations'), {
        name: loc.name,
        type: loc.type,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`  + ${loc.name} (${loc.type})`);
    }
  } else {
    console.log(`Adding all ${locations.length} locations...`);
    for (const loc of locations) {
      await addDoc(collection(db, 'truckLocations'), {
        name: loc.name,
        type: loc.type,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`  + ${loc.name} (${loc.type})`);
    }
  }
  console.log('Done!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
