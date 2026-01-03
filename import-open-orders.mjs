// ============================================
// OPEN ORDERS IMPORT SCRIPT
// ============================================
// Run with: node import-open-orders.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

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

// Open orders data from NetSuite export
const orders = [
  { so_number: "SO1526", customer_name: "John Engram", description: "Flow test on pivot for renozzle 37°02'31.9\"N 89°47'06.4\"W  Isaac Engram 573-703-4017", memo: "After Crop -Flow test Todt Pivot on hwy 91/renozzle" },
  { so_number: "SO1772", customer_name: "Aaron Guethle", description: "Service Call Pop 2 8\" steel wells by his shop at Dexter. Customer will pump off. Kari called 7/28/25 - Customer wants to wait until winter/spring and may have a couple more to add.", memo: "Pop Wells - Hold off till Winter/Spring" },
  { so_number: "SO1826", customer_name: "Hulshof Farms", description: "Emerson Home Farm 37.304582575105282 -89.59877199883796  there was a snake in the VFD that caused problems.", memo: "Service Call -VFD -Sending to Phase Tech" },
  { so_number: "SO1904", customer_name: "Irrigation Central", description: "Repair power unit loaned to Heartland Application by Chuck and came back burned up.", memo: "fix power unit burned up by Heartland App" },
  { so_number: "SO1905", customer_name: "Irrigation Central", description: "Rebuild power unit purchased from Charlotte Edwards at Mid America Sod Farm  Remove generator.", memo: "shop - go through P/U from Mid America Sod" },
  { so_number: "SO2013", customer_name: "Curtsinger Farm LLC", description: "Replace leaking span gaskets from storm damage repair.  william 2708535610", memo: "Service Call - fix when crop is out" },
  { so_number: "SO2037", customer_name: "Schaefer Stock Farm", description: "Service Call - Turbine repair crew states nose cone on gear drive is leaking, needs new nose cone seal.", memo: "replace nose cone seal" },
  { so_number: "SO2091", customer_name: "Chad Fullerton", description: "fieldnet says alignment fault  user CEFFarms pass bulldog  chad 5732251787", memo: "Service Call- in progress - fieldnet" },
  { so_number: "SO2171", customer_name: "Kyle & Carol Bollinger", description: "Power unit new oil line blew out hole just above connection point. New Murphy panel needle burned off and failed to shut down engine.", memo: "shop call - p/u for new Murphy Failure" },
  { so_number: "SO2216", customer_name: "Chris Porter", description: "Service Call - flow test for sprinkler package this fall", memo: "service call - flow test - winter" },
  { so_number: "SO2268", customer_name: "Randy Sutton Farms", description: "Service Call - power unit 4045 front pulley fell off.", memo: "service call - JD 4045" },
  { so_number: "SO2284", customer_name: "BC Bottoms LLC / Steve Traube", description: "Service Call - busted riser but wants rough estimate first", memo: "service call - busted riser" },
  { so_number: "SO2366", customer_name: "Irrigation Central", description: "Generac 105KW rebuild", memo: "Generac 105KW rebuild" },
  { so_number: "SO2387", customer_name: "Jared McGinnis", description: "Service Call", memo: "service call - pu functionality" },
  { so_number: "SO2415", customer_name: "Eric Doza", description: "Service Call-Flow Test for renozzle on 2 pivots", memo: "flow test for renozzle" },
  { so_number: "SO2439", customer_name: "Wiseman Brothers", description: "Service Call-underground break", memo: "underground break" },
  { so_number: "SO2440", customer_name: "Irrigation Central", description: "Service Call", memo: "Alarm System - Replace Batteries" },
  { so_number: "SO2468", customer_name: "Zoellner Construction Co", description: "Service Call", memo: "Broken shaft - American Marsh Warranty" },
  { so_number: "SO2469", customer_name: "Tank Tech", description: "GENERATOR REPAIR:  CUSTOMER STATES THAT IT WILL NOT STAY RUNNING UNLESS FUEL TANK IS FULL", memo: "BLUE GENERATOR REPAIR" },
  { so_number: "SO2484", customer_name: "Taylor Farms", description: "Service Call - Pick up 3 power units from fields and bring back to shop for new trailer build.", memo: "New power unit trailers" },
  { so_number: "SO2495", customer_name: "Ten Mile Pond", description: "Service Call", memo: "WELL #2 HAVING ISSUES" },
  { so_number: "SO2496", customer_name: "Ten Mile Pond", description: "Service Call", memo: "WELL #5 HAVING ISSUES" },
  { so_number: "SO2498", customer_name: "Ten Mile Pond", description: "Service Call", memo: "Service Call" },
  { so_number: "SO2502", customer_name: "Ten Mile Pond", description: "WELL #11 6068 JOHN DEERE / BAD O-RING ON COOLANT SYSTEM", memo: "WELL #11 - 6068 John Deere" },
  { so_number: "SO2505", customer_name: "Nutrien Ag/Sikeston", description: "Jason's job for John Cray", memo: "shop call - build" },
  { so_number: "SO2507", customer_name: "RICKY MAJOR", description: "BERKLEY PUMP REBUILD", memo: "REPAIR POWER UNIT/PUMP" },
  { so_number: "SO2508", customer_name: "Shelby Lake Farms LLC", description: "UNIT IS BACK, STILL NOT OPERATING CORRECTLY, GO THRU UNIT, REPAIR POWER UNIT, PUMP, AND CHECK CLUTCH ASSY", memo: "REPAIR POWER UNIT / PUMP / CLUTCH" },
  { so_number: "SO2510", customer_name: "H W Stumpf Inc", description: "Service Call Airport Pivot Customer wants pivot serviced.", memo: "(Early Spring) Airport Pivot Service and Possible Leak Repair" },
  { so_number: "SO2511", customer_name: "Montana Morehead", description: "Service Call - pump not priming", memo: "pump not priming" },
  { so_number: "SO2514", customer_name: "LARRY HAMMETT", description: "NEED TO SERVICE UNIT, WILL NOT STAY RUNNING", memo: "LP POWER UNIT WILL NOT STAY RUNNING" }
];

