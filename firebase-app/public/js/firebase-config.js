/**
 * Firebase Configuration
 * 
 * คำแนะนำ: 
 * 1. ไปที่ https://console.firebase.google.com/
 * 2. สร้าง project ใหม่ หรือเลือก project ที่มีอยู่
 * 3. ไปที่ Project Settings > General > Your apps > Web app
 * 4. คัดลอก firebaseConfig มาวางแทนที่ด้านล่าง
 */

const firebaseConfig = {
    apiKey: "AIzaSyClcPbCNBNZGF3u2bffl7jzMzsy0IH2Jnk",
    authDomain: "smartcourt-gvsport.firebaseapp.com",
    databaseURL: "https://smartcourt-gvsport-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smartcourt-gvsport",
    storageBucket: "smartcourt-gvsport.firebasestorage.app",
    messagingSenderId: "1098274282918",
    appId: "1:1098274282918:web:241e878678db797ad84367",
    measurementId: "G-HG0TZWS2LV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();

// Set auth persistence to LOCAL — session survives browser restart
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(err => console.warn('[Auth Persistence]', err));

// Offline persistence disabled.
// The Mega-Document architecture already reduces reads by 99%,
// so we don't need the buggy IndexedDB cache which causes INTERNAL ASSERTION FAILED
// when multiple tabs or schema changes occur.

// Global Error Handler for Firestore Cache Corruption
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('INTERNAL ASSERTION FAILED')) {
        console.error('Firestore Cache corrupted, clearing...');
        if (typeof showToast === 'function') {
            showToast('ระบบขัดข้อง', 'กำลังรีเซ็ตระบบเนื่องจากข้อมูลเก่าขัดแย้งกัน...', 'error');
        } else {
            alert('ตรวจพบข้อมูลเวอร์ชันเก่าขัดข้อง กำลังรีเฟรชระบบใหม่');
        }
        setTimeout(() => {
            // Delete firestore indexedDB cache
            indexedDB.deleteDatabase('firestore/[DEFAULT]/smartcourt-gvsport/main');
            window.location.reload(true);
        }, 2000);
    }
});

// Project list (same as original)
const PROJECTS = ["กอล์ฟวิว", "กอล์ฟซิตี้", "กอล์ฟแมนชั่น", "เมเปิลซิตี้", "เมเปิลแมนชั่น"];

console.log('[Firebase] Initialized successfully');
