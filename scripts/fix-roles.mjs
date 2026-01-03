// Fix user roles script
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBMtyL-VNDAYOFpL9NVzk6Q_fkeysYrIIE",
  authDomain: "fieldsync-app.firebaseapp.com",
  projectId: "fieldsync-app",
  storageBucket: "fieldsync-app.firebasestorage.app",
  messagingSenderId: "848430270498",
  appId: "1:848430270498:web:5e5e5e5e5e5e5e5e5e5e5e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixRoles() {
  const usersRef = collection(db, 'users');
  
  // Find and fix Kari Byrd -> manager
  const kariQuery = query(usersRef, where('name', '==', 'Kari Byrd'));
  const kariSnapshot = await getDocs(kariQuery);
  
  if (!kariSnapshot.empty) {
    const kariDoc = kariSnapshot.docs[0];
    console.log('Found Kari Byrd:', kariDoc.data());
    await updateDoc(doc(db, 'users', kariDoc.id), { role: 'manager' });
    console.log('Updated Kari Byrd to manager role');
  } else {
    console.log('Kari Byrd not found, searching with partial match...');
    const allUsers = await getDocs(usersRef);
    allUsers.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes('kari')) {
        console.log('Found potential match:', data.name, 'ID:', doc.id, 'Current role:', data.role);
      }
    });
  }
  
  // Find and fix Lisa Mosby -> office
  const lisaQuery = query(usersRef, where('name', '==', 'Lisa Mosby'));
  const lisaSnapshot = await getDocs(lisaQuery);
  
  if (!lisaSnapshot.empty) {
    const lisaDoc = lisaSnapshot.docs[0];
    console.log('Found Lisa Mosby:', lisaDoc.data());
    await updateDoc(doc(db, 'users', lisaDoc.id), { role: 'office' });
    console.log('Updated Lisa Mosby to office role');
  } else {
    console.log('Lisa Mosby not found, searching with partial match...');
    const allUsers = await getDocs(usersRef);
    allUsers.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes('lisa')) {
        console.log('Found potential match:', data.name, 'ID:', doc.id, 'Current role:', data.role);
      }
    });
  }
  
  console.log('Done!');
  process.exit(0);
}

fixRoles().catch(console.error);