// Detect equipment type from description/memo
function detectEquipmentType(desc, memo) {
  const text = (desc + ' ' + memo).toLowerCase();
  
  if (text.includes('power unit') || text.includes('p/u') || text.includes('pu ') || text.includes('4045') || text.includes('6068') || text.includes('deere')) {
    return 'power_unit';
  }
  if (text.includes('generator') || text.includes('generac')) {
    return 'generator';
  }
  if (text.includes('well') || text.includes('wells')) {
    return 'well';
  }
  if (text.includes('pump') || text.includes('priming') || text.includes('berkley')) {
    return 'pump';
  }
  if (text.includes('pivot') || text.includes('span') || text.includes('renozzle') || text.includes('fieldnet') || text.includes('alignment')) {
    return 'center';
  }
  if (text.includes('vfd') || text.includes('panel') || text.includes('alarm')) {
    return 'panel';
  }
  if (text.includes('motor') || text.includes('turbine')) {
    return 'motor';
  }
  
  return 'other';
}

// Get equipment type label
function getTypeLabel(type) {
  const labels = {
    'power_unit': 'Power Unit',
    'generator': 'Generator',
    'well': 'Well',
    'pump': 'Pump',
    'center': 'Center Pivot',
    'panel': 'Control Panel',
    'motor': 'Motor',
    'other': 'Other'
  };
  return labels[type] || 'Other';
}

// Find customer by name (fuzzy match)
async function findCustomer(name) {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const searchName = name.toLowerCase().trim();
  
  // Try exact match first
  for (const doc of snapshot.docs) {
    const userData = doc.data();
    if (userData.name && userData.name.toLowerCase() === searchName) {
      return { id: doc.id, ...userData };
    }
  }
  
  // Try partial match
  for (const doc of snapshot.docs) {
    const userData = doc.data();
    if (userData.name && (
      userData.name.toLowerCase().includes(searchName) || 
      searchName.includes(userData.name.toLowerCase())
    )) {
      return { id: doc.id, ...userData };
    }
  }
  
  // Try company name match
  for (const doc of snapshot.docs) {
    const userData = doc.data();
    if (userData.company && (
      userData.company.toLowerCase().includes(searchName) || 
      searchName.includes(userData.company.toLowerCase())
    )) {
      return { id: doc.id, ...userData };
    }
  }
  
  return null;
}

// Create customer if not found
async function createCustomer(name) {
  const customerData = {
    name: name,
    email: '',
    phone: '',
    role: 'farmer',
    avatar: '👨‍🌾',
    isActive: true,
    createdAt: new Date().toISOString(),
    importedAt: new Date().toISOString(),
    importSource: 'NetSuite Open Orders'
  };
  
  const docRef = await addDoc(collection(db, 'users'), customerData);
  return { id: docRef.id, ...customerData };
}

// Create equipment
async function createEquipment(farmerId, name, type) {
  const equipmentData = {
    name: name,
    farmerId: farmerId,
    type: type,
    status: 'active',
    acres: 0,
    brand: '',
    model: '',
    createdAt: new Date().toISOString(),
    importedAt: new Date().toISOString(),
    importSource: 'NetSuite Open Orders'
  };
  
  const docRef = await addDoc(collection(db, 'pivots'), equipmentData);
  return { id: docRef.id, ...equipmentData };
}

// Create job
async function createJob(farmerId, pivotId, pivotName, title, description, soNumber) {
  const jobData = {
    farmerId: farmerId,
    pivotId: pivotId,
    pivotName: pivotName,
    title: title,
    description: description,
    soNumber: soNumber,
    status: 'pending',
    priority: 'normal',
    assignedTo: null,
    createdAt: new Date().toISOString(),
    importedAt: new Date().toISOString(),
    importSource: 'NetSuite Open Orders'
  };
  
  const docRef = await addDoc(collection(db, 'jobs'), jobData);
  return { id: docRef.id, ...jobData };
}

async function importOrders() {
  console.log('🚀 Starting Open Orders Import...\n');
  console.log(`📋 Processing ${orders.length} orders\n`);
  console.log('=' .repeat(80));
  
  let successCount = 0;
  let errorCount = 0;
  let newCustomers = 0;
  const errors = [];
  
  for (const order of orders) {
    try {
      console.log(`\n📝 ${order.so_number}: ${order.customer_name}`);
      
      // Find or create customer
      let customer = await findCustomer(order.customer_name);
      if (!customer) {
        customer = await createCustomer(order.customer_name);
        console.log(`   ➕ Created new customer: ${customer.name}`);
        newCustomers++;
      } else {
        console.log(`   ✓ Found customer: ${customer.name}`);
      }
      
      // Detect equipment type
      const equipType = detectEquipmentType(order.description, order.memo);
      console.log(`   🔧 Equipment type: ${getTypeLabel(equipType)}`);
      
      // Create equipment name from memo or generate one
      const equipName = order.memo || `${getTypeLabel(equipType)} - ${order.so_number}`;
      
      // Create equipment
      const equipment = await createEquipment(customer.id, equipName, equipType);
      console.log(`   ➕ Created equipment: ${equipment.name}`);
      
      // Create job
      const jobTitle = order.memo || order.description.substring(0, 50);
      const job = await createJob(
        customer.id,
        equipment.id,
        equipName,
        jobTitle,
        order.description,
        order.so_number
      );
      console.log(`   ✅ Created job: ${job.title} (${order.so_number})`);
      
      successCount++;
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      errors.push({ order: order.so_number, error: error.message });
      errorCount++;
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 IMPORT SUMMARY');
  console.log('=' .repeat(40));
  console.log(`✅ Successful imports: ${successCount}`);
  console.log(`❌ Failed imports: ${errorCount}`);
  console.log(`👤 New customers created: ${newCustomers}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    errors.forEach(e => console.log(`   - ${e.order}: ${e.error}`));
  }
  
  console.log('\n✨ Import complete!');
  process.exit(0);
}

// Run import
importOrders();
